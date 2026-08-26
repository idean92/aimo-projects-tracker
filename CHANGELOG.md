# Changelog

All notable changes to AIMO Tracker are recorded here, newest at the top. Every
shipped change gets an entry here (see `CLAUDE.md` § Versioning rules).

## v5.0 — 26 Aug 2026
**P21 — Replaced the 9-KPI framework with the 6 KPIs from RAC AIMO's "AIMO
Process KPIs V1.3" deck.** Major bump — this removes 5 of the 9 previously
tracked KPIs and changes scoring formulas on the rest, per full consolidation/
design/build detail in `PENDING_CHANGES.md`.

- **`KPI_DEFAULTS`/`calcKPIs()` rebuilt around 6 KPIs**, renumbered to match
  the deck:
  1. **Document Review Duration** — sum (not average) of working days per
     review cycle, split into Construction (Design Package Review, target
     ≤25 wd) and OPS (Commissioning Package Review, target ≤22 wd) sub-scores
     — each with its own threshold pair in KPI Settings.
  2. **Masterplan / Concurrence / Concept Plan Review** — new, **portfolio-
     wide** (not per-project): a submission/response round log
     (`aimo_portfolio_reviews`, synced/exported like every other data domain)
     with its own add/edit/delete UI in the KPI 2 detail view. Scored as the
     slowest round (max working days), target ≤12 wd.
  3. **Revisions to Acceptance** — the old avg-review-cycles KPI, rethresholded
     to ≤3 revisions.
  4. **GACA Submission Acceptance Rate** — same calculation as before,
     rethresholded to ≥85% Excellent / <70% critical gap.
  5. **Resubmission Efficiency Index (REI)** — the old KREI engine, renamed;
     its Timeliness sub-score now scores each resubmission cycle individually
     (≤7 wd = 40 pts, 8–12 wd = 20, >12 wd = 0, averaged) instead of an
     aggregate-percentage bucket. Thresholds: ≥95 Excellent, ≥80 Good, <80 Not
     Acceptable.
  6. **Signature Collection Timeliness** — new KPI card surfacing a
     calculation that already existed for the Portfolio Schedule's
     "Signature Period" rows (package-completion acceptance → GACA submission
     date), target ≤5 wd.
- **Retired (cards removed, underlying data untouched):** PSQS, First
  Submission Completeness Rate, End-to-End Regulatory Submission Time,
  Comment Close Rate, C/D Major Finding Ratio. PSQS's document-registry
  scoring UI inside the Design/Commissioning Package Review tabs is
  unaffected — only its "KPI 1" labelling there was corrected, since PSQS
  is no longer part of the scorecard.
- KPI Settings, the KPI Reference Explainer, the KPI detail modal, and each
  project's KPI health strip (sidebar cards) all updated to the new 6-KPI
  set; the health strip excludes KPI 2 since it isn't project-specific.
- New `portfolioReviews` data domain wired into every place `kpiSettings`
  already was: cloud sync push/pull (with the same shape validation and
  pre-pull/pre-import backups as the others) and Session export/import.
- QA: headless Chromium exercised `calcKPIs()`/`calcPortfolioKPI()`/
  `kreiScores()` against synthetic data covering every KPI's data path, all
  6 KPI detail views, the settings table (incl. the new sub-key threshold
  path for KPI 1), and a full add/edit/delete round-trip on the portfolio
  review log — zero runtime errors, all figures hand-verified against the
  formulas above.
