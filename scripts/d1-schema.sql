-- APEX D1 schema (see DEPLOY-LIMITS.md) — one-time setup.
--   npx wrangler d1 execute apex-db --remote --file scripts/d1-schema.sql
--
-- rows: one row per wiki/value record. This is why a single edit costs ONE
--       write instead of rewriting the whole 7.6 MB bundle.
-- meta: __v, timestamp, deletedUnits, bundle metadata — tiny, one row each.
-- kv / kv_chunk: the remaining small keys the worker already uses (change log,
--       per-unit history, admin lists, announcements, bug inbox ...), so they
--       move off the KV 1,000-writes/day budget too. kv_chunk only exists for
--       values that are too big for one D1 row (uploaded images).
CREATE TABLE IF NOT EXISTS rows (
  section    TEXT NOT NULL,
  slug       TEXT NOT NULL,
  body       TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (section, slug)
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kv (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL DEFAULT '',
  chunks INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS kv_chunk (
  key   TEXT NOT NULL,
  idx   INTEGER NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (key, idx)
);
