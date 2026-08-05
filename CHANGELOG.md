# Changelog

All notable changes to AIMO Tracker are recorded here, newest at the top. Every
shipped change gets an entry here (see `CLAUDE.md` § Versioning rules).

## v3.3 — 05 Aug 2026
- **Fixed: `--text-3` small text failed WCAG AA contrast** (owner request:
  *"fix the text-3 contrast in both apps"*, following the v3.2 pre-deploy
  review). The same fix landed in the Safety Tracker sibling — the two apps
  share this token and both had the problem.
  - `--text-3` `#8a8496` → **`#6f6a7c`**. The old value measured **3.19:1** on
    `--bg-elevated` and 3.61:1 on white, against AA's 4.5:1 for normal text —
    and this token carries the 9–11px stat-tile labels, table headers and
    helper copy. The new value clears AA on every flat surface: 5.21:1 on
    `--bg-card`, 4.91:1 on `--bg-sidebar`, 4.70:1 on `--bg-base`, 4.60:1 on
    `--bg-elevated`.
  - **Hovered/selected sidebar rows needed a second fix.** `--bg-hover` and
    `--bg-active` are translucent purple (`rgba(111,50,138,.08/.14)`), so those
    rows composite to a *darker* surface than any flat background — 4.32:1 and
    3.91:1 even with the new token. Lightening the overlay doesn't rescue it
    (still 4.46:1 at `.06`, by which point the selection is barely visible),
    and darkening `--text-3` far enough would have collapsed it into
    `--text-2`. Instead `.sb-proj-sub` / `.h-ms-baseline` step up to
    `--text-2` in those two states only — 5.95:1 and 5.39:1 — leaving the
    text-2/text-3 hierarchy intact everywhere else.
  - Verified in-browser rather than on paper: measured computed colour against
    the *composited* background (an early probe read the translucent selection
    layer as opaque and reported a false 1.61:1). All sampled selectors across
    both apps now measure ≥4.5:1.
  - No layout, markup or behaviour change — two CSS declarations and one new
    rule per app.

