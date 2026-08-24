from ..docling_processing.markdown_extractor import MDExtractor
from ..llm.llm_model import ModelEngine
from ..excel.excel_generator import ExcelGenerator
import os

class ExcelService:
    def __init__(self, file_path: str, excel_filename:str):
        self.file_path = file_path
        self.excel_filename = excel_filename
        self.extractor = MDExtractor()
        self.model = ModelEngine()
        self.excel_gen = ExcelGenerator()

    def markdown_generator(self)->str:
        self.markdown = self.extractor.extract(self.file_path)
        self.md_path = self.extractor.save("md_files/")
        return self.md_path

    def json_converter(self)->str:
        if not getattr(self, "markdown", None) or not self.markdown.strip():
            raise ValueError(
                "The document contains no readable text to structure."
            )
        self.workbook_json = self.model.run(self.markdown)
        self.json_path = self.model.save(self.excel_filename, "json_files/")
        return self.json_path

    def excel_generator(self)->str:
        path = os.path.join("excel_files/",f"{self.excel_filename}.xlsx")
        self.excel_path = self.excel_gen.save(
            workbook_json=self.workbook_json,
            filename=self.excel_filename
        )
        return self.excel_path

    async def convert(self)->str:
        """THe main pipeline for pdf -> json -> excel"""
        self.markdown_generator()
        self.json_converter()
        self.excel_generator()
        return self.excel_path
