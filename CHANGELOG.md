# Changelog

All notable changes to AIMO Tracker are recorded here, newest at the top. Every
shipped change gets an entry here (see `CLAUDE.md` § Versioning rules).

## v2.0 — 04 Aug 2026
- **New: cloud sync via Supabase**, matching the Safety Tracker sibling's UX
  pattern. Major/architectural change — first time this app talks to a backend
  for anything other than the feedback button.
  - Email + password sign-in (invite-only project, no self-signup) via a new
    header control (`#cloudSyncBtn`, first item in the top bar) that opens a
    login modal. The control — and all cloud behavior — stays hidden if the
    Supabase CDN script doesn't load (offline/blocked network): the app is
    unaffected and works exactly as it always has, local-only.
  - Syncs the same three localStorage keys `downloadSession()` already exports
    (`aimo_projects`, `aimo_governance`, `aimo_kpi_settings`) as one JSON blob to
    a single shared team row (`projects.team_state`, `id='default'`) in the
    Supabase project shared with AIMO Safety Tracker (see `docs/SUPABASE.md`).
    Push is debounced off every local write (hooked at `lsSet()` itself) and
    pulls on sign-in and on tab refocus.
  - **Data-safety design: optimistic concurrency.** Every push is a
    compare-and-swap on the row's `updated_at` (enforced by a `BEFORE UPDATE`
    trigger on the table — see `docs/SUPABASE.md`). If someone else saved
    first, we pull their version in and show a blocking alert rather than
    silently overwriting their work. Local writes always happen before any
    cloud call, so a network or auth failure never risks local data — it only
    fails to sync (shown as a red status dot), degrading gracefully to
    local-only behavior. A pull that's about to overwrite local data first
    stashes it to a recovery key (`aimo_pre_pull_backup`) — one level of undo,
    recoverable from DevTools if a conflict resolution or a first-sync-after-
    offline discards more than expected.
  - **The `?verify=` pop-out window does not run its own cloud sync client**
    (deliberately, after a review found per-window dirty-tracking state
    doesn't compose safely with two windows sharing one `localStorage`). Its
    edits still reach the cloud: they land in `localStorage` the same way any
    edit does, the main window's existing `aimoRefresh`/`BroadcastChannel`/
    `storage`-event listeners (which already exist to re-render on the
    pop-out's saves) now also schedule a push when they see real content
    change — which incidentally covers two ordinary tabs of the main app both
    open at once, too, since the native `storage` event fires for that same
    way.
  - Realtime cross-device push is a deliberate follow-up, not in this release —
    pull-on-sign-in + pull-on-refocus covers a small team well enough for now.
  - **Reviewed by multiple independent passes before shipping** (per
    `CLAUDE.md`'s rule for architecturally significant / data-loss-risk
    changes) — this is
    concurrency logic with a lot of surface area (two windows, offline/online
    transitions, sign-out mid-flight, conflicting simultaneous edits), and
    review kept finding real problems through most of those passes: an inert
    CAS (missing DB trigger), missing DB grants, a blind-overwrite race on
    first sign-in, refocus silently clobbering unsynced edits, a first-push
    race with no conflict detection, session state not surviving sign-out
    correctly, an offline-recovery path that could destroy hours of work with
    no backup, and — the trickiest one, requiring two separate fix attempts —
    the pop-out window's edits silently never reaching the cloud at all
    (partly pre-existing, partly a regression introduced by an earlier fix in
    this same sequence; corrected as described above). All fixed and
    re-verified; see the git history on this branch for the full
    round-by-round detail if needed.
  - QA: headless Playwright throughout — CDN-blocked boot (graceful
    degradation), a mocked Supabase client exercising sign-in/pull/push/
    conflict/sign-out, and targeted tests for each fix above (dirty-edit-
    survives-refocus, offline-work-recoverable-via-backup, cross-window
    sign-out reset, verify-pop-out-edit-reaches-cloud, echo-suppression
    between tabs, and more) — 0 unexpected console errors beyond pre-existing
    baseline noise.

- **Fixed: 6 Critical/High findings from an independent code audit** (Notion:
  "Code Audits — AIMO Projects Tracker", Audit Run 1, against v1.4/`0d9795c`;
  see `PENDING_CHANGES.md` P9/P11/P12 for the full audit context — the
  remaining Medium/Low findings from that audit are still pending, not in this
  release):
  - **Session import no longer crashes the app on a malformed file** (C1) —
    `projects`/`governance` shape is validated before anything is written;
    previously an unvalidated non-array `projects` value could pass import,
    persist, then crash the very next page load outside any try/catch.
  - **Session import now confirms before replacing unsaved edits, and backs up
    the outgoing session first** (C2) — to a new `aimo_pre_import_backup`
    recovery key, recoverable from DevTools.
  - **Corrupted (unparseable) localStorage is now preserved, not silently
    replaced by demo data** (H1) — stashed under `aimo_projects_corrupt_backup`
    with an alert, instead of the previous behavior of seeding fresh sample
    data over data that might have been recoverable.
  - **A failed storage write during import is now detected and reported**
    (H2), instead of the import claiming success regardless.
  - **Planned construction-schedule dates entered in the Add/Edit modal now
    save to the same location every other view reads** (H3) — they previously
    wrote to a flat location nothing else read, so entered dates never showed
    up in the schedule table, executive report, or overview; a one-time
    migration recovers any dates already saved under the old broken location.
  - **KREI (KPI 4) now scores fairly when only some of its components have
    data** (H4) — it previously coerced an unmeasured component to 0 and
    scored it against the full 100-point scale (e.g. perfect resubmission
    timing alone showed as 40/100 instead of 100/100); now pro-rated over only
    the components actually measured.
  - QA: headless tests for each fix — malformed-import-rejected, corrupted-
    data-survives-boot, quota-failure-detected, phase-date-round-trip +
    migration, KREI-pro-rating.

- **Not shipped in this entry** — built and QA'd on the working copy only; per
  `CLAUDE.md`, deploying to `public/index.html` requires a separate, explicit
  "ship it."

## v1.4 — 01 Aug 2026
- **First real user feedback came in via the in-app button** (see
  `docs/NOTION.md`) — both items addressed:
  - **Project cards**: removed the crosshair corner brackets, replaced with a
    frosted-glass card treatment (translucent white + backdrop blur, rounded
    18px corners) per the request for an "iPhone glass" look.
  - **Safety tab**: removed the embedded MOC/Risk Verification/Observations
    sub-tabs (a stale, unmaintained duplicate of functionality that lives in
    the dedicated AIMO Safety Tracker app) and replaced with a simple redirect
    card linking out to https://aimo-safety-tracker.ideandaai.workers.dev. The
    underlying `buildSafety*()` functions are left defined but unused rather
    than deleted, in case that data view is wanted again later.
- QA: headless screenshots (homepage cards, Safety tab), 0 new console/page
  errors.
- Shipped to https://aimo-projects-tracker.ideandaai.workers.dev on the owner's
  explicit "ship it".

## v1.3 — 01 Aug 2026
- **Reskin refinement pass**, matching specific patterns the owner pointed out from
  the live Safety Tracker sibling (screenshots, not just the written design doc):
  - Section headers (`.section-lbl`/`.sec-label`/`.info-panel-title`) now get a
    small purple accent bar before the label text, matching the sibling's card-header
    system.
  - Sidebar status counts (`.sb-stat`) and KPI scorecards (`.kpi-card.rag-*`) get a
    colored top border matching their semantic status (green/blue/red/slate,
    green/amber/red) — was previously just colored number text.
  - Tab-bar "active" indicator changed from purple to amber/orange, to distinguish
    "current location" from the purple used for primary actions/selected filters —
    matches the sibling's two-accent convention.
  - Fixed the header's "Session" button, which used the light-mode `.btn-ghost`
    style (dark text, faint border) and was nearly unreadable against the new dark
    purple header — added `.btn-ghost-dark` (translucent white, matching the
    existing `.vp-nav-btn` verify-mode pattern) and applied it there.
  - Minor: the "overdue" forecast-date warning text now uses `var(--amber)` instead
    of a hardcoded old-amber hex.
  - Scope note: did not build new dashboard-style widgets (donut/bar charts, a
    dedicated "Command Dashboard" page) — those don't have an equivalent in AIMO
    Tracker today and would be a feature addition, not a reskin; owner confirmed
    this scope explicitly.
- QA: headless screenshots (homepage, sidebar stat close-up, KPI dashboard), 0
  console/page errors, stylesheet brace-balance check.
- Shipped to https://aimo-projects-tracker.ideandaai.workers.dev on the owner's
  explicit "deploy it".

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
- Shipped to https://aimo-projects-tracker.ideandaai.workers.dev on the owner's
  explicit "deploy it".

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
