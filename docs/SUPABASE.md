# Supabase setup — AIMO Tracker

Independent Supabase project, separate from the Safety Tracker sibling's
`AIMO-SMS-Tracker` project (same org, different project — no data is shared).

| What | Value |
|---|---|
| Organization | `wymtqyszjnboblejdsoy` ("Dean") — same org as the sibling project |
| Project name | `AIMO-Projects-Tracker` |
| Project ref | `ynyxtdmmrnbxmbycnaqe` |
| Region | `ap-south-1` (matches the sibling, for latency) |
| Project URL | `https://ynyxtdmmrnbxmbycnaqe.supabase.co` |
| Plan | Free tier ($0/month) |

**Publishable (anon) key** — safe to embed client-side (RLS enforces security, not
the key's secrecy):
```
sb_publishable_UZnvxnwP-vmKI4aG8fd7Yg_9UDk0YSR
```
The `service_role` key was never fetched and must never be — per the hard rule in
`docs/reference/safety-tracker-start-here.md`, it's never written to files or
committed.

## Schema
One table, mirroring the sibling's shared-team-sync pattern:

```sql
create table public.team_state (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
```
- RLS is **on**. Any `authenticated` user can select/insert/update (no per-row
  restriction) — this is intentional, matching the sibling's "shared team workspace,
  invite-only" model: the whole point is every signed-in teammate reads/writes the
  same blob. Supabase's advisor flags this as a permissive-policy warning; that's
  expected here, not a bug — see the note below on why it's safe.
- Added to the `supabase_realtime` publication, so connected clients can get live
  updates when a teammate saves (mirrors the sibling's realtime feature).

## ⚠️ Manual step required before this is actually safe to use
**Public sign-ups must be disabled** in this project's Auth settings
(dashboard → Authentication → Settings → toggle off "Allow new users to sign up",
or invite-only mode) — this can't be done via the connected Supabase MCP tools (no
auth-config tool is exposed). Until you do this, *anyone* who signs up gets full
read/write on `team_state`, since the RLS policies only check "authenticated," not
team membership. This mirrors exactly what the sibling project's `DEPLOY_LOG.md`
(cloud-v2) flags: "Needs `supabase-team-setup.sql` + disabled public sign-ups."

## What's NOT built yet
- The app (`aimo-tracker.html`) has no Supabase client code, no `AIMOCloud`-style
  sync adapter, no login UI. The database is ready; the app doesn't talk to it yet.
  Building that is a real feature change and needs the owner's explicit go, per
  `CLAUDE.md`.
- No branch/preview environments set up (Supabase branching exists but wasn't used
  here — single project only).
