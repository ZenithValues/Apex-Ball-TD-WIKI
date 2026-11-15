# D1: getting the 100,000-writes/day database (and your current data in it)

You already did **step 1** (`npx wrangler d1 create apex-db`). This is **step 2**
— the binding — done the way *your* worker is actually deployed, plus the data
transfer.

Nothing here touches the live site. The worker keeps reading KV until it is
switched over, so you can do all of this safely and decide about the switch
later.

---

## Step 2 — bind the database to the worker

The binding name must be exactly **`APEX_D1`** (the worker looks for that name;
`apex-db` is the database name, the binding is the label the code uses).

### Route A — Cloudflare dashboard (this is your setup)

Your `wrangler.toml` has the KV block **commented out on purpose**: this worker
is deployed from the dashboard (Workers & Pages → `apex-db` → Quick edit), so its
bindings live in the dashboard, not in the file. Do the same for D1:

1. Cloudflare dashboard → **Workers & Pages** → **`apex-db`**
2. **Settings** → **Bindings** (older UI: *Settings → Variables* → *Bindings*)
3. **Add binding** → **D1 database**
   - Variable name: `APEX_D1`
   - D1 database: `apex-db`
4. **Save / Deploy**

That is the whole of step 2. If there is no *Add binding* button, you are on the
Overview tab — open **Settings** first, or open the editor (Quick edit → Settings
tab) and add it there.

### Route B — CLI (`wrangler.toml`)

Only if you deploy with `npx wrangler deploy`. Uncomment/add:

```toml
[[d1_databases]]
binding = "APEX_D1"
database_name = "apex-db"
database_id = "<id printed by wrangler d1 create>"
```

then `npx wrangler deploy`. Keep the KV binding in place either way.

> Adding the binding does **not** change any behaviour yet: the worker still
> reads and writes KV because its storage layer does not use `APEX_D1` so far
> (see "What is still missing" at the bottom).

---

## Step 3 — create the tables and load your current data

Run these from the project folder (the one with `wrangler.toml`). `--remote`
means *the real database*, not a local copy.

```bash
# 3a. tables
npx wrangler d1 execute apex-db --remote --file scripts/d1-schema.sql

# 3b. your current data (this file is the live bundle, imported as 736 rows)
npx wrangler d1 execute apex-db --remote --file d1-seed.sql
```

Get `d1-seed.sql` from the handoff folder (7.4 MB, bundle version `__v` = 503).
It is not inside the project zip on purpose — it is your data, not code, and it
goes stale the moment somebody edits the wiki. Any time you want a fresh one:

```bash
curl -s https://apex-db.apexballtd-admin.workers.dev/overrides > bundle.json
node scripts/kv-to-d1.mjs bundle.json > d1-seed.sql
```

The import takes a minute or two and is **safe to re-run** — every statement is
an upsert (`INSERT … ON CONFLICT DO UPDATE`), so running it again just refreshes
the rows.

### Prove it worked

```bash
npx wrangler d1 execute apex-db --remote \
  --command "SELECT section, count(*) FROM rows GROUP BY section"
```

Expected, exactly:

| section | rows |
|---|---|
| value | 362 |
| wiki | 353 |
| map | 17 |
| crate | 2 |
| material | 1 |
| item | 1 |
| **total** | **736** |

```bash
npx wrangler d1 execute apex-db --remote \
  --command "SELECT key, value FROM meta"
```

Expected: `__v` = `503` and `deletedUnits` = `["queenofhearts"]`.

Both were checked here against a real SQLite 3.46 database: 736 rows, every
section's slug set identical to the live bundle, largest single row 50,815 bytes
(`meteor`).

---

## Free-plan limits that shaped this schema

| Limit (Workers Free) | Value | Why it matters here |
|---|---|---|
| Rows written / day | **100,000** | ~100× the KV budget |
| Rows read / day | 5,000,000 | a full bundle read ≈ 736 rows, cached per isolate |
| Storage | 5 GB (500 MB per database) | wiki data is ~7.6 MB |
| Max row / string size | 2 MB | largest row is 51 KB ⇒ row-per-record works |
| Max SQL statement length | 100 KB | seed statements peak at 51 KB |
| Bound parameters per query | 100 | batch writes go 25 rows (100 params) at a time |
| Queries per invocation | 50 | a 500-row batch commit must fit in ≤50 statements — 25-row chunks do |
| Import file size | 5 GB | a 7.4 MB seed is nothing |

Limits reset at 00:00 UTC; when hit, queries fail until reset (no surprise bill).

---

## What is still missing before the site actually uses it

The database is ready and holds your data, but the worker still stores
everything in KV. Two pieces of code have to move:

1. the bundle itself → the `rows` table (one edited row = one row written), and
2. the other ~90 storage calls (change log, per-unit history, admin lists,
   bug inbox, announcements, fan art …) → the `kv` / `kv_chunk` tables, so they
   stop charging the KV budget too.

Until both are done, a save still costs 2–3 KV puts (≈500 saves/day). After
both, a save costs ~3 rows out of 100,000. The refactor is designed to be safe:
it feature-detects `APEX_D1`, keeps KV as the fallback, and undoing it is
"remove one binding and redeploy".

**Keep KV exactly as it is** — it is the source of truth and your rollback until
the switch has proven itself for a few days.
