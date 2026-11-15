# How many edits can you make per day — and how to get more for free

Reality check first, because it changes the plan:

> **The Cloudflare KV free limit is 1,000 writes per DAY per ACCOUNT — not per
> worker and not per namespace.** Running two, three or ten workers on the same
> Cloudflare account does **not** give you more writes. It just splits the same
> 1,000 between them. Same for extra KV namespaces: the allowance is account-wide.

So "more workers" is not a lever. These are:

| Lever | What it costs you | Edits per day | Status |
|---|---|---|---|
| **1. Lean writes** (shipped, rev 9) | nothing — already in the worker | ≈ 500 single-row saves | ✅ in `scripts/cloudflare-proxy-worker.js` |
| **2. Batch edits** (already shipped) | nothing — use Spreadsheet Mode | 1 commit per batch, up to 500 rows | ✅ `POST /overrides/batch` |
| **3. Cloudflare D1 instead of KV** | ~15 min one-time setup, free plan | **≈ 100,000** (100× more) | 📋 recipe below |
| 4. R2 bucket as the store | one-time setup | 1M writes / month (≈33k/day) | not implemented |
| 5. Supabase / Postgres | account + table | depends on plan | not implemented |

## 1. What a save costs now (lean writes)

Every admin save rewrites the one shared bundle, so it was costing 3–4 KV puts:

| | before rev 9 | after rev 9 |
|---|---|---|
| bundle (`staticOverrides`) | 1 put | 1 put |
| rollback copy | throttled to 15 min | throttled to 15 min |
| shared change log | 1 put | 1 put |
| per-unit history | 1 put **on every section** | **1 put only for `value`** |
| **typical row edit** | **3–4 puts** | **2–3 puts** |

History is what the trend charts read, and only value rows have charts — so a
wiki / map / crate / material / item save no longer pays for it. The shared
change log still records every single edit, so the audit trail is intact.
Single-row saves now report `writes` in the response, and the worker advertises
the `lean-writes` capability.

**Batch the work instead of saving row by row.** Spreadsheet Mode commits the
whole visible sheet as ONE bundle write + ONE change-log write
(`POST /overrides/batch`), which is how 40 rows used to cost ~200 puts and now
costs ~3.

## 2. The real fix: move the store to Cloudflare D1 (100,000 writes/day free)

KV is the wrong shape for this app anyway: the entire database is one 7.6 MB
value that gets rewritten on every edit. D1 is a real SQL database with a much
larger free allowance.

Free-plan comparison:

| | KV (today) | D1 |
|---|---|---|
| writes / day | 1,000 | **100,000** |
| reads / day | 100,000 | 5,000,000 |
| storage | 1 GB | 5 GB |

### Setup (one time, ~15 minutes, free plan, no card)

Everything here happens in **your** Cloudflare account — I cannot create the
database for you because it needs your login.

```bash
# 0. once per machine
npx wrangler login

# 1. create the database (free plan, no card needed)
npx wrangler d1 create apex-db
#    -> prints database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

2. Bind it to the worker. **Dashboard-first**, because that is how this worker is
   deployed (`wrangler.toml` has its KV block commented out on purpose):
   Workers & Pages -> `apex-db` -> Settings -> Bindings -> Add binding ->
   **D1 database** -> variable name `APEX_D1` -> `apex-db` -> Save.
   Full walkthrough with screenshots-worth of detail: **D1-SETUP.md**.
   CLI route (only if you deploy with `wrangler deploy`) is this, next to the KV
   binding — keep KV, it stays the fallback and still holds uploaded images:

```toml
name = "apex-db"
main = "scripts/cloudflare-proxy-worker.js"
compatibility_date = "2024-11-01"

[[kv_namespaces]]
binding = "APEX_OVERRIDES"
id = "<your existing KV namespace>"

[[d1_databases]]
binding = "APEX_D1"            # the worker feature-detects this binding
database_name = "apex-db"
database_id = "<id printed by step 1>"
```

```bash
# 3. create the tables (schema ships with the project)
npx wrangler d1 execute apex-db --remote --file scripts/d1-schema.sql

# 4. import the current live bundle (one-off)
curl -s https://<your-worker>/overrides > bundle.json
node scripts/kv-to-d1.mjs bundle.json > seed.sql
npx wrangler d1 execute apex-db --remote --file seed.sql

