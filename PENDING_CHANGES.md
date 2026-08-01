# Pending Changes — AIMO Tracker

Tracks requested changes from consolidation through approval to shipped, per the
process in `CLAUDE.md`. Newest items at the top of each section.

## Summary
| # | Item | Status |
|---|------|--------|
| P1 | In-app feedback button + Cloudflare/Notion endpoint | Shipped (v1.1); not fully functional yet — see notes |

## 🐛 Bugs
_(none yet)_

## ✨ Improvements
_(none yet)_

## 🆕 New
_(none currently in progress)_

## ✅ Shipped
- **P1 — In-app feedback button + endpoint** (v1.1, 01 Aug 2026). Floating button +
  modal in `aimo-tracker.html`, Cloudflare Worker endpoint (`src/worker.js`) filing
  into the Notion Feedback Inbox. Shipped to `public/index.html` and pushed —
  Cloudflare's Git integration is connected and building from this repo. **Not yet
  end-to-end functional:** no public URL is enabled on the Worker yet, and
  `NOTION_API_KEY` / `NOTION_FEEDBACK_DATABASE_ID` still need to be set (see
  `docs/CLOUDFLARE.md`). Also note: Cloudflare is currently tracking the
  `claude/review-pending-context-jbjnrg` branch as production, not `main` (no `main`
  branch exists yet in this repo) — revisit once/if this branch is merged.
