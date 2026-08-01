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

## What's NOT done — requires the Cloudflare dashboard (no API/MCP path exists)
The connected Cloudflare MCP tools only cover D1, KV, R2, Hyperdrive, and read-only
Worker inspection (`workers_list` / `workers_get_worker` / `workers_get_worker_code`)
— there is no tool to create a Worker or connect a GitHub repo for auto-deploy.
Per Cloudflare's docs, that's a dashboard-only flow:

1. Go to **Workers & Pages** in the Cloudflare dashboard → **Create** → **Import a
   repository** (or create a Worker first, then Settings → Builds → Connect).
2. Select the `idean92/aimo-projects-tracker` GitHub repo, branch `main`.
3. Cloudflare should auto-detect `wrangler.jsonc` in the repo root — confirm the
   Worker name matches (`aimo-projects-tracker`) and the build/deploy settings need
   no build command (it's static assets, nothing to compile).
4. Push a commit to `main` to trigger the first build/deploy.

Once that's connected, the deploy model matches the sibling exactly: **a push to
`main` is a deploy** — nothing else to trigger. Update `CLAUDE.md`'s Deployment
section once this is live (it currently still says "no hosting wired up").

## R2 / photo storage
Explicitly skipped for now (per your direction) — AIMO Tracker has no photo-capture
feature today, unlike the sibling's field-photo findings. Revisit if/when a feature
needs it; see the sibling's `docs/reference/safety-tracker-deploy-log.md` (cloud-v4)
for the pattern it used (R2 bucket + dedicated photo Worker).
