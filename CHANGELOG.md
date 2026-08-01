# Changelog

All notable changes to AIMO Tracker are recorded here, newest at the top. Every
shipped change gets an entry here (see `CLAUDE.md` § Versioning rules).

## v1.1 — 01 Aug 2026
- **New: in-app feedback button.** A floating "Send feedback" button (bottom-right,
  hidden in `?verify` pop-out and print) opens a modal for a free-text comment plus
  an optional screenshot (client-resized before sending). Submits to
  `POST /api/feedback` with the app version and current screen/tab as context.
  Fails gracefully with an inline message if the endpoint isn't reachable — no data
  loss, the comment stays in the box so the user can retry.
- **New: Cloudflare Worker feedback endpoint** (`src/worker.js`) that files
  submissions into the Notion Feedback Inbox database (`docs/NOTION.md`).
- **Not live yet** — this is implemented and QA'd (headless, see below) but the
  Cloudflare Worker isn't deployed/connected to this repo yet, and the Notion
  integration credential hasn't been created/shared. See `docs/CLOUDFLARE.md` for the
  exact remaining manual steps. Per `CLAUDE.md`, this is not shipped/deployed until a
  separate explicit "ship it" (copying `aimo-tracker.html` → `public/index.html` and
  pushing) — this release only updates the working copy.
- QA: headless Playwright pass — FAB visibility toggle, modal open/close, empty-
  comment validation, successful submit (mocked endpoint) with correct payload
  shape, auto-close on success, screenshot attach/preview/remove, 0 new console
  errors.

## v1.0 — 07 Jul 2026 (baseline)
- Initial version-controlled baseline. No functional changes — this is the snapshot
  of `aimo-tracker.html` as of 07 Jul 2026 (matching the in-app `APP_VERSION` /
  `APP_DATE`), committed as the starting point for future work under the process in
  `CLAUDE.md`. Prior history was tracked by hand-copying files rather than git; see
  `docs/ARCHITECTURE.md` for what's known about that period.
