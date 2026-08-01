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

## Feedback endpoint setup — done ✅ (01 Aug 2026)
Both variables are set and confirmed working:
- **`NOTION_API_KEY`** (secret) — a Notion internal integration, shared with the
  Feedback Inbox database via its `•••` → Connections menu.
- **`NOTION_FEEDBACK_DATABASE_ID`** (plain var) — `94824d19762d4feb9cbee64de525930b`.

**Important gotcha, worth remembering:** these had to be set under **Settings →
"Variables and secrets"** (the top-level one in the Settings sub-nav) — **not** the
similarly-named "Variables and secrets" panel nested under **Settings → Build**. The
Build one only feeds the CI build process; it does not reach the Worker's runtime
`env`. Setting them there first produced a persistent `503` even after a fresh
rebuild — moving them to the top-level Runtime panel fixed it immediately, no
redeploy needed.

End-to-end tested via a direct `POST /api/feedback` call and confirmed the resulting
row in the Feedback Inbox database (via Notion's data-source query) — comment,
context, and status all populated correctly.

Until both are set, `/api/feedback` returns a `503` and the app shows the submitter a
graceful "isn't connected yet" message — no errors, no lost work, the app just can't
actually deliver feedback yet. (This is now moot — see above.)

**Screenshots aren't uploaded to Notion yet** — the endpoint files the text feedback
and leaves a comment on the new page noting a screenshot was attached, since Notion's
page-properties API doesn't take inline image data. Wiring actual image upload (via
Notion's file-upload API) is a follow-up, not built.

## Status (updated 01 Aug 2026)
- ✅ **Worker created and connected** to `idean92/aimo-projects-tracker` via
  Cloudflare's Git integration (done manually in the dashboard — confirmed working,
  auto-builds on push).
- ✅ **Live at https://aimo-projects-tracker.ideandaai.workers.dev** — `workers.dev`
  subdomain enabled (Settings → Domains & Routes), confirmed loading the app
  (v1.1, with the feedback button).
- ⚠️ **Tracking branch `claude/review-pending-context-jbjnrg`, not `main`** — there is
  no `main` branch in this repo yet (everything so far has been pushed straight to
  this working branch). If/when this branch is merged into a real `main`, repoint the
  Worker's production branch in Settings → Builds.
- ✅ **`NOTION_API_KEY` / `NOTION_FEEDBACK_DATABASE_ID` set and working** — see
  "Feedback endpoint setup" above for the exact panel that mattered.
- ✅ **Feedback pipeline confirmed end-to-end** (01 Aug 2026): submitted via a direct
  API call, verified the row landed in the Feedback Inbox database.
- No custom domain added — the `workers.dev` URL is the only way to reach it. Add one
  later in Settings → Domains & Routes if desired.

There is no Cloudflare MCP tool to enable a workers.dev subdomain, add a custom
domain, or set Worker environment variables/secrets — all three were dashboard-only
steps the owner completed manually.

## R2 / photo storage
Explicitly skipped for now (per your direction) — AIMO Tracker has no photo-capture
feature today, unlike the sibling's field-photo findings. Revisit if/when a feature
needs it; see the sibling's `docs/reference/safety-tracker-deploy-log.md` (cloud-v4)
for the pattern it used (R2 bucket + dedicated photo Worker).
