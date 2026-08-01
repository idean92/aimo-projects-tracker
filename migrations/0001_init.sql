-- D1 schema for AIMO-Projects-Tracker, mirroring the Supabase team_state /
-- app_state pattern used by the sibling (Postgres jsonb -> SQLite TEXT; no
-- GIN indexes since there are no in-JSON queries, only whole-blob get/set by
-- key). Applied directly via the Cloudflare MCP `d1_database_query` tool on
-- 2026-08-01; kept here so `wrangler d1 migrations apply` can reproduce this
-- database from scratch (e.g. a new environment, or after a `d1 create`).

CREATE TABLE IF NOT EXISTS team_state (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

-- Per-user blob, mirroring the Safety Tracker sibling's app_state table
-- (Postgres RLS: auth.uid() = user_id). Not used by AIMO Tracker's app yet --
-- this is the D1/Workers equivalent of that per-user pattern, built and
-- tested here first since this project has no live user data, before ever
-- considering it for the Safety Tracker's real migration. See
-- docs/D1-TRIAL.md for how user_id is populated and scoped.
CREATE TABLE IF NOT EXISTS app_state (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
