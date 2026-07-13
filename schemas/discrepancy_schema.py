from typing import Literal
from pydantic import BaseModel


class DiscrepancyItem(BaseModel):
    field: str
    source_a: str
    source_b: str
    severity: Literal["match", "minor", "major"]
    note: str


class ValidationReport(BaseModel):
    validation_type: Literal["PO_vs_SAP", "PO_vs_Contract"]
    summary: str
    discrepancies: list[DiscrepancyItem]
    overall_status: Literal["PASS", "PASS_WITH_WARNINGS", "FAIL"]
