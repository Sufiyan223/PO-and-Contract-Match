import json
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from crews.extraction_crew import run_extraction_crew
from crews.validation_crew import run_validation_crew
from utils.report_writer import write_report

BASE = Path(__file__).parent
PO_PATH = str(BASE / "input" / "sample_po.pdf")
CONTRACT_PATH = str(BASE / "input" / "sample_contract.pdf")
SAP_RECORD_PATH = BASE / "config" / "sap_po_record.json"


def main() -> None:
    sap_record = json.loads(SAP_RECORD_PATH.read_text())

    print("\n=== Phase 1: Extraction ===")
    po_details, contract_details = run_extraction_crew(PO_PATH, CONTRACT_PATH)
    print(f"\nPO extracted: {po_details.po_number}")
    print(f"Contract extracted: {contract_details.contract_agreement_number}")

    print("\n=== Phase 2: Validation ===")
    sap_report, contract_report = run_validation_crew(po_details, contract_details, sap_record)

    print("\n=== Phase 3: Report ===")
    output_path = write_report(sap_report, contract_report)
    print(f"\nReport saved: {output_path}")


if __name__ == "__main__":
    main()
