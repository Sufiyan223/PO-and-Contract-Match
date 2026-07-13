# PDF Validation Report — Design

**Date:** 2026-07-10
**Status:** Approved

## Problem

`write_report()` in `utils/report_writer.py` currently produces only a JSON file (`output/report_<timestamp>.json`) plus a console `print()` summary. JSON is fine for downstream/machine consumption but isn't presentable for a human reviewing PO/Contract discrepancies. We want a presentable report format in addition to — not instead of — the JSON.

## Scope

Small, additive change. No new module, no change to `write_report()`'s public signature or return value, no change to upstream crews/schemas.

## Design

**Where:** `utils/report_writer.py` only.

**New function:** `_write_pdf(sap_report: ValidationReport, contract_report: ValidationReport, now: datetime, output_path: Path) -> None`, using `fpdf2` (already a project dependency — used by `scripts/generate_samples.py` — so no new library is added). Called from `write_report()` immediately after the JSON file is written, using the same `now` timestamp so the `.json` and `.pdf` filenames share a base name (`report_<timestamp>.json` / `report_<timestamp>.pdf`) in the same `output/` directory.

**`write_report()` changes:** unchanged signature and return value (still returns the JSON path — that's what `main.py` logs and what downstream/VIM would consume). After writing the PDF, print its path to console alongside the existing JSON path print.

**PDF content** (mirrors the existing `_print_summary` structure, since that's the known-good structure to make presentable):

- Title: "PO/Contract Validation Report" + generated timestamp (from `now`)
- One section per `ValidationReport` (PO_vs_SAP, then PO_vs_Contract), in that order:
  - Heading: `validation_type` + `overall_status`, color-coded — green for `PASS`, amber for `PASS_WITH_WARNINGS`, red for `FAIL`
  - `summary` paragraph
  - If `discrepancies` is non-empty: a table (built via fpdf2's `cell()`/`multi_cell()`, matching the style already used in `scripts/generate_samples.py`) with columns `Field | PO/SAP Value | Contract Value | Severity | Note`, shaded header row, severity cell color-coded (amber for `minor`, red for `major`; `match` rows excluded, matching today's `_print_summary` filter)
  - If empty (after filtering `match`): text "No discrepancies found."

**Dependencies:** none — `fpdf2` is already in `requirements.txt`.

**Error handling:** none added. If `fpdf2` raises, it propagates like any other step in `main.py` — this prototype has no retry/fallback logic anywhere else, so no reason to special-case this one step.

**Testing:** one new test (in the existing test file/convention for `report_writer.py`, or a new `tests/test_report_writer.py` if none exists) asserting `write_report()` produces both a `.json` and a `.pdf` file, and that the PDF file is non-empty and starts with the `%PDF` magic bytes.

## Out of scope

- Company branding/logo
- Configurable templates or styling options
- Replacing JSON output
- Any change to `main.py`'s orchestration beyond what already calls `write_report()`
