# Frontend UI Overhaul — Design

## Purpose

The current frontend (sub-project 1) is functionally complete but visually minimal: unstyled default form controls, ad-hoc inline colors, no design system, no icons, no dark mode, no responsive behavior. This overhaul brings it to a professional, polished standard — the visual quality a paying client would expect from a demo — without changing any of the underlying behavior, API contract, or component responsibilities established in the original design.

## Architecture

Add **Tailwind CSS v4** (via `@tailwindcss/vite`, the official Vite plugin — no separate PostCSS config file needed) as the styling engine, replacing the hand-written `App.css`/`index.css`. Add **`lucide-react`** for icons (tree-shakeable, MIT-licensed, the standard icon set for modern Tailwind/React apps) — used for file-type icons, status icons, nav icons, and action icons throughout.

No component's *props, state shape, or external behavior* changes — this is a rendering/styling pass over the existing five components (`SettingsPanel`, `UploadForm`, `ResultsView`, `HistorySidebar`, `App`) plus a new small `src/components/ui/` folder of reusable presentational primitives that those five compose:
- `Button.tsx` — variants: `primary`, `secondary`, `danger`, `ghost`; sizes: `sm`, `md`. Used everywhere a `<button>` appears today.
- `Card.tsx` — a bordered, padded, rounded container with an optional header — used for every "section" (each report, each Settings connection group, each history entry).
- `Badge.tsx` — a colored pill for status (`PASS`/`PASS_WITH_WARNINGS`/`FAIL`, and discrepancy `severity`).
- `Spinner.tsx` — a small animated loading indicator, replacing plain "Validating…" text.
- `Alert.tsx` — a bordered, icon-prefixed banner for errors (replaces the bare `.error-banner` paragraph).
- `FileDropzone.tsx` — a drag-and-drop area layered over a real `<input type="file">` (so click-to-browse and keyboard/screen-reader access both still work), showing the file name and a remove (×) button once a file is chosen.

Since existing tests query by label text, role, and visible text (not CSS classes), this restyle should not require rewriting existing test assertions — only updating them where visible copy changes (e.g., a button's accessible name) or where new interaction affordances (like the dropzone's remove button) need new test coverage.

## Design System

- **Color:** a neutral slate base (backgrounds, borders, body text) with a single brand accent (indigo) for primary actions and active nav state. Status colors: green (PASS), amber (PASS_WITH_WARNINGS / minor), red (FAIL / major) — same semantic mapping as today, restyled as pills with icons (check / alert-triangle / x-circle from lucide) instead of plain colored text.
- **Dark mode:** supported via Tailwind's `dark:` variant, driven by `prefers-color-scheme` (no manual toggle — matches the system setting automatically, consistent with how the rest of this environment already treats theme-awareness). Every color choice has a `dark:` counterpart.
- **Typography:** Tailwind's default system font stack (no external font loading — avoids adding a network dependency for an internal tool, and this project has already hit real network flakiness once this session). A clear type scale: page titles, section headings, body, and small/muted text each get one consistent Tailwind text-size class used everywhere.
- **Spacing & shape:** Tailwind's default spacing scale throughout (no custom values). Cards use `rounded-lg`, subtle `shadow-sm`, and a `border`. Buttons and inputs share consistent padding/height so the whole form feels aligned.
- **Responsive layout:** the history sidebar sits beside the main content on wide viewports and stacks below it on narrow ones (a plain `flex-col md:flex-row` change to the existing layout structure).

## Component-by-Component Changes

- **`App.tsx`** — the plain button-row nav becomes a proper top bar: app name/logo-mark on the left, the three nav items as tabs with an active-state underline/pill (not just `disabled`), icons per tab (Upload, Results, Settings from lucide).
- **`UploadForm.tsx`** — each of the three file inputs becomes a `FileDropzone`; the "Fetch from Outlook" button gets an icon and sits visually grouped with the PO/Contract dropzones it fills (since it's an alternative way to populate the same two slots); the loading state uses `Spinner` + `Alert`-style container instead of plain text.
- **`ResultsView.tsx`** — each `ValidationReport` renders in a `Card` with a `Badge` for its status; the discrepancy table gets zebra-striped rows, a `Badge` per severity instead of colored text, and a proper empty-state (checkmark icon + "No discrepancies found") instead of an italic sentence.
- **`HistorySidebar.tsx`** — each entry becomes a small `Card`-like button with the timestamp, two status `Badge`s (SAP/Contract), and a hover/selected state using the accent color instead of a plain background swap.
- **`SettingsPanel.tsx`** — the three connection groups (API, Outlook, SAP) each become a `Card` with a heading and icon; the "Client Secret: configured ✓" state becomes a small `Badge`; the SAP stub's button and message are styled consistently with the other two sections rather than looking unfinished.

## Testing

Existing test files (`UploadForm.test.tsx`, `ResultsView.test.tsx`, `HistorySidebar.test.tsx`, `SettingsPanel.test.tsx`, `api.test.ts`, `download.test.ts`) are expected to keep passing largely unchanged, since they target labels/roles/text rather than markup structure. New coverage is added for:
- `FileDropzone`: dropping a file (simulated `drop` event) selects it the same as clicking and choosing one; the remove (×) button clears the selection.
- The nav's active-tab state (`App.tsx`) reflects the current view.

Any test broken by a genuine copy/behavior change (not just styling) is fixed as part of this change, not deferred.

## Out of Scope

- No manual light/dark theme toggle — system-preference only.
- No Storybook or visual regression tooling.
- No changes to any backend endpoint, API contract, or component prop/state shape.
- No new dependencies beyond `tailwindcss`, `@tailwindcss/vite`, and `lucide-react`.
