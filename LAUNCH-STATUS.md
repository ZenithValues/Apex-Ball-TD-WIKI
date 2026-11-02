# APEX WIKI & Values — release status (November 2, 2026)

**This is a code package, not a deployment.** Nothing was pushed, no live worker
or KV record was modified, no destructive write/delete test was run against the
shared live endpoint. Production and staging still serve their old builds until
you run `push.cmd`.

**Read `DEPLOY-WORKER.md` FIRST.** The frontend in this package expects worker
`2026-11-02.1`; the live worker is still `2026-10-30.2`. Deploy the worker,
attach the KV namespace and set the session secret before editors publish.

Both ZIPs contain the **same code**. That is intentional: one codebase serves
production at `/` and the Test Realm at `/Apex-Ball-TD-WIKI/`, and both realms
read the same Cloudflare KV namespace. `apex-td-project.zip` pushes to the Test
Realm repo, `apex-td-final.zip` pushes to the production repo. This closes the
16-day drift: production receives the newer staging feature set.

## What was fixed

| Issue | Fix |
|---|---|
| Staging edits not landing on production; 16-day drift | One shared KV bundle + `bundleMeta.v` + `GET /overrides/version`. Both sites poll the ~80-byte version and pull the full bundle only on change (~60 s propagation). `backup:previous` rollback snapshot on every write. Local mock test proves a staging-origin write is visible from the production origin. |
| Worker CORS `*` + credentials, cross-origin writes | Exact two-origin allowlist, fixed allow-headers, 403 on cross-origin writes/preflight from unlisted origins, `nosniff` + `no-referrer`. |
| Plaintext passcode in `localStorage` forever | `sessionStorage`, 8-hour HMAC `/session` token bound to the passcode hash; token rotation/revocation on password change and logout-all; tab-scoped legacy fallback for an un-upgraded worker. Login now prefers `/session` and never stores the passcode when it succeeds. |
| 7.5 MB downloaded every 60 s per visitor; cache-buster defeats edge | Version probe, ETag/`304`, `Cache-Control: public, max-age=60`, no default `?_=Date.now()`; maintenance poll aligned to 60 s. |
| `wrangler.toml` KV binding commented → silent in-memory data loss | Documented as a hard prerequisite, exposed by `GET /health` (`kvBound`). |
| `/terms` 404, missing legal pages | `Terms`, `Privacy`, `Cookies`, `Disclaimer` rewritten with the operator's legal name, private contact, 15-day worldwide SLA, LGPD/ECA Digital/GDPR/UK GDPR/COPPA/US state rights, child-safety, Roblox IP disclaimer and takedown channel. All four are prerendered (`/terms/index.html` etc.) and linked from the footer. |
| No consent control; prod ads loading without consent | First-party `PrivacyChoices` banner with reject/customize/accept, statistics and advertising OFF by default, withdraw anytime. **All ads are OFF on both realms**; `TagError: X/Y` fixed by one slot per placement, one push per node, script-load gating, and a production-only `VITE_ADS_ENABLED` switch. See `ENABLE-ADS.md`. |
| Third-party asset/time/privacy leaks | 13 Supabase unit images self-hosted under `public/images/units/`, URLs rewritten at render and in the baked fallback; fonts already self-hosted; `worldtimeapi.org` / `timeapi.io` replaced by same-origin `GET /time`; `0` third-party hosts contacted in browser tests. |
| Broken animations | `AnimatePresence` makes route exit variants live; scroll-reveal for above-the-fold and on scroll; `--theme-speed` has one writer and never becomes `0.0001`; `data-anim-speed="none"` and OS reduced-motion disable CSS animations globally; lightweight CRT texture restored on mobile/tablet; duplicate `@keyframes apex-pop` renamed; 3D hero no longer excludes ordinary laptops/tablets and logs (rather than hides) WebGL failures. |
| Heavy 404 / unoptimized payloads | 404 slimmed from ~3,000 to 152 DOM nodes; baked JSON minified 8.28 MB → 7.50 MB and localized; `eval()` removed from `bake-data.mjs`; `<AnimatePresence>` route transitions verified. |
| Staging duplicate canonical/sitemap paths, staging indexed | `VITE_SITE_URL` is now origin-only with a defensive strip; verified `https://zenithvalues.github.io/Apex-Ball-TD-WIKI/` (single); staging gets `noindex,nofollow` and `Disallow: /`. |
| Force-push deploy helpers, no CI gates | `git push --force` removed from `push.sh`/`push-test.sh`; new `push.cmd` uses a non-force push; `deploy.yml` now runs lint + tests, disables persisted credentials and passes `VITE_ADS_ENABLED`; new `verify.yml` runs on PRs. |
| Supply chain | `npm audit` **0 vulnerabilities** (was 7/10 advisories, including 2 high + 2 critical dev-only). `react-router-dom` lock bumped to 7.18.5, `vitest` to 4.1.12; 184 tests still pass. |

