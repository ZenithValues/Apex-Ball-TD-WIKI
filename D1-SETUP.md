# D1: getting the 100,000-writes/day database (and your current data in it)

> **STATUS 2026-11-15:** done. Database `apex-db` created, bound to the worker as
> `APEX_D1` (KV `APEX_OVERRIDES` re-bound alongside it), schema created, and the
> live bundle imported: **736 rows** — value 362, wiki 353, map 17, crate 2,
> material 1, item 1 — plus `meta` with `__v` 503 and
> `deletedUnits ["queenofhearts"]`. The worker still reads/writes KV until the
> storage layer below is switched over.

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

No project folder handy? The schema is four statements, so it can be run
without any file at all (paste line by line):

```powershell
npx wrangler d1 execute apex-db --remote --command "CREATE TABLE IF NOT EXISTS rows (section TEXT NOT NULL, slug TEXT NOT NULL, body TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (section, slug));"
npx wrangler d1 execute apex-db --remote --command "CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);"
npx wrangler d1 execute apex-db --remote --command "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', chunks INTEGER NOT NULL DEFAULT 1);"
npx wrangler d1 execute apex-db --remote --command "CREATE TABLE IF NOT EXISTS kv_chunk (key TEXT NOT NULL, idx INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY (key, idx));"
```

The data file below is the only step that genuinely needs a file path.

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

### Windows: "Unable to read SQL text file"

That error means PowerShell is not inside the project folder — it says nothing
about the table or the database. `--file scripts/d1-schema.sql` is a **relative**
path, and a fresh PowerShell window (especially "Run as administrator") starts in
`C:\WINDOWS\system32`, where there is no `scripts` folder.

```powershell
# see where you are
pwd

# go to the extracted package (the folder that has wrangler.toml + package.json)
cd C:\Users\GUSTAVO-\Downloads\apex-td-project

# prove you are in the right place - this must list wrangler.toml and package.json
dir wrangler.toml, package.json, scripts\d1-schema.sql
```

If `scripts\d1-schema.sql` is not listed, you are either one folder too high (the
zip sometimes extracts to `apex-td-project\apex-td-project`) or you have not
extracted the zip yet. Go **into** the folder that contains `scripts\`.

Absolute paths work from anywhere, so this is the safe fallback:

```powershell
npx wrangler d1 execute apex-db --remote --file "C:\Users\GUSTAVO-\Downloads\apex-td-project\scripts\d1-schema.sql"
```

### Building the seed on Windows (avoid PowerShell redirection)

PowerShell's `>` writes UTF-16, which wrangler then reads as garbage. Use `--out`
and the script writes UTF-8 with no BOM, and it can pull the bundle straight
from the live worker so you never download a 7 MB file by hand:

```powershell
node scripts/kv-to-d1.mjs https://apex-db.apexballtd-admin.workers.dev/overrides --out d1-seed.sql
# wrote d1-seed.sql
#   736 rows + 2 meta rows, bundle __v = 503, 7.39 MB

