import base64
import json
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from api.main import app
from schemas.contract_schema import ContractDetails
from schemas.discrepancy_schema import DiscrepancyItem, ValidationReport
from schemas.po_schema import PODetails

client = TestClient(app)

FAKE_PO = PODetails(
    po_number="CC-PO-2025-001234",
    po_date="2025-08-15",
    contract_period_start="2025-09-01",
    contract_period_end="2026-08-31",
    contract_price="INR 45,00,000",
    payment_terms="Net 30 days",
    liquidated_damage="0.5% per week, max 5%",
    pricing_info="Fixed price",
    contact_info="procurement@clientco.com",
    confidence_notes="",
)

FAKE_CONTRACT = ContractDetails(
    contract_agreement_number="CC-CONT-2025-001234",
    validity_start="2025-09-01",
    validity_end="2026-08-31",
    owner="ClientCo Limited",
    service_provider="ABC Engineering Services Pvt. Ltd.",
    payment_terms="Payment within 30 days of invoice",
    liquidated_damage="0.5% per week, max 10%",
    pricing_info="INR 45,50,000 fixed",
    bank_guarantee="10% of contract value",
    penalty_info="2% for quality non-conformance",
    confidence_notes="",
)

FAKE_SAP_REPORT = ValidationReport(
    validation_type="PO_vs_SAP",
    summary="No discrepancies found.",
    discrepancies=[
        DiscrepancyItem(
            field="contract_price",
            source_a="INR 45,00,000",
            source_b="INR 45,00,000",
            severity="match",
            note="Matches",
        )
    ],
    overall_status="PASS",
)

FAKE_CONTRACT_REPORT = ValidationReport(
    validation_type="PO_vs_Contract",
    summary="One major discrepancy found.",
    discrepancies=[
        DiscrepancyItem(
            field="contract_price",
            source_a="INR 45,00,000",
            source_b="INR 45,50,000",
            severity="major",
            note="Price differs by INR 50,000",
        )
    ],
    overall_status="FAIL",
)


@pytest.fixture(autouse=True)
def _set_api_key(monkeypatch):
    monkeypatch.setenv("API_KEY", "test-key")


def _upload_files():
    return {
        "po_pdf": ("po.pdf", b"%PDF-1.4 fake po content", "application/pdf"),
        "contract_pdf": ("contract.pdf", b"%PDF-1.4 fake contract content", "application/pdf"),
    }


@patch("api.main.run_validation_crew", return_value=(FAKE_SAP_REPORT, FAKE_CONTRACT_REPORT))
@patch("api.main.run_extraction_crew", return_value=(FAKE_PO, FAKE_CONTRACT))
def test_validate_happy_path(mock_extraction, mock_validation):
    response = client.post(
        "/validate",
        headers={"X-API-Key": "test-key"},
        files=_upload_files(),
        data={"sap_record": json.dumps({"po_number": "CC-PO-2025-001234"})},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["sap_validation"]["overall_status"] == "PASS"
    assert body["contract_validation"]["overall_status"] == "FAIL"
    assert base64.b64decode(body["report_pdf_base64"]).startswith(b"%PDF")


def test_validate_missing_api_key():
    response = client.post(
        "/validate",
        files=_upload_files(),
        data={"sap_record": "{}"},
    )
    assert response.status_code == 401


def test_validate_wrong_api_key():
    response = client.post(
        "/validate",
        headers={"X-API-Key": "wrong-key"},
        files=_upload_files(),
        data={"sap_record": "{}"},
    )
    assert response.status_code == 401


def test_validate_invalid_sap_record_json():
    response = client.post(
        "/validate",
        headers={"X-API-Key": "test-key"},
        files=_upload_files(),
        data={"sap_record": "not valid json"},
    )
    assert response.status_code == 400


def test_validate_sap_record_not_a_json_object():
    response = client.post(
        "/validate",
        headers={"X-API-Key": "test-key"},
        files=_upload_files(),
        data={"sap_record": "42"},
    )
    assert response.status_code == 400


def test_validate_missing_required_field():
    response = client.post(
        "/validate",
        headers={"X-API-Key": "test-key"},
        files={"po_pdf": ("po.pdf", b"%PDF-1.4 fake po content", "application/pdf")},
        data={"sap_record": "{}"},
    )
    assert response.status_code == 400


@patch("api.main.run_extraction_crew", side_effect=RuntimeError("LLM API error"))
def test_validate_pipeline_failure(mock_extraction):
    response = client.post(
        "/validate",
        headers={"X-API-Key": "test-key"},
        files=_upload_files(),
        data={"sap_record": "{}"},
    )
    assert response.status_code == 500
