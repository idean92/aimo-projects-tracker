# AIMO Tracker — Working Notes

## What this is
AIMO Tracker is a project-management tool for the AIMO (airport infrastructure /
master-planning) team at King Salman International Airport (KSIA). It tracks MOC
(Management of Change) projects, governance actions, and KPIs through their
approval/design/execution lifecycle.

The app is a single self-contained file, `aimo-tracker.html` (~13,400 lines: markup +
CSS + vanilla JS all inline, no build step, no framework, no npm runtime dependencies).
Data currently lives entirely in the browser via `localStorage`
(`aimo_projects` / `aimo_governance` / `aimo_kpi_settings`); the only backup mechanism
is a manual session export/import (`downloadSession()` / `loadSessionFile()`). A
Supabase project exists for future cloud sync (see `docs/SUPABASE.md`) but the app has
no code yet that talks to it — nothing has changed for end users until that's built.

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
https://aimo-projects-tracker.ideandaai.workers.dev. It's currently tracking the
`claude/review-pending-context-jbjnrg` branch as production, not `main` (no `main`
branch exists in this repo yet) — revisit once/if that branch is merged. See
`docs/CLOUDFLARE.md` for exact status and next steps.
- **A push to the tracked branch is a deploy** — same "push is a deploy" model as the
  Safety Tracker sibling, just not on `main` yet.
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
see `docs/NOTION.md` for the page/database IDs. The **in-app feedback button and its
Cloudflare Pages Function endpoint are not built yet**; the Notion side (Feedback
Inbox database + Pending Changes page) is provisioned and ready for when that's
implemented. Until the button exists, change requests still come directly from the
owner in conversation. The same discipline applies either way:
1. Consolidate a request into `PENDING_CHANGES.md` as a new item (short
   root-cause/approach note) — do not touch `aimo-tracker.html` yet.
2. Build only on an explicit go ("go", "build it", "start", "implement").
3. Once implemented and QA'd, bump `APP_VERSION` / `APP_DATE` (top of the file,
   currently `v1.0` / 07 Jul 2026) and add a `CHANGELOG.md` entry — it still isn't
   shipped/handed over until a separate, explicit "ship it".
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
- Never require the owner to wipe `localStorage`/session data to adopt a new version.

## Related project
AIMO Safety Tracker (`aimo-safety-tracker.html`, its own repo) is a sibling that split
off from this codebase on 2026-07-19 and has since diverged significantly — its own
`localStorage` key (`aimo_safety_projects`), its own cloud deployment (Cloudflare +
Supabase). If a request is about safety/MOC-risk/reporting/deck generation, it's almost
certainly that project, not this one. See `docs/ARCHITECTURE.md` for the full picture
and `docs/reference/` for that project's own process docs, kept here for cross-project
context.
