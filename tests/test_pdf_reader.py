import pytest
from pathlib import Path
from tools.pdf_reader import PDFReaderTool

SAMPLE_PO = str(Path(__file__).parent.parent / "input" / "sample_po.pdf")
SAMPLE_CONTRACT = str(Path(__file__).parent.parent / "input" / "sample_contract.pdf")


def test_pdf_reader_extracts_po_text():
    tool = PDFReaderTool(file_path=SAMPLE_PO)
    text = tool._run()
    assert "PURCHASE ORDER" in text
    assert "CC-PO-2025-001234" in text


def test_pdf_reader_extracts_contract_text():
    tool = PDFReaderTool(file_path=SAMPLE_CONTRACT)
    text = tool._run()
    assert "CONTRACT AGREEMENT" in text
    assert "CC-CONT-2025-001234" in text


def test_pdf_reader_returns_string():
    tool = PDFReaderTool(file_path=SAMPLE_PO)
    result = tool._run()
    assert isinstance(result, str)
    assert len(result) > 0


def test_pdf_reader_missing_file_raises():
    tool = PDFReaderTool(file_path="nonexistent_file.pdf")
    with pytest.raises(Exception):
        tool._run()