npx wrangler d1 execute apex-db --remote --file d1-seed.sql
```

The `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` line after the error
is a known Node-on-Windows shutdown glitch — it appears after an error and means
nothing. No wrangler command was run.

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

---

## Incident 2026-11-15 — read this before diagnosing a "missing database"

While binding D1, the live worker answered `503 KV temporarily unavailable` and
`/overrides` served the Nov-8 GitHub fallback, `/health` reported
`provisionedAccounts: 0`, `/login` said `account_not_provisioned` and image URLs
404'd. That looked exactly like a deleted/emptied KV namespace. **It was not.**
The account's KV **read** allowance was exhausted, and the worker treats a
failed read as "key missing" in several paths — so empty-looking reads, missing
credentials and missing images were all one symptom: `429 Too Many Requests`
from KV. Everything came back by itself (`/status` → `"v":534`) once reads
recovered; nothing had been deleted.

Lesson for next time: before restoring anything, check `/status`. If `v` is `0`
**and** `wrangler kv key get` returns `429`, it is the quota, not data loss.
Restoring while reads are capped can overwrite newer data.

## If the worker answers `503 {"error":"KV temporarily unavailable"}`

That message means one thing: the worker is bound to something called
`APEX_OVERRIDES` that **cannot do KV reads** — not that your data is gone. Your
overrides are still in the KV namespace.

Check **Workers & Pages → `apex-db` → Settings → Bindings**. You must see
exactly two:

| Variable name | Type | Points at |
|---|---|---|
| `APEX_OVERRIDES` | **KV Namespace** | your existing KV namespace |
| `APEX_D1` | D1 database | `apex-db` |

The mistake that causes the 503: adding the D1 database under the name
`APEX_OVERRIDES` (or replacing the KV binding with it). D1 objects have no
`.get()`, so every read throws and `/overrides` returns 503, `/status` reports
`"v":0`, and the site silently falls back to its baked snapshot.

Fix: delete the wrong binding, make sure `APEX_OVERRIDES` is a **KV Namespace**
binding, add `APEX_D1` as a **D1 database** binding, then **Deploy**. Verify:

```bash
curl -s https://apex-db.apexballtd-admin.workers.dev/status   # "v": 503, not 0
curl -s https://apex-db.apexballtd-admin.workers.dev/overrides | head -c 60
```

The second command must start with `{"valueOverrides"` / `{"__v":503`, never
`{"error"`.

---

## Storage layer is live on D1 — 2026-11-16 (`2026-11-16.1`)

The worker now reads and writes the database through **D1**, with KV kept as a
mirror and rollback path. Nothing else changed: same routes, same JSON shapes,
same admin panel, same login.

**What the code does now**

| | before | after |
|---|---|---|
| bundle read (`/overrides`, `/status`) | 1 KV read of a 7–14 MB blob | D1 rows in `kv` + `kv_chunk` |
| bundle save | 1 KV write of the whole blob | D1 write of the changed key only |
| small keys (`adminPasswords`, `changeLog`, `maintenance`, images …) | KV | D1, mirrored to KV |
| daily platform allowance | 1,000 writes **and 100,000 reads** | 100,000 writes, 5,000,000 row reads |
| `/health` | `kvBound` | adds `storage:"d1"`, `d1Bound:true`, `d1Stats` |

Values under 1.2 MB live in one `kv` row. Bigger values (the bundle, uploaded
pictures) are split across `kv_chunk` rows and reassembled on read; the `kv` row
carries the chunk count and is written **last inside one atomic batch**, so a
reader can never see half a bundle. If a chunk set is ever torn, the worker
falls back to the KV mirror, re-writes D1 and carries on.

Keys that only exist in KV (everything the old worker wrote: `adminPasswords`,
`changeLog`, `teamRoster`, `unitImage:*` …) are **copied into D1 the first time
they are read**. There is no migration script to run and nothing to re-enter.

**Deploy (one command, from the project folder)**

```bash
npx wrangler deploy
```

`wrangler.toml` already carries both bindings (`APEX_OVERRIDES` KV and
`APEX_D1`), so the storage switch happens with this deploy and nothing else.

**Verify (in this order)**

```bash
curl -s https://apex-db.apexballtd-admin.workers.dev/health
curl -s https://apex-db.apexballtd-admin.workers.dev/status
curl -s https://apex-db.apexballtd-admin.workers.dev/overrides | head -c 80
```

Expected: `/health` → `"version":"2026-11-16.1"`, `"storage":"d1"`,
`"d1Bound":true`, `"kvBound":true`; `/status` → `"v"` unchanged (534 unless you
published since); `/overrides` starts with `{"__v"` (never `{"error"`). Then log
into the admin panel and save one throwaway edit — the response should report
`writes: 2` or similar and the value should reload.

**Rollback (30 seconds, no code)**

Dashboard → Workers & Pages → `apex-db` → Settings → Bindings → delete
**`APEX_D1`** → Deploy. The worker immediately runs KV-only again, and KV has
been kept in sync the whole time, so no edit is lost. Nothing in the D1 database
is deleted by doing this.

**Free-tier maths after the switch**

A save costs ~14 statements (12 bundle chunks + metadata) instead of one KV
write; a browse costs one tiny `kv` read per request thanks to the per-isolate
caches. Both stay far under 100,000 writes / 5,000,000 row reads per day. The
old failure mode — the whole account's 100,000 KV **reads** being consumed by
visitors, which looked exactly like data loss on 2026-11-15 — cannot recur while
`storage` reports `d1`.