## v3.2 — 05 Aug 2026
- **"What's new", guided tour, and a Settings modal — P16 Phase 4, items 1–3**
  (owner-approved: *"Proceed with 1,2 and 3"*). Three independent UX features
  the Safety Tracker sibling has and this app didn't. Item 4 (viewer/read-only
  mode) was explicitly **not** included — it's Supabase RLS work, not frontend.
  Additive: nothing removed, no data-model change, nothing to re-enter.
  - **What's new.** After an update, a modal lists the changes since the version
    this browser last saw, once. The sidebar version badge is now clickable to
    reopen it any time. Tracked per browser in `localStorage['aimo_seen_version']`
    — a first-ever load baselines silently rather than greeting new users with a
    changelog.
    - This required a **second, in-app copy of the release notes**: a
      `CHANGELOG` const near `APP_VERSION`, written benefit-first for end users,
      alongside this file's engineering log. Both must be updated on release —
      noted in the const's own comment and in `CLAUDE.md` § Versioning rules.
  - **Guided tour.** A spotlight-and-bubble walkthrough covering search, Add
    Project, opening a project, Governance/Schedule, feedback and the version
    badge. Auto-runs once per browser (`localStorage['aimo_tour_seen']`),
    replayable from a new header "Tour" button or from Settings. Steps whose
    target isn't on screen are filtered out rather than shown broken — with no
    projects yet, the "Open a project" step is skipped automatically.
    - The dimming and the highlight ring are one element: `.tour-ring`'s
      box-shadow paints the ring, then a 9999px spread dims everything else, so
      the highlighted control is never restyled. A transparent `.tour-blocker`
      underneath stops clicks reaching the dimmed app. Escape ends the tour.
    - The two never stack: the tour waits behind "What's new" and starts when
      it's dismissed. Neither can fire in the `?verify=` pop-out (it doesn't run
      `revealApp()`, and both guard on `verify-mode`) or behind the sign-in gate.
  - **Settings modal.** The header "Session" button is now "Settings" (carrying
    the same unsaved-changes dot), with **Session Data** — the unchanged backup/
    restore modal, one click further in — and **About** (version, date, and
    shortcuts to What's new / Replay tour). Unlike the sibling there's no Risk &
    Hazard Library or report-logo section; those are safety-specific. KPI
    thresholds are overridable in data via `updateKPISetting()` but still have
    no UI — Settings is where that would go if it's ever wanted.
  - **Fixed:** the Session modal's footer used `class="modal-footer"`, which is
    not a defined class, so it rendered unstyled. Now `modal-ftr`. Pre-existing,
    but more visible now that Settings is the way in.
  - QA: headless runs over a brand-new browser (silent baseline + tour
    auto-start), an upgrade from v2.0 (correct entries listed, "Got it" hands
    off to the tour), an already-current browser (nothing pops; badge click
    still forces it), tour next/back/skip/Escape/walk-to-end, replay from
    Settings, and an empty project list — no JavaScript errors.

## v3.1 — 05 Aug 2026
- **Design parity with the AIMO Safety Tracker sibling — Phases 1 & 3 of P16**
  (owner request: *"review the design, UI and UX of the safety tracker and see
  what changes need to be made to the Projects tracker so that they are
  identical and very similar"*). Visual only — no data-model, storage or
  behavioural change, and nothing to re-enter or re-import.
  - **Phase 1 — shared visual language.** Ported the two style layers the
    sibling gained after the 2026-07-19 split and this app never received:
    the *iOS-polish* layer (consistent radii — buttons 11px, inputs 10px,
    panels/table wraps 14px, stat tiles 12px, pills 9px — plus unified
    transitions, press feedback, antialiased text and tap-highlight
    suppression), and the *Refined Pages* layer (4px violet accent-bar section
    headers, stat strips as gapped/elevated white tiles with hover lift, soft
    surface elevation, gentler table rhythm). Added the sibling's brand palette
    tokens (`--violet`, `--sp01`–`--sp04`, `--skydepth` …) that those layers
    reference, and `height:100dvh` on `body`.
  - Point fixes: the header logo was painting `--brand-grad` on top of the
    gradient header bar, making it effectively invisible — now solid
    `--accent`. Header ghost buttons realigned to the sibling's contrast
    values. The project detail tab bar's active indicator moved from amber to
    `--accent` purple: v1.3 took amber from screenshots of the sibling, but
    there amber belongs to `.safety-sub-btn`, not the detail tab bar.
  - **Phase 3 — section cards.** Added the sibling's `_p8()` section-card
    component (white card, tinted header strip with violet accent bar,
    optional count pill and header actions, optional collapse) and wrapped the
    inner-page sections with it: Document Register/Documents, PSQS Document
    Registry, Design Package Review Cycles, PRC Overview and Comment Status,
    Risk Assessment, Risk Verification (+ History), Safety/Operations/
    Engineering Observations, All Observations, Construction Schedule,
    Submission Milestones, GACA Acceptance Cycle, Comments by Document, and
    Task Schedule. (Also CRS Revision History and Delay Analytics, though both
    are gated on `CRS_STAGES`, currently empty, so neither renders today. KPI
    detail panes are *not* wrapped — they render via `tableWrap`.)
  - Redundant `border-top` separators between those sections were removed —
    each section is now a self-contained card — and the Document Register card
    is skipped entirely when its summary strip is empty (previously it would
    have rendered as an empty card when embedded in another tab).
  - **Deliberately kept, against the sibling:** the frosted-glass project cards
    (owner request, v1.4) and the coloured top borders on the sidebar stat
    tiles (v1.3) — the latter now combined with the new 12px tile radius. The
    corner "crosshair" brackets removed in v1.4 were **not** re-added even
    though the sibling still has them.
  - **Not copied from the sibling:** its `border-radius:0` re-skin leftovers,
    where a class-based polish layer missed `.toast-item`, `.close-btn`,
    `.ms-date-inp`, `.task-inp`, scrollbar thumbs and `.form-map-wrap`. This
    app's rounded values are kept.
  - QA: headless run over the homepage, all 8 detail tabs, every Construction
    sub-panel, the AIPS sub-tab, Governance and Schedule, with both empty and
    populated projects — no JavaScript errors.

## v3.0 — 05 Aug 2026
- **New: mandatory sign-in gate — local-only usage is retired** (owner
  feedback: *"Change the login screen to be like this. Remove the prompt
  for session upload or download. Just load this screen and the user
  should login first before seeing any information."*, confirmed:
  *"local-only usage doesn't exist anymore — hence we are tied to
  cloudflare and supabase."*). Major/architectural change — reverses P7's
  original "local-first, cloud sync optional" design.
  - A full-screen sign-in gate is now visible by default before any script
    runs — no more "browse local-only, sign in later." Nothing is rendered
    or seeded until a signed-in session is confirmed (existing or freshly
    entered) and a cloud pull has been attempted. Three states: connecting,
    a blocking "can't connect" error (no more silent fallback to local-only
    if Supabase/the CDN is unreachable), and the sign-in form.
  - Signing out — from this window or another tab sharing the same
    persisted session — brings the gate back for the rest of the session,
    not just at boot.
  - The Session modal no longer auto-opens on boot; still reachable
    post-login via the header button as a manual backup/transfer tool.
  - The verify (`?verify=`) pop-out explicitly bypasses the gate, since it
    intentionally has no cloud sync of its own and shares localStorage with
    the main window instead.
  - **Reviewed by an independent subagent before finalizing** (architecturally
    significant boot/auth-flow change, per `CLAUDE.md`'s rule). The review
    found 5 real bugs, two of them HIGH severity and both defeating the
    gate's entire purpose: (1) the gate was fully bypassable via Tab+Enter
    reaching header controls behind it, because a CSS overlay blocks clicks
    but not tab order, compounded by every modal in the file sharing one
    z-index so a later-opened one could paint on top; (2) `revealApp()`
    didn't recheck the signed-in state before revealing, so a sign-out
    racing an in-flight cloud pull could show the full app to a signed-out
    user. Also found: a demo project would auto-seed into the shared
    team_state row for an empty team (harmless pre-gate, wrong once the
    seed only ever runs while signed in); a stuck gate on cross-tab sign-in;
    a stale corrupted-data flag firing its alert even after a pull already
    fixed things. All 5 fixed: the gate's z-index now beats every other
    overlay regardless of DOM order, `inert` is baked into the header/app
    markup by default and only lifted once really revealed, `revealApp()`
    re-checks the session before proceeding, the demo-seed was removed
    entirely (an empty pull is now a legitimate state), cross-tab sign-in
    triggers a reveal, and the corruption flag resets every load.
  - QA: headless Playwright covering all four boot paths (no session →
    sign in via the gate; existing session → auto-reveal with no manual
    action; CDN blocked → blocking offline state; sign-out → gate
    reappears), the verify pop-out not being blocked, a dedicated test per
    review-found fix, and a full re-run of the existing audit and
    cloud-sync regression suites (two pre-existing scripts updated for the
    new sign-in entry point and the removed auto-seed — expected behavior
    changes, not regressions) — zero regressions.
- **Not shipped in this entry** — built and QA'd on the working copy only;
  per `CLAUDE.md`, deploying to `public/index.html` requires a separate,
  explicit "ship it."

## v2.1 — 05 Aug 2026
- **Fixed: all remaining Medium/Low findings from the code audit** (Notion:
  "Code Audits — AIMO Projects Tracker"; see `PENDING_CHANGES.md` P9–P13 for
  the full audit context — the Critical/High findings shipped earlier in
  v2.0). Built on the owner's explicit "go ahead" for this whole remaining
  set (Batches B and D below); M12 (production deploying from this working
  branch instead of `main`) is intentionally excluded — separate infra
  decision, needs its own approval.
  - **KPI correctness** (M5, M6, M7, L6, L7, L9, L10): `workingDaysKSA()`
    rewritten for correct UTC date handling — was timezone-fragile and could
    misfire around midnight; now returns `null` on reversed dates instead of
    a bogus negative count. KPI8 (comment close rate) now sums from the same
    `stageDocs[key].docList` source the document-review views use, instead
    of a separately-derived count that could disagree with it. KPI
    target-display text now reads the settings-aware `getKPIS()` accessor
    instead of hardcoded defaults. KPI detail-view RAG colors centralized
    through one `ragHex()` helper. KPI5 (end-to-end days) now consistently
    excludes partial submissions at both its calculation and its
    detail-render call sites. `deriveMilestoneDates()` now sorts the design
    submission log by actual date (filtering out undated rounds first)
    before taking its first entry, instead of assuming array order.
  - **Governance data integrity** (M8, M9): the Project Overview panel's
    breach check now calls the same `isDateBreached()` function the
    Governance view uses, instead of a narrower inline check that could
    disagree with it. Editing an action's target date via the Edit Action
    modal now records a `targetDateHistory` entry, same as every other
    target-date-changing path.
  - **Data-loss hardening** (M1, M2, M4): a new `_flushPendingSave()` /
    `_flushPendingDeriveAndSave()` pair now runs before every cross-tab/
    cross-window state reload (the `verify_updated` broadcast, the `storage`
    listener, the `_aimo_sync` poll, and `window.aimoRefresh`) and before a
    session export, closing a race where an incoming external update or an
    export could silently miss or clobber a locally pending debounced edit —
    the same problem P7's `sbNoteExternalStorageChange` already solved for
    cloud sync, now closed for the plain-localStorage and derived-field save
    paths too. Two handlers that wrote the full projects array (incl. base64
    photos) to localStorage on every keystroke now debounce instead.
  - **Security** (L1): closed a stored-XSS gap in the governance action
    detail panel — a hand-edited/malicious session import could previously
    plant an unescaped payload in several date/reference fields rendered via
    `innerHTML` (date-opened, escalation/steering dates, date-closed,
    meeting reference); all now escaped.
  - **Correctness/hygiene** (M3, L8, M10, M11, L4, L5, L11, L13): governance
    action age no longer renders "NaNd" when Date Opened is empty (falls
    back to an ID-embedded timestamp); fixed invalid CSS silently dropping a
    KPI sub-line's RAG color; the sidebar version badge and the version
    references in `CLAUDE.md`/`docs/ARCHITECTURE.md` are no longer hardcoded
    literals that can drift from the real value; ID generation (12 call
    sites) now appends a random suffix to prevent timestamp collisions; a
    failed localStorage write (quota exceeded) now shows a persistent
    visible indicator in addition to the existing one-time alert; removed
    ~506 lines of dead `buildSafety*` code (and 4 orphaned helpers) left
    over from the v1.4 Safety-tab redirect.
  - **Worker hardening** (L2/L3): `/api/feedback` now rejects wrong-content-
    type and oversized requests before parsing the body, instead of after.
  - **Reviewed by an independent subagent before finalizing** (per
    `CLAUDE.md`'s rule — this batch touches KPI scoring, session export, and
    cross-tab save races). The review found 5 real regressions, two of them
    data-loss bugs in the fixes meant to prevent data loss (a `saveTimer`
    that never reset, silently causing stale state to overwrite a
    just-loaded external update; an unfiltered sort that could blank a real
    milestone date). All 5 fixed and re-verified.
  - QA: headless Playwright — a syntax check of all inline script blocks, a
    dedicated test per audit fix, a dedicated test per review-found
    regression, and a full re-run of the existing Batch D and cloud-sync
    regression suites. Zero regressions.
- **Not shipped in this entry** — built and QA'd on the working copy only;
  per `CLAUDE.md`, deploying to `public/index.html` requires a separate,
  explicit "ship it."

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
