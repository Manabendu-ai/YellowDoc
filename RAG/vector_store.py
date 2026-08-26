"""FAISS store that knows which documents are in it.

The original version wrote an index once and then trusted it forever: if
``faiss.index`` existed on disk it was loaded and never questioned. The index in
this repo was built on 4 August from two invoices, so every question asked since
— about sample2, sample3, sample4, anything — was answered from those two old
documents. There was no way to notice, because chunks recorded only their text
and not where they came from.

So this version keeps a manifest beside the index describing exactly which files
were indexed, at which size and mtime, with which model and chunk settings. On
startup the manifest is compared against ``md_files/`` and the index either
appends the new documents or rebuilds itself. Retrieval can also be scoped to a
single source, which is the only reliable way to stop a question about one
invoice being answered from a near-identical one.
"""

from __future__ import annotations

import json
import os
import pickle
import threading
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence

import faiss
import numpy as np

from . import embeddings as emb
from .data_loader import list_documents, load_document

MANIFEST_VERSION = 2
METRIC = "cosine"


def settings_fingerprint(
    model: str, chunk_size: int, chunk_overlap: int
) -> Dict[str, Any]:
    """The knobs that, if changed, make an existing index meaningless."""
    return {
        "model": model,
        "chunk_size": chunk_size,
        "chunk_overlap": chunk_overlap,
        "metric": METRIC,
        "version": MANIFEST_VERSION,
    }


def plan_sync(
    manifest: Optional[Dict[str, Any]],
    on_disk: Sequence[Dict[str, Any]],
    settings: Dict[str, Any],
) -> Dict[str, Any]:
    """Decide what to do about the gap between the index and the directory.

    Pure function of its three inputs so it can be tested without faiss, torch
    or a real index. Returns a mode, the documents to add, and a human reason
    that gets logged — silent resynchronisation is how the original bug stayed
    invisible for three weeks.

    ``append`` is only safe when nothing already indexed has changed, because
    metadata row *i* must keep corresponding to index row *i*. Anything else
    (a changed file, a deleted file, different settings) forces a full rebuild.
    """
    disk_by_source = {d["source"]: d for d in on_disk}

    if not manifest:
        return {
            "mode": "rebuild",
            "add": list(on_disk),
            "reason": "no manifest — the index predates document tracking",
        }

    if manifest.get("settings") != settings:
        return {
            "mode": "rebuild",
            "add": list(on_disk),
            "reason": "embedding model or chunk settings changed",
        }

    indexed: Dict[str, Any] = manifest.get("documents") or {}

    removed = sorted(set(indexed) - set(disk_by_source))
    if removed:
        return {
            "mode": "rebuild",
            "add": list(on_disk),
            "reason": f"no longer on disk: {', '.join(removed)}",
        }

    changed = sorted(
        source
        for source, entry in indexed.items()
        if entry.get("mtime") != disk_by_source[source].get("mtime")
        or entry.get("size") != disk_by_source[source].get("size")
    )
    if changed:
        return {
            "mode": "rebuild",
            "add": list(on_disk),
            "reason": f"rewritten since indexing: {', '.join(changed)}",
        }

    added = [d for d in on_disk if d["source"] not in indexed]
    if added:
        names = ", ".join(d["source"] for d in added)
        return {"mode": "append", "add": added, "reason": f"new documents: {names}"}

    return {"mode": "current", "add": [], "reason": "index matches md_files/"}


