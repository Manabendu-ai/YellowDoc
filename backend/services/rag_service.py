"""Thin service layer over RAGSearch.

``RagService.__init__`` used to construct a whole ``RAGSearch`` — embedding model,
FAISS read, Groq client — on every single request. It now borrows the shared one.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from RAG.search import get_rag_search
from RAG.structured_response import RAGAnswer


class RagService:
    def __init__(self, query: str = "", top_k: int = 5, source: Optional[str] = None):
        self.query = query
        # 3 was too few once several near-identical invoices were indexed: the
        # relevant passage often sat just outside the cut.
        self.top_k = top_k
        self.source = source or None

    def get_response(self) -> RAGAnswer:
        return get_rag_search().search_and_summarize(
            self.query, self.top_k, self.source
        )

    @staticmethod
    def documents() -> List[Dict[str, Any]]:
        """Everything currently searchable, refreshed against md_files/ first."""
        rag = get_rag_search()
        rag.refresh()
        return rag.documents()

    @staticmethod
    def reindex() -> Dict[str, Any]:
        return get_rag_search().reindex()

    @staticmethod
    def index_document(md_path: str) -> Dict[str, Any]:
        return get_rag_search().add_document(md_path)
