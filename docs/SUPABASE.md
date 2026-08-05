# Supabase setup — AIMO Tracker

**Consolidated into the Safety Tracker sibling's project as of 01 Aug 2026.**
AIMO Tracker originally had its own independent Supabase project
(`AIMO-Projects-Tracker`, ref `ynyxtdmmrnbxmbycnaqe`) — see "History" below for why
that changed. It now lives in the **same Supabase project as AIMO Safety Tracker**
(`AIMO-SMS-Tracker`), under its own schema, so both apps share one auth pool (same
real people use both apps) without their data mixing.

| What | Value |
|---|---|
| Organization | `wymtqyszjnboblejdsoy` ("Dean") |
| Project name | `AIMO-SMS-Tracker` (shared with the Safety Tracker sibling) |
| Project ref | `kvbmgyupyzegtgbnqktk` |
| Region | `ap-south-1` |
| Project URL | `https://kvbmgyupyzegtgbnqktk.supabase.co` |
| Plan | Free tier ($0/month) |
| AIMO Tracker's schema | `projects` (kept separate from the Safety Tracker's `public` tables) |

**Publishable (anon) key** — safe to embed client-side (RLS enforces security, not
the key's secrecy):
```
sb_publishable_2syo6yqH1QJHsTbGWqo8pw_g42_Vkkg
```
The `service_role` key was never fetched and must never be — per the hard rule in
`docs/reference/safety-tracker-start-here.md`, it's never written to files or
committed.

## Schema
`projects.team_state` — same shape as the original standalone project, added
01 Aug 2026 via migration `add_projects_schema_team_state`:

```sql
create schema if not exists projects;

create table projects.team_state (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
```
- RLS is **on**. Any `authenticated` user can select/insert/update (no per-row
  restriction) — same "shared team workspace" model as the Safety Tracker's own
  `public.team_state`/`public.app_state` tables in this same project.
- Added to the `supabase_realtime` publication.
- **`public.app_state` and `public.team_state` (the Safety Tracker's own tables)
  were not touched** — different schema, different RLS policies, verified
  row-count-unchanged before and after this migration.

**Added 04 Aug 2026** via migration `projects_team_state_updated_at_trigger_and_grants`,
found missing during code review of the client integration (see `CHANGELOG.md` v2.0):
```sql
create or replace function projects.set_team_state_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger team_state_set_updated_at
before update on projects.team_state
for each row execute function projects.set_team_state_updated_at();

grant usage on schema projects to authenticated;
grant select, insert, update on projects.team_state to authenticated;
```
- The trigger is what makes the client's optimistic-concurrency compare-and-swap
  (CAS on `updated_at`) actually work — without it, `updated_at` was INSERT-only
  and the CAS predicate always matched, so pushes silently clobbered each other.
- The grants were simply missing before this — `authenticated` had RLS policies
  but no underlying `GRANT`, so every client query would have 403'd regardless of
  RLS. Verified live: `has_schema_privilege('authenticated','projects','USAGE')`
  now returns `true`, and grants show up in `information_schema.role_table_grants`.

## Shared table — `public.project_registry` (added 06 Aug 2026, v4.0 / Safety V6.0)
The cross-tracker project roster (P16 here, P36 in the sibling repo). One row per
project, **shared by both apps** — unlike `projects.team_state` (this app's blob) and
`public.team_state` (the sibling's blob), which stay separate.

```sql
create table public.project_registry (
  id          text primary key,   -- 'p_1784632308655' — the id both apps already share
  name        text not null,
  program     text,               -- effective program (inherited for sub-projects)
  parent_id   text,               -- parent PROJECT id; null = top-level
  archived    boolean not null default false,
  origin_app  text not null default 'safety' check (origin_app in ('safety','projects')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),   -- server-set via trigger
  updated_by  uuid references auth.users(id)
);
```
Migrations: `create_project_registry`, `project_registry_revoke_truncate`,
`project_registry_harden_id_and_audit`, `projects_team_state_viewer_restrictions`.

**Added by the pre-deploy review (06 Aug 2026):**
- `check (id ~ '^[A-Za-z0-9_-]{1,64}$')` — a registry id becomes a *local project id* in
  both apps, and project ids are interpolated into `onclick`/`id`/`<option>` attributes.
  Without this, one INSERT was stored XSS in both apps. Both clients also reject
  malformed ids on ingest; this is the server-side backstop, not the only line.
- `check` length caps on `name` / `program`.
- `updated_by` is now stamped **server-side** from `auth.uid()` in the BEFORE
  INSERT-OR-UPDATE trigger. It was declared but never populated by either client, so
  every row was unattributable; setting it server-side also means a client can't forge it.
- **`projects.team_state` gained viewer-cannot-write policies.** It previously had
  `using (true)` / `with check (true)` for every authenticated user, and AIMO Tracker has
  no viewer concept in its UI — so an account marked read-only for safety data could
  rewrite the shared roster here, and the next editor's reconcile would publish that to
  the registry, deleting the matching Safety Tracker projects. ⚠️ This policy change is
  **live immediately**, independent of any app deploy: accounts with
  `app_metadata.role = 'viewer'` can no longer write to `projects.team_state`. Editors are
  unaffected (the predicate defaults to `editor` when the claim is absent).

Deliberate choices, each with a reason:
- **It lives in `public`, not a new `shared` schema.** A new schema would need the same
  manual Dashboard → Settings → API step the `projects` schema needed, and would have
  shipped dead until someone clicked it. `public` is already exposed.
- **Grants are applied explicitly** (`grant select, insert, update … to authenticated`).
  RLS alone is not enough — that's exactly what was missing on `projects.team_state` and
  would have 403'd every query.
- **`parent_id` is not a foreign key.** Clients batch-upsert rows in arbitrary order; a
  dangling parent is harmless (rendered top-level), whereas an FK violation would fail
  the whole batch and break roster sync outright.
- **No DELETE policy** — rows archive (`archived = true`), never delete, so a deletion in
  one app can always propagate to the other instead of just vanishing.
- **RLS mirrors `viewers_cannot_*_team_state`** — viewers read, non-viewers write, keyed
  off the same admin-set `app_metadata.role` claim.
- **`TRUNCATE` was revoked** from `authenticated`/`anon`. It bypasses RLS, and Supabase's
  default privileges on `public` grant it to every new table. ⚠️ **`public.team_state` and
  `public.app_state` still carry that same default grant** — not changed here (out of
  scope for this work), and not currently reachable since PostgREST exposes no TRUNCATE
  verb, but worth closing separately.

Only the *roster* is shared. `stageDocs`, `milestones`, `keyDates`, `mocs`, KPIs and
observations are **not** in this table and stay app-owned.

## Exposed schemas
Confirmed working — a signed-out `curl` against `/rest/v1/team_state` with
`Accept-Profile: projects` returns `42501 permission denied for schema projects`
(RLS/grant-denied, the schema resolved correctly) rather than a schema-not-found
error, confirming the `projects` schema is in the exposed-schemas list (Dashboard →
Settings → API → Data API).

Public sign-ups should also be confirmed disabled on this project (shared with the
Safety Tracker's real users) — likely already handled as part of that app's own
setup; re-verify if unsure.

## Client integration — built (v2.0, 04 Aug 2026)
`aimo-tracker.html` now has a Supabase client, email+password auth, and a
whole-blob sync layer targeting `projects.team_state`. Summary (see `CHANGELOG.md`
for the full entry):
- CDN: `@supabase/supabase-js@2.45.4` (UMD, `<script defer>` in `<head>`) — the
  one deliberate exception to this file's "everything inlined" convention.
- Header control `#cloudSyncBtn` (hidden if the CDN didn't load) opens a login
  modal (`#cloudAuthOverlay`); email+password only, invite-only (no self-signup
  UI). Every `sbClient` query goes through `.schema('projects').from('team_state')`.
- Sync payload is one JSON blob: `{projects, governance, kpiSettings}` — the same
  three localStorage keys `downloadSession()` exports, keyed to the single shared
  row `id='default'`.
- Push is hooked off `lsSet()` itself (not the individual save functions), so it
  fires from every write path, including the `?verify=` pop-out's direct `lsSet`
  calls.
- Optimistic concurrency: push is a compare-and-swap on `updated_at`. If another
  session pushed first, the newer row is pulled in and a blocking `alert()` warns
  the user their edit may not have saved — no silent clobbering.
- Local writes always happen before any cloud call, so a network/auth failure
  never risks local data — it only fails to sync (red status dot), degrading to
  the original local-only behavior.
- Not built yet: realtime (the publication is provisioned for a future pass); a
  `visibilitychange` re-pull is the current lightweight substitute for staying
  fresh across tabs/devices without an open connection.

## History
- **01 Aug 2026, initial build:** created `AIMO-Projects-Tracker` as its own
  independent Supabase project, deliberately separate from the Safety Tracker's —
  matched how the two apps had already diverged.
- **01 Aug 2026, later the same day:** hit the Supabase free-tier cap (2 active
  projects; had 3 counting `wealth-tracker`). Trialed migrating off Supabase
  entirely to Cloudflare D1 + Cloudflare Access instead (see `docs/D1-TRIAL.md` —
  kept for the record, including a real gotcha about Access not supporting
  path-scoped protection on bare `workers.dev` domains). Ultimately reconsidered:
  since the same real people use both AIMO Tracker and Safety Tracker, one shared
  Supabase auth pool made more practical sense than either paying for D1/Access
  setup complexity or maintaining two separate user pools for the same team.
  Consolidated `team_state` into `AIMO-SMS-Tracker` under a `projects` schema (this
  document), and paused the now-unused standalone `AIMO-Projects-Tracker` project
  (reversible, not deleted).
