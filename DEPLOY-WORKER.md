# Deploy the updated shared database worker — REQUIRED, do this first

Both realms (production **and** the Test Realm) read and write the SAME worker:
`https://apex-db.apexballtd-admin.workers.dev`. An editor publishing a value on
the Test Realm bumps `bundleMeta.v`; both sites poll that tiny version and pick
up the change within ~60 seconds. The frontend changes in this package are
only useful once the worker below is deployed.

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
# expect: {"ok":true,"version":"2026-11-02.1","kvBound":true,"sessions":true,...}
curl https://apex-db.apexballtd-admin.workers.dev/overrides/version
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

No destructive write/delete test was executed against the live endpoint.
