from docling.document_converter import DocumentConverter
import os
from dotenv import load_dotenv

load_dotenv()

os.environ["HF_TOKEN"] = os.getenv("HF_TOKEN")
os.environ["CUDA_VISIBLE_DEVICES"] = ""

class MDExtractor:
    def __init__(self):
        self.converter = DocumentConverter()

    def extract(self, file_path:str)->str:
        self.file_path = file_path
        doc = self.converter.convert(file_path)
        self.content = doc.document.export_to_markdown()

        if not self.content or not self.content.strip():
            raise ValueError(
                "No readable text could be extracted from this document. "
                "It may be blank, corrupted, or an unsupported scan."
            )
        return self.content

    def save(self, persist_dir:str = "docs/")->str:
        os.makedirs(persist_dir, exist_ok=True)

        base_name = os.path.splitext(os.path.basename(self.file_path))[0]
        md_path = os.path.join(persist_dir, f"{base_name}.md")

        with open(md_path, "w", encoding="utf-8") as f:
            f.write(self.content)

        print(f"[SUCCESS] File Saved at : {md_path}")
        return md_path
