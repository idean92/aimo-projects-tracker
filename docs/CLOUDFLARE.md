# Cloudflare setup — AIMO Tracker

Independent from the Safety Tracker sibling's Cloudflare resources
(`aimo-safety-tracker` Worker, `aimo-photos` Worker + R2 bucket) — nothing here is
shared with those.

## What's prepared in this repo
- **`wrangler.jsonc`** — Worker config (`name: "aimo-projects-tracker"`) serving
  `public/` as static assets, with `src/worker.js` handling `/api/*` requests first
  (`run_worker_first`) and falling through to the static file for everything else.
- **`public/index.html`** — the file Cloudflare will actually serve, copied from
  `aimo-tracker.html` at the repo root. **`aimo-tracker.html` at the root is the
  working copy you edit; `public/index.html` is the deploy copy.** Per the sibling's
  own deploy convention (`docs/reference/safety-tracker-deploy-log.md`), copying the
  working file into `public/index.html` and pushing is what triggers a deploy — do
  that only on an explicit "ship it," per `CLAUDE.md`.
- **`src/worker.js`** — handles `POST /api/feedback`: validates the submission and
  files it into the Notion Feedback Inbox database (see `docs/NOTION.md`) via the
  Notion API. Needs two environment variables set on the Worker before it actually
  works (see "Feedback endpoint setup" below).

## Feedback endpoint setup — manual, one-time
Two things need to be configured on the Worker (dashboard → your Worker → Settings →
Variables and Secrets, or `wrangler secret put` / `wrangler.jsonc` `vars`):

1. **`NOTION_API_KEY`** (secret, never commit this) — create a Notion **internal
   integration** at https://www.notion.so/my-integrations, copy its secret, then open
   the **Feedback Inbox** database in Notion → `•••` → **Connections** → add that
   integration. Without this share step, the API key gets a 404 even though it's
   valid — Notion integrations only see pages/databases explicitly shared with them.
2. **`NOTION_FEEDBACK_DATABASE_ID`** (plain var, not secret) — `94824d19762d4feb9cbee64de525930b`
   (from the database URL in `docs/NOTION.md`). Double check this is accepted as a
   classic `database_id` when you first test it; if Notion rejects it, use the fetch
   tool on the database URL to confirm the right ID.

Until both are set, `/api/feedback` returns a `503` and the app shows the submitter a
graceful "isn't connected yet" message — no errors, no lost work, the app just can't
actually deliver feedback yet.

**Screenshots aren't uploaded to Notion yet** — the endpoint files the text feedback
and leaves a comment on the new page noting a screenshot was attached, since Notion's
page-properties API doesn't take inline image data. Wiring actual image upload (via
Notion's file-upload API) is a follow-up, not built.

## Status (updated 01 Aug 2026)
- ✅ **Worker created and connected** to `idean92/aimo-projects-tracker` via
  Cloudflare's Git integration (done manually in the dashboard — confirmed working,
  auto-builds on push).
- ⚠️ **Tracking branch `claude/review-pending-context-jbjnrg`, not `main`** — there is
  no `main` branch in this repo yet (everything so far has been pushed straight to
  this working branch). If/when this branch is merged into a real `main`, repoint the
  Worker's production branch in Settings → Builds.
- ⚠️ **No public URL enabled** — the dashboard overview shows "No URLs enabled,"
  `workers.dev` disabled, no custom domain. Nobody can reach the deployed app yet.
  Fix in **Settings → Domains & Routes**: enable the `workers.dev` subdomain for
  quick testing, and/or add a custom domain for real use.
- ⚠️ **`NOTION_API_KEY` / `NOTION_FEEDBACK_DATABASE_ID` not set** — see "Feedback
  endpoint setup" above. Until both are set, `/api/feedback` returns 503.
- `public/index.html` now matches `aimo-tracker.html` (shipped 01 Aug 2026, v1.1) —
  once a URL is enabled, the deployed site will show the feedback button.

There is no Cloudflare MCP tool to enable a workers.dev subdomain, add a custom
domain, or set Worker environment variables/secrets — all three remain dashboard-only
steps for the owner to complete.

## R2 / photo storage
Explicitly skipped for now (per your direction) — AIMO Tracker has no photo-capture
feature today, unlike the sibling's field-photo findings. Revisit if/when a feature
needs it; see the sibling's `docs/reference/safety-tracker-deploy-log.md` (cloud-v4)
for the pattern it used (R2 bucket + dedicated photo Worker).