class FaissVectorStore:
    def __init__(
        self,
        persist_dir: str = "faiss_store",
        embedding_model: str = emb.DEFAULT_MODEL,
        chunk_size: int = emb.DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = emb.DEFAULT_CHUNK_OVERLAP,
    ):
        self.persist_dir = persist_dir
        os.makedirs(self.persist_dir, exist_ok=True)
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict[str, Any]] = []
        self.manifest: Optional[Dict[str, Any]] = None
        self.embedding_model = embedding_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._lock = threading.Lock()

    # ---------- paths ----------

    @property
    def index_path(self) -> str:
        return os.path.join(self.persist_dir, "faiss.index")

    @property
    def meta_path(self) -> str:
        return os.path.join(self.persist_dir, "metadata.pkl")

    @property
    def manifest_path(self) -> str:
        return os.path.join(self.persist_dir, "manifest.json")

    @property
    def settings(self) -> Dict[str, Any]:
        return settings_fingerprint(
            self.embedding_model, self.chunk_size, self.chunk_overlap
        )

    # ---------- persistence ----------

    def save(self) -> None:
        if self.index is None:
            raise ValueError("There is no index to save.")
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "wb") as f:
            pickle.dump(self.metadata, f)
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(self.manifest or {}, f, indent=2)
        print(f"[INFO] Saved index, metadata and manifest to {self.persist_dir}")

    def load(self) -> bool:
        """Load an index from disk. False means there isn't a usable one."""
        if not (os.path.exists(self.index_path) and os.path.exists(self.meta_path)):
            return False
        try:
            self.index = faiss.read_index(self.index_path)
            with open(self.meta_path, "rb") as f:
                self.metadata = pickle.load(f)
        except Exception as e:
            print(f"[WARN] Could not read the index ({e}); it will be rebuilt.")
            self.index, self.metadata = None, []
            return False

        if os.path.exists(self.manifest_path):
            try:
                with open(self.manifest_path, encoding="utf-8") as f:
                    self.manifest = json.load(f)
            except Exception as e:
                print(f"[WARN] Unreadable manifest ({e}); the index will be rebuilt.")
                self.manifest = None
        else:
            self.manifest = None

        # Row i of the index must be described by row i of the metadata. If that
        # ever drifts, every citation would point at the wrong document, which
        # is worse than having no index at all.
        if self.index.ntotal != len(self.metadata):
            print(
                f"[WARN] Index has {self.index.ntotal} vectors but "
                f"{len(self.metadata)} metadata rows; rebuilding."
            )
            self.index, self.metadata, self.manifest = None, [], None
            return False

        print(
            f"[INFO] Loaded {self.index.ntotal} vectors covering "
            f"{len(self.manifest.get('documents', {})) if self.manifest else 0} documents"
        )
        return True

    # ---------- building ----------

    def _fresh_index(self, dim: int) -> faiss.Index:
        # Inner product over unit vectors == cosine similarity, so a higher
        # score is a better match (the reverse of the old L2 index).
        return faiss.IndexFlatIP(dim)

    def _chunks_for(self, documents: List[Any]) -> List[Any]:
        return emb.split_documents(documents, self.chunk_size, self.chunk_overlap)

    def _append_documents(self, documents: List[Any], show_progress: bool = False) -> int:
        """Embed and append documents. Returns the number of chunks added."""
        chunks = self._chunks_for(documents)
        if not chunks:
            return 0

        vectors = emb.encode(
            (c.page_content for c in chunks),
            self.embedding_model,
            show_progress=show_progress,
        )
        if vectors.shape[0] == 0:
            return 0

        if self.index is None:
            self.index = self._fresh_index(vectors.shape[1])
        elif self.index.d != vectors.shape[1]:
            raise ValueError(
                f"Index has dimension {self.index.d} but the model produced "
                f"{vectors.shape[1]}."
            )

        self.index.add(vectors)
        for position, chunk in enumerate(chunks):
            meta = chunk.metadata or {}
            self.metadata.append(
                {
                    # "text" keeps the key the rest of the codebase already reads.
                    "text": chunk.page_content,
                    "source": meta.get("source", "unknown"),
                    "document": meta.get("document", "unknown"),
                    "chunk": position,
                }
            )
        return len(chunks)

    def _record(self, info: Dict[str, Any], chunks: int) -> None:
        if self.manifest is None:
            self.manifest = {"settings": self.settings, "documents": {}}
        self.manifest.setdefault("documents", {})[info["source"]] = {
            "document": info["document"],
            "mtime": info["mtime"],
            "size": info["size"],
            "chunks": chunks,
            "indexed_at": int(time.time()),
        }

    def rebuild(self, source_dir: str = "md_files/") -> Dict[str, Any]:
        """Throw the index away and build it from everything on disk."""
        self.index, self.metadata = None, []
        self.manifest = {"settings": self.settings, "documents": {}}

        on_disk = list_documents(source_dir)
        total = 0
        for info in on_disk:
            docs = load_document(os.path.join(source_dir, info["source"]))
            added = self._append_documents(docs, show_progress=True)
            if added:
                self._record(info, added)
                total += added
            else:
                print(f"[WARN] {info['source']} produced no chunks; skipped.")

        if self.index is None:
            # Nothing to index. Leave the store empty rather than writing a
            # zero-vector index that later loads and answers nothing.
            print("[WARN] No documents to index.")
            return {"mode": "rebuild", "chunks": 0, "documents": 0}

        self.save()
        docs_count = len(self.manifest.get("documents", {}))
        print(f"[INFO] Rebuilt index: {total} chunks from {docs_count} documents")
        return {"mode": "rebuild", "chunks": total, "documents": docs_count}

    def ensure_ready(self, source_dir: str = "md_files/") -> Dict[str, Any]:
        """Make the index agree with ``source_dir``, doing the least work needed."""
        with self._lock:
            if self.index is None:
                self.load()

            plan = plan_sync(self.manifest, list_documents(source_dir), self.settings)
            print(f"[INFO] Index sync: {plan['mode']} — {plan['reason']}")

            if plan["mode"] == "current":
                return {"mode": "current", "chunks": 0, "documents": 0}

            if plan["mode"] == "rebuild":
                return self.rebuild(source_dir)

            total = 0
            for info in plan["add"]:
                docs = load_document(os.path.join(source_dir, info["source"]))
                added = self._append_documents(docs)
                if added:
                    self._record(info, added)
                    total += added
            if total:
                self.save()
            return {"mode": "append", "chunks": total, "documents": len(plan["add"])}

    def add_path(self, md_path: str) -> Dict[str, Any]:
        """Index one Markdown file immediately after it has been written.

        Used by the conversion pipeline so a document is searchable as soon as
        it exists. If the file was already indexed under the same name — a
        re-conversion — the whole index is rebuilt, because appending would
        leave the superseded chunks in place and retrieval would then mix two
        versions of the same document.
        """
        with self._lock:
            if self.index is None:
                self.load()

            path = Path(md_path)
            if not path.is_file():
                raise FileNotFoundError(md_path)

            source_dir = str(path.parent)
            from .data_loader import describe

            info = describe(path)
            indexed = (self.manifest or {}).get("documents", {})

            if self.manifest is None or (self.manifest.get("settings") != self.settings):
                return self.rebuild(source_dir)
            if info["source"] in indexed:
                print(f"[INFO] {info['source']} was already indexed; rebuilding.")
                return self.rebuild(source_dir)

            added = self._append_documents(load_document(path))
            if not added:
                return {"mode": "current", "chunks": 0, "documents": 0}
            self._record(info, added)
            self.save()
            print(f"[INFO] Indexed {info['source']}: {added} chunks")
            return {"mode": "append", "chunks": added, "documents": 1}

    # ---------- reading ----------

    def documents(self) -> List[Dict[str, Any]]:
        """What retrieval can currently see, for the document picker."""
        entries = (self.manifest or {}).get("documents", {})
        return sorted(
            (
                {
                    "source": source,
                    "document": entry.get("document", Path(source).stem),
                    "chunks": entry.get("chunks", 0),
                    "indexed_at": entry.get("indexed_at"),
                }
                for source, entry in entries.items()
            ),
            key=lambda d: d["document"].lower(),
        )

    def add_embeddings(
        self, embeddings: np.ndarray, metadatas: Optional[List[Any]] = None
    ) -> None:
        """Low-level append, kept because rag_testing.py calls it directly."""
        if embeddings.ndim != 2 or embeddings.shape[0] == 0:
            raise ValueError("No embeddings were generated.")
        if self.index is None:
            self.index = self._fresh_index(embeddings.shape[1])
        self.index.add(np.ascontiguousarray(embeddings, dtype="float32"))
        if metadatas:
            self.metadata.extend(metadatas)

    def build_from_documents(self, documents: List[Any]) -> None:
        """Kept for the Streamlit UI, which builds from a document list."""
        if not documents:
            raise ValueError("No documents were loaded. Check your data directory.")
        self.index, self.metadata = None, []
        self.manifest = {"settings": self.settings, "documents": {}}
        self._append_documents(documents, show_progress=True)
        seen: Dict[str, int] = {}
        for row in self.metadata:
            seen[row["source"]] = seen.get(row["source"], 0) + 1
        for source, count in seen.items():
            self.manifest["documents"][source] = {
                "document": Path(source).stem,
                "mtime": 0,
                "size": 0,
                "chunks": count,
                "indexed_at": int(time.time()),
            }
        self.save()

    def search(
        self,
        query_embeddings: np.ndarray,
        top_k: int = 5,
        sources: Optional[Iterable[str]] = None,
    ) -> List[Dict[str, Any]]:
        if self.index is None or self.index.ntotal == 0:
            return []

        wanted = {s for s in sources} if sources else None

        # With a filter we have to look past the global nearest neighbours,
        # because the chosen document's best chunk may not be in the global
        # top-k at all. The corpus here is small enough to scan exhaustively.
        probe = self.index.ntotal if wanted else min(top_k, self.index.ntotal)
        scores, ids = self.index.search(query_embeddings, probe)

        results: List[Dict[str, Any]] = []
        for idx, score in zip(ids[0], scores[0]):
            idx = int(idx)
            # faiss pads with -1 when it finds fewer neighbours than asked for.
            # The original code let that through, and -1 indexes the *last*
            # chunk in Python, so a short index silently cited the wrong text.
            if idx < 0 or idx >= len(self.metadata):
                continue
            meta = self.metadata[idx]
            if wanted and meta.get("source") not in wanted:
                continue
            results.append(
                {
                    "index": idx,
                    "score": float(score),
                    "distance": float(1.0 - score),
                    "metadata": meta,
                }
            )
            if len(results) >= top_k:
                break
        return results

    def query(
        self,
        query_text: str,
        top_k: int = 5,
        sources: Optional[Iterable[str]] = None,
    ) -> List[Dict[str, Any]]:
        scope = ", ".join(sources) if sources else "all documents"
        print(f"[INFO] Query ({scope}): {query_text}")
        query_emb = emb.encode([query_text], self.embedding_model)
        return self.search(query_emb, top_k=top_k, sources=sources)
