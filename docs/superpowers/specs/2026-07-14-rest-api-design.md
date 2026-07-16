# REST API for PO and Contract Match — Design

## Purpose

Expose the existing PO/Contract validation pipeline (currently only runnable via `main.py`) as an HTTP API, so any external application can submit a PO PDF, a Contract PDF, and an SAP record, and receive the discrepancy report back — without needing Python, a local venv, or CLI access.

## Architecture

A new `api/` package sits alongside `crews/`, `agents/`, `schemas/`, etc. It is a thin HTTP layer only — no business logic lives here. It orchestrates calls into the existing pipeline (`crews/extraction_crew.py`, `crews/validation_crew.py`, `utils/report_writer.py`).

**Post-implementation note:** manual end-to-end verification (see the implementation plan's Task 4) found that `utils/report_writer.py` crashed on real LLM output containing characters outside the PDF's `helvetica` font range (en/em dashes, curly quotes, `₹`, etc.). This was an approved, out-of-plan exception to "unchanged" — a `_sanitize_text` helper was added at PDF-render call sites only, leaving the JSON report's original text untouched. This affects `main.py` (CLI) too, not just the API.

`main.py` (CLI entry point) and `api/main.py` (server entry point) are two independent front doors to the same core pipeline. Neither imports the other.

```
api/
├── __init__.py
├── main.py       # FastAPI app + POST /validate endpoint
└── auth.py       # API key dependency
```

**Framework choice:** FastAPI. The project's schemas (`schemas/po_schema.py`, `contract_schema.py`, `discrepancy_schema.py`) are already Pydantic models — FastAPI validates requests/responses against them natively and generates interactive docs at `/docs` for free, which directly serves the "integrate with any application" goal (integrators get a browsable, self-documenting contract).

Rejected alternatives:
- **Flask** — no native Pydantic integration; would require hand-written validation/serialization the project already has for free via FastAPI.
- **CLI flag on `main.py` to start a server** — mixes one-shot script and long-running server concerns in a single entry point; worse separation than a dedicated `api/` module.

## Endpoint

### `POST /validate`

**Auth:** Required. Header `X-API-Key: <value>`, checked against `API_KEY` in `.env`. Missing or mismatched key → `401`.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `po_pdf` | file | Purchase Order PDF |
| `contract_pdf` | file | Contract PDF |
| `sap_record` | form field (JSON string) | SAP PO record, same shape as `config/sap_po_record.json`. Supplied by the caller per-request — not read from a fixed server-side file — so the API works for any PO/SAP data, not just the bundled demo fixture. |

**Response:** `200 OK`, JSON body:
```json
{
  "sap_validation": { "...": "ValidationReport (PO_vs_SAP)" },
  "contract_validation": { "...": "ValidationReport (PO_vs_Contract)" },
  "report_pdf_base64": "<base64-encoded PDF bytes>"
}
```

**Processing (synchronous — client waits for the full response, no job queue/polling):**
1. Validate `X-API-Key`.
2. Save `po_pdf` and `contract_pdf` to a temp directory.
3. Parse `sap_record` JSON string into a dict.
4. `run_extraction_crew(po_path, contract_path)` → `PODetails`, `ContractDetails` (unchanged).
5. `run_validation_crew(po_details, contract_details, sap_record)` → two `ValidationReport`s (unchanged).
6. `write_report(sap_report, contract_report)` (unchanged) — writes JSON + PDF to `output/`, exactly as `main.py` does today, preserving the on-disk audit trail.
7. Read the generated PDF file, base64-encode its bytes.
8. Delete the temp upload directory (uploads are transient; `output/` reports persist as before).
9. Return the JSON response described above.

## Error Handling

| Condition | Response |
|---|---|
| Missing/invalid `X-API-Key` | `401 Unauthorized` |
| Missing `po_pdf`/`contract_pdf`/`sap_record` | `400 Bad Request` with a clear message |
| `sap_record` is not valid JSON, or not a JSON object | `400 Bad Request` with a clear message |
| PDF unreadable/corrupt | `500 Internal Server Error` — surfaces via the generic pipeline-failure path (pdfplumber errors inside `run_extraction_crew`), not distinguished from other crew/LLM failures, consistent with the "thin layer, no business logic" principle |
| Crew/LLM call fails (rate limit, API error, etc.) | `500 Internal Server Error` with a generic message; details logged server-side, not leaked to the caller |

## Testing

`tests/test_api.py`, using FastAPI's `TestClient`. `run_extraction_crew` and `run_validation_crew` are patched at their `api.main` import site to return fixed `PODetails`/`ContractDetails`/`ValidationReport` objects — avoiding real LLM calls, consistent with how `crewai` is already mocked project-wide in `tests/conftest.py`.

Covers:
- Happy path — valid request returns `200` with the expected JSON shape.
- Missing/invalid API key → `401`.
- Invalid `sap_record` JSON, or valid JSON that isn't an object → `400`.
- Missing file field → `400`.

## Dependencies

Adds to `requirements.txt`: `fastapi`, `uvicorn[standard]`, `python-multipart` (required by FastAPI for parsing `multipart/form-data` file uploads).

## Out of Scope

- Async/job-queue processing (polling, background workers) — synchronous request/response is sufficient for current integration needs.
- Multi-tenant or per-client SAP record storage — caller supplies the SAP record per-request.
- Rate limiting, request logging/observability, HTTPS/TLS termination (assumed handled by whatever reverse proxy/host deploys this).
- Endpoints beyond `/validate` (no separate `/extract`, `/status`, etc.).