# 5. prove the import
npx wrangler d1 execute apex-db --remote \
  --command "SELECT section, count(*) FROM rows GROUP BY section"
```

Step 5 against the live database today must print exactly:

| section | rows |
|---|---|
| value | 362 |
| wiki | 353 |
| map | 17 |
| crate | 2 |
| material | 1 |
| item | 1 |
| **total** | **736** |

and `SELECT value FROM meta WHERE key='__v'` must show the current bundle
version (503 at the time of writing). That import has been executed against a
real SQLite 3.46 database here: 736 rows, no key mismatches against the bundle,
largest single row 50,815 bytes (the `meteor` wiki row) — well inside D1's 2 MB
row limit, which is why the store is row-per-record and not one big blob.

```bash
# 6. deploy the worker once it uses APEX_D1
npx wrangler deploy
```

### Free-plan hard limits the code has to respect

| Limit | Free | Consequence |
|---|---|---|
| Rows written / day | 100,000 | ~100× KV |
| Rows read / day | 5,000,000 | full bundle ≈ 736 rows, cached per isolate |
| Row / string size | 2 MB | row-per-record (largest row 51 KB) |
| SQL statement length | 100 KB | seed statements peak at 51 KB |
| Bound parameters per query | 100 | writes go 25 rows (100 params) per statement |
| Queries per invocation | **50** | a 500-row batch = 20 statements of 25 rows — fits |
| Storage | 5 GB total / 500 MB per DB | data is ~7.6 MB |

That 50-queries-per-invocation cap is the one that constrains the design: the
batch endpoint cannot fire 500 separate upserts, it must pack 25 rows per
statement.

### What a save costs on D1

One row edit rewrites one row, not a 7.6 MB blob:

| | KV today | D1 |
|---|---|---|
| bundle (`staticOverrides`) | 1 put (whole 7.6 MB) | 1 row update |
| change log | 1 put | 1 row update |
| per-value history | 1 put | 1 row update |
| bundle meta (`__v`) | 1 put | 1 row update |
| **typical row edit** | **2–3 writes** | **3 writes of a 100,000/day budget** |

Reads: a full bundle read is ~736 rows, and the worker caches the bundle per
isolate, so 5,000,000 reads/day is not a real constraint for this app.

### What still has to change in the worker (not shipped yet)

Two things, and I want to be precise about them because "the bundle is on D1"
alone would NOT get you 100,000 writes/day:

1. **The bundle itself.** `readOverridesBundle()` / `writeOverridesBundle()`
   currently read and rewrite one 7.6 MB blob. On D1 they become
   `SELECT section, slug, body FROM rows` and a diff against the bundle that was
   just read, writing only the rows that changed (`INSERT … ON CONFLICT DO
   UPDATE`). `__v`, `timestamp` and `deletedUnits` move to the `meta` table.

2. **Everything else the worker stores** — change log, per-unit history, admin
   password/invite lists, announcements, maintenance flag, bug inbox, team
   roster, OC ranks, exist counts. Those are ~90 call sites, all of which use
   only `get` / `put` / `delete` / `list`. The clean way is one small storage
   facade: with `APEX_D1` bound it maps those calls onto `kv` / `kv_chunk`, so
   every one of them stops charging the KV budget. Without that half, MVPs like
   the change log keep costing 2–3 KV puts per save and you stay at ~500 saves
   a day even after the bundle moves.

So the honest status: **the schema, the import and the numbers above are done
and tested; the worker's storage layer is not written yet.** It is a real
refactor of a 2,940-line worker that your live wiki depends on, and it cannot be
proven end-to-end from here without your actual D1 database. Say the word and I
build it behind `APEX_D1` feature detection (KV stays the fallback, so a bad
deploy can be undone by removing one binding), plus a test harness that runs the
whole worker against a fake D1.

## 3. While you stay on KV

- Publish in batches (Spreadsheet Mode) — 1 commit per sheet.
- The quota meter in the admin sidebar shows estimated publishes left today and
  the UTC reset time.
- If you hit `429 kv_put_quota`, nothing is lost: the edit stays on your device
  and the admin offers a retry after the reset.
