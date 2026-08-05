# Pending Changes — AIMO Tracker

Tracks requested changes from consolidation through approval to shipped, per the
process in `CLAUDE.md`. Newest items at the top of each section.

## Summary
| # | Item | Status |
|---|------|--------|
| P17 | Cross-tracker project overlap — shared project registry + program/project/sub-project hierarchy mirror | 🔧 **Built, QA'd, independently reviewed** (v4.0 registry/sync, v4.1 hierarchy, v4.2 review fixes). 3 Opus reviewers → 22 findings, incl. 3 critical (stored XSS via registry ids; deletion-by-absence destroying Safety data; folding discarding real completions) — **all fixed**, 92 logic tests passing. Awaiting an explicit "ship it" |
| P16 | Design/UI/UX parity with the Safety Tracker sibling (owner review request) | ✅ Shipped (v3.1 + v3.2) — Phases 1, 3 and Phase 4 items 1–3. Phase 2 (mobile) not started; Phase 4 item 4 out of scope |
| P15 | Batch A/B/D housekeeping + audit remainders (owner's "go ahead") | 🔧 Built, QA'd, independently reviewed (5 findings fixed), version bumped (v2.1) — awaiting explicit "ship it" |
| P14 | Retire local-only usage — mandatory sign-in gate, remove Session-modal auto-open (owner feedback) | 🔧 Built, QA'd, independently reviewed (5 findings fixed, 2 of them HIGH), version bumped (v3.0) — awaiting explicit "ship it" |
| P13 | Audit batch 5 — hardening & hygiene (M1, M4, M12, L2–L5, L11–L13) | 🔧 M1/M4/L2–L5/L11/L13 done (Batch D); M12 excluded — needs separate owner approval (`main`-branch infra change) |
| P12 | Audit batch 4 — schema + governance (H3, M8, M9) | ✅ Done (H3 shipped in v2.0; M8/M9 done in Batch D) |
| P11 | Audit batch 3 — KPI correctness (H4, M5, M6, M7, L6, L7, L9, L10) | ✅ Done (H4 shipped in v2.0; M5–M10/L6/L7/L9/L10 done in Batch D) |
| P10 | Audit batch 2 — quick correctness wins (L1, M3, L8, M10, M11) | ✅ Done (Batch B) |
| P9 | Audit batch 1 — data-loss protection (C1, C2, H1, H2, M2) | ✅ Done (C1/C2/H1/H2 shipped in v2.0; M2 done in Batch D) |
| P7 | Cloud sync (Supabase auth + team_state sync) — v2.0 big build | ✅ Shipped (v2.0) |
| P6 | Consolidate Supabase into AIMO-SMS-Tracker (`projects` schema) | ✅ Done — pausing AIMO-Projects-Tracker project |
| P5 | Glass project cards (remove crosshairs) + Safety tab → redirect to sister app | ✅ Shipped (v1.4) |
| P4 | D1 + Cloudflare Access trial (Supabase free-tier consolidation, Option B) | ❌ Abandoned — see P6 |
| P3 | Reskin refinement pass (accent bars, colored borders, orange nav-active, header button fix) | ✅ Shipped (v1.3) |
| P2 | Purple design-system reskin (matching Safety Tracker) | ✅ Shipped (v1.2) |
| P1 | In-app feedback button + Cloudflare/Notion endpoint | ✅ Shipped and fully working (v1.1) |

## 🐛 Bugs
_(none yet)_

## ✨ Improvements
- **P2 (follow-up, optional)** — ~20-30 hardcoded RAG-status/comment-class/gantt
  color literals still use the pre-reskin saturated green/amber/red rather than the
  new muted semantic set. Deliberately left out of P2's scope; low visual impact.

## 🆕 New
- **P17 — Cross-tracker project overlap: shared registry + hierarchy mirror**
  (05 Aug 2026, owner request in conversation: *"i need to discuss with you on
  how projects can overlap across both trackers (e.g. the existing projects in
  safety tracker should also be reflected in the projects tracker) … safety
  tracker is more from a SMS perspective (oversight and management) and projects
  tracker is for managing the entire project cycle."*). Design agreed with the
  owner across a Q&A pass; **not yet approved to build**.

  **Findings that ground this (verified against live Supabase data, not assumed):**
  - The two apps never stopped sharing a data model. Project records in both
    carry the *identical* 13 fields; the `MILESTONES` constant is byte-identical
    in both files; even the demo seed uses the same hardcoded IDs
    (`p_new_northern_runway`). The 2026-07-19 split forked the UI, not the model.
  - **Project IDs already match.** All 8 projects in `projects.team_state` exist
    in the Safety Tracker's `public.team_state` under byte-identical IDs. There
    is no projects-tracker-only record. No matching/fuzzy-join logic is needed —
    the join key already exists and is stable.
  - Safety is the de-facto master: 16 projects vs 8, last edits 04 Aug vs 21 Jul.
    This tracker's cloud row is effectively a frozen snapshot from the split
    date — its records even carry `keyDates` and `statusUpdates`, fields this app
    has **zero** code to read or write.
  - Drift has already started: names differ on 2 of 8 (`Areas 1, 2, 3, 4 &
    Airside Central` vs `Areas 1-4,AC`; `PA Apron Phase 0 Design` vs
    `… Phase 0 - Design`), `stageDocs` on 6 of 8, `mocs` on 2 of 8.
  - The parent/sub-project linkage is **already present in this app's own
    records** — all 8 carry `mocs[0].parentMocId` and `isAddendum` intact. This
    app simply has no code that reads them. So the hierarchy mirror is a
    UI/logic build, not a data migration.
  - Tombstones are clean (`demo_ksia_1`, `p_1784814970435`, both deleted 27 Jul;
    neither is in this tracker), so a 16-project backfill is safe.

  **Approach — a shared registry, deliberately not a blob**, so both apps can
  write it without fighting over each other's `team_state` row:
  ```sql
  create schema shared;
  create table shared.project_registry (
    id          text primary key,   -- 'p_1784632308655' — already common to both
    name        text not null,
    program     text,               -- effective program (inherited for sub-projects)
    parent_id   text references shared.project_registry(id),  -- null = top-level
    archived    boolean not null default false,
    origin_app  text not null,      -- 'safety' | 'projects'
    updated_at  timestamptz not null default now()
  );
  ```
  `parent_id` is a **project** id, not a MOC id — the deliberate decoupling. The
  Safety Tracker derives it from its existing `mocParentProject()`; this app
  consumes it directly and never has to understand what a MOC is in order to
  nest a sub-project. MOCs stay a Safety concept, matching the SMS-vs-delivery
  split. Reconcile on sync: registry row not held locally → create a local stub;
  local project not in registry → insert it; `archived` → hide locally.

  **Owner decisions locked in this pass:**
  1. Safety is master of the roster. All 16 projects come across, and creation
     in *either* app reflects into the other.
  2. Mirror the full three-level hierarchy — **program → project →
     sub-project/addendum** — exactly as the Safety Tracker has it, rather than
     flattening or hiding sub-projects. (Supersedes the earlier idea of an
     `in_projects` visibility flag that would hide addenda.)
  3. A project can **not** legitimately exist with no MOC — the two current
     no-MOC records are projects whose MOC is *in planning*. That's a state, not
     a category; a project created here lands in Safety as MOC-in-planning.
  4. Renames are bidirectional (this app can rename too, and it propagates back);
     last-write-wins, Safety wins ties.
  5. Delete in either app archives in both.
  6. Observations stay **separate** — safety observations in the Safety Tracker,
     ops/engineering observations here. Phase 1 does not touch `stageDocs` at
     all, which keeps it clear of the `stageDocs` data-loss gotcha
     (`docs/ARCHITECTURE.md`).
  7. **Rollup semantics (note: deliberately differs from the Safety Tracker,
     which rolls up everywhere — do not "fix" this into consistency):**
     a sub-project **scores independently** as its own unit in the KPI engine,
     but **folds into the parent's bar** in the schedule and executive report.

  **Scope in this repo (the larger of the two sides).** This app only understands
  `parentGroup` (a flat program string) — there is no sub-project concept
  anywhere in it. Needs: a `parentProjectId` field on the project record; the
  four hierarchy helpers ported from the Safety Tracker (`isAddendumProj`,
  `mocParentProject`, `effectiveProgram`, `addendaOf`); program inheritance
  (without it, *KSIA Enabling Works 2 – Addendum 1* renders orphaned — it has no
  program set in either app and relies on inheriting its parent's); three-level
  nesting in the sidebar, schedule, and executive report; and the KPI/report
  split from decision 7.

  **Risk / process notes.** Touches KPI scoring and adds a hierarchy adjacent to
  `stageDocs` — squarely in "spawn an independent review before shipping"
  territory per `CLAUDE.md`. Likely a major bump (data-model change). Two
  implementation gotchas already identified: (a) the Safety Tracker merges cloud
  data *per project*, so a delete here must also write a Safety tombstone
  (`aimo_deleted_projects`) or the next merge resurrects the record; (b) the
  first reconciliation must be one-way (Safety → Projects), because this app's
  row is a stale 21 Jul snapshot and a symmetric merge would push older names
  back over newer ones. Proposed as a phased build — registry + sync first,
  hierarchy second — not one drop. Paired item: **P36** in the Safety Tracker
  repo.
- **P16 — Design/UI/UX parity with the Safety Tracker sibling** (05 Aug 2026,
  owner request: *"review the design, UI and UX of the safety tracker and see
  what changes need to be made to the Projects tracker so that they are
  identical and very similar"*). **Consolidated only — nothing implemented.**

  **Root cause of the drift.** Both apps still share the same base stylesheet —
  class names, structure and section order are near-identical, and every
  component class the Safety Tracker restyles already exists here. The gap is
  four layers Safety appended after the 2026-07-19 split that this app never
  received:
  1. A "daa International 2025 brand re-skin" flattening everything to
     `border-radius:0`;
  2. an **iOS-polish layer** appended later that re-rounds and re-shadows almost
     all of it — this, not the sharp look, is Safety's *current* language;
  3. **Refined Pages (V3.4)** + **P8 section cards (V4.0)** — accent-bar section
     headers, gapped elevated stat tiles, white section cards;
  4. a **Mobile Responsive Layer** (drawer nav, phone modals, safe-area insets).

  Because the layers' selectors override the base regardless of its value, this
  app's 8px-rounded base does **not** need unwinding first — porting is largely
  a CSS append.

  **Phased approach** (full review in the agent's parity report; Phases 1 and 3
  are planned in detail and awaiting approval):
  - **Phase 1 — visual parity.** CSS-only. Brand palette tokens, `--text-3`,
    `100dvh`, the iOS-polish and Refined-Pages layers, plus point fixes (header
    logo, header ghost buttons, detail-tab active colour). Low risk, no markup
    or logic touched.
  - **Phase 2 — mobile layer.** The single largest UX gap: this app has four
    breakpoints that only narrow the sidebar, and no phone support at all.
    Safety adds a hamburger + off-canvas drawer, horizontally-scrolling nav
    bars, icon-only header, full-screen modals, 40–44px tap targets, and
    `env(safe-area-inset-*)` notch handling. All additive inside media queries.
    Not yet planned in detail.
  - **Phase 3 — P8 section cards.** Port `.p8card`/`.p8hd`/`.p8bd` CSS plus the
    `_p8()`/`_p8Toggle()` helpers, then wrap this app's inner-page sections
    (24 `.sec-label` sections across 8 build functions, 22 `.info-panel-title`
    panels, 1 `.sched-section-hdr`). Touches shared render paths.
  - **Phase 4 — UX features.** What's-new modal (needs an in-app `CHANGELOG`
    array — this app has none), guided tour, Settings-modal consolidation of the
    Session button, viewer/read-only mode. Each its own decision.

  **Status (05 Aug 2026):**
  - **Phases 1 & 3 — implemented and QA'd, versioned v3.1** (see `CHANGELOG.md`).
  - **Phase 4 items 1–3 — implemented and QA'd, versioned v3.2** on the owner's
    *"Proceed with 1,2 and 3"*: the "What's new" modal, the guided tour, and the
    Settings modal (header "Session" → "Settings", session backup/restore moved
    inside). Item 4 (viewer/read-only mode) explicitly **out of scope** — it's
    Supabase RLS work on the `projects` schema, not frontend, and needs its own
    decision about what a viewer is for this app.
    - Note: "What's new" introduced a **second, in-app copy of the release
      notes** (`const CHANGELOG` in `aimo-tracker.html`). Both it and
      `CHANGELOG.md` must be updated on every release — added to `CLAUDE.md`
      § Versioning rules.
  - **Phase 2 (mobile layer) not started** — still the largest remaining UX gap:
    this app has no phone support at all (no drawer nav, no full-screen modals,
    no safe-area handling).

  **✅ Shipped 05 Aug 2026** on the owner's explicit *"merge into
  claude/review-pending-context-jbjnrg and ship it"* — `aimo-tracker.html`
  copied to `public/index.html` and merged into the Cloudflare-tracked
  production branch (this working branch was 3 commits ahead, 0 behind, so a
  clean fast-forward).
  - **Pre-deploy review ran first** (required — Phase 3 touches ~10 shared
    render functions). It booted the app in Chromium, exercised every rewritten
    builder, and injected XSS payloads across every stage tab and exec sub-tab:
    **no XSS, no markup damage, no tour DOM/listener leaks, no CSS regressions**
    against a base-vs-new comparison of 12 screens. Six findings; four fixed
    before shipping:
    1. *(medium)* the tour's blocker sat at z-index 20000+, above the sign-in
       gate at 9500 — a session dropping mid-tour re-showed the sign-in form
       under a live click-swallowing blocker. `_agShowState()` now tears both
       post-reveal surfaces down whenever the gate returns.
    2. `addObs()` stopped scrolling the new row into view on the Operations /
       Engineering panels — those rows have no `id="obs-row-…"`, so they relied
       on the `.sec-label` the section-card rewrite replaced with `.p8hd`.
    3. the tour bubble used a hard-coded 170px height estimate and hung ~5px
       below the viewport on taller steps; now re-placed with its measured
       height.
    4. Escape didn't close What's-new or Settings, unlike every other modal.
  - **Two findings deliberately not actioned** — see "Open follow-ups" below.

  **Three open decisions — resolved by the owner, 05 Aug 2026: all three
  recommendations accepted** (keep the glass cards, switch the detail tab bar
  to accent purple, keep the coloured stat-tile borders *and* add the radius):
  - **Glass project cards.** P5 (v1.4) removed the crosshair corner brackets and
    added the frosted-glass card on direct owner feedback ("iPhone glass" look).
    Safety uses solid + border + soft shadow instead. *Recommendation: keep the
    glass* — it's a deliberate owner preference and nothing else in the parity
    work depends on it.
  - **Amber active detail-tab.** P3 (v1.3) added the amber/orange active-nav
    indicator, built from owner screenshots of the live Safety Tracker. But
    Safety's `.tab-btn.active` is `var(--accent)` purple; amber (`#e07b00`)
    survives there only on `.safety-sub-btn` — so P3 most likely mirrored the
    sub-bar onto the wrong bar. *Recommendation: switch to accent purple.*
  - **Coloured top borders on sidebar stat tiles.** P3 added them deliberately;
    Safety has since dropped them in favour of rounded elevated tiles.
    *Recommendation: keep the coloured border AND add the 12px radius* — they
    compose fine.

  **Do not copy from Safety** (this app is currently the better of the two —
  Safety's iOS layer is class-based and missed these, leaving re-skin
  leftovers): `.toast-item`, `.close-btn`, `.ms-date-inp`, `.task-inp`,
  `::-webkit-scrollbar-thumb` and `.form-map-wrap` are all `border-radius:0` in
  Safety and sensibly rounded here. Safety's `.card-visual` also has no top
  radius, so its map renders square corners inside an 18px rounded card — a real
  visual bug there, already fixed here in P2. Safety also still emits four
  `<i class="corner">` bracket decorations on a now-rounded, shadowed card —
  the very crosshairs P5 removed here. These are worth fixing in the sibling
  rather than regressing this app.

  **Correction to `CLAUDE.md`:** it stated the in-app feedback button "is not
  built yet". It *is* built and present — `.fb-fab` CSS, `openFeedbackModal()`,
  and the `#fbFab` button, shipped in P1/v1.1. **Corrected in `CLAUDE.md` on
  05 Aug 2026.** Still worth re-verifying the Worker endpoint resolves — per
  `docs/CLOUDFLARE.md`, `NOTION_API_KEY` needs re-adding in the dashboard as
  type **Secret** (owner-only, dashboard step).

  **Open follow-ups from the pre-deploy review (not blocking, owner's call):**
  - **`--text-3` contrast.** Ported from the sibling as `#8a8496`, up from
    `#7b7488`. That drops small-text contrast on white from 4.47:1 to
    **3.61:1** — below WCAG AA's 4.5:1 for normal text, and this token carries
    the 9–11px stat-tile labels, table headers and helper copy. Kept as-is
    because matching the sibling *is* the point of P16, but the sibling has the
    same problem: the honest fix is darkening the token in **both** apps
    (~`#6f6a7c` clears AA while staying in the same family).
  - **What's-new can't auto-fire on this release.** `aimo_seen_version` is
    introduced *by* v3.2, so every existing browser hits the "no stored
    version" branch and baselines silently rather than being greeted with a
    changelog. Working as designed (and as the sibling does), but it means the
    v3.2 entry is only reachable via the version badge — the first automatic
    pop will be v3.3.
  - **Dead code carried over from the sibling:** `_p8Toggle`/`_p8Collapsed` and
    `opts.collapse`/`opts.flush` have no call sites (all 22 `_p8()` calls omit
    both), and `buildCrsHistorySection`/`buildDelayAnalyticsHTML` are gated on
    `CRS_STAGES`, currently an empty Set, so their rewrites are unreachable.
    Harmless; a cleanup pass could drop them.
- **P14 — Retire local-only usage — implemented, reviewed, and QA'd**
  (05 Aug 2026, owner feedback via the in-app Feedback button, 04 Aug 2026:
  *"Change the login screen to be like this. Remove the prompt for session
  upload or download. Just load this screen and the user should login first
  before seeing any information."* + confirmed explicitly: *"local-only
  usage doesn't exist anymore — hence we are tied to cloudflare and
  supabase."*). Reverses P7's original "local-first, cloud sync optional"
  design: sign-in is now mandatory before any project data is shown. **See
  `CHANGELOG.md` v3.0 for the full description** — a full-screen sign-in
  gate blocks the whole app until a signed-in session is confirmed, no more
  silent local-only fallback if Supabase/the CDN is unreachable, the Session
  modal no longer auto-opens on boot (still reachable post-login via the
  header button). Note: the owner's exact screenshot for the requested
  login-screen look wasn't viewable by the agent (Notion's API didn't expose
  the attached file) — the gate's visual design is the agent's own
  interpretation, not built from the screenshot; worth a look once live.
  Versioned as v3.0 (major bump — this is a behavior-removing change).
  **Not yet deployed** — `public/index.html` untouched, awaiting a separate
  explicit "ship it" per `CLAUDE.md`.
  - **Independent review** (required — architecturally significant
    boot/auth-flow change) found 5 real bugs, two of them HIGH severity and
    both defeating the gate entirely: it was bypassable via Tab+Enter
    reaching header controls behind it (a CSS overlay blocks clicks but not
    tab order, compounded by every modal sharing one z-index); and
    `revealApp()` didn't recheck the signed-in state before revealing, so a
    sign-out racing an in-flight pull could show the full app to a
    signed-out user. Also found and fixed: a demo project that would've
    auto-seeded into the shared team_state row for an empty team, a stuck
    gate on cross-tab sign-in, and a stale corrupted-data flag firing its
    alert after a pull already fixed things. All 5 fixed and re-verified —
    see `CHANGELOG.md` v3.0.
- **P15 — Batch A/B/D from the audit + feedback review** (05 Aug 2026, on the
  owner's explicit "go ahead"). Batch A (housekeeping): fixed this doc's stale
  P7 "not deployed" status (below, now ✅ Shipped); investigated the
  empty-`Comment`-field anomaly on two old Notion feedback rows — reproduced
  the Worker's exact code path twice via direct submissions and `Comment`
  populated correctly both times, so concluded it was a transient artifact of
  the same outage window the env-vars issue caused, not a code bug — nothing
  to fix there; updated old feedback rows' Notion `Status` to reflect what's
  actually shipped; archived (`Status: Rejected`) the diagnostic test rows
  left over from verifying the feedback endpoint (no Notion delete/archive
  tool is available, so this is the closest equivalent). Batch B (P10) and
  Batch D (P9/P11/P12 remainders + P13) — see the consolidated entry below.
- **P9/P11/P12/P10/P13 — all remaining audit items implemented, reviewed, and
  QA'd** (05 Aug 2026, Batch A/B/D, on the owner's explicit "go ahead"). C1,
  C2, H1, H2, H3, H4 shipped earlier with v2.0. **See `CHANGELOG.md` v2.1 for
  the full per-item description** — KPI correctness (M5, M6, M7, L6, L7, L9,
  L10), governance data integrity (M8, M9), data-loss hardening (M1, M2, M4),
  a stored-XSS fix (L1), assorted correctness/hygiene items (M3, L8, M10,
  M11, L4, L5, L11, L13), and Worker request-validation hardening (L2/L3).
  Versioned as v2.1. **Not yet deployed** — `public/index.html` untouched,
  awaiting a separate explicit "ship it" per `CLAUDE.md`.
  - **Independent review** (required — this batch touches KPI scoring,
    session export, and cross-tab save races) found 5 real regressions
    before this shipped as v2.1, two of them data-loss bugs in the fixes
    meant to prevent data loss: `saveTimer` never reset after firing (so
    every flush site re-saved stale state over a just-loaded external
    update — silently destroying the verify pop-out's edits); the L10 sort
    didn't filter undated rounds (blanking a real milestone date); the new
    derive-and-save debounce wasn't flushed before export; the quota-
    recovery fix cleared the dirty dot's only background source instead of
    restoring it; the XSS fix missed 4 more raw interpolations in the same
    panel. All 5 fixed and re-verified — see `CHANGELOG.md` v2.1.
  - **M12 explicitly excluded** — production deploying from this working
    branch instead of `main` is a separate infra decision needing its own
    owner approval, tracked here and in `CLAUDE.md`'s deployment notes.
  - **Follow-up spotted, not yet actioned**: while confirming the deleted
    `buildSafety*` functions had no other callers, the MOC CRUD functions
    (`addMoc`, `saveMocField`, `saveMocStatus`, etc.) and their state vars
    (`stSafetyMocId`, `mocSectionCollapsed`) also appear to have zero live UI
    callers left, post the v1.4 Safety-tab redirect. Left in place — out of
    L13's specific scope — flagging here for a future cleanup pass if
    confirmed dead.

## ✅ Shipped
- **P7 — Cloud sync (Supabase)** (v2.0, 04 Aug 2026), the "big build" requested
  to bring AIMO Tracker's header/sync UX in line with the Safety Tracker
  sibling. Email + password sign-in, whole-blob sync
  (`projects`/`governance`/`kpiSettings`) to the shared `projects.team_state`
  row provisioned in P6, optimistic-concurrency conflict handling (pull +
  blocking alert, never silent clobber). The `?verify=` pop-out doesn't run
  its own cloud-sync client (removed after a review found per-window state
  didn't compose safely across two windows sharing one `localStorage`); its
  edits still reach the cloud via the main window's existing pickup listeners.
  Went through multiple independent review rounds that each found and led to
  fixing real concurrency/data-loss issues — see `CHANGELOG.md` v2.0 for the
  summary. Headless QA throughout. Shipped to
  https://aimo-projects-tracker.ideandaai.workers.dev on the owner's explicit
  "deploy the updated app". At this point local-only usage is retired — see
  P14 below.
- **P6 — Consolidated Supabase into AIMO-SMS-Tracker** (01 Aug 2026). After P4 (D1
  trial) hit a real blocker — Cloudflare Access can't path-scope protection on a
  bare `workers.dev` domain, only whole-Worker — and given the same real people use
  both AIMO Tracker and Safety Tracker anyway, went back to the original
  consolidation option instead. Created schema `projects` in `AIMO-SMS-Tracker`
  (ref `kvbmgyupyzegtgbnqktk`) with a `team_state` table matching the standalone
  project's shape + RLS policy; verified `public.app_state`/`public.team_state`
  (the Safety Tracker's own tables, live data) untouched — row counts confirmed
  unchanged before/after. Removed all D1-trial code from the repo (`src/access.js`,
  `migrations/`, `scripts/test-access-jwt.mjs`, the two Worker routes, the D1
  binding) and deleted the (empty) trial D1 database. Paused the now-unused
  standalone `AIMO-Projects-Tracker` Supabase project (reversible, not deleted) —
  this frees a real project slot; `wealth-tracker` could be unpaused separately if
  wanted. See `docs/SUPABASE.md` for full detail and the one remaining manual step
  (exposing the `projects` schema in API settings — dashboard-only, needed before
  any future client code can query it). `docs/D1-TRIAL.md` kept, marked abandoned,
  for the Access/workers.dev gotcha it surfaced.
- **P4 — D1 + Cloudflare Access trial.** ❌ Abandoned in favor of P6 — see above and
  `docs/D1-TRIAL.md`.
- **P5 — First real user feedback, addressed** (v1.4, 01 Aug 2026). Source: two
  submissions via the in-app feedback button (Notion Feedback Inbox). (1) Project
  cards: removed crosshair corner brackets, replaced with a frosted-glass card
  (translucent + backdrop blur, "iPhone glass" look as requested). (2) Safety tab:
  removed the embedded MOC/Risk Verification/Observations sub-tabs (stale
  duplicate of the dedicated Safety Tracker app's functionality) and replaced
  with a redirect card linking to https://aimo-safety-tracker.ideandaai.workers.dev.
  See `CHANGELOG.md` for detail. Built, QA'd, and shipped to `public/index.html`
  on the owner's explicit "ship it" — pushed to
  https://aimo-projects-tracker.ideandaai.workers.dev. Both Notion feedback rows
  marked Status: Planned.
- **P3 — Reskin refinement pass** (v1.3, 01 Aug 2026, built directly from owner
  screenshots of the live Safety Tracker sibling). Accent bars on section headers,
  colored top borders on stat/KPI tiles, amber/orange active-nav-tab indicator, and
  a fix for the header's "Session" button (was unreadable — light-mode ghost style
  on the new dark header). See `CHANGELOG.md` for detail. Built, QA'd, and shipped
  to `public/index.html` on the owner's explicit "deploy this too" — pushed to
  https://aimo-projects-tracker.ideandaai.workers.dev.
- **P2 — Purple design-system reskin** (v1.2, 01 Aug 2026, owner-supplied design
  doc, built directly on explicit request). Full palette/gradient/shape/shadow
  overhaul matching the Safety Tracker sibling's look — see `CHANGELOG.md` for
  detail. Independently reviewed before finalizing; two real bugs found and fixed
  (`.btn-primary` hover color, `.card-visual` corner clipping). Built, QA'd, and
  shipped to `public/index.html` on the owner's explicit "deploy it" — pushed to
  https://aimo-projects-tracker.ideandaai.workers.dev.
- **P1 — In-app feedback button + endpoint** (v1.1, 01 Aug 2026). Floating button +
  modal in `aimo-tracker.html`, Cloudflare Worker endpoint (`src/worker.js`) filing
  into the Notion Feedback Inbox. Live at
  https://aimo-projects-tracker.ideandaai.workers.dev with `NOTION_API_KEY` /
  `NOTION_FEEDBACK_DATABASE_ID` configured — end-to-end tested (submitted via direct
  API call, confirmed the row landed in Feedback Inbox with correct fields). Fully
  working. Remaining loose end (infra, not this feature): Cloudflare is tracking the
  `claude/review-pending-context-jbjnrg` branch as production, not `main` (no `main`
  branch exists yet in this repo) — revisit once/if this branch is merged.
