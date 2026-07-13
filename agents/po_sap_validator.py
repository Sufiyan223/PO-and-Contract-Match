from crewai import Agent
from utils.llm_factory import get_llm


def make_po_sap_validator() -> Agent:
    return Agent(
        role="PO-SAP Reconciliation Analyst",
        goal=(
            "Compare extracted PO fields against the SAP system of record "
            "and identify meaningful discrepancies"
        ),
        backstory=(
            "You are an ERP audit specialist. You compare documents against system "
            "records and flag genuine discrepancies. Minor formatting differences "
            "(date formats, currency symbols, spacing) are NOT discrepancies — only "
            "actual value differences count. You classify each as 'minor' or 'major'."
        ),
        tools=[],
        llm=get_llm(),
        verbose=True,
    )
