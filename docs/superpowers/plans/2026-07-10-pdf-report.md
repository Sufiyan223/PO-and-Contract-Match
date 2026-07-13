# PDF Validation Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a presentable PDF report, generated alongside the existing JSON report, so PO/Contract discrepancy findings are human-readable.

**Architecture:** `utils/report_writer.py` gains one new function, `_write_pdf()`, called from the existing `write_report()` right after the JSON file is written. It builds a PDF with `fpdf2` (already a project dependency — used in `scripts/generate_samples.py`) using its high-level `pdf.table()` API for the discrepancy grid. No other file changes.

**Tech Stack:** `fpdf2` (already installed, version 2.8.7 confirmed in this environment) — `FPDF`, `fpdf.fonts.FontFace`, `fpdf.enums.XPos`/`YPos`.

## Global Constraints

- No new dependency — do not add `reportlab` or anything else to `requirements.txt`; `fpdf2` is already there.
- `write_report()`'s signature and return value (the JSON `Path`) must not change — `main.py` depends on it.
- Do not use the deprecated `cell(..., ln=True)` form — use `new_x=XPos.LMARGIN, new_y=YPos.NEXT` (confirmed via `python -c` in this repo's venv that this avoids the `DeprecationWarning` that `ln=True` raises in the installed fpdf2 2.8.7).
- Follow the existing `_print_summary` filter: discrepancies with `severity == "match"` are excluded from what's shown.
- PDF filename must share the JSON's timestamp: `report_<timestamp>.pdf` next to `report_<timestamp>.json` in `output/`.

---

### Task 1: Generate a presentable PDF report alongside the JSON report

**Files:**
- Modify: `utils/report_writer.py` (full contents shown below)
- Test: `tests/test_report_writer.py`

**Interfaces:**
- Consumes: `schemas.discrepancy_schema.ValidationReport` (fields: `validation_type: Literal["PO_vs_SAP","PO_vs_Contract"]`, `summary: str`, `discrepancies: list[DiscrepancyItem]`, `overall_status: Literal["PASS","PASS_WITH_WARNINGS","FAIL"]`) and `DiscrepancyItem` (fields: `field: str`, `source_a: str`, `source_b: str`, `severity: Literal["match","minor","major"]`, `note: str`) — both already defined in `schemas/discrepancy_schema.py`, unchanged.
- Produces: `write_report(sap_report, contract_report) -> Path` — same signature as before, still returns the JSON path. New side effect: also writes `output/report_<timestamp>.pdf`.

- [ ] **Step 1: Write the failing tests**

Add these tests to the end of `tests/test_report_writer.py` (the file already has `_make_report`, `json`, `pytest`, `Path` imported at the top — no new imports needed):

```python
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
```

The third test constructs a `ValidationReport` directly, so add `ValidationReport` to the existing schema import line at the top of the file — it currently reads:

```python
from schemas.discrepancy_schema import ValidationReport, DiscrepancyItem
```

`ValidationReport` is already imported, so no change needed there.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pytest tests/test_report_writer.py -v`
Expected: `test_write_report_creates_pdf_file`, `test_pdf_report_is_valid_pdf`, and `test_pdf_report_handles_no_discrepancies` all FAIL (PDF file doesn't exist yet — `write_report` doesn't produce one). The four pre-existing JSON tests should still PASS.

- [ ] **Step 3: Replace `utils/report_writer.py` with the full implementation**

```python
import json
from datetime import datetime
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos
from fpdf.fonts import FontFace

from schemas.discrepancy_schema import ValidationReport

OUTPUT_DIR = Path(__file__).parent.parent / "output"

STATUS_COLORS = {
    "PASS": (0, 128, 0),
    "PASS_WITH_WARNINGS": (204, 153, 0),
    "FAIL": (200, 0, 0),
}
SEVERITY_COLORS = {
    "minor": (204, 153, 0),
    "major": (200, 0, 0),
}


def write_report(sap_report: ValidationReport, contract_report: ValidationReport) -> Path:
    OUTPUT_DIR.mkdir(exist_ok=True)
    now = datetime.now()
    output_path = OUTPUT_DIR / f"report_{now.strftime('%Y%m%d_%H%M%S')}.json"
    pdf_path = output_path.with_suffix(".pdf")

    payload = {
        "generated_at": now.isoformat(),
        "reports": [sap_report.model_dump(), contract_report.model_dump()],
    }
    output_path.write_text(json.dumps(payload, indent=2))

    _write_pdf(sap_report, contract_report, now, pdf_path)

    _print_summary(sap_report, contract_report)
    print(f"\nPDF report saved: {pdf_path}")
    return output_path


def _write_pdf(
    sap_report: ValidationReport,
    contract_report: ValidationReport,
    now: datetime,
    output_path: Path,
) -> None:
    pdf = FPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "PO/Contract Validation Report", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.set_font("Helvetica", size=10)
    pdf.cell(
        0, 8, f"Generated: {now.strftime('%Y-%m-%d %H:%M:%S')}",
        new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C",
    )
    pdf.ln(4)

    for report in (sap_report, contract_report):
        _write_pdf_section(pdf, report)

    pdf.output(str(output_path))


def _write_pdf_section(pdf: FPDF, report: ValidationReport) -> None:
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*STATUS_COLORS[report.overall_status])
    pdf.cell(
        0, 9, f"{report.validation_type} - {report.overall_status}",
        new_x=XPos.LMARGIN, new_y=YPos.NEXT,
    )
    pdf.set_text_color(0, 0, 0)

    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, 6, report.summary)
    pdf.ln(2)

    flagged = [d for d in report.discrepancies if d.severity != "match"]
    if not flagged:
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 6, "No discrepancies found.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(6)
        return

    pdf.set_font("Helvetica", size=9)
    header_style = FontFace(emphasis="BOLD", fill_color=(220, 220, 220))
    with pdf.table(
        col_widths=(18, 24, 24, 12, 22),
        text_align="LEFT",
        headings_style=header_style,
    ) as table:
        header_row = table.row()
        for label in ("Field", "PO/SAP Value", "Contract Value", "Severity", "Note"):
            header_row.cell(label)
        for item in flagged:
            row = table.row()
            row.cell(item.field)
            row.cell(item.source_a)
            row.cell(item.source_b)
            row.cell(
                item.severity,
                style=FontFace(color=SEVERITY_COLORS.get(item.severity, (0, 0, 0))),
            )
            row.cell(item.note)
    pdf.ln(6)


