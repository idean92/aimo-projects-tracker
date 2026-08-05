# Pending Changes — AIMO Tracker

Tracks requested changes from consolidation through approval to shipped, per the
process in `CLAUDE.md`. Newest items at the top of each section.

## Summary
| # | Item | Status |
|---|------|--------|
| P15 | Batch A/B/D housekeeping + audit remainders (owner's "go ahead") | 🔧 Implemented + QA'd, pending review sign-off, version bump, commit |
| P14 | Retire local-only usage — mandatory sign-in gate, remove Session-modal auto-open (owner feedback) | 🆕 Scope confirmed by owner — not started |
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
- **P14 — Retire local-only usage** (owner feedback via the in-app Feedback
  button, 04 Aug 2026: *"Change the login screen to be like this. Remove the
  prompt for session upload or download. Just load this screen and the user
  should login first before seeing any information."* + confirmed explicitly:
  *"local-only usage doesn't exist anymore — hence we are tied to cloudflare
  and supabase."*). This reverses P7's original "local-first, cloud sync
  optional" design: sign-in becomes mandatory before any project data is
  shown. Scope, as interpreted (owner's exact screenshot wasn't viewable by
  the agent — Notion's API didn't expose the attached file — confirm/correct
  once seen live):
  - App boot now shows a full-screen sign-in gate before rendering any project
    data — no more "browse local-only, sign in later" path.
  - The Session modal no longer auto-opens on boot (that was the local-first
    backup/restore entry point); the Session import/export feature itself
    stays available post-login, via the header button, as a manual
    backup/transfer tool — not removed outright, since it's still useful and
    the cloud-sync recovery-backup keys (`aimo_pre_pull_backup` etc.) build on
    the same underlying idea.
  - If Supabase/the CDN is unreachable, the app now shows a clear blocking
    "can't connect" state instead of silently degrading to local-only, since
    that fallback no longer exists.
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
- **P9/P11/P12/P10/P13 — all remaining audit items implemented and QA'd**
  (05 Aug 2026, Batch A/B/D, on the owner's explicit "go ahead"). C1, C2, H1,
  H2, H3, H4 shipped earlier with v2.0 (see `CHANGELOG.md`); everything below
  is newly done in this pass, built on `aimo-tracker.html` and verified with
  headless Playwright (targeted tests per fix plus a full regression re-run of
  the existing cloud-sync suite — zero regressions). **Not yet versioned,
  reviewed, committed, or deployed** — see P15 above.
  - **P9 remainder — M2**: `downloadSession()` now flushes any pending
    debounced save before exporting, so the export can no longer miss the
    last edit.
  - **P11 remainder — M5, M6, M7, L6, L7, L9, L10**: `workingDaysKSA()`
    rewritten for correct UTC date handling (was timezone-fragile) and
    returns `null` on reversed dates instead of a bogus negative count; KPI8
    (comment close rate) now sums from the same `stageDocs[key].docList`
    source the document-review views use, instead of a separately-derived
    `reviewEvents` count that could disagree with it; KPI target-display text
    now reads the settings-aware `getKPIS()` accessor instead of hardcoded
    `KPI_DEFAULTS`; KPI detail-view RAG colors centralized through one
    `ragHex()` helper; KPI5 (end-to-end days) excludes partial submissions
    consistently at both its calc and detail-render sites;
    `deriveMilestoneDates()` now sorts the design log before taking its first
    entry instead of assuming input order. **Touches KPI scoring** — an
    independent review subagent (stronger model) is running against this
    batch before it's committed, per `CLAUDE.md`'s rule; results pending.
  - **P12 remainder — M8, M9**: the Project Overview panel's governance-breach
    check now calls the same canonical `isDateBreached()` function the
    Governance view uses (was a separately-inlined, narrower check); editing
    an action's target date via the Edit Action modal now records a
    `targetDateHistory` entry, same as every other target-date-changing path.
  - **P10 — quick correctness wins (L1, M3, L8, M10, M11)**: escaped 3
    previously-unescaped governance-panel fields closing a stored-XSS gap
    reachable via a hand-edited session import; governance action age no
    longer renders "NaNd" when Date Opened is empty (falls back to an
    ID-embedded timestamp); fixed an invalid CSS class name that was silently
    dropping a KPI sub-line's RAG color; the sidebar version badge is now
    driven by `APP_VERSION` at runtime instead of a hardcoded literal that
    could drift; `CLAUDE.md`/`docs/ARCHITECTURE.md` no longer hardcode the
    current version number, pointing at the `APP_VERSION` constant instead.
  - **P13 — hardening & hygiene (M1, M4, L2–L5, L11, L13)**: a new
    `_flushPendingSave()` helper now runs before every cross-tab/cross-window
    state reload (the `verify_updated` broadcast, the `storage` listener, the
    `_aimo_sync` poll, and `window.aimoRefresh`), closing the race where an
    incoming external update could silently clobber a local unsaved edit —
    same problem P7's `sbNoteExternalStorageChange` solved for cloud sync,
    now closed for the plain-localStorage path too; two handlers that wrote
    the full projects array (incl. base64 photos) to localStorage on every
    keystroke now debounce instead; ID generation (12 call sites) now appends
    a random suffix to the timestamp to prevent collisions; a failed
    localStorage write (quota exceeded) now shows a persistent visible
    indicator (`#sessionDirtyDot`) in addition to the existing one-time
    alert, and clears itself on the next successful write; `/api/feedback`
    now rejects wrong-content-type and oversized requests before parsing the
    body, instead of after; deleted ~506 lines of dead `buildSafety*` code
    (and 4 orphaned helpers) left over from the v1.4 Safety-tab redirect —
    confirmed via grep that nothing else references them.
    - **M12 explicitly excluded** — production deploying from this working
      branch instead of `main` is a separate infra decision needing its own
      owner approval, tracked here and in `CLAUDE.md`'s deployment notes.
    - **Follow-up spotted, not yet actioned**: while confirming the deleted
      `buildSafety*` functions had no other callers, the MOC CRUD functions
      (`addMoc`, `saveMocField`, `saveMocStatus`, etc.) and their state vars
      (`stSafetyMocId`, `mocSectionCollapsed`) also appear to have zero live
      UI callers left, post the v1.4 Safety-tab redirect. Left in place —
      out of L13's specific scope — flagging here for a future cleanup pass
      if confirmed dead.

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
