# Notion setup — AIMO Tracker

Independent from the Safety Tracker's Notion setup (own top-level page, own
databases), per the same pattern described in
`docs/reference/safety-tracker-handoff.md` § 8.

| What | ID / URL |
|---|---|
| **AIMO Tracker** (top-level workspace page) | `3af84c76-5da9-81bd-bfe2-c4af93ff4a7c` — https://app.notion.com/p/3af84c765da981bdbfe2c4af93ff4a7c |
| **Pending Changes (awaiting approval)** page | `3af84c76-5da9-8134-af2f-ef2d84e9fa12` — https://app.notion.com/p/3af84c765da98134af2fef2d84e9fa12 |
| **Feedback Inbox** database | https://app.notion.com/p/94824d19762d4feb9cbee64de525930b |
| **Code Audits — AIMO Projects Tracker** page | `3b284c76-5da9-81f2-a6b1-ee82cb0572a6` — https://app.notion.com/p/3b284c765da981f2a6b1ee82cb0572a6 |
| Feedback Inbox data source (for API/query use) | `collection://2597b3b1-5765-455d-b9f5-60531f7c809b` |

## Code Audits page (recurring)
The **Code Audits** page above is the central audit record, updated on every audit
run (first run: 04 Aug 2026, against v1.4 / `0d9795c`). Workflow:
- The **audit agent** appends a new dated "Audit Run N" section per run and updates
  the run-log table at the top; it also re-checks prior findings.
- The **builder agent** implements fixes from those findings — only after the
  owner's explicit "go" per `CLAUDE.md` — and updates each finding's `Status:`
  marker (`Open` → `Fix implemented` → `Verified pre-deploy` → `Shipped`, or
  `Won't fix` / `Reopened`).
- A separate **pre-deploy audit agent** reviews implemented fixes before ship and
  flips statuses to `Verified pre-deploy` (or reopens with a note).
Findings carry exact line numbers valid at the audited commit plus quoted
snippets for re-location after the file changes.

## Feedback Inbox schema
- `Feedback` (title)
- `Comment` (rich text) — free-text feedback submitted by the user
- `Context` (rich text) — app version + screen/tab it was raised from
- `Status` (select: New / Reviewed / Planned / Shipped / Rejected)
- `Priority` (select: Low / Medium / High)
- `Reviewed` (checkbox)
- `Screenshot` (files)
- `Submitted` (created time, automatic)

## Status
- ✅ Notion pages/database created (2026-08-01).
- ✅ In-app "Send feedback" button + modal built (`aimo-tracker.html`, v1.1).
- ✅ Feedback-capture endpoint built and **live** (`src/worker.js`, `POST /api/feedback`
  on https://aimo-projects-tracker.ideandaai.workers.dev) — end-to-end tested
  01 Aug 2026, confirmed a real submission lands in this database correctly.
- ⬜ Screenshot upload to Notion — submissions note "screenshot attached" as a comment
  for now; actual image upload isn't wired up (see `docs/CLOUDFLARE.md`).
- ⬜ Daily/recurring triage task that reviews `Reviewed = false` rows and files them
  into `PENDING_CHANGES.md` — not set up yet (the Safety Tracker sibling has one; see
  `docs/reference/safety-tracker-handoff.md` § 8 for that pattern).

## How to query this database
Use `notion-query-data-sources` (SQL mode) against
`collection://2597b3b1-5765-455d-b9f5-60531f7c809b` — e.g.
`SELECT * FROM "collection://2597b3b1-5765-455d-b9f5-60531f7c809b" WHERE Reviewed = '__NO__'`
— to find unreviewed rows for triage, the same way the sibling project's daily task
does.
