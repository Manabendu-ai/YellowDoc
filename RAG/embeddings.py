"""Chunking and embedding, with the embedding model shared process-wide.

The model used to be constructed inside every ``FaissVectorStore`` and every
``EmbeddingPipeline``, which meant a fresh ~90 MB SentenceTransformer plus a
fresh torch runtime on *every* chat message. Loading it once and handing out
the same instance is the difference between a query costing milliseconds and
costing several seconds of model load — and it is a large part of why the
server ran out of memory after a few requests.
"""

from __future__ import annotations

import threading
from typing import Any, Iterable, List

import numpy as np
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

# Chunking defaults live here so the store, the pipeline and the manifest all
# agree. Changing either value invalidates an existing index (the manifest
# records them and forces a rebuild), so they are deliberately in one place.
DEFAULT_MODEL = "all-MiniLM-L6-v2"
DEFAULT_CHUNK_SIZE = 1200
DEFAULT_CHUNK_OVERLAP = 200

_models: dict[str, SentenceTransformer] = {}
_models_lock = threading.Lock()


def get_embedder(model_name: str = DEFAULT_MODEL) -> SentenceTransformer:
    """Return the one shared SentenceTransformer for ``model_name``.

    Double-checked locking, because FastAPI serves requests from a threadpool
    and two concurrent first-time callers would otherwise each pay for a full
    model load.
    """
    model = _models.get(model_name)
    if model is not None:
        return model

    with _models_lock:
        model = _models.get(model_name)
        if model is None:
            print(f"[INFO] Loading embedding model: {model_name}")
            model = SentenceTransformer(model_name)
            _models[model_name] = model
        return model


def encode(
    texts: Iterable[str],
    model_name: str = DEFAULT_MODEL,
    show_progress: bool = False,
) -> np.ndarray:
    """Embed ``texts`` as unit vectors, ready for a cosine-similarity index.

    Normalising here rather than at search time means the index can be a plain
    inner-product index and the score it returns *is* the cosine similarity,
    which is what all-MiniLM-L6-v2 was trained for. The original code used raw
    vectors with L2 distance, so a chunk's score depended partly on how long it
    was rather than only on what it said.
    """
    batch = list(texts)
    if not batch:
        return np.zeros((0, 384), dtype="float32")

    vectors = get_embedder(model_name).encode(
        batch,
        show_progress_bar=show_progress,
        normalize_embeddings=True,
    )
    return np.ascontiguousarray(np.asarray(vectors), dtype="float32")


def split_documents(
    documents: List[Any],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[Any]:
    """Split LangChain documents, preserving each one's metadata on its chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(documents)


class EmbeddingPipeline:
    """Kept for the Streamlit UI and rag_testing.py, which import it by name."""

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ):
        self.model_name = model_name
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    @property
    def model(self) -> SentenceTransformer:
        return get_embedder(self.model_name)

    def chunk_documents(self, documents: List[Any]) -> List[Any]:
        return split_documents(documents, self.chunk_size, self.chunk_overlap)

    def embed_chunks(self, chunks: List[Any]) -> np.ndarray:
        vectors = encode(
            (chunk.page_content for chunk in chunks),
            self.model_name,
            show_progress=True,
        )
        print(f"[INFO] Embeddings shape: {vectors.shape}")
        return vectors
