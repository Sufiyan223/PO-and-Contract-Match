# Outlook Integration — Design

## Purpose

Let the PO/Contract Match tool pull the PO and Contract PDFs directly from an Outlook mailbox instead of requiring a manual upload every time, while the SAP record JSON continues to be uploaded manually. This is sub-project 2 of the broader plan (sub-project 1: frontend web app, already built; sub-project 3: SAP connection stub, later).

## Architecture

A new backend `outlook/` package sits alongside `api/`, `agents/`, `crews/`, using Microsoft Graph's app-only Client Credentials flow — no interactive login, no per-user consent. The app is registered once in Azure AD (Tenant ID, Client ID, Client Secret) with permission to read one specific mailbox.

Connection settings (Tenant ID, Client ID, Client Secret, mailbox address, subject filter) are entered through a new "Outlook Connection" section in the frontend's Settings view, but — unlike the API key, which lives in browser `localStorage` — they're stored **server-side**, since a Client Secret is a real credential that shouldn't sit in a browser. They're persisted to a gitignored `config/outlook_config.json`, mirroring the project's existing `config/sap_po_record.json` pattern, so the running server can pick up changes without a restart.

Three new endpoints on the existing FastAPI app (`api/main.py`), all behind the existing `require_api_key` dependency:
- `GET /outlook/config` — returns the current settings with the secret masked (only a boolean `client_secret_set`, never the value itself).
- `POST /outlook/config` — saves settings (all fields, including the secret) to the config file.
- `POST /outlook/fetch` — searches the configured mailbox for the most recent email matching the subject filter, and returns the PO and Contract PDF bytes (base64) extracted from its attachments.

## Backend Components

- `outlook/config_store.py` — reads/writes `config/outlook_config.json`. Exposes `load_config() -> OutlookConfig | None` and `save_config(config: OutlookConfig) -> None`, where `OutlookConfig` is a Pydantic model: `tenant_id`, `client_id`, `client_secret`, `mailbox`, `subject_filter`.
- `outlook/graph_client.py` — `fetch_po_and_contract_attachments(config: OutlookConfig) -> tuple[bytes, bytes]`:
  1. Acquires an app-only access token via `msal.ConfidentialClientApplication` (new dependency `msal`), using the client credentials flow against `https://login.microsoftonline.com/{tenant_id}`.
  2. Calls Graph's REST API directly via `httpx` (already a dependency — no new SDK) to search `https://graph.microsoft.com/v1.0/users/{mailbox}/messages` filtered by subject containing `subject_filter`, sorted by received date descending, taking the most recent match.
  3. Lists that message's attachments via `.../messages/{id}/attachments`.
  4. Picks the PO PDF (filename contains "po" or "purchase", case-insensitive) and Contract PDF (filename contains "contract" or "agreement", case-insensitive) from the attachment list.
  5. Raises a specific, distinguishable exception for each failure mode (no matching email; PO attachment not found; Contract attachment not found; Graph/auth error) so `api/main.py` can map each to a clear message.

## API Endpoint Details

### `GET /outlook/config`
Returns `{"tenant_id": ..., "client_id": ..., "mailbox": ..., "subject_filter": ..., "client_secret_set": true|false}` (no `client_secret` field ever appears in a response). `404` if never configured.

### `POST /outlook/config`
Body: `{"tenant_id": str, "client_id": str, "client_secret": str, "mailbox": str, "subject_filter": str}`. All fields required. Saves to `config/outlook_config.json`, overwriting any existing file. Returns `200` with the same shape as `GET` (secret masked) on success.

### `POST /outlook/fetch`
No request body. Loads the saved config (`404` if none saved yet). On success, returns `{"po_pdf_base64": str, "contract_pdf_base64": str}`. Errors:
| Condition | Response |
|---|---|
| No config saved | `404 Not Found` |
| Auth/token acquisition fails (bad credentials) | `401 Unauthorized` with a message indicating the Outlook credentials are invalid |
| No email matches the subject filter | `404 Not Found` with "No matching email found" |
| Matching email found, but missing the PO or Contract attachment | `422 Unprocessable Entity` naming which one is missing |
| Any other Graph API error | `502 Bad Gateway` with the Graph error message where safe to expose |

## Frontend Changes

- `SettingsPanel.tsx` gains an "Outlook Connection" section: five inputs (Tenant ID, Client ID, Client Secret [password-masked], Mailbox, Subject Filter) and a Save button that calls `POST /outlook/config`. On mount, calls `GET /outlook/config` to pre-fill the non-secret fields and show whether a secret is already set (e.g., "Client Secret: configured ✓" instead of re-displaying it).
- `UploadForm.tsx` keeps its existing manual PO/Contract file pickers unchanged, and gains a "Fetch from Outlook" button. Clicking it calls `POST /outlook/fetch`; on success, the returned base64 PDFs are converted to `File` objects client-side and populate the same `poPdfFile`/`contractPdfFile` state the manual pickers use — so validation and submission behave identically regardless of source. The SAP JSON file picker is untouched (always manual). On failure, the mapped error message appears in the same error-banner slot the upload flow already uses.
- `api.ts` gains `getOutlookConfig()`, `saveOutlookConfig(config)`, and `fetchFromOutlook()`, following the same fetch-wrapper and error-mapping pattern as `validate()`.

## Error Handling

Covered in the endpoint table above for the backend. On the frontend, every `/outlook/*` call reuses the existing error-banner mechanism from sub-project 1 — no new UI pattern, just new mapped messages per the status codes above (401/404/422/502).

## Testing

Backend: `tests/test_outlook_config_store.py` (read/write round-trip, missing-file case) and `tests/test_outlook_graph_client.py` (mocks `httpx` calls — no real Microsoft account needed — covering: successful fetch, no matching email, missing PO attachment, missing Contract attachment, auth failure). `tests/test_api.py` gains cases for the three new endpoints' happy paths and error mappings, following the existing pattern of patching the outlook module functions at their `api.main` import site.

Frontend: `api.test.ts` gains cases for `getOutlookConfig`/`saveOutlookConfig`/`fetchFromOutlook` (mocked `fetch`, same pattern as `validate`). `SettingsPanel.test.tsx` (new) covers the Outlook section rendering and save flow. `UploadForm.test.tsx` gains a case for the "Fetch from Outlook" button populating the file state on success and showing the error banner on failure.

Manual verification: since a real Azure AD app registration and mailbox are needed for a true end-to-end run (not available in this environment), manual verification is limited to confirming the endpoints reject bad/missing config correctly and that the frontend wiring (buttons, calls, error display) behaves correctly against a locally mocked or intentionally-misconfigured backend — the same "prove the wiring, not the third-party service" approach used for the API's own Task 4.

## Out of Scope

- Interactive/delegated OAuth (per-user login) — app-only only.
- Configurable filename keywords for PO vs Contract — fixed defaults.
- Multiple mailbox support — one configured mailbox at a time.
- Handling more than one matching email — always takes the single most recent match.
- Any SAP integration (that's sub-project 3, a stub only).
