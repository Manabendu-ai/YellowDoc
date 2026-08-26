"""The document → markdown → json → xlsx pipeline.

Two structural changes here.

Every step is blocking and CPU-bound (Docling inference, a Groq round trip,
OpenPyXL writing), and ``convert`` was declared ``async`` while doing all of it
inline. That runs on the event loop, so for the whole minute-or-two of a
conversion the server could not answer anything else — including the health
check the front end polls. ``convert`` now hands the work to a worker thread.

The freshly written markdown is also registered with the search index as soon as
it exists, so a document becomes askable the moment it is converted rather than
on the next query that happens to trigger a rescan.
"""

from __future__ import annotations

import os

from anyio import to_thread

from ..docling_processing.markdown_extractor import MDExtractor
from ..excel.excel_generator import ExcelGenerator
from ..llm.llm_model import ModelEngine


class ExcelService:
    def __init__(self, file_path: str, excel_filename: str):
        self.file_path = file_path
        self.excel_filename = excel_filename
        self.extractor = MDExtractor()
        self.model = ModelEngine()
        self.excel_gen = ExcelGenerator()
        self.md_path: str | None = None
        self.indexed: bool = False

    def markdown_generator(self) -> str:
        self.markdown = self.extractor.extract(self.file_path)
        self.md_path = self.extractor.save("md_files/")
        return self.md_path

    def index_markdown(self) -> bool:
        """Make the new document searchable.

        Imported lazily and failure-tolerant on purpose: a broken index must not
        turn a successful conversion into a 502. If this does not run, the next
        query rescans md_files/ and picks the document up anyway — this only
        moves the cost off the user's first question.
        """
        if not self.md_path:
            return False
        try:
            from .rag_service import RagService

            result = RagService.index_document(self.md_path)
            self.indexed = True
            print(
                f"[INFO] Indexed {os.path.basename(self.md_path)} "
                f"({result.get('mode', 'unknown')}, {result.get('chunks', 0)} chunks)"
            )
            return True
        except Exception as e:  # noqa: BLE001 - never fail the conversion for this
            print(f"[WARN] Could not index {self.md_path}: {e}")
            return False

    def json_converter(self) -> str:
        if not getattr(self, "markdown", None) or not self.markdown.strip():
            raise ValueError("The document contains no readable text to structure.")
        self.workbook_json = self.model.run(self.markdown)
        self.json_path = self.model.save(self.excel_filename, "json_files/")
        return self.json_path

    def excel_generator(self) -> str:
        self.excel_path = self.excel_gen.save(
            workbook_json=self.workbook_json,
            filename=self.excel_filename,
        )
        return self.excel_path

    def run(self) -> str:
        """The pipeline, synchronously. Call from a worker thread."""
        self.markdown_generator()
        # Before the LLM step, so a document stays searchable even if structuring
        # fails: the text was extracted successfully, which is all search needs.
        self.index_markdown()
        self.json_converter()
        self.excel_generator()
        return self.excel_path

    async def convert(self) -> str:
        """Same contract as before, but off the event loop."""
        return await to_thread.run_sync(self.run)