## Verification performed

| Check | Result |
|---|---|
| `npm test` | 33 files, **184 passed** (includes 7 new tests for session storage and local assets) |
| `npm run lint` | 0 errors; 92 pre-existing warnings |
| `npm audit` (all deps) | **0 vulnerabilities** |
| `npm run build` | success; 760 prerendered pages, all social cards present, `/privacy`, `/terms`, `/cookies`, `/disclaimer` emitted |
| Worker local mock (in-memory KV, no live calls) | **25/25 checks** — CORS, CSRF, sessions, ETag/304, shared-DB propagation, backups, private endpoints, legacy auth |
| Playwright browser (local `dist`) | **29/29 checks** — desktop/mobile/tablet animation parity, reduced motion, animations-off, consent, legal pages, zero ad slots, zero third-party hosts, zero console errors, 404 weight |
| Staging-base build | canonical/sitemap single `/Apex-Ball-TD-WIKI/`, `noindex`, `Disallow: /` |
| JS syntax | `node --check` on worker, `apexClient.js`, `bake-data.mjs`, `prerender-core.mjs`; Vite build compiles all JSX |

Evidence: `/home/user/_audit/browser/build-verify.json`, `/home/user/_audit/browser/probe.json`, `/home/user/APEX-DIAGNOSIS.md` (the original read-only diagnosis).

## Operator actions still required

1. **Deploy the worker** (`DEPLOY-WORKER.md`): create/bind `APEX_OVERRIDES`, set `APEX_SESSION_SECRET` via `wrangler secret put`, deploy, then check `/health` shows `kvBound:true` and `sessions:true`. Back up KV first. Rotate every editor passcode; the Test Realm credentials were shared in plain text.
2. **Push both packages** with `push.cmd` (Test Realm first is a useful smoke test, then production). Each `push.cmd` performs a non-force push. Edit `push-message.txt` if you want a different commit message.
3. **Verify**: live `/version` = `2026-11-02.1`, production `/terms` = 200, one value edited on the Test Realm appears on production within ~60 s, no `TagError`, no ad requests.
4. **Legal review**: the pages are technical preparation, not legal advice. Have the operator's parent/guardian review the operator identity, the 15-day SLA, the child-safety statements and the retention wording before publication. No postal address is published; `gustavo.romao.borges0@gmail.com` is the published privacy/takedown channel; `gustavo.rb1410@gmail.com` remains the admin/owner address.
5. **AdSense** (`ENABLE-ADS.md`): apply **after** this deploy. Google requires the account holder to be 18+, so a parent/guardian must own the account and payments. A Google-certified CMP and real per-placement ad-unit IDs are required before `VITE_ADS_ENABLED=true`. Ads stay OFF meanwhile; `ads.txt` is inert.
6. **Staging confidentiality**: `AccessGate` is a client-side UI gate. GitHub Pages static files remain directly fetchable by anonymous visitors. For genuine team-only staging, use Cloudflare Access on a protected origin or private hosting. This is a hosting limitation, not a code bug.

## Deliberate limitations / open decisions

- Ads are OFF by default in production until approval + CMP. The one-variable switch is documented; no code change is needed to turn them on.
- The KV version check is best-effort and not an atomic compare-and-swap; concurrent editor writes can still race. A Durable Object would be required for strict transactional integrity. Backup snapshots are best-effort too.
- Worker rate limiting is per-isolate (in-memory), not distributed.
- No certified CMP or verified parental-consent flow is bundled. The zero-personal-data architecture is what makes ordinary browsing safe for children; that claim depends on keeping ads, analytics and third-party assets off.
- No legal counsel was engaged. This document and the site copy are engineering work, not a compliance certification.
