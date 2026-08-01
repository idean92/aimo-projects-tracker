# Changelog

All notable changes to AIMO Tracker are recorded here, newest at the top. Every
shipped change gets an entry here (see `CLAUDE.md` § Versioning rules).

## v1.2 — 01 Aug 2026
- **Visual reskin: purple "lavender" design system**, matching the look documented
  for the Safety Tracker sibling (see the design doc the owner supplied). AIMO
  Tracker previously had a flat, blue-gray look predating that sibling's V4.0
  dashboard-card redesign; this brings it in line.
  - New color palette: lavender-neutral surfaces, `#6F328A` purple accent (was
    blue-gray `#5980a6`), muted semantic status colors.
  - Brand gradient (`#32183C → #472358 → #6F328A`) applied to the header, logo
    mark, verify-mode top bar, and feedback FAB.
  - Shape: buttons/cards/modals/inputs now soft-rounded (previously
    `border-radius:0` everywhere) — buttons 10px, KPI/stat cards 12px, project
    cards 18px, modals 20px; all pill/badge elements fully rounded.
  - Shadows switched from neutral gray to purple-tinted (`rgba(50,24,60,…)`),
    consistent with the sibling's "purple ink" elevation style.
  - Typography (Barlow / Barlow Condensed, self-hosted) was already correct —
    no font changes needed.
- Reviewed by an independent pass before finalizing: caught and fixed two real
  bugs from the mechanical rollout — `.btn-primary` was still reverting to the
  old blue-gray on hover/press, and `.card-visual`'s square top corners were
  poking out past the now-rounded `.project-card` — plus a handful of smaller
  leftover old-color references and a `--text-3` contrast tweak.
- **Known, accepted scope boundary:** roughly 20-30 other hardcoded color
  literals elsewhere in the file (KPI RAG-status tints, governance status
  colors, comment-class colors, gantt bar colors) still use the older, more
  saturated green/amber/red rather than the new muted set. Cosmetically minor
  — not touched, to keep this change reviewable; flagged as a possible follow-up.
- QA: headless Playwright screenshots across homepage, project detail, edit
  modal, and KPI dashboard; 0 console/page errors; brace-balance check on the
  full stylesheet.
- Not shipped — working copy only, per `CLAUDE.md`.

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
