# Cloudflare setup — AIMO Tracker

Independent from the Safety Tracker sibling's Cloudflare resources
(`aimo-safety-tracker` Worker, `aimo-photos` Worker + R2 bucket) — nothing here is
shared with those.

## What's prepared in this repo
- **`wrangler.jsonc`** — a static-assets-only Worker config (`name:
  "aimo-projects-tracker"`), serving whatever is in `public/`. No server-side Worker
  code — this is just static hosting for the single HTML file, same model the
  sibling uses.
- **`public/index.html`** — the file Cloudflare will actually serve, copied from
  `aimo-tracker.html` at the repo root. **`aimo-tracker.html` at the root is the
  working copy you edit; `public/index.html` is the deploy copy.** Per the sibling's
  own deploy convention (`docs/reference/safety-tracker-deploy-log.md`), copying the
  working file into `public/index.html` and pushing is what triggers a deploy — do
  that only on an explicit "ship it," per `CLAUDE.md`.

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
