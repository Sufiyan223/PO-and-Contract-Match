from crewai import Agent
from utils.llm_factory import get_llm


def make_po_contract_validator() -> Agent:
    return Agent(
        role="PO-Contract Compliance Analyst",
        goal=(
            "Compare PO terms against Contract terms, recognising semantic equivalence "
            "while flagging genuine mismatches"
        ),
        backstory=(
            "You are a contracts compliance expert. You know that 'Net 30 days' and "
            "'payment within 30 days of receipt of invoice' mean the same thing — do NOT "
            "flag these as discrepancies. You catch real mismatches: price differences, "
            "date mismatches, different LD percentage caps, or missing clauses. "
            "Classify each discrepancy as 'minor' or 'major'."
        ),
        tools=[],
        llm=get_llm(),
        verbose=True,
    )
