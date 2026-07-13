import json

from crewai import Crew, Task, Process

from agents.po_sap_validator import make_po_sap_validator
from agents.po_contract_validator import make_po_contract_validator
from schemas.po_schema import PODetails
from schemas.contract_schema import ContractDetails
from schemas.discrepancy_schema import ValidationReport


def run_validation_crew(
    po_details: PODetails,
    contract_details: ContractDetails,
    sap_record: dict,
) -> tuple[ValidationReport, ValidationReport]:
    sap_validator = make_po_sap_validator()
    contract_validator = make_po_contract_validator()

    sap_task = Task(
        description=(
            "Compare the extracted PO data against the SAP system record below.\n\n"
            f"EXTRACTED PO DATA:\n{po_details.model_dump_json(indent=2)}\n\n"
            f"SAP SYSTEM RECORD:\n{json.dumps(sap_record, indent=2)}\n\n"
            "Identify meaningful discrepancies only — ignore formatting differences. "
            "For each field, produce a DiscrepancyItem with severity 'match', 'minor', or 'major'. "
            "Set overall_status to PASS (no major discrepancies), "
            "PASS_WITH_WARNINGS (minor discrepancies only), or FAIL (any major discrepancy). "
            "Set validation_type to 'PO_vs_SAP'. "
            "Return a JSON object matching the ValidationReport schema exactly."
        ),
        expected_output=(
            "A JSON ValidationReport with validation_type='PO_vs_SAP', a summary paragraph, "
            "a list of DiscrepancyItem objects, and an overall_status."
        ),
        agent=sap_validator,
        output_pydantic=ValidationReport,
    )

    contract_task = Task(
        description=(
            "Compare the extracted PO data against the Contract data below.\n\n"
            f"PO DATA:\n{po_details.model_dump_json(indent=2)}\n\n"
            f"CONTRACT DATA:\n{contract_details.model_dump_json(indent=2)}\n\n"
            "Recognise semantic equivalence — 'Net 30 days' and 'payment within 30 days' "
            "are the SAME and must be marked severity='match'. "
            "Flag genuine mismatches (price differences, different LD caps, date mismatches) "
            "as 'minor' or 'major'. "
            "Set overall_status to PASS, PASS_WITH_WARNINGS, or FAIL. "
            "Set validation_type to 'PO_vs_Contract'. "
            "Return a JSON object matching the ValidationReport schema exactly."
        ),
        expected_output=(
            "A JSON ValidationReport with validation_type='PO_vs_Contract', a summary paragraph, "
            "a list of DiscrepancyItem objects, and an overall_status."
        ),
        agent=contract_validator,
        output_pydantic=ValidationReport,
    )

    crew = Crew(
        agents=[sap_validator, contract_validator],
        tasks=[sap_task, contract_task],
        process=Process.sequential,
        verbose=True,
    )

    crew.kickoff()

    sap_report: ValidationReport = sap_task.output.pydantic
    contract_report: ValidationReport = contract_task.output.pydantic

    return sap_report, contract_report
