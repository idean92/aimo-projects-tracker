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

## Feedback endpoint setup — ⚠️ regressed, root cause found (05 Aug 2026)
The variables were set and confirmed working on 01 Aug, but they **kept
disappearing after subsequent pushes**, taking the feedback endpoint back to
`503`. Root cause: every git-push build runs `wrangler deploy`, and by default
that **deletes all dashboard-set plaintext ("Text") variables** that aren't
listed in `wrangler.jsonc`. True **Secrets are never deleted** by deploys — so
the fact that `NOTION_API_KEY` kept dropping means it had been entered in the
dashboard as type "Text", not type "Secret".

Fix (in `wrangler.jsonc`, on branch `claude/notion-feedback-key-cloudflare-d338dt`):
- `"keep_vars": true` — deploys no longer wipe dashboard variables.
- `NOTION_FEEDBACK_DATABASE_ID` moved into the config's `vars` block (it's not
  sensitive), so it ships with every deploy automatically.

**Two manual steps remain for the owner:**
1. Re-add `NOTION_API_KEY` in **Settings → Variables and secrets** (top-level
   runtime panel, per the gotcha below) and set its **Type to "Secret"** — not
   "Text". As a Secret it will survive every future deploy even without
   `keep_vars`.
2. This fix only protects the live Worker once the `wrangler.jsonc` change is
   on the branch the Worker builds from (`claude/review-pending-context-jbjnrg`
   as of today) — merge/cherry-pick it there.

Original setup notes (01 Aug 2026):
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
- ⚠️ **Production branch migration — half done, ONE OWNER STEP REMAINING (06 Aug 2026).**
  A real **`main` branch now exists** and was created at `dc4eab9`, the exact commit
  the Worker is currently serving (v4.3) — so `main` and
  `claude/review-pending-context-jbjnrg` are byte-identical right now and either one
  builds the same site.

  **The Worker still builds from `claude/review-pending-context-jbjnrg`.** Changing
  that is dashboard-only: **Workers & Pages → aimo-projects-tracker → Settings →
  Builds → Branch control → production branch → `main`**. There is no Cloudflare MCP
  tool for it (the Workers tools available here are read-only), so it cannot be
  scripted from an agent session.

  **Until the owner flips that setting, `claude/review-pending-context-jbjnrg` is
  still production** — a push to `main` alone will NOT deploy. While both branches
  exist, keep them in lockstep: land a deploy on the tracked branch and fast-forward
  the other to match. Once the setting is flipped, `main` becomes the only branch that
  matters and the old branch can be retired (deleting it needs explicit owner
  confirmation, per `CLAUDE.md` § Git workflow).
- ⚠️ **`NOTION_API_KEY` / `NOTION_FEEDBACK_DATABASE_ID` kept getting wiped by
  deploys** (05 Aug 2026: endpoint back to `503`) — root cause and fix in
  "Feedback endpoint setup" above; `NOTION_API_KEY` must be re-added as type
  **Secret**.
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

<!-- deploy-trigger probe: docs-only, no app change. See CLAUDE.md Deployment. -->
