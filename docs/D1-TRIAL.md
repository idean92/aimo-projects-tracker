# D1 migration trial — AIMO-Projects-Tracker (ABANDONED, superseded)

**This path was not taken.** Kept for the record — mainly for the real gotcha it
surfaced (Cloudflare Access can't path-scope protection on a bare `workers.dev`
domain, only whole-Worker) in case D1/Access comes up again for a project with a
custom domain. All the code described below (D1 database, `src/access.js`, the
`/api/team-state`/`/api/app-state` routes, `migrations/`, `scripts/test-access-jwt.mjs`)
has been **removed from the repo** and the trial D1 database deleted (it was
always empty, zero data loss). What actually happened instead: **consolidated
into the Safety Tracker's Supabase project** — see `docs/SUPABASE.md`.

**Why abandoned:** after building this out and getting partway through the
Cloudflare Access dashboard setup, hit a real blocker — Access's path-scoped
"Public hostname" destinations only work for hostnames that are an actual zone in
your Cloudflare account, not a `*.workers.dev` subdomain. The only way to gate just
`/api/*` (not the whole app) would've meant getting a custom domain first. Given the
same real people use both AIMO Tracker and Safety Tracker anyway, sharing one
Supabase auth pool (the original Option A) turned out to make more practical sense
than clearing that extra hurdle.

---

*(Original trial write-up follows, unmodified, for context.)*

**Status at the time: infrastructure built and tested, not yet connected to the live
app or to a real Cloudflare Access deployment.** This is a trial of Option B
(migrate off Supabase to Cloudflare D1 + Cloudflare Access) run against
`AIMO-Projects-Tracker` specifically *because* it has 0 rows and 0 auth users —
nothing live to risk. The Safety Tracker's real Supabase project (`AIMO-SMS-Tracker`,
live user data) is untouched; this trial is what would get evaluated before ever
considering that migration for real.

## Why D1 instead of the Supabase consolidation (Option A)

