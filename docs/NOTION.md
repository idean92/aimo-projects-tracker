# Notion setup — AIMO Tracker

Independent from the Safety Tracker's Notion setup (own top-level page, own
databases), per the same pattern described in
`docs/reference/safety-tracker-handoff.md` § 8.

| What | ID / URL |
|---|---|
| **AIMO Tracker** (top-level workspace page) | `3af84c76-5da9-81bd-bfe2-c4af93ff4a7c` — https://app.notion.com/p/3af84c765da981bdbfe2c4af93ff4a7c |
| **Pending Changes (awaiting approval)** page | `3af84c76-5da9-8134-af2f-ef2d84e9fa12` — https://app.notion.com/p/3af84c765da98134af2fef2d84e9fa12 |
| **Feedback Inbox** database | https://app.notion.com/p/94824d19762d4feb9cbee64de525930b |
| Feedback Inbox data source (for API/query use) | `collection://2597b3b1-5765-455d-b9f5-60531f7c809b` |

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
- ✅ Feedback-capture endpoint built (`src/worker.js`, `POST /api/feedback`) — but
  **not live yet**: needs the Cloudflare Worker deployed/connected (`docs/CLOUDFLARE.md`)
  and a Notion internal integration created + shared with this database (also in
  `docs/CLOUDFLARE.md`, "Feedback endpoint setup").
- ⬜ Screenshot upload to Notion — submissions note "screenshot attached" as a comment
  for now; actual image upload isn't wired up (see `docs/CLOUDFLARE.md`).
- ⬜ Daily/recurring triage task that reviews `Reviewed = false` rows and files them
  into `PENDING_CHANGES.md` — not set up yet (the Safety Tracker sibling has one; see
  `docs/reference/safety-tracker-handoff.md` § 8 for that pattern).

## How to query this database
Once the feedback button + endpoint exist, triage can use the Notion MCP tools
(`notion-fetch` on the data source URL above, or `notion-search`) to find rows with
`Reviewed = false`, the same way the sibling project's daily task does.
