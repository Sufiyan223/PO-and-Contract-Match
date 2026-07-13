import pdfplumber
from crewai.tools import BaseTool
from pydantic import Field


class PDFReaderTool(BaseTool):
    name: str = "PDF Reader"
    description: str = (
        "Reads a PDF file and returns its full text content. "
        "No arguments needed — the file path is already configured."
    )
    file_path: str = Field(..., description="Absolute path to the PDF file to read")

    def _run(self, **kwargs) -> str:
        with pdfplumber.open(self.file_path) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        if not any(pages):
            raise ValueError(
                f"No extractable text in {self.file_path} — may be a scanned image PDF"
            )
        return "\n".join(pages)
