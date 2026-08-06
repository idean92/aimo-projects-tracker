# AIMO Tracker — Working Notes

## What this is
AIMO Tracker is a project-management tool for the AIMO (airport infrastructure /
master-planning) team at King Salman International Airport (KSIA). It tracks MOC
(Management of Change) projects, governance actions, and KPIs through their
approval/design/execution lifecycle.

The app is a single self-contained file, `aimo-tracker.html` (~14,800 lines: markup +
CSS + vanilla JS all inline, no build step, no framework, no npm runtime dependencies).
Local state lives in the browser via `localStorage` (`aimo_projects` /
`aimo_governance` / `aimo_kpi_settings`), with a manual session export/import
(`downloadSession()` / `loadSessionFile()`) as the offline backup path. **Cloud sync is
built and live** — sign-in is mandatory (P14/v3.0) and the whole blob syncs to
`projects.team_state` in the shared Supabase project (P7/v2.0), with
`shared.project_registry` added in P17/v4.0–4.2 for the cross-tracker roster. See
`docs/SUPABASE.md`. *(This paragraph previously said Supabase was unbuilt and data was
browser-only — false since v2.0; corrected 06 Aug 2026.)*

See `docs/ARCHITECTURE.md` for the detailed architecture cheat-sheet, the data-model
gotchas, and how this project relates to its sibling, AIMO Safety Tracker.

## Deployment
Independent Cloudflare and Notion resources exist for this project, separate from
the sibling's (see `docs/CLOUDFLARE.md`, `docs/NOTION.md`). **Supabase is shared**
with the sibling as of 01 Aug 2026 (see `docs/SUPABASE.md` — same real people use
both apps, so one auth pool made more sense than two independent ones; AIMO
Tracker's data lives in its own `projects` schema there, not mixed with the
sibling's `public` tables). The Cloudflare Worker is connected to this GitHub repo,
auto-builds on push, and is **live** at
https://aimo-projects-tracker.ideandaai.workers.dev.
- **Production branch is mid-migration (06 Aug 2026).** A real `main` branch now
  exists, created at the exact commit the Worker is serving (v4.3), so `main` and
  `claude/review-pending-context-jbjnrg` are identical. **The Worker still builds
  from `claude/review-pending-context-jbjnrg`** until the owner repoints it in the
  Cloudflare dashboard (Settings → Builds → Branch control) — that step is
  dashboard-only and can't be done from an agent session. Keep both branches in
  lockstep meanwhile. See `docs/CLOUDFLARE.md`.
  *(An earlier draft of this line said "a push to `main` does not deploy" — that is
  wrong; the probe below shows every branch deploys. What the setting controls is
  which branch the dashboard treats as production, not which pushes build.)*
- ### ⚠️ ANY branch push deploys — VERIFIED for this repo, 06 Aug 2026
  Confirmed by direct experiment, not inferred. A **docs-only** commit (no change to
  `public/index.html`, so the served bytes were identical and the live site could not
  move) was pushed to `test/deploy-trigger-probe` — a branch that is neither `main`
  nor the tracked production branch. The Worker's `modified_on` advanced from
  16:18:59Z to 16:28:35Z, i.e. Cloudflare built and deployed from it. The live file
  was byte-for-byte unchanged before and after, so the probe proved the trigger
  without touching what users see.
  The same was verified in the Safety Tracker sibling, where believing the old
  "watches `main`" text caused two unapproved deploys.
- **Therefore: do not push anything not approved to ship.** Work that is built and
  awaiting a deploy green light stays **local and unpushed**. Never report something
  as "not deployed" on the grounds that it is only on a working branch — check the
  live URL, and allow ~a minute of build lag before trusting the result (a check
  immediately after a push can still return the previous version).
- When pulling the live file to check `APP_VERSION`, download it fully before
  grepping — a truncated stream can match near the top of the file and miss code
  further down.
- "Deploying" a change means: copy `aimo-tracker.html` (the working copy) →
  `public/index.html` (the deploy copy) → commit → push — only on an
  explicit "ship it," per the hard rule below.

## Hard rule: no version changes or deploys without explicit approval
No new version of the app is built, updated, or deployed unless the owner has
explicitly said to do so, in that specific instance. This overrides any other signal —
a backlog item, a "next in sequence" version, or momentum from a prior task are never
sufficient alone.
- Do not edit code to implement a change until the owner has approved that specific
  change.
- Do not bump the version or hand over a new build until explicitly told to ship it —
  even if already implemented. Approval-to-implement and approval-to-deploy are
  separate green lights.
- If in doubt, ask.

## Git workflow
- Commits in this repo are the version history now — no more hand-copying the file
  before risky edits (that was the old process; see `docs/ARCHITECTURE.md`). Commit
  before any risky edit so it stays revertible.
- Pushing to the remote / opening a PR is not implicitly authorized by "build this" —
  that's a separate instruction, same principle as the hard rule above.
- Destructive git ops (force-push, history rewrite, branch deletion) require explicit
  confirmation, always.

## Feedback / change-request process
A Notion workspace mirroring the Safety Tracker's pattern exists for this project —
see `docs/NOTION.md` for the page/database IDs. The in-app feedback button **is
built and live** (shipped in P1/v1.1): the floating `#fbFab` button + modal in
`aimo-tracker.html`, filing into the Notion Feedback Inbox via the Worker endpoint
in `src/worker.js`. (This section previously said it wasn't built — corrected
05 Aug 2026.) Change requests also still come directly from the owner in
conversation. The same discipline applies either way:
1. Consolidate a request into `PENDING_CHANGES.md` as a new item (short
   root-cause/approach note) — do not touch `aimo-tracker.html` yet.
2. Build only on an explicit go ("go", "build it", "start", "implement").
3. Once implemented and QA'd, bump `APP_VERSION` / `APP_DATE` (see `const APP_VERSION`
   near the top of `aimo-tracker.html` for the current value) and add a `CHANGELOG.md`
   entry — it still isn't shipped/handed over until a separate, explicit "ship it".
