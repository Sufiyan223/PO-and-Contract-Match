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
