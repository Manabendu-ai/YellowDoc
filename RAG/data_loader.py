"""Loads the extracted Markdown that retrieval searches over.

Every document carries a ``source`` (the file name, e.g. ``sample3.md``) and a
``document`` (the human label, e.g. ``sample3``) in its metadata. The first
version dropped this, which is why an answer about sample3.pdf could quote a
completely different invoice with nothing to reveal the substitution.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List

from langchain_core.documents import Document

MD_DIR = "md_files/"


def describe(path: Path) -> Dict[str, Any]:
    """The identity of one document on disk: what it is, and which version.

    ``mtime`` and ``size`` are what let the index notice that a file was
    replaced — converting twice under the same name rewrites the Markdown, and
    without this the index would keep serving the superseded text.
    """
    stat = path.stat()
    return {
        "source": path.name,
        "document": path.stem,
        "mtime": int(stat.st_mtime),
        "size": stat.st_size,
    }


def list_documents(dir: str = MD_DIR) -> List[Dict[str, Any]]:
    """Every Markdown file available to search, sorted for stable ordering."""
    root = Path(dir)
    if not root.is_dir():
        return []
    return sorted(
        (describe(p) for p in root.glob("**/*.md") if p.is_file()),
        key=lambda d: d["source"],
    )


def load_document(path: str | os.PathLike[str]) -> List[Document]:
    """Load one Markdown file as a single LangChain document."""
    p = Path(path)
    text = p.read_text(encoding="utf-8", errors="replace")
    if not text.strip():
        return []

    info = describe(p)
    return [
        Document(
            page_content=text,
            metadata={
                "source": info["source"],
                "document": info["document"],
                "mtime": info["mtime"],
                "size": info["size"],
            },
        )
    ]


class DocumentLoader:
    def load_all_documents(self, dir: str = MD_DIR) -> List[Any]:
        root = Path(dir)
        if not root.is_dir():
            print(f"[WARN] Data Loader: {root} does not exist")
            return []

        docs: List[Any] = []
        for md_file in sorted(root.glob("**/*.md")):
            if not md_file.is_file():
                continue
            try:
                docs.extend(load_document(md_file))
            except Exception as e:
                print(f"[EXCEPTION] Data Loader {md_file.name}: {e}")

        return docs

    def load_one(self, path: str | os.PathLike[str]) -> List[Any]:
        try:
            return load_document(path)
        except Exception as e:
            print(f"[EXCEPTION] Data Loader {path}: {e}")
            return []