def _print_summary(sap_report: ValidationReport, contract_report: ValidationReport) -> None:
    for report in (sap_report, contract_report):
        print(f"\n{'=' * 60}")
        print(f"  {report.validation_type}  —  {report.overall_status}")
        print(f"{'=' * 60}")
        print(report.summary)
        flagged = [d for d in report.discrepancies if d.severity != "match"]
        if flagged:
            print("\nDiscrepancies:")
            for item in flagged:
                print(f"  [{item.severity.upper()}] {item.field}")
                print(f"    PO/SAP : {item.source_a}")
                print(f"    Contract: {item.source_b}")
                print(f"    Note   : {item.note}")
        else:
            print("  No discrepancies found.")
```

This changes only `write_report()` (added the PDF call + print line) and adds `_write_pdf()` / `_write_pdf_section()`. `_print_summary()` is unchanged from the current file.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pytest tests/test_report_writer.py -v`
Expected: all 7 tests PASS (4 pre-existing JSON tests + 3 new PDF tests).

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `pytest -v`
Expected: all tests across `tests/test_llm_factory.py`, `tests/test_pdf_reader.py`, `tests/test_report_writer.py`, `tests/test_schemas.py` PASS.

- [ ] **Step 6: Manually sanity-check the PDF renders sensibly**

Run:
```bash
python -c "
from tests.test_report_writer import _make_report
from utils.report_writer import write_report
r1 = _make_report('PO_vs_SAP', 'PASS')
r2 = _make_report('PO_vs_Contract', 'FAIL')
path = write_report(r1, r2)
print(path.with_suffix('.pdf'))
"
```
Open the printed `.pdf` path (e.g. `output/report_<timestamp>.pdf`) in a PDF viewer and confirm: title + timestamp at top, two sections (PO_vs_SAP in green heading, PO_vs_Contract in red heading), each with a summary paragraph and a discrepancy table with the "major" severity cell in red.

- [ ] **Step 7: Commit**

```bash
git add utils/report_writer.py tests/test_report_writer.py
git commit -m "$(cat <<'EOF'
Generate a presentable PDF report alongside the JSON output

JSON is fine for downstream consumption but isn't readable by the
people reviewing PO/Contract discrepancies day to day. Reuses fpdf2
(already a project dependency) so no new library is introduced.
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** title+timestamp ✓, per-report section with color-coded status heading ✓, summary paragraph ✓, discrepancy table with the 5 specified columns and severity color-coding ✓, "No discrepancies found" fallback ✓ (Step 1's third test), same-timestamp filename pairing ✓, `write_report()` signature/return unchanged ✓, no new dependency ✓, error handling deliberately unchanged ✓ (per spec's "none added" — no task needed).
- **Placeholder scan:** none found — all code blocks are complete and were validated against the actually-installed fpdf2 2.8.7 in this repo's environment (`pdf.table()` + `FontFace` + `XPos`/`YPos` all confirmed working via direct execution, not assumed from docs).
- **Type consistency:** `_write_pdf(sap_report, contract_report, now, output_path)` signature matches its call site in `write_report()`; `_write_pdf_section(pdf, report)` used consistently for both reports.
