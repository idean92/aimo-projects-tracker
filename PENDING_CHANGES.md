# Pending Changes — AIMO Tracker

Tracks requested changes from consolidation through approval to shipped, per the
process in `CLAUDE.md`. Newest items at the top of each section.

## Summary
| # | Item | Status |
|---|------|--------|
| P4 | D1 + Cloudflare Access trial (Supabase free-tier consolidation, Option B) | Built + tested, not deployed to Access |
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
- **P4 — D1 + Cloudflare Access trial.** Root cause: Supabase free tier caps at 2
  active projects; had 3 (AIMO-SMS-Tracker, AIMO-Projects-Tracker, wealth-tracker).
  Two options drafted (Supabase schema-consolidation into AIMO-SMS-Tracker, or
  migrate AIMO-Projects-Tracker off Supabase entirely to D1 + Cloudflare Access,
  trialed here since it's empty/no live users). Owner chose the D1 path. Built:
  D1 database + schema (`migrations/0001_init.sql`), JWT verification module
  (`src/access.js`), two new Worker routes (`/api/team-state`, `/api/app-state`).
  Tested: 6/6 JWT-verification checks (valid/tampered/expired/wrong-audience/
  unknown-key), plus direct D1-level query isolation between two synthetic users.
  AIMO-SMS-Tracker (live Safety Tracker data) was not touched.
  **Paused mid-setup (01 Aug 2026):** in the Cloudflare Zero Trust dashboard, we
  created an Access policy (`AIMO Tracker API access`, allow-listing
  `ideandaai@gmail.com`) scoped to two path-based destinations
  (`aimo-projects-tracker.ideandaai.workers.dev/api/app-state*` and
  `/api/team-state*`), but the **Application itself didn't save** — the
  Applications list came back empty after clicking through. Team domain is known
  (`quiet-unit-b4b4.cloudflareaccess.com`); the AUD tag is not yet captured since
  the app was never actually created. **Next time:** redo the application
  creation (Create new application → Self-hosted → Workers tab → re-add the two
  path destinations → this time use "Add existing policy" to reuse the
  already-saved `AIMO Tracker API access` policy instead of recreating it →
  confirm it actually lands on the app's detail page after saving, then grab the
  AUD tag from its Overview tab → set `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD`
  as Worker vars (top-level Settings panel, not the one under Build). See
  `docs/D1-TRIAL.md` for the full remaining checklist.

## ✅ Shipped
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
