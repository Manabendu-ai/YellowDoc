"""Docling → Markdown.

``DocumentConverter`` caches its initialised pipelines on the *instance*
(``self.initialized_pipelines``), not on the class. The previous version built a
new converter inside every ``MDExtractor``, and ``MDExtractor`` was constructed
per request, so each conversion loaded Docling's layout and TableFormer weights
from scratch — roughly a gigabyte of torch tensors per call, with the previous
call's copy still reachable. That is why the server died after a conversion or
two and had to be restarted.

One converter for the process fixes both the memory growth and the ~20 s of
model loading that used to be charged to every single upload.
"""

from __future__ import annotations

import os
import threading

from docling.document_converter import DocumentConverter
from dotenv import load_dotenv

load_dotenv()

# Assigning None into os.environ raises TypeError, so a missing HF_TOKEN used to
# take the whole server down at import time with a confusing traceback.
_hf_token = os.getenv("HF_TOKEN")
if _hf_token:
    os.environ["HF_TOKEN"] = _hf_token

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")

_converter: DocumentConverter | None = None
_converter_lock = threading.Lock()


def get_converter() -> DocumentConverter:
    """The one Docling converter for this process, built on first use."""
    global _converter
    if _converter is not None:
        return _converter
    with _converter_lock:
        if _converter is None:
            print("[INFO] Initialising Docling DocumentConverter (first use)")
            _converter = DocumentConverter()
        return _converter


class MDExtractor:
    def __init__(self):
        # No model loading here — the converter is shared and lazy, so building
        # an MDExtractor is free.
        self.content: str | None = None
        self.file_path: str | None = None

    @property
    def converter(self) -> DocumentConverter:
        return get_converter()

    def extract(self, file_path: str) -> str:
        self.file_path = file_path
        doc = self.converter.convert(file_path)
        self.content = doc.document.export_to_markdown()

        if not self.content or not self.content.strip():
            raise ValueError(
                "No readable text could be extracted from this document. "
                "It may be blank, corrupted, or an unsupported scan."
            )
        return self.content

    def save(self, persist_dir: str = "docs/") -> str:
        if self.content is None or self.file_path is None:
            raise ValueError("Nothing has been extracted yet.")

        os.makedirs(persist_dir, exist_ok=True)

        base_name = os.path.splitext(os.path.basename(self.file_path))[0]
        md_path = os.path.join(persist_dir, f"{base_name}.md")

        with open(md_path, "w", encoding="utf-8") as f:
            f.write(self.content)

        print(f"[SUCCESS] File Saved at : {md_path}")
        return md_path
