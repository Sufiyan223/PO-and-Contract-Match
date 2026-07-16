# SAP Connection Stub — Design

## Purpose

Add a placeholder "Connect to SAP" option to the frontend, per the user's original request, with no real integration behind it yet — a visible starting point to be enhanced later.

## Architecture

Purely frontend, no backend change. `SettingsPanel.tsx` gains a third connection section, "SAP Connection", alongside the existing API and Outlook Connection sections. It contains a single "Connect to SAP" button. Clicking it shows an inline "SAP integration is not yet available" message in place — no network call, no config storage, no new types in `types.ts` or functions in `api.ts`.

## Testing

`SettingsPanel.test.tsx` gains one case: clicking "Connect to SAP" shows the "not yet available" message.

## Out of Scope

Everything about a real SAP integration — auth, data exchange, configuration — is deferred entirely; this is a stub only.
