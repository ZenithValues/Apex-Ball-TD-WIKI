# Deploy the updated shared database worker — REQUIRED, do this first

Both realms (production **and** the Test Realm) read and write the SAME worker:
`https://apex-db.apexballtd-admin.workers.dev`. An editor publishing a value on
the Test Realm bumps `bundleMeta.v`; both sites send ONE tiny `GET /status`
request per minute and pick up the change within ~60 seconds. The frontend
changes in this package are only useful once the worker below is deployed —
**deploy the worker first** (see section 6 for the Moonlight provisioning step).

## 1. Create and bind the KV namespace (critical)

`wrangler.toml` currently has `[[kv_namespaces]]` commented out. Without it the
worker falls back to per-isolate memory and **editor changes are silently lost**
on cold start.

```bash
cd apex-td-final            # or apex-td-project
npx wrangler login
npx wrangler kv namespace create APEX_OVERRIDES
```

Copy the returned `id` into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "APEX_OVERRIDES"
id = "<the id returned by the command above>"
```

If you deploy through the Cloudflare dashboard instead: **Workers & Pages →
apex-db → Settings → Variables → KV Namespace Bindings → Add binding**, variable
name exactly `APEX_OVERRIDES`, select the namespace. Then paste the contents of
`scripts/cloudflare-proxy-worker.js` into the editor and Deploy.

## 2. Set the session secret (strongly recommended)

```bash
npx wrangler secret put APEX_SESSION_SECRET
# paste a long random string, e.g. the output of: openssl rand -hex 32
```

With the secret set, `POST /session` issues an 8-hour HMAC token. The site then
stores only that token in `sessionStorage`; no plaintext passcode stays in the
browser. Tokens are bound to the current passcode hash, so **Logout everywhere**
and **Change password** revoke every other session instantly.

## 3. Deploy

```bash
npx wrangler deploy
```

Or paste the worker file into the dashboard and click Deploy.

## 4. Verify (read-only)

```bash
curl https://apex-db.apexballtd-admin.workers.dev/health
# expect: {"ok":true,"version":"2026-11-02.2","kvBound":true,"sessions":true,"statusEndpoint":true,...}
curl https://apex-db.apexballtd-admin.workers.dev/overrides/version
curl https://apex-db.apexballtd-admin.workers.dev/status
# expect: {"v":…,"maintenance":{"on":false,"confirmed":true},"announcements":[],"workerVersion":"2026-11-02.2",…}
curl https://apex-db.apexballtd-admin.workers.dev/time
curl -I https://apex-db.apexballtd-admin.workers.dev/overrides
# expect: ETag + Cache-Control: public, max-age=60 ...
```

`kvBound:false` → the namespace is not attached. Fix step 1 before letting
editors publish. `version` must match `src/config/workerVersion.js`.

## 5. Rotate editor passcodes

The credentials used for the Test Realm were shared in plain text earlier.
After deploying, have every editor use **Change password** in `/admin`, and
never distribute a passcode over chat again. The old default `apex2026` is
rejected by the worker.

## 6. Provision Moonlight (no passcode in the repository)

`mnlghtapexhelper@gmail.com` is now on the worker and frontend rosters as an
**editor** (Values + WIKI only — no announcements, maintenance or bug-report
admin tools). No credential is baked into the code. Add a strong random
passcode to the existing `adminPasswords` KV map (the same map used by every
other editor) and give it to Moonlight out-of-band:

The safest route is the Cloudflare dashboard: **Workers & Pages → KV →
`APEX_OVERRIDES` → the `adminPasswords` key**, copy the existing JSON map, add
one entry, save.
`"mnlghtapexhelper@gmail.com": "<a fresh random secret>"`

With Wrangler (flag names vary slightly by version; `--namespace-id` also
works):

```bash
npx wrangler kv key get "adminPasswords" --binding APEX_OVERRIDES > /tmp/passwords.json
# edit /tmp/passwords.json and add the entry above
npx wrangler kv key put "adminPasswords" --binding APEX_OVERRIDES --path /tmp/passwords.json
rm /tmp/passwords.json
```

Back up the map first, and never commit it. `POST /logout-all` and **Change
password** rotate entries in this same map; the old `env.KV` binding bug that
made logout-all report success without persisting is fixed. Moonlight can then
sign in from `/admin`.

## What changed in the worker

| Before | After |
|---|---|
| `ACAO: *` + `Allow-Credentials: true` + reflect any header | Exact allowlist of the two GitHub Pages origins, no credentials header, fixed allow-headers |
| Any origin could POST/DELETE | Cross-origin writes from unlisted origins → **403** |
| Full 7.5 MB bundle fetched every 60 s per visitor | `GET /overrides/version` (~80 B) polled; full bundle only when `__v` changes |
| `?_=Date.now()` defeated edge caching | `ETag` + `Cache-Control: public, max-age=60`, `304` support |
| No rollback | `backup:previous` snapshot written on every change |
| Plaintext passcode in `localStorage` forever | 8 h HMAC session in `sessionStorage`, tab-scoped legacy fallback |
| No deployment health check | `GET /health` reports `kvBound` / `sessions` |
| Third-party time APIs | Same-origin `GET /time` |
| Silent KV-binding fallback | `/health` exposes it; this doc makes it a hard prerequisite |
| Three separate 30/60 s client polls (version, maintenance, announcements) | One `GET /status` per visible tab per minute, with ETag/304 and BroadcastChannel tab sharing; legacy workers still fall back to the three original endpoints |
| `GET /overrides` parsed the 7.5 MB JSON on every request just to find `__v`; edge cache was only ever read, never filled | Per-isolate memoized public body keyed by `__v`, cheap version metadata TTL, `cache.put` on the public path, cached credentials (invalidated on rotation) |
| `writeOverridesBundle` re-read the whole 7.5 MB bundle for its backup | Reuses the already-fetched raw value; metadata + rollback written in parallel after the commit |
| `logout-all` wrote to an unbound `env.KV` namespace | Writes to `APEX_OVERRIDES` and invalidates the credential cache; verified by a local mock |
| Baked snapshot had no `__v`, so cold-start version polling reported 0 | `bake-data.mjs` preserves the live `__v`; the packaged snapshot carries it too |
| Moonlight absent; frontend/worker rosters disagreed for Izak and Horren | Moonlight added as `editor`; rosters now match exactly and are guarded by a unit test |

A frontend deployed before this worker will log one harmless `/status` 404 in
the browser console and automatically use the three legacy endpoints. Deploy
the worker first to avoid it.

No destructive write/delete test was executed against the live endpoint.
