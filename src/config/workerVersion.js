// Must match WORKER_VERSION in scripts/cloudflare-proxy-worker.js.
// Bump BOTH together on every worker deploy. The admin dashboard compares
// the live worker's /version against this and warns when a deploy is due.
// rev 8: this had drifted one release behind the worker in the repo, so the
// admin dashboard told the operator "Outdated … deploy pending (2026-11-02.5)"
// while the live worker was actually NEWER (2026-11-03.2). A status line that
// lies in either direction is worse than no status line.
export const EXPECTED_WORKER_VERSION = '2026-11-03.2';
