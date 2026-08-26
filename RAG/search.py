"""Retrieval + answer generation.

Two changes from the first version matter most.

``RAGSearch`` is now a process-wide singleton. It used to be constructed inside
``RagService.__init__``, i.e. once per chat message, and its constructor loads a
SentenceTransformer and reads the FAISS index from disk. Every question paid for
a full model load, and the copies accumulated.

The retrieved context is now labelled with the document each passage came from,
and the search can be restricted to one document. Unlabelled context is what
allowed an answer about sample3.pdf to be assembled from a different invoice
without anything in the response revealing it.
"""

from __future__ import annotations

import os
import threading
from typing import Any, Dict, List, Optional, Sequence

from dotenv import load_dotenv
from langchain_groq import ChatGroq

from .structured_response import RAGAnswer, RAGResponse, RetrievedChunk
from .vector_store import FaissVectorStore

load_dotenv()

MD_DIR = "md_files/"

NO_INDEX = (
    "There are no documents in the search index yet. Convert a document first, "
    "then ask again."
)
NO_MATCH = (
    "The indexed documents do not contain anything relevant to that question."
)

PROMPT = """You are YellowDoc.ai, an AI assistant that answers questions about financial documents.

Answer the user's question using ONLY the retrieved context below.

Instructions:
- Base every answer strictly on the retrieved context.
- Do not use outside knowledge or make assumptions.
- Each passage is labelled with the document it came from. If the question names
  a document, answer only from passages belonging to that document, and say so
  if none of them contain the answer.
- If the answer is not present in the context, say:
  "The uploaded documents do not contain enough information to answer this question."
- Quote important values exactly as written (invoice numbers, dates, totals, tax
  amounts, vendor names). Do not correct, reformat or recalculate them, even if
  they look wrong — a value that disagrees with its total is reported as-is.
- If the question requires arithmetic over values in the context, perform it and
  show which values you used.
- Keep answers clear, concise and well structured.
- Never invent missing information.
- Return ONLY a JSON object with exactly these fields:
    `query` (string), `answer` (string), `summary` (string),
    `confidence` (string: high, medium or low), `key_points` (array of strings),
    and `examples` (array of strings). No Markdown fences, no extra text.

User Question:
{query}

Retrieved Context:
{context}
"""


def _format_context(results: Sequence[Dict[str, Any]]) -> str:
    """Label every passage with its document, so the model can attribute it."""
    blocks = []
    for position, result in enumerate(results, start=1):
        meta = result.get("metadata") or {}
        document = meta.get("document", "unknown")
        source = meta.get("source", "unknown")
        text = meta.get("text", "")
        blocks.append(
            f"[Passage {position} — document: {document} (file: {source})]\n{text}"
        )
    return "\n\n".join(blocks)


class RAGSearch:
    def __init__(
        self,
        persist_dir: str = "faiss_store",
        embedding_model: str = "all-MiniLM-L6-v2",
        llm_model: str = "openai/gpt-oss-120b",
        source_dir: str = MD_DIR,
    ):
        self.source_dir = source_dir
        self.vectorstore = FaissVectorStore(persist_dir, embedding_model)

        # Bring the index in line with md_files/ instead of trusting whatever
        # happens to be on disk. This is the actual fix for questions being
        # answered from documents the user converted weeks ago.
        self.vectorstore.ensure_ready(source_dir)

        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not set; retrieval cannot answer.")
        self.llm = ChatGroq(groq_api_key=groq_api_key, model_name=llm_model)
        self._structured = self.llm.with_structured_output(RAGResponse, method="json_mode")
        print(f"[INFO] Groq LLM initiated: {llm_model}")

    # ---------- index management ----------

    def refresh(self) -> Dict[str, Any]:
        """Pick up documents added since startup. Cheap when nothing changed."""
        return self.vectorstore.ensure_ready(self.source_dir)

    def reindex(self) -> Dict[str, Any]:
        return self.vectorstore.rebuild(self.source_dir)

    def add_document(self, md_path: str) -> Dict[str, Any]:
        return self.vectorstore.add_path(md_path)

    def documents(self) -> List[Dict[str, Any]]:
        return self.vectorstore.documents()

    # ---------- answering ----------

    def search_and_summarize(
        self,
        query: str,
        top_k: int = 5,
        source: Optional[str] = None,
    ) -> RAGAnswer:
        """Answer ``query``, optionally restricted to a single source file."""
        self.refresh()

        known = {d["source"] for d in self.documents()}
        if not known:
            return RAGAnswer.empty(query, NO_INDEX, scope=source)

        if source and source not in known:
            return RAGAnswer.empty(
                query,
                f"'{source}' is not in the search index. Convert it first, or "
                f"rebuild the index from Settings.",
                scope=source,
            )

        results = self.vectorstore.query(
            query, top_k=top_k, sources=[source] if source else None
        )
        if not results:
            return RAGAnswer.empty(query, NO_MATCH, scope=source)

        context = _format_context(results)
        if not context.strip():
            return RAGAnswer.empty(query, NO_MATCH, scope=source)

        answer: RAGResponse = self._structured.invoke(
            PROMPT.format(query=query, context=context)
        )

        return RAGAnswer(
            **answer.model_dump(),
            scope=source,
            sources=[
                RetrievedChunk(
                    document=(r["metadata"] or {}).get("document", "unknown"),
                    source=(r["metadata"] or {}).get("source", "unknown"),
                    chunk=(r["metadata"] or {}).get("chunk", 0),
                    score=round(r.get("score", 0.0), 4),
                    # Enough to recognise the passage, not enough to bloat the
                    # thread that the browser keeps in localStorage.
                    excerpt=((r["metadata"] or {}).get("text", "") or "")[:600],
                )
                for r in results
            ],
        )


_instance: Optional[RAGSearch] = None
_lock = threading.Lock()


def get_rag_search() -> RAGSearch:
    """The one RAGSearch for this process.

    Built on first use rather than at import time, so an unreachable Groq key or
    a corrupt index surfaces as a failed request instead of a server that will
    not start.
    """
    global _instance
    if _instance is not None:
        return _instance
    with _lock:
        if _instance is None:
            _instance = RAGSearch()
        return _instance