- **Independent review** (required — major bump + KPI scoring, per
  `CLAUDE.md`) found 3 blocking issues and 3 more worth fixing before ship,
  all fixed and re-verified headless:
  - KPI 2's add/edit/delete UI never refreshed the KPI Detail modal it lives
    in (it wrote to `#kpiDetailBody`, which only `openKPIDetail()` renders,
    not `renderProjectDetail()`) — a round add/edit/delete saved correctly
    but appeared to do nothing on screen. Fixed by having the CRUD functions
    re-run `openKPIDetail(2)`.
  - KPI 3 ("Revisions to Acceptance") counted total submissions, not
    revisions — a package accepted on its first submission showed "1
    revision" instead of 0, and every figure was inflated by exactly one
    against the deck's own definition. Fixed (submissions − 1, floored at 0).
  - A stale `kpiSettings` override from the old 9-KPI framework could
    silently re-score a new KPI under a threshold meaning something
    completely different (e.g. an old KPI 6 GACA-rate override driving the
    new KPI 6 Signature Collection Timeliness). `loadKPISettings()` now
    stamps and checks a framework version, resetting on mismatch — no
    manual `localStorage` wipe needed.
  - KPI 1's per-cycle detail rows compared one cycle's days against the
    *stage total's* threshold, so several short cycles could each show green
    while the total they summed to was red. Status pill now only appears on
    the Total row.
  - Deleting a portfolio round had no confirmation, unlike every comparable
    row-delete in the app — now confirms first.
  - The REI Timeliness badge was still keyed to the retired aggregate-bucket
    stat (`pct7`, "% in ≤7 days") instead of the new per-cycle score it sits
    next to, so it could show a misleadingly harsh color for a middling
    score. Badge now derives from the actual score.
  - Also fixed: the KPI 2 scorecard card and detail view undercounted
    logged rounds (excluded ones missing a response date from the "N
    round(s) logged" count); the Session backup summary claimed "No data"
    and disabled the download button when only portfolio rounds existed
    (no projects/governance yet); a malformed round `id` from a doctored
    import/cloud row is now sanitized on load rather than trusted verbatim
    into an `onclick` handler.
- **Not yet deployed** — `public/index.html` untouched, awaiting a separate
  explicit "ship it" per `CLAUDE.md`.

## v4.5 — 10 Aug 2026
Pre-ship fix set from **Audit Run 2** (the pre-deploy audit of v4.4 — see the
"Code Audits — AIMO Projects Tracker" Notion page for the full findings). Six
fixes, all in the cloud-sync/import safety path plus one CSS line:
- **R2-1 — sync no longer discards in-flight edits.** The cloud pull
  (`sbPullNow`) and both registry-reconcile paths (`regReconcile` /
  `regReconcileSoon`) now flush the pending debounced save before replacing
  state from storage — the same rule the four original reload paths got in
  v4.x (M1). Previously an edit typed during a reconcile's network round-trip
  or just before a tab-refocus pull could be silently reverted.
- **R2-2 — corrupted cloud data is refused.** The pull-apply path now runs the
  same shape validation as the session import (arrays/objects checked) before
  writing to localStorage; a malformed `team_state` row sets sync status to
  error instead of emptying the app and then pushing that emptiness to the
  team.
- **R2-4 — dropped-session edits now raise the conflict alert.** `sbDirty` is
  captured into `_hadUnsyncedOnReset` when a session ends with an unpushed
  edit; the first pull after re-sign-in treats it like a live conflict (alert
  + pointer at `aimo_pre_pull_backup`) instead of silently overwriting.
- **R2-L1 — safety backups must succeed before the overwrite runs.** Both
  `aimo_pre_pull_backup` (cloud pull) and `aimo_pre_import_backup` (session
  import) now abort the apply/import with a storage-full message if the backup
  write fails, instead of proceeding without the promised recovery net.
- **R2-L3 — imported `kpiSettings` validated** with the same plain-object
  check as `governance` (was: persisted and cloud-pushed unvalidated).
- **R2-6 — P19 residue: map draw-toolbar icons no longer vanish on hover.**
  The `:hover` rule still used the `background` shorthand (which resets
  `background-image`) one line below the base rule P19 fixed. Now
  `background-color`.
- Independently reviewed before ship (touches sync/import = data-loss-
  sensitive per `CLAUDE.md`); QA'd headless.

## v4.4 — 09 Aug 2026
- **P19 — Fixed broken Leaflet/Leaflet.Draw icons on the Project Scope
  satellite map.** From an owner screenshot (06 Aug 2026): the draw
  toolbar's polygon/edit/delete buttons rendered as blank white boxes.
  Two separate bugs, both required:
  - The inlined Leaflet 1.9.4 + Leaflet.Draw 1.0.4 CSS had 7
    `background-image` `url()` references pointing at broken UUID
    placeholders instead of real image data (an artifact of however this
    app's CSS got inlined) — sourced the real assets from the matching npm
    package versions and replaced all 7 (6 distinct files: layers.png/-2x,
    marker-icon.png, spritesheet.png/-2x/.svg) with base64 data URIs.
    *(Correction: this was originally diagnosed as 27 broken references.
    Re-verified during implementation — it was 7. The other ~20 are a
    separate, unrelated issue: this app's "Barlow" Google Font is broken
    the same way. Not fixed here, logged separately.)*
  - `.leaflet-bar a{background:#fff!important;...}` used the `background`
    shorthand, which resets `background-image` to `none` on every match —
    including the draw toolbar's own `<a>` elements, which also carry the
    `leaflet-bar` class. This alone would have kept the icons blank even
    with the broken UUIDs fixed. Changed to `background-color`.
  - QA: headless Playwright confirmed the toolbar buttons resolve a real
    computed `background-image`, plus a visual screenshot. Full regression
    suite re-run — zero regressions.
- **P16 Phase 2 — mobile responsive layer**, ported from the Safety
  Tracker sibling (same two breakpoints, same shape, adapted to this
  app's class names). This app previously had zero phone support.
  - **820px**: the sidebar becomes an off-canvas drawer (hamburger button
    + backdrop, closes via backdrop click / Escape / picking a project);
    the main tab bar scrolls horizontally instead of wrapping.
  - **480px**: icon-only header buttons, 40-44px tap targets, and every
    modal in the file — all 13 of them, including the mandatory sign-in
    gate — goes full-screen via overrides on the shared `.overlay`/
    `.modal` classes they all funnel through.
  - Safe-area-inset handling (header, modal footers, sidebar, feedback
    FAB) behind `@supports`, plus the `viewport-fit=cover` viewport-meta
    addition it depends on.
  - Explicitly not ported (Safety-specific, no equivalent here): the
    Observations table→stacked-cards treatment, and the second-FAB
    stacking offset.
  - **Independently reviewed before shipping** (required — touches every
    modal in the app, including the sign-in gate). Found 2 HIGH-severity
    bugs: the drawer/backdrop's z-index (1200/1100) beat every `.overlay`
    (600) in the shared stacking context, so a modal opened from inside
    the drawer (Add Project, What's New) rendered fully hidden behind it;
    and the guided tour's visibility check didn't account for
    `transform:translateX(-100%)` still producing a layout box, so 4 of
    its 6 steps pointed at the closed drawer's off-screen contents on
    phones. Also found and fixed: checkboxes stretched into a 14×40
    sliver from a blanket tap-target rule, missing
    `safe-area-inset-left` handling, a ~1px active-tab-underline clip
    from `overflow-x:auto`'s spec-mandated effect on `overflow-y`,
    `nav-open` not clearing on a breakpoint crossing, and full-screen
    modals keeping their corner radius. All fixed and re-verified with
    dedicated tests. One LOW finding not fixed (`#verifModal`'s mobile
    layout) — confirmed dead code, zero callers anywhere in the file.
  - QA: headless Playwright at 390px phone and 1440px desktop viewports —
    drawer open/close via all 3 paths, the sign-in gate confirmed
    full-screen and usable, all 13 modals confirmed full-screen, icon-only
    header, zero effect outside the two breakpoints. Full existing
    regression suite re-run throughout — zero regressions.
- **Shipped 09 Aug 2026** on the owner's explicit "begin deployment" —
  `aimo-tracker.html` copied to `public/index.html` and pushed.

## v4.3 — 06 Aug 2026
- **P18 — Cloud Sync: last-synced date + who last saved.** From in-app feedback
  (05 Aug 2026, v3.0 · Homepage): *"in the 'Cloud Sync', the last sync should also
  display the date (in addition to the time) and if possible - who was last user?"*
  Implemented on the owner's explicit "go ahead with all", reviewed by Fable 5, and
  **deployed 06 Aug 2026** on the owner's explicit "apply the trigger migration and
  ship both".

  ⚠️ **Caveat on the "not deployed" note this entry originally carried.** It said
  `public/index.html` was untouched and nothing was live. That was true of the deploy
  *copy*, but it assumed only the tracked branch deploys. In the Safety Tracker
  sibling that assumption was proven false the same day — any branch push deploys
  there — and this Worker is configured the same way, so the working-branch pushes of
  v4.3 may well have been live before the explicit "ship it". Not directly verified
  here. See `CLAUDE.md` § Deployment.

  - **The date.** All three "Last synced" sites (the first-push insert, the CAS
    update, and the pull) formatted with `toLocaleTimeString()` only, so the panel
    read `Last synced 2:32:10 PM` with no indication of *which day* — meaningless
    the moment the last save wasn't today. Replaced with a single `_syncStamp(ts,
    email)` helper used by all three, rendering date + short time.
  - **The "who".** `projects.team_state.updated_by` is a `uuid`; it was written on
    every push and read nowhere, and the client cannot resolve it because
    Supabase's `auth.users` is not client-readable by design. Added a nullable
    `updated_by_email text` column (migration
    `projects_team_state_add_updated_by_email`), written alongside `updated_by` on
    both the insert and the update paths and selected on all three read paths.
    Chosen over a `profiles` join table or a `SECURITY DEFINER` RPC because the
    team is small and invite-only, and this adds no new RLS surface.
  - **Backward compatibility.** The column is additive and nullable, and grants on
    `projects.team_state` are table-level (`authenticated`: SELECT/INSERT/UPDATE),
    so it inherits them — no GRANT and no policy change was needed. The currently
    live v4.2 build selects `(data, updated_at)` and writes `(data, updated_by)`,
    so it is completely unaffected and the two versions can run side by side.
    Rows written before this release have `updated_by_email = null` (the one live
    row does today), and `_syncStamp()` then renders date + time with no "by"
    clause rather than `undefined`. A null/invalid timestamp falls back to plain
    `Synced` instead of `Invalid Date`.
  - The Cloud Sync modal's Status line now wraps (`line-height`, `word-break`),
    since the string carries a full timestamp plus an email address.

  **Verification.** All 6 inline `<script>` blocks parse. `_syncStamp()` exercised
  in headless Chromium across six cases — with email, without email, empty email,
  an older day, a null timestamp and a malformed timestamp — all correct, no page
  or console errors, and the mandatory sign-in gate still blocks the app. The
  migration was applied to the shared Supabase project and the column verified
  present and null on the live row.

  **Correction to this item's entry in `PENDING_CHANGES.md`:** the triage note
  claimed `sbPullNow()` "never sets the status detail at all". That was wrong —
  it does, at the third `Last synced` site. The only real defect was the missing
  date, at all three sites. Corrected in `PENDING_CHANGES.md`.

  **Independently reviewed (Fable 5)** — required by `CLAUDE.md`, since this touches
  Supabase reads/writes. The review confirmed no injection path (`_syncStamp()`'s
  output reaches only `#caSyncDetail` via `textContent`), no CAS regression, no
  impact on the sibling's `public` tables, and genuine backward compatibility with
  the live v4.2 build (which uses explicit column lists, never `select *`). It also
  found one blocker, now fixed:

  - **The email could name the wrong person for the whole mixed-version window.**
    The `team_state_set_updated_at` trigger set only `updated_at`, so a **v4.2**
    client's push advanced the timestamp while leaving the *previous v4.3 writer's*
    email in `updated_by_email`. A v4.3 reader then saw a fresh time confidently
    attributed to someone who hadn't touched it — and it persisted until the next
    v4.3 push, not just momentarily. The failure lands exactly where the feature is
    meant to help: you lose a CAS race, read "someone else's changes were just
    loaded", check who overwrote you, and it names *you*, so you assume it was your
    own second tab and never look at `aimo_pre_pull_backup`.
  - **Secondary:** the email was client-asserted, so any authenticated non-viewer
    could forge attribution via a direct PostgREST PATCH.
  - **Fix — one migration, no client change:**
    `projects_team_state_stamp_updated_by_email_server_side` extends the trigger to
    `BEFORE INSERT OR UPDATE` and stamps
    `new.updated_by_email := nullif(auth.jwt() ->> 'email','')`. This covers v4.2
    writers too, so it corrects the problem for the whole rollout window, and makes
    the value unforgeable. Mirrors what P17 already does for
    `public.project_registry.updated_by`. **Verified on a throwaway probe table
    before touching `team_state`:** a v4.2-style update (no email in the payload)
    gets stamped from the JWT, and a payload carrying a forged `updated_by_email` is
    overwritten with the real one. CAS is unaffected — the `.eq('updated_at', …)`
    predicate is evaluated against the existing row before the BEFORE trigger runs.
  - Also recorded in `docs/SUPABASE.md`, including a note that the writer's email is
    readable by every account in the shared Supabase project.

## v4.2 — 06 Aug 2026
- **Pre-deploy review fixes for P17** (three independent Opus reviewers — sync/
  data-loss, hierarchy/KPI, and security — run on the owner's instruction before
  deploying v4.0/v4.1). 22 findings; all fixed. Ships with v4.0 and v4.1 as one
  feature. **Deployed** on the owner's explicit "ship it" — `public/index.html`
  is byte-identical to `aimo-tracker.html` at v4.2. *(This line previously read
  "Still not deployed"; corrected 06 Aug 2026 — it was written before the deploy
  commit and never updated.)*

  **Critical**
  - **Stored XSS via registry-supplied project ids.** Project ids are
    interpolated into `onclick`/`id`/`<option>` attributes throughout this file.
    That was inert while ids were only ever generated locally — v4.0 made them
    remote, cross-app, attacker-controllable input and left every sink
    unescaped. A single row inserted by any signed-in non-viewer would have run
    script in every other user's session, in **both** apps, on render with no
    click, with the Supabase session token in reach. Fixed three ways: all 7
    sinks now use `esc()`, malformed ids are rejected on ingest
    (`/^[A-Za-z0-9_-]{1,64}$/`), and a matching `CHECK` constraint was added
    server-side (migration `project_registry_harden_id_and_audit`). Names were
    already escaped everywhere — it was the id that was missed.
  - **Deletion by shadow-absence replaced with real tombstones.** v4.0 inferred
    "the user deleted this" from a project being in the local shadow but not the
    local array. The shadow is written synchronously while the matching state
    only reaches the cloud via an 800ms debounced push, so a CAS-conflict pull, a
    closed tab, a quota failure or a **session import** made the shadow claim a
    project the array lacked — read as a deletion, which propagated to the Safety
    Tracker as an *irreversible* tombstone destroying that project's hazards,
    findings, MOC records and verification logs for the whole team. Deletion is
    now an explicit `aimo_deleted_projects` map written **only** by
    `deleteProject()`, synced with the rest of the payload and carried through
    session export/import. A session import also clears the registry shadow, so
    the roster it brings is adopted rather than read as a mass change.
  - **`familyMilestones()` discarded actual-only milestones.** It required
    `planned || baseline` for a milestone to count as expected — but
    `deriveMilestoneDates()` auto-derives `actual` for 7 of the 10 milestones and
    never writes planned/baseline for them, so on the most common data shape a
    family reported **0%** and its markers dropped out of the Gantt entirely,
    with the report announcing "Next: Design Review" for a project in
    construction. An actual now counts as its own evidence.

  **High**
  - Per-field three-way merge replaces the per-record one, so adopting a remote
    name no longer records the remote program/parent as "agreed" and republishes
    them a cycle later.
  - `topLevelProjects()` now resolves the true root by walking the parent chain.
    It previously excluded any project with a `parentProjectId` — so an orphan
    (parent archived via the registry) and a grandchild were both dropped from
    the schedule and the deck while still showing in the sidebar.
  - The reconcile now flushes a pending `debouncedSave()` before its
    read-modify-write of localStorage. Without it a `stageDocs` edit made in the
    600ms window was silently destroyed — exactly the hazard `CLAUDE.md` flags.
  - **Three-level cap is now enforced.** A project that *has* sub-projects can no
    longer be given a parent (the control is disabled, with a save-path
    backstop) — that path silently built 3-deep chains whose grandchild vanished
    from all reporting.
  - **Sub-project observations, hazards and comment-closure now sum into the
    parent's row** in the executive report (owner's call). Folding was only ever
    meant to apply to milestone bars; the risk data was disappearing from the
    deck entirely, understating portfolio open-observation totals.

  **Medium / low**
  - Folded completion forecasts now take the **latest** across the family
    (owner's call) — taking the earliest reported a family finishing Dec 2026
    when its addendum ran to Jun 2027.
  - A throttled reconcile is retried instead of dropped; the throttle clock also
    advances on failure, so a failing registry can't cause a request storm.
  - Program headers can no longer be emitted twice by the cycle-leftover pass.
  - `updatedAt` is stamped per project rather than off a shared accumulator.
  - `orderByHierarchy` keys on the object, so two records sharing an id both
    still render.
  - Archiving a project now promotes its children rather than leaving a dangling
    `parentProjectId`.
  - `getFamilyStatus`/`getFamilyProgress` documented as intentionally unused.
  - **Supabase:** `updated_by` is now stamped server-side from `auth.uid()`
    (it was declared but never populated, so every row was unattributable), and
    **`projects.team_state` gained viewer-cannot-write policies** (migration
    `projects_team_state_viewer_restrictions`). It had none, and this app has no
    viewer concept, so a read-only account could rewrite the shared roster — which
    an editor's next reconcile would then publish, deleting Safety Tracker data.
    ⚠️ That RLS change is **live immediately**, independent of this deploy.
  - 92 logic tests across both apps (up from 69), including regressions for every
    critical and high finding above.

## v4.1 — 06 Aug 2026
- **New: three-level project hierarchy — P17 phase 2** (ships together with v4.0
  below; the two are one feature split across two approvals). Mirrors the Safety
  Tracker's **program → project → sub-project** structure, so the two apps show
  the same shape. **Not deployed** — `public/index.html` untouched, awaiting an
  independent review then an explicit "ship it".
  - **Hierarchy helpers** — `isSubProject()`, `parentProjectOf()`,
    `subProjectsOf()`, `effectiveProgram()`, `topLevelProjects()`,
    `familyMilestones()`, `orderByHierarchy()`. `parentProjectId` points at a
    **project**, never a MOC — the Safety Tracker resolves the MOC linkage and
    publishes a project id, so nothing here needs to understand MOCs.
  - **Program inheritance.** A sub-project with no program of its own inherits
    its parent's, matching the Safety Tracker's `effectiveProgram()`. Without it
    a real record (*KSIA Enabling Works 2 – Addendum 1*, which has no program on
    either side) would render orphaned.
  - **Sidebar and homepage cards** now nest three levels. Sub-projects sort
    directly after their parent; in the card grid they carry a "↳ Sub-project of
    …" label rather than being indented, since cards live in a grid.
  - ⚠️ **Two deliberately different behaviours** (guard comments are in the code
    at `calcKPIs()` and the hierarchy block — please don't "align" them):
    - **KPIs: a sub-project scores independently**, as its own unit. `calcKPIs()`
      reads only its own project's `stageDocs` and is unchanged.
    - **Schedule + executive report: a sub-project folds into its parent's bar.**
      It gets no row or slide of its own.
    This split is the owner's explicit decision, and differs on purpose from the
    Safety Tracker, which rolls up everywhere.
  - **Folding rule** (`familyMilestones()`), per milestone: baseline/planned take
    the **earliest** across the family; actual takes the **latest**, and only once
    every family member that planned that milestone has completed it. A parent
    whose addendum is still open is not finished, so reporting it complete would
    overstate progress. Implemented by handing the schedule and report shallow
    render-only clones, so every `p.milestones` / `getStatus` / `getProgress` read
    folds automatically instead of each call site having to remember.
  - **New "Parent Project" field** on the add/edit form. Only top-level projects
    are offered, capping the tree at three levels (the same depth the Safety
    Tracker allows, where an addendum may only point at a non-addendum MOC); self
    and descendants are excluded so a cycle can't be built.
  - **Deleting a parent promotes its sub-projects** to top level rather than
    orphaning them, with the count shown in the confirm dialog — a dangling
    `parentProjectId` would otherwise keep being published to the registry.
  - Cycle guards throughout: `effectiveProgram()` and `orderByHierarchy()`
    terminate on a malformed parent chain, and `orderByHierarchy()` appends any
    leftovers flat so a project can never silently vanish from the list.
  - `migrateProject()` defaults `parentProjectId` to null, so an existing session
    upgrades with no data wipe.
  - 26 new logic tests (69 total across both apps) — inheritance, cycles,
    ordering, filtered-out parents, folding rules, and the Safety-side
    parent-authority fix. All passing.

## v4.0 — 06 Aug 2026
- **New: cross-tracker project registry — phase 1 of 2** (P17 here; **P36** in
  the `aimo-safety-tracker` repo — the two ship together). Owner request,
  05 Aug 2026: *"the existing projects in safety tracker should also be
  reflected in the projects tracker … when a project is created it should also
  reflect in the other tracker."* Major bump — adds a second cloud data source,
  a new field on the project record, and lets projects this app didn't create
  appear in it. **Not deployed** — `public/index.html` untouched, awaiting an
  explicit "ship it", and an independent review is still outstanding per
  `CLAUDE.md` (major bump + KPI-adjacent hierarchy + Supabase writes).
  - A new `public.project_registry` table mirrors the project *roster only* —
    id, name, program, parent, archived — between the two trackers. Create a
    project in either app and it appears in the other; renames and deletions
    propagate both ways.
  - **Nothing else is synced.** No `stageDocs`, `milestones`, KPIs, doc
    registers or observations cross over. Ops/engineering observations stay
    here, safety observations stay in the Safety Tracker (owner decision). This
    keeps phase 1 entirely clear of the `stageDocs` data-loss gotcha in
    `docs/ARCHITECTURE.md`.
  - **New `regReconcile()` / `regReconcileSoon()`**, hooked into the existing
    `sbPullNow()` / `sbPushNow()` cycle rather than replacing any of it.
  - **The Safety Tracker is master of the hierarchy.** It derives `program` and
    `parent_id` from its MOC data and publishes them; this app consumes both and
    so never needs to know what a MOC is. `parentProjectId` is now stored on the
    project record but **not yet rendered** — the three-level program → project →
    sub-project nesting, and the KPI/report split that goes with it, is phase 2.
  - **The first reconcile is deliberately one-way (Safety → Projects).** This
    app's cloud row was a frozen 21 Jul snapshot holding 8 of the 16 projects
    with two drifted names; a symmetric merge would have pushed those older
    names back over the current ones. With no shadow recorded yet, the merge
    always adopts the registry, which is what makes that first run safe.
  - **Cold-start guards.** `regReconcile()` refuses to run before the first
    successful pull, and the "deleted here" pass is skipped entirely when the
    local project array is empty — this app has no tombstones of its own, so
    absence is the only deletion signal available and an unloaded array must
    never be read as "the user deleted everything."
  - `aimo_registry_shadow` (local-only, never synced) records what this browser
    last saw, so a rename here can be told apart from a rename there. Cleared in
    `sbResetSessionState()` so it can't leak across accounts.
  - 43 logic tests across both apps' reconcilers — first-run convergence, both
    rename directions, both delete directions, resurrection, cycle guard, viewer
    read-only, cold-start guards — all passing.
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
