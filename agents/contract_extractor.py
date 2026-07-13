from crewai import Agent
from tools.pdf_reader import PDFReaderTool
from utils.llm_factory import get_llm


def make_contract_extractor(contract_path: str) -> Agent:
    return Agent(
        role="Contract Document Analyst",
        goal="Extract all required fields from a Contract PDF into structured JSON",
        backstory=(
            "You are a legal contracts specialist with expertise in reading Indian "
            "commercial contracts. You locate clauses written in legal prose and extract "
            "their key terms accurately. You never infer values not explicitly stated — "
            "if a clause is absent, you record 'NOT FOUND' in confidence_notes."
        ),
        tools=[PDFReaderTool(file_path=contract_path)],
        llm=get_llm(),
        verbose=True,
    )
