# START HERE — AIMO Safety Tracker (kickoff prompt for Claude Code)

*Paste this whole file as your first message to Claude Code in the
`AIMO-Safety-Tracker` project folder. It's the same prompt for both chats that
used to run this project (the deploy/publish chat and the "AIMO-Safety-Reporting"
builder chat) — in Claude Code you are now the single agent for it.*

---

You are taking over an existing, live project. **Before doing anything, read these
files in the project — they were written as your handoff and contain everything:**

1. `docs/HANDOFF.md` — start here: working model, conventions, gotchas, open items.
2. `docs/ARCHITECTURE.md` — the whole cloud system + every URL, ID, env var, and the Supabase SQL.
3. `docs/DEPLOYMENT.md` — how to publish a new version + verification checklist + secrets policy.
4. `CLAUDE.md` — the app's scope/how-it-works notes.
5. `AIMO_Safety_Tracker_CHANGELOG.md` and `cloud-deploy/DEPLOY_LOG.md` — the version + deploy history.
6. `PENDING_CHANGES.md` — the approved/awaiting change queue (mirrors a Notion page).

## Snapshot (as of 2026-07-30)
- **What it is:** a single self-contained HTML safety tracker for GACA work. The one
  maintained build is **`cloud-deploy/index.html`** — currently **V4.5 / cloud-v26**.
  The old offline build is deprecated in `_archive/`.
- **Live app:** https://aimo-safety-tracker.ideandaai.workers.dev (Cloudflare Workers,
  auto-deploys from the private GitHub repo `idean92/aimo-safety-tracker` on push to `main`).
  *Ignore the old `bitter-rain-3d7d…` Worker — it's stale and being retired.*
- **Backing services:** Supabase (login + shared `team_state` data), Cloudflare R2 via the
  `aimo-photos` Worker (field photos), and a Cloudflare Pages app that files in-app feedback
  into Notion. All details, IDs and env vars are in `docs/ARCHITECTURE.md`.

## The working model (Dean's rules — keep them)
- **Dean is the owner and is NOT a coder / not IT.** Explain things plainly, no jargon.
- **The local folder is the workshop; GitHub is the "publish" button + version history;
  Cloudflare updates itself from GitHub.** Make changes in the folder, publish when Dean says.
- **Dean decides when to deploy.** Never push a build live unless he asks.
- This project used to be split across two chats — a **builder** (UI/interface edits to the
  HTML) and a **publisher** (cloud/infra/deploys). You now do both; the division is just a
  useful way to think about the work.

## Hard rules
- **Every change to `cloud-deploy/index.html` gets a `CHANGELOG.md` entry** (newest at top),
  and a matching `cloud-vN` line in `DEPLOY_LOG.md` when it deploys.
- **Version `X.Y`:** minor change → bump `Y`; major (data-model / behaviour / removal) → roll
  `X`, reset `Y`. Keep `const APP_VERSION` + footer in sync.
- **Secrets:** the GitHub token, Supabase `service_role` key, and the feedback `NOTION_API_KEY`
  are NEVER written to files or committed. Dean pastes the GitHub token per session; mask it in
  output. Only the Supabase publishable key + Worker URLs are public-safe.
- Preserve the app invariants (no embedded/seed data; never force users to wipe storage;
  keep the single-file inlined build; `ensureStageDocs`).

## To deploy (short version — full runbook in `docs/DEPLOYMENT.md`)
Update `cloud-deploy/index.html` → copy it to the repo's `public/index.html` → commit → push
to `main`. Cloudflare auto-deploys in ~1–2 min. Then hard-refresh the live URL and confirm the
footer shows the new version. The destination file must be named **exactly** `index.html`.

## Open items to be aware of
- **Verify photos work** on the live app — the `aimo-photos` Worker's `ALLOWED_ORIGIN` was just
  corrected in source from the old URL to `aimo-safety-tracker…`; confirm the *deployed* Worker
  allows the current origin (see `docs/HANDOFF.md`).
- **Retire** the stale `bitter-rain-3d7d` Cloudflare Worker.
- **P9 — view-only mode** is awaiting a scoping decision from Dean (display-only flag vs. an
  enforced Supabase role). See `PENDING_CHANGES.md`.
- GitHub token is fine-grained with ~90-day expiry — Dean re-mints it when it lapses.
- **Before your first commit:** this local repo currently has a stale `.git/index.lock` left over
  from an earlier session, which will make `git add`/`git commit` fail with "Unable to create
  .git/index.lock: File exists." Just delete that file (`rm .git/index.lock`) — there is no other
  git process actually running. Also note `git remote -v` is currently empty here (no `origin`
  configured); confirm with Dean whether this local repo should be wired to
  `github.com/idean92/aimo-safety-tracker` directly, since deploys so far were done from a
  separately-cloned copy in a cloud session.

Once you've read the handoff docs, give Dean a one-paragraph "I'm caught up — here's where
things stand and what I can do next." Then wait for his direction.