4. Update `PENDING_CHANGES.md` to mark the item shipped, as part of the same change.

## Code review before deploying
Spawn a review subagent on a stronger model before shipping when:
- Major version bump (left-most version number changes, e.g. v1.x → v2.0).
- The change touches sensitive logic: `stageDocs` mutation (see the gotcha in
  `docs/ARCHITECTURE.md`), KPI scoring, or session import/export (data-loss risk).
- It feels architecturally significant or risky, even if technically minor.
Skip review for minor/patch bumps, styling, copy edits, small isolated fixes.

## Versioning rules
- Every change is recorded in `CHANGELOG.md` (newest at top). No ship without an
  entry.
- Version `X.Y`: minor change → bump `Y`. Major (data-model/behavior/removal) → roll
  `X`, reset `Y`.
- `const APP_VERSION` and the sidebar version badge (`#appVersionBadge`) must stay in
  sync with the latest `CHANGELOG.md` entry.
- **Two changelogs, both updated on release.** `CHANGELOG.md` is the engineering
  log; the `const CHANGELOG` array in `aimo-tracker.html` (just below
  `APP_VERSION`) drives the in-app "What's new" modal and is written
  benefit-first for end users. A release adds an entry to *both*, and the new
  entry's `v` must match `APP_VERSION` or the modal won't show it.
- Never require the owner to wipe `localStorage`/session data to adopt a new version.

## Related project
AIMO Safety Tracker (`aimo-safety-tracker.html`, its own repo) is a sibling that split
off from this codebase on 2026-07-19 and has since diverged significantly — its own
`localStorage` key (`aimo_safety_projects`), its own cloud deployment (Cloudflare +
Supabase). If a request is about safety/MOC-risk/reporting/deck generation, it's almost
certainly that project, not this one. See `docs/ARCHITECTURE.md` for the full picture
and `docs/reference/` for that project's own process docs, kept here for cross-project
context.
