# Pending Changes — AIMO Tracker

Tracks requested changes from consolidation through approval to shipped, per the
process in `CLAUDE.md`. Newest items at the top of each section.

## Summary
| # | Item | Status |
|---|------|--------|
| P13 | Audit batch 5 — hardening & hygiene (M1, M4, M12, L2–L5, L11–L13) | 🆕 Logged — awaiting go |
| P12 | Audit batch 4 — schema + governance (H3, M8, M9) | 🆕 Logged — awaiting go |
| P11 | Audit batch 3 — KPI correctness (H4, M5, M6, M7, L6, L7, L9, L10) | 🆕 Logged — awaiting go |
| P10 | Audit batch 2 — quick correctness wins (L1, M3, L8, M10, M11) | 🆕 Logged — awaiting go |
| P9 | Audit batch 1 — data-loss protection (C1, C2, H1, H2, M2) | 🆕 Logged — awaiting go |
| P7 | Cloud sync (Supabase auth + team_state sync) — v2.0 big build | 🔧 Built + QA'd on working copy — awaiting review + explicit "ship it" |
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
- **P9 through P13 — Independent code audit findings** (Notion: "Code Audits — AIMO
  Projects Tracker", Audit Run 1, 04 Aug 2026, against v1.4 / commit `0d9795c` —
  predates P7's cloud-sync work, no overlap). 31 findings: 2 Critical, 4 High, 12
  Medium, 13 Low. Full finding detail, exact line numbers, and fix instructions
  live in the Notion page; batched here exactly as the audit itself suggests, so
  each batch is one go/no-go decision. Nothing implemented yet — logged per
  `CLAUDE.md`'s process, awaiting explicit go per batch.
  - **P9 — Batch 1, data-loss protection (Critical).** C1: malformed session
    import can brick the app on next load (crash outside any try/catch). C2:
    import overwrites all current data with no confirmation and no backup. H1:
    corrupted localStorage gets silently replaced by demo data on next load
    instead of preserved. H2: import reports success even when a storage write
    actually failed (quota). M2: session export can miss the last debounced
    edit, then clears the "needs backup" flag anyway. Audit's own recommended
    review-before-ship, since this is exactly the session import/export path
    `CLAUDE.md` already flags as data-loss-sensitive.
  - **P10 — Batch 2, quick correctness wins.** L1: one real stored-XSS gap — a
    hand-edited/malicious session import can plant an unescaped `innerHTML`
    payload in the governance detail panel. M3: governance action age renders
    "NaNd" when Date Opened is empty. L8: invalid CSS silently drops a KPI
    sub-line's RAG color. M10/M11: stale hardcoded version badge in the
    markup and stale version references in `CLAUDE.md`/`docs/ARCHITECTURE.md`.
    Low risk, one-line-scale fixes.
  - **P11 — Batch 3, KPI correctness.** H4: KREI total treats unmeasured
    components as 0 instead of excluding them, causing false-red scores. M5:
    reversed event dates count as 0-day turnarounds. M6/L12: timezone bugs in
    working-day/date-math helpers (correct in KSA, wrong for other-timezone
    viewers). M7: two KPI cards compute "comment closure" from different
    sources and can disagree on identical data. L6/L7/L9/L10: assorted
    threshold/footnote/ordering drift in KPI displays. Touches KPI scoring —
    per `CLAUDE.md` this batch warrants a review subagent before shipping.
  - **P12 — Batch 4, schema + governance.** H3: phase-planned-dates entered via
    the Add/Edit modal write to a flat schema location nothing else reads,
    creating two disconnected sources of truth (needs a migration for existing
    data). M8: breach-flag logic disagrees between the project Overview panel
    and the Governance view. M9: editing an action via the modal bypasses
    target-date audit-trail history that the inline editor records.
  - **P13 — Batch 5, hardening & hygiene.** M1: cross-tab save race between the
    main app and the `?verify=` popup can silently drop or overwrite edits.
    M4: a couple of handlers write the full projects array (incl. base64
    photos) to localStorage on every keystroke instead of debouncing. M12: the
    known loose end that production deploys from this working branch, no
    `main` yet (needs owner approval per the hard rule — already tracked
    elsewhere too). L2/L3: `/api/feedback` has no auth/rate-limiting and
    parses the body before size validation. L4: timestamp-only IDs (no random
    suffix) can collide. L5/L11/L13: quota-alert-only-fires-once, inconsistent
    overdue-date semantics across views, ~510 lines of dead `buildSafety*`
    code kept since the v1.4 Safety-tab redirect.
- **P7 — Cloud sync (Supabase)**, the "big build" requested to bring
  AIMO Tracker's header/sync UX in line with the Safety Tracker sibling. Email +
  password sign-in, whole-blob sync (`projects`/`governance`/`kpiSettings`) to the
  shared `projects.team_state` row provisioned in P6, optimistic-concurrency
  conflict handling (pull + blocking alert, never silent clobber), local-first —
  fully functional with cloud sync untouched if the CDN is blocked or nobody
  signs in. Built on `aimo-tracker.html`, version bumped to v2.0, `CHANGELOG.md`
  and `docs/SUPABASE.md` updated. Headless QA (CDN-blocked graceful degradation,
  mocked-client sign-in/pull/push/conflict/sign-out) all passed. **Not deployed**
  — `public/index.html` untouched, per `CLAUDE.md`'s separate build/ship
  approval rule.

## ✅ Shipped
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
