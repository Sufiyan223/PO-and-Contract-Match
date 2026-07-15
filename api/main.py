import base64
import json
import shutil
import tempfile
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, UploadFile
from pydantic import BaseModel

from api.auth import require_api_key
from crews.extraction_crew import run_extraction_crew
from crews.validation_crew import run_validation_crew
from schemas.discrepancy_schema import ValidationReport
from utils.report_writer import write_report

app = FastAPI(title="PO and Contract Match API")


class ValidateResponse(BaseModel):
    sap_validation: ValidationReport
    contract_validation: ValidationReport
    report_pdf_base64: str


@app.post(
    "/validate",
    response_model=ValidateResponse,
    dependencies=[Depends(require_api_key)],
)
def validate(
    po_pdf: UploadFile = File(...),
    contract_pdf: UploadFile = File(...),
    sap_record: str = Form(...),
) -> ValidateResponse:
    sap_record_dict = json.loads(sap_record)

    temp_dir = Path(tempfile.mkdtemp(prefix="po_contract_match_"))
    try:
        po_path = temp_dir / "po.pdf"
        contract_path = temp_dir / "contract.pdf"
        po_path.write_bytes(po_pdf.file.read())
        contract_path.write_bytes(contract_pdf.file.read())

        po_details, contract_details = run_extraction_crew(str(po_path), str(contract_path))
        sap_report, contract_report = run_validation_crew(
            po_details, contract_details, sap_record_dict
        )
        report_json_path = write_report(sap_report, contract_report)

        pdf_path = report_json_path.with_suffix(".pdf")
        pdf_base64 = base64.b64encode(pdf_path.read_bytes()).decode("ascii")

        return ValidateResponse(
            sap_validation=sap_report,
            contract_validation=contract_report,
            report_pdf_base64=pdf_base64,
        )
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
