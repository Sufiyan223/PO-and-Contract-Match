import json
import pytest
from pathlib import Path
from schemas.discrepancy_schema import ValidationReport, DiscrepancyItem
from utils.report_writer import write_report


def _make_report(validation_type: str, status: str) -> ValidationReport:
    return ValidationReport(
        validation_type=validation_type,
        summary="Test summary for validation.",
        discrepancies=[
            DiscrepancyItem(
                field="contract_price",
                source_a="INR 45,00,000",
                source_b="INR 45,50,000",
                severity="major",
                note="Price differs by INR 50,000",
            )
        ],
        overall_status=status,
    )


def test_write_report_creates_json_file(tmp_path, monkeypatch):
    import utils.report_writer as rw
    monkeypatch.setattr(rw, "OUTPUT_DIR", tmp_path)

    sap_report = _make_report("PO_vs_SAP", "PASS")
    contract_report = _make_report("PO_vs_Contract", "FAIL")

    output_path = write_report(sap_report, contract_report)

    assert output_path.exists()


def test_write_report_json_has_two_reports(tmp_path, monkeypatch):
    import utils.report_writer as rw
    monkeypatch.setattr(rw, "OUTPUT_DIR", tmp_path)

    sap_report = _make_report("PO_vs_SAP", "PASS")
    contract_report = _make_report("PO_vs_Contract", "FAIL")

    output_path = write_report(sap_report, contract_report)
    data = json.loads(output_path.read_text())

    assert "reports" in data
    assert len(data["reports"]) == 2


def test_write_report_json_contains_both_validation_types(tmp_path, monkeypatch):
    import utils.report_writer as rw
    monkeypatch.setattr(rw, "OUTPUT_DIR", tmp_path)

    sap_report = _make_report("PO_vs_SAP", "PASS")
    contract_report = _make_report("PO_vs_Contract", "FAIL")

    output_path = write_report(sap_report, contract_report)
    data = json.loads(output_path.read_text())

    types = {r["validation_type"] for r in data["reports"]}
    assert types == {"PO_vs_SAP", "PO_vs_Contract"}


def test_write_report_filename_has_timestamp(tmp_path, monkeypatch):
    import utils.report_writer as rw
    monkeypatch.setattr(rw, "OUTPUT_DIR", tmp_path)

    sap_report = _make_report("PO_vs_SAP", "PASS")
    contract_report = _make_report("PO_vs_Contract", "PASS")

    output_path = write_report(sap_report, contract_report)
    assert output_path.name.startswith("report_")
    assert output_path.suffix == ".json"


def test_write_report_creates_pdf_file(tmp_path, monkeypatch):
    import utils.report_writer as rw
    monkeypatch.setattr(rw, "OUTPUT_DIR", tmp_path)

    sap_report = _make_report("PO_vs_SAP", "PASS")
    contract_report = _make_report("PO_vs_Contract", "FAIL")

    output_path = write_report(sap_report, contract_report)
    pdf_path = output_path.with_suffix(".pdf")

    assert pdf_path.exists()


def test_pdf_report_is_valid_pdf(tmp_path, monkeypatch):
    import utils.report_writer as rw
    monkeypatch.setattr(rw, "OUTPUT_DIR", tmp_path)

    sap_report = _make_report("PO_vs_SAP", "PASS")
    contract_report = _make_report("PO_vs_Contract", "FAIL")

    output_path = write_report(sap_report, contract_report)
    pdf_path = output_path.with_suffix(".pdf")

    assert pdf_path.read_bytes().startswith(b"%PDF")


def test_pdf_report_handles_unicode_characters(tmp_path, monkeypatch):
    import utils.report_writer as rw
    monkeypatch.setattr(rw, "OUTPUT_DIR", tmp_path)

    sap_report = ValidationReport(
        validation_type="PO_vs_SAP",
        summary="Prices differ – the PO lists ₹45,00,000 — “fixed” per the contract.",
        discrepancies=[
            DiscrepancyItem(
                field="contract_price",
                source_a="INR 45,00,000",
                source_b="INR 45,50,000",
                severity="major",
                note="Price differs by ₹50,000 – flagged as major.",
            )
        ],
        overall_status="FAIL",
    )
    contract_report = _make_report("PO_vs_Contract", "PASS")

    output_path = write_report(sap_report, contract_report)
    pdf_path = output_path.with_suffix(".pdf")

    assert pdf_path.exists()
    assert pdf_path.read_bytes().startswith(b"%PDF")


def test_pdf_report_handles_no_discrepancies(tmp_path, monkeypatch):
    import utils.report_writer as rw
    monkeypatch.setattr(rw, "OUTPUT_DIR", tmp_path)

    clean_report = ValidationReport(
        validation_type="PO_vs_SAP",
        summary="Everything matches.",
        discrepancies=[],
        overall_status="PASS",
    )
    contract_report = _make_report("PO_vs_Contract", "PASS")

    output_path = write_report(clean_report, contract_report)
    pdf_path = output_path.with_suffix(".pdf")

    assert pdf_path.exists()
    assert pdf_path.read_bytes().startswith(b"%PDF")
