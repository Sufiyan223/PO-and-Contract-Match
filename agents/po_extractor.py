from crewai import Agent
from tools.pdf_reader import PDFReaderTool
from utils.llm_factory import get_llm


def make_po_extractor(po_path: str) -> Agent:
    return Agent(
        role="PO Document Analyst",
        goal="Extract all required fields from a Purchase Order PDF into structured JSON",
        backstory=(
            "You are a procurement specialist with 15 years of experience reading "
            "Purchase Orders at Indian manufacturing companies. You extract data with "
            "precision. You never infer or guess missing values — if a field is not "
            "explicitly stated, you record it as 'NOT FOUND' in confidence_notes."
        ),
        tools=[PDFReaderTool(file_path=po_path)],
        llm=get_llm(),
        verbose=True,
    )