Both options were on the table to free up a Supabase free-tier project slot.
Option A (merge into `AIMO-SMS-Tracker` under separate schemas) was drafted but
not executed — seeing this session had already chosen *independent* Supabase
projects for the two apps specifically because they'd diverged, consolidating them
back was a real reversal worth a second look, and the owner picked Option B instead
before that reversal was confirmed. `AIMO-SMS-Tracker` and its Supabase project are
untouched. (Data backups from that project were still taken as a precaution and
are sitting in the session scratchpad, not this repo — they contain live user data
and don't belong in git.)

## What's built

- **D1 database**: `aimo-projects-tracker-db` (uuid `89e58d3c-7182-4b2f-96c7-7b15d8bdbf18`).
- **Schema** (`migrations/0001_init.sql`): `team_state` (shared blob, mirrors the
  Supabase table of the same name) and `app_state` (per-user blob, mirrors the
  Safety Tracker's `app_state` table — AIMO Tracker itself has no per-user concept
  today, so this is a template proving the pattern works before it's ever needed
  for real).
- **`wrangler.jsonc`**: added a `d1_databases` binding (`DB`).
- **`src/access.js`**: verifies a Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`
  header) against the team's JWKS — signature, expiry, audience — and returns the
  verified `email`/`sub` claims. Throws on any failure; never falls back to a
  default identity.
- **`src/worker.js`**: two new routes.
  - `GET/PUT /api/team-state` — any valid Access identity, single shared row
    (same trust model as the old Supabase policy: `auth.uid() IS NOT NULL`).
  - `GET/PUT /api/app-state` — scoped to the caller's *verified* email.

## The "no missed WHERE clause" guarantee, concretely

This was the explicit ask: show exactly where per-user scoping happens and how a
missed `WHERE` clause is prevented. The answer is structural, not a promise to be
careful:

`handleAppState()` in `src/worker.js` calls `requireAccessIdentity(request, env)`
once, and the returned `email` is the **only** identifier used in both the
`SELECT ... WHERE user_id = ?` and the `INSERT ... ON CONFLICT` — bound as a SQL
parameter, never string-concatenated. The function never reads a `user_id` from
the request body or query string at all, so there's no client-supplied value that
could be forgotten, spoofed, or substituted. If someone's client sent
`{"user_id": "someone-else@x.com", "data": {...}}`, that field is simply never
looked at.

**Tested, not just asserted:**
- A standalone test (`test_access_jwt.mjs`, run against real RSA-signed JWTs,
  not against a live Access deployment) confirmed: a valid token for user A
  resolves to A's email; a valid token for user B resolves to a different email;
  a tampered payload (B's email spliced into A's signed token) fails signature
  verification; an expired token is rejected; a wrong-audience token is rejected;
  a token signed by a key not in the JWKS is rejected. All 6 checks passed.
- At the D1 layer directly: inserted two rows (`usera@example.com`,
  `userb@example.com`), ran the exact parameterized query the handler uses for
  each, confirmed each only ever returns its own row. Rows deleted afterward —
  D1 is back to empty.

## What's NOT done — requires the Cloudflare dashboard (no API path)

Same category of manual step as the Worker Git-integration connection and the
`workers.dev` subdomain toggle earlier in this project — the connected Cloudflare
MCP tools have no Access/Zero Trust API surface.

**Paused mid-setup as of 01 Aug 2026** — picking this back up:

- ✅ Team domain known: `quiet-unit-b4b4.cloudflareaccess.com`.
- ✅ Access policy created and saved: `AIMO Tracker API access` (allow
  `ideandaai@gmail.com`).
- ✅ Destinations decided: path-scoped public hostnames, **not** a whole-Worker
  scope (whole-Worker would have required login for the entire app, including
  the public homepage and `/api/feedback` — wrong). Use:
  `aimo-projects-tracker.ideandaai.workers.dev/api/app-state*` and
  `.../api/team-state*`.
- ❌ The **Application itself failed to save** — after configuring destinations
  + policy and clicking through, the Applications list came back empty. Cause
  unconfirmed (possibly navigated away before the final save action completed).
- ❌ AUD tag not yet captured (app was never actually created).

**To finish:**
1. Zero Trust → Access → Applications → **Create new application** → Self-hosted
   → **Workers** tab → Continue.
2. Re-add the two path-scoped public hostname destinations above; delete the
   empty "Workers" scope block if it appears.
3. Under Access policies, use **"Add existing policy"** and select
   `AIMO Tracker API access` (already saved — don't recreate it).
4. Scroll to the bottom and confirm you land on the new application's **detail
   page** after saving (not back on an empty applications list — that's the
   failure mode that happened last time).
5. On the application's Overview tab, copy the **Application Audience (AUD)
   Tag**.
6. Set two Worker vars (Settings → Variables and secrets — the **top-level**
   one, not the one nested under Build; see the note in `docs/CLOUDFLARE.md`
   about that exact gotcha from the Notion feedback endpoint):
   - `CF_ACCESS_TEAM_DOMAIN` = `quiet-unit-b4b4.cloudflareaccess.com`
   - `CF_ACCESS_AUD` = the Application's AUD tag
7. Test by logging into `/api/app-state` through the Access-protected URL as two
   different team members and confirming each only ever sees their own data —
   the real-world version of the isolation test above.

Until that's done, both routes return `401` (currently
`"Missing Cf-Access-Jwt-Assertion header"`, confirmed live) — safe, inert, no
data exposure risk either way.

## Not wired into the app yet

`aimo-tracker.html` has no client-side code calling these endpoints — it never had
any cloud-sync code at all (same as the Supabase `team_state` table before it:
built and ready, not yet used). Wiring the app's UI to actually read/write through
`/api/team-state` (and, if ever needed, `/api/app-state`) is a separate, later
step — this trial's job was to prove the D1 + Access approach is sound before
committing to it.

## Rollback

Nothing here is destructive or irreversible: the D1 database can be dropped with
`d1_database_delete` with zero data loss (it's empty), and removing the
`d1_databases` block from `wrangler.jsonc` (plus the two new routes) returns the
Worker to exactly its pre-trial state.
