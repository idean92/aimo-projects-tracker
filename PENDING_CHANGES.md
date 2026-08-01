# Pending Changes — AIMO Tracker

Tracks requested changes from consolidation through approval to shipped, per the
process in `CLAUDE.md`. Newest items at the top of each section.

## Summary
| # | Item | Status |
|---|------|--------|
| P1 | In-app feedback button + Cloudflare/Notion endpoint | Built (v1.1), not deployed |

## 🐛 Bugs
_(none yet)_

## ✨ Improvements
_(none yet)_

## 🆕 New
- **P1 — In-app feedback button + endpoint.** Owner-approved and built directly
  (root-cause: no feedback capture existed for this app, unlike the Safety Tracker
  sibling). Floating button + modal in `aimo-tracker.html` (v1.1), Cloudflare Worker
  endpoint (`src/worker.js`) filing into the Notion Feedback Inbox. **Remaining
  before this is live:** Cloudflare Worker deploy/connect + Notion integration
  credential — see `docs/CLOUDFLARE.md`. Not shipped (not copied to
  `public/index.html` / pushed) pending explicit "ship it".

## ✅ Shipped
_(none yet — nothing has gone through the deploy step)_
