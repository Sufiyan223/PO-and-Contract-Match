# Frontend Web App — Design

## Purpose

Give the PO/Contract Match pipeline a browser UI: upload the PO PDF, Contract PDF, and SAP record JSON, submit them to the existing `POST /validate` API, and view/download the resulting discrepancy report — without needing curl or `/docs`.

## Architecture

A new `frontend/` folder: a React + Vite (TypeScript) single-page app. Three views — Upload, Results, Settings — switched via simple React state (no router; three views with no deep-linking need don't justify `react-router-dom`). It calls the existing backend directly; the only backend change is CORS middleware, since browsers block cross-origin requests by default.

`frontend/` is independent of `api/` and `main.py` — it's a pure HTTP client, no shared code, matching the project's existing pattern of independent front doors onto the same backend.

## Backend Change: CORS

`api/main.py` adds `fastapi.middleware.cors.CORSMiddleware`, allowing exactly one origin read from a new `.env` var `FRONTEND_ORIGIN` (default `http://localhost:5173`, Vite's dev server port). Only `GET`/`POST` and the `Content-Type`/`X-API-Key` headers need to be allowed.

## Components

- `src/api.ts` — thin fetch wrapper. `validate(baseUrl, apiKey, files) -> Promise<ValidateResponse>`. Builds the exact `multipart/form-data` shape the API expects (`po_pdf`, `contract_pdf`, `sap_record` as a JSON string), attaches `X-API-Key`, and maps non-200 responses to typed errors (`{status, message}`) using the API's `detail` field where present.
- `src/components/SettingsPanel.tsx` — API base URL + API key inputs, persisted to `localStorage` (keys: `poContractMatch.apiUrl`, `poContractMatch.apiKey`).
- `src/components/UploadForm.tsx` — three file inputs (PO PDF, Contract PDF, SAP JSON). Client-side checks before enabling "Validate": all three files chosen, and the SAP JSON file's content parses as JSON. Shows a loading state with a "this can take a minute or two" note while the request is in flight (real LLM calls are slow).
- `src/components/ResultsView.tsx` — renders both `ValidationReport`s (status badge colored by `overall_status`, summary text, a discrepancy table: field/source_a/source_b/severity/note) and a "Download PDF Report" button that decodes `report_pdf_base64` (`atob` + `Uint8Array`) into a `Blob` and triggers a browser download named `report_<timestamp>.pdf`.
- `src/components/HistorySidebar.tsx` — lists past runs from the current session only (timestamp + PASS/FAIL badges for each report). Clicking an entry re-displays that full result in `ResultsView`. Cleared on page refresh — no persistence, no new backend storage.
- `src/App.tsx` — holds view state (`"upload" | "results" | "settings"`) and the in-memory history array (`ValidateResponse & {timestamp: string}[]`); wires the components together.

## Data Flow

1. User opens Settings once, enters the API base URL and key → saved to `localStorage`.
2. On Upload, user picks all three files. Client-side validation must pass before "Validate" is enabled.
3. On submit: loading state shown → `api.ts` builds the multipart request → `POST {apiUrl}/validate` with `X-API-Key`.
4. Success (`200`): response pushed onto the history array with a timestamp; view switches to Results showing this run.
5. Error: an inline banner shows a message mapped from the status code (`401` → "Invalid API key — check Settings"; `400` → the API's `detail` message; `500` → "Validation failed on the server"; network/timeout → "Could not reach the API — check the URL in Settings and that the server is running"). User stays on Upload and can retry. No client-side request timeout is imposed — real runs can legitimately take minutes — but the loading state includes a manual "Cancel" action via `AbortController`.
6. Download: decodes `report_pdf_base64` from whichever result is currently shown (latest or a history entry) into a `Blob` and triggers the browser's native download.

## Error Handling

| Condition | Frontend behavior |
|---|---|
| Missing file(s) before submit | "Validate" button disabled; inline hint listing which files are missing |
| SAP JSON file doesn't parse | Inline error under that file input; "Validate" stays disabled |
| API returns `401` | Banner: "Invalid API key — check Settings" |
| API returns `400` | Banner shows the API's `detail` message verbatim |
| API returns `500` | Banner: "Validation failed on the server. Check the backend logs." |
| Network error / request fails to reach server | Banner: "Could not reach the API — check the URL in Settings and that the server is running" |
| User cancels an in-flight request | Loading state clears, no banner, back to Upload |

## Testing

Vitest + React Testing Library (`jsdom` environment). No real backend calls in tests — `fetch` is mocked.

Covers:
- `api.ts`: builds the correct `FormData`/headers; maps `401`/`400`/`500`/network failure to the right typed error.
- `UploadForm`: "Validate" stays disabled until all three files are present and the SAP file is valid JSON; shows the loading state on submit.
- `ResultsView`: renders status badges, summary, and discrepancy rows from a sample `ValidateResponse`; download button triggers a `Blob`/anchor click (mocked, not a real file write).
- `HistorySidebar`: clicking an entry surfaces that entry's data to `ResultsView`.

Manual verification: run the backend (`uvicorn api.main:app --reload`) and frontend (`npm run dev`) together, confirm CORS allows the request, and exercise the real upload → result → download flow at least through the wiring (given prior LLM flakiness, a full real success isn't required to prove the frontend is correct — hitting a real error path also proves the wiring).

## Out of Scope

- Outlook integration and SAP connection (separate specs, per the agreed build order).
- Any backend persistence of validation history — session-only, in-memory on the frontend.
- Authentication/user accounts for the frontend itself — single shared API key, same trust model as the API today.
- Deployment/hosting configuration — dev-only (`npm run dev`) for now.
