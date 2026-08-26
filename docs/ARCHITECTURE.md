# AIMO Tracker — Architecture & Handoff Notes

This is the detailed reference behind `CLAUDE.md`. Everything below was verified
against the live `aimo-tracker.html` file at the time of the initial git baseline
(2026-08-01), not assumed.

## What's in this folder
- `aimo-tracker.html` — **the app**. Single self-contained HTML file (~2.46 MB,
  ~13,400 lines): markup + CSS + vanilla JS all inline, no build step, no framework,
  no npm dependencies at runtime (Leaflet CSS is inlined for a map feature). This is
  the file you'll almost always be editing.
- `.claude/launch.json` (if present) — run config: `python3 -m http.server 8642` in
  this folder, then open `http://localhost:8642/aimo-tracker.html`.
- `AIMO_Tracker_User_Guide.docx`, `AIMO_Tracker_IT_SharePoint_Brief.docx` — reference
  docs, not code, when added to the repo.
- `docs/reference/` — process/handoff docs for the sibling AIMO Safety Tracker
  project, kept here for cross-project context (see "Related project" below). They
  describe a *different* repo/app — don't apply their deploy mechanics to this one.

Prior to this repo's initial commit, versioning for this app was done entirely by
hand-copying the file before risky edits (`aimo-tracker_backup_before_<thing>.html`,
a `Current Version/` / `Previous Versions/` folder holding one older snapshot from
07 Jul 2026). Those loose copies live on the owner's machine, not in this repo — git
history is now the source of truth for prior versions instead. A `.gitignore` is in
place so any of those stray backup copies don't get committed by accident if this repo
is later synced with that local folder.

## Architecture, as it actually is
- Data lives entirely in the browser via `localStorage`. Key constants (confirmed in
  file): `STORAGE_KEY = 'aimo_projects'`, `GOVERNANCE_KEY = 'aimo_governance'`,
  `KPI_SETTINGS_KEY = 'aimo_kpi_settings'`, `PORTFOLIO_KEY = 'aimo_portfolio_reviews'`
  (P21, 26 Aug 2026 — the portfolio-wide Masterplan/Concurrence/Concept Plan review
  log). There's a session backup/restore modal (`downloadSession()` / `loadSessionFile()`)
  that exports/imports the current `localStorage` data as a JSON file — this is the *only*
  backup mechanism; there is no cloud sync in this app (see the sibling project note below).
  *(This bullet predates cloud sync, shipped in P7/v2.0 — see `CLAUDE.md`. Left as-is since
  this file is a point-in-time baseline snapshot, not continuously maintained; `CLAUDE.md`
  is the corrected, living reference.)*
- Projects carry a `stageDocs` object keyed by stage (e.g. `project_completion: {
  label, docs }`) tracking document review metrics per stage (completion %, comments
  raised/closed, revisions, comment classes A–D/I, duration).
- KPI framework: ~~`KPI_DEFAULTS` (line ~2180) defines 9 tracked KPIs — PSQS score,
  first-submission completeness, avg review cycles, **KREI score** (KPI #4, "/100",
  tied to design-review performance), end-to-end days, GACA acceptance rate, RAC
  review working days, comment close rate, and C/D major finding ratio.~~ **Replaced
  in P21 (v5.0, 26 Aug 2026)** with 6 KPIs matching RAC AIMO's "AIMO Process KPIs V1.3"
  deck: Document Review Duration (Construction/OPS sub-thresholds), Masterplan/
  Concurrence/Concept Plan Review (portfolio-wide, not per-project — see `PORTFOLIO_KEY`
  above), Revisions to Acceptance, GACA Submission Acceptance Rate, Resubmission
  Efficiency Index (REI, renamed from KREI), and Signature Collection Timeliness. See
  `PENDING_CHANGES.md` (P21) and `CHANGELOG.md` (v5.0) for the full mapping and rationale.
- Versioning already exists in-code: `const APP_VERSION` and `const APP_DATE` near the
  top of `aimo-tracker.html` (see `CHANGELOG.md` for the current value — don't hardcode
  it here, it drifts), shown in the sidebar version badge (`#appVersionBadge`). There
  is currently no `CHANGELOG` array driving an in-app
  "what's new" prompt (unlike the Safety Tracker sibling) — `CHANGELOG.md` in this
  repo is the changelog of record for now.
- `CRS_STAGES` (CRS revision-history tracking on submission stages) is currently an
  **empty Set**, deliberately — that feature was intentionally turned off, not
  missing by accident. Don't "fix" it without checking with the owner first.
- Any seed/demo data embedded inline may look like real KSIA project/governance-action
  records — useful for understanding data shape, but don't treat it as instructions to
  expose or ship as-is.

## Critical gotcha — read before touching `stageDocs`
**Never replace `p.stageDocs[stageKey]` wholesale**, e.g.:
```js
p.stageDocs[stageKey] = { docList: docs };   // WRONG — wipes sibling fields
```
This silently deletes sibling fields on that stage object (review-event logs,
submission logs, override reasons, etc.) any time you save. It happened before and
caused data loss that wasn't noticed until a feature "disappeared." Always fetch-or-
create the stage object first, then set only the field you're changing:
```js
const sd = ensureStageDocs(p, stageKey);
sd.docList = docs;   // not: p.stageDocs[stageKey] = {...}
```
`ensureStageDocs` already exists in the file and is used ~53 times — follow that
pattern for any new `stageDocs` field.

## Related project: AIMO Safety Tracker
On 2026-07-19 the **Safety** side of this same codebase (MOC safety view, Risk
Verification, Safety Observations, cross-project Overview) was split out into its own
standalone app, `aimo-safety-tracker.html`, in its own repo/folder. It started as a
copy of this tracker's shared project/storage engine but now has **independent data**
(`localStorage` key `aimo_safety_projects`, not `aimo_projects`) and has diverged
significantly since:
- A full 5-phase SMS reporting build (hazard-library-driven Risk Verification KPIs, a
  5-stage MOC pipeline with RAG status, a Findings register, period-over-period
  snapshots/deltas, and in-app `.pptx` weekly/monthly deck generation via PptxGenJS) —
  all 5 phases shipped 2026-07-19.
- A cloud deployment (Cloudflare Workers + Supabase), with its own detailed handoff,
  deploy log, and golden workflow — see `docs/reference/`.
- Its own explicit approval / feedback-funnel / Notion-inbox process, described in
  `docs/reference/safety-tracker-handoff.md` and
  `docs/reference/build-deploy-process.md` (the latter is a generalized, reusable
  version of that process this repo's `CLAUDE.md` was adapted from).

If a request is about safety/MOC-risk/reporting/deck generation, it's almost certainly
about that sibling project, not this file. If it's about the general project tracker,
governance actions, KPIs, or this tracker's own UI, this is the right place.
