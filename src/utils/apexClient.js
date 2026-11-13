// APEX KV API CLIENT (Cloudflare Workers KV — Supabase-free)
// The single-file Cloudflare Worker (scripts/cloudflare-proxy-worker.js,
// deployed as `apex-db`) is the ONLY backend. Both the Test Realm and the
// production site point at this ONE shared database: an editor publishing a
// value on staging is immediately visible to production visitors.

export const APEX_KV_URL =
  import.meta.env.VITE_APEX_KV_URL ||
  'https://apex-db.apexballtd-admin.workers.dev';

import {
  getAdminCredentials,
  getAdminSessionToken,
  saveAdminSessionToken,
  clearAdminCredentials,
} from './adminSession';

/** Admin auth headers. A short-lived session token is preferred; a scoped,
 *  expiring passcode is only used when the worker has no session support. */
export function getAdminHeaders() {
  const token = getAdminSessionToken();
  if (token) return { 'Content-Type': 'application/json', 'X-Admin-Session': token };
  const { email, passcode } = getAdminCredentials();
  return {
    'Content-Type': 'application/json',
    'X-Admin-Email': email,
    'X-Admin-Passcode': passcode,
  };
}

/** Exchange credentials for a signed session. Returns false on legacy workers. */
export async function requestAdminSession(email, passcode) {
  const response = await fetch(`${APEX_KV_URL}/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Email': String(email || '').trim().toLowerCase(),
      'X-Admin-Passcode': String(passcode || ''),
    },
  }).catch(() => null);
  if (!response || !response.ok) return false;
  try {
    const data = await response.json();
    if (!data?.token) return false;
    saveAdminSessionToken(data.token, data.expiresAt, data.email || email);
    return true;
  } catch { return false; }
}

export function clearAdminAuth() { clearAdminCredentials(); }

/** Tiny (~80 byte) version probe. Lets the app skip a 7.5 MB download on
 *  every sync tick while still landing editor changes within ~60 seconds. */
/** Small automatic exist-count snapshot. The site only calls this when the
 *  consolidated /status poll reports a new existV; a 404 from an old worker
 *  simply means "no data", never a made-up number. */
export async function fetchExistCounts() {
  const response = await fetch(`${APEX_KV_URL}/exist-counts`, { cache: 'no-store' }).catch(() => null);
  if (!response || !response.ok) return null;
  try {
    const data = await response.json();
    return data && typeof data === 'object' && data.counts && typeof data.counts === 'object' ? data : null;
  } catch { return null; }
}

export async function fetchBundleMeta() {
  const response = await fetch(`${APEX_KV_URL}/overrides/version`, { cache: 'no-store' }).catch(() => null);
  if (!response || !response.ok) return null;
  try {
    const data = await response.json();
    return typeof data?.version === 'number' ? { version: data.version, updatedAt: data.updatedAt || null } : null;
  } catch { return null; }
}

/**
 * Fetch the live database bundle (values + WIKI + maps + crates overrides).
 * No cache-busting query: the worker now sends ETag + Cache-Control so the
 * shared edge cache can actually serve it. Returns `{__unchanged:true}` on a
 * 304 so callers keep their current data instead of falling back to a stale
 * baked snapshot.
 */
export async function fetchKvBundle({ cacheBust = false, attempts = 2, timeoutMs = 25000 } = {}) {
  const url = cacheBust ? `${APEX_KV_URL}/overrides?_=${Date.now()}` : `${APEX_KV_URL}/overrides`;
  // Editors MUST send their credentials on the read too. Without them the
  // worker treats the request as public and serves the shared edge cache, so
  // pressing "Refresh" can replace a just-created unit with an older bundle.
  const isAdmin = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin');

  // The bundle is ~7.5 MB. A single short attempt used to give up on slow
  // connections and silently swap the site onto the BAKED snapshot, which is
  // what made the live site show older values than the database. Two attempts
  // with a 25s ceiling (and no retry when the browser is offline) fix that.
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetch(url, {
        ...(isAdmin ? { headers: getAdminHeaders(), cache: 'no-store' } : {}),
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (response.status === 304) return { __unchanged: true };
      if (!response.ok) {
        // 4xx/5xx will not improve on retry.
        return null;
      }
      return await response.json();
    } catch {
      // Network error / timeout: retry once.
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  return null;
}

/** Fetch the ACTIVE global announcements (a list; may be empty). */
export async function fetchActiveAnnouncements() {
  // no-store: a replaced announcement must show up on the next poll.
  // Handles both the new list format ({announcements: [...]}) and the
  // legacy single-object format.
  const response = await fetch(`${APEX_KV_URL}/announcements`, { cache: 'no-store' }).catch(() => null);
  if (!response || !response.ok) return [];
  try {
    const data = await response.json();
    const now = Date.now();
    const alive = (a) => a && a.message && (!a.expiresAt || new Date(a.expiresAt).getTime() > now);
    if (Array.isArray(data?.announcements)) return data.announcements.filter(alive);
    if (data && data.message && alive(data)) return [data]; // legacy worker
    return [];
  } catch {
    return [];
  }
}

/** Fetch the currently active global announcement (legacy helper, first item). */
export async function fetchActiveAnnouncement() {
  const list = await fetchActiveAnnouncements();
  return list[0] || null;
}

/** Remove ONE announcement by id (owner or admin). */
export async function deleteAnnouncement(id) {
  const response = await fetch(`${APEX_KV_URL}/announcements/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  }).catch(() => null);
  return { ok: !!(response && response.ok) };
}

/** Live worker version (for the dashboard's deploy-status chip). */
export async function fetchWorkerVersion() {
  const response = await fetch(`${APEX_KV_URL}/version`, { cache: 'no-store' }).catch(() => null);
  if (!response || !response.ok) return null;
  try {
    const data = await response.json();
    return data?.version || null;
  } catch {
    return null;
  }
}

/** Version + capabilities of the DEPLOYED worker. `capabilities` is empty on
 *  worker builds older than 2026-11-03.1, which is exactly the signal an editor
 *  needs before trusting bulk saves to go out as one commit. Never throws. */
export async function fetchWorkerInfo() {
  const response = await fetch(`${APEX_KV_URL}/version`, { cache: 'no-store' }).catch(() => null);
  if (!response || !response.ok) return { version: null, capabilities: [], reachable: false };
  try {
    const data = await response.json();
    return {
      version: data?.version || null,
      capabilities: Array.isArray(data?.capabilities) ? data.capabilities : [],
      reachable: true,
    };
  } catch {
    return { version: null, capabilities: [], reachable: false };
  }
}

/** Read the maintenance-mode state (public). Never throws. */
export async function fetchMaintenanceStatus() {
  const response = await fetch(`${APEX_KV_URL}/maintenance`, { cache: 'no-store' }).catch(() => null);
  if (!response || !response.ok) return { on: false, message: '', confirmed: false };
  try {
    const data = await response.json();
    if (typeof data?.on !== 'boolean') return { on: false, message: '', confirmed: false };
    return { on: data.on, message: data?.message || '', at: data?.at || null, confirmed: true };
  } catch {
    return { on: false, message: '', confirmed: false };
  }
}

/** Turn maintenance mode on/off (owner or admin). */
export async function setMaintenance(on, message = '') {
  const response = await fetch(`${APEX_KV_URL}/maintenance`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ on: !!on, message }),
  }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  return { ok: !!(response && response.ok), status: response ? response.status : 0, error: data.error };
}

/**
 * Write ONE entry (value|wiki|map|crate) straight to the KV database.
 * Concurrent-safe: no full-bundle overwrite, records history server-side.
 */
/**
 * Cloudflare's free plan allows 1,000 KV writes per day and every save costs
 * several of them. These results therefore carry the extra fields the admin UI
 * needs to react precisely: `code` ('kv_put_quota' when the daily limit is hit),
 * `resetAt` (when the allowance comes back), `writes` (what this call cost) and
 * the plan `limit`. Older workers simply omit them.
 */
function publishResult(response, data) {
  return {
    ok: !!(response && response.ok),
    status: response ? response.status : 0,
    version: data.version,
    error: data.error,
    code: data.code,
    resetAt: data.resetAt,
    writes: data.writes,
    limit: data.limit,
    hint: data.hint,
    rows: data.rows,
    audit: data.audit,
  };
}

export async function pushKvEntry(section, slug, entry) {
  const response = await fetch(`${APEX_KV_URL}/overrides/${section}/${encodeURIComponent(slug)}`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(entry),
  }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  return publishResult(response, data);
}

/**
 * Write MANY rows in one commit — one bundle write + one change-log write
 * instead of a full publish per row. `entries` = [{ section, slug, row }]
 * (use `{ delete: true }` to remove one). Falls back to the per-row endpoint
 * when the deployed worker predates /overrides/batch.
 */
export async function pushBatchToKV(entries) {
  const list = Array.isArray(entries) ? entries.filter((entry) => entry && entry.section && entry.slug) : [];
  if (!list.length) return { ok: true, status: 0, rows: 0, writes: 0, version: undefined };
  const response = await fetch(`${APEX_KV_URL}/overrides/batch`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ entries: list }),
  }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  if (response && response.status === 404) {
    // Legacy worker: do the rows one by one so the edit still lands.
    let version;
    let writes = 0;
    for (const entry of list) {
      const result = entry.delete
        ? await deleteKvEntry(entry.section, entry.slug)
        : await pushKvEntry(entry.section, entry.slug, entry.row);
      if (!result.ok) return { ...result, rows: 0, legacy: true };
      version = result.version ?? version;
      writes += result.writes ?? 4;
    }
    return { ok: true, status: 200, rows: list.length, writes, version, legacy: true };
  }
  return { ...publishResult(response, data), legacy: false };
}

/** Remove ONE entry from the KV database (records history server-side). */
export async function deleteKvEntry(section, slug) {
  const response = await fetch(`${APEX_KV_URL}/overrides/${section}/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  return publishResult(response, data);
}

/** Shared recent-changes feed. Strict callers distinguish an error from an empty feed. */
export async function fetchChangeLog({ strict = false } = {}) {
  try {
    const response = await fetch(`${APEX_KV_URL}/changes`, { headers: getAdminHeaders(), cache: 'no-store' });
    if (!response.ok) throw new Error(`Change feed unavailable (HTTP ${response.status}).`);
    const arr = await response.json();
    if (!Array.isArray(arr)) throw new Error('Change feed returned an invalid response.');
    return arr;
  } catch (error) {
    if (strict) throw error;
    return [];
  }
}

/** Older server audit entries, available to an authenticated admin only. */
export async function fetchArchivedChanges(cursor = null) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const response = await fetch(`${APEX_KV_URL}/changes/archive${query}`, { headers: getAdminHeaders(), cache: 'no-store' });
  if (!response.ok) throw new Error(`Archive unavailable (HTTP ${response.status}).`);
  const page = await response.json();
  if (!Array.isArray(page?.entries) || typeof page.complete !== 'boolean') throw new Error('Archive returned an invalid response.');
  return page;
}

/** Public per-unit edit history (powers the shared value trend graph). */
// 60s in-flight/result cache: hovering a unit card warms its history so the
// detail page's trend graph renders instantly on click.
const unitHistoryCache = new Map();

export function fetchUnitHistory(section, slug) {
  const key = `${section}:${slug}`;
  const cached = unitHistoryCache.get(key);
  if (cached && Date.now() - cached.at < 60000) return cached.promise;
  const promise = (async () => {
    const response = await fetch(`${APEX_KV_URL}/history/${section}/${encodeURIComponent(slug)}`).catch(() => null);
    if (!response || !response.ok) return [];
    try {
      const arr = await response.json();
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  })();
  unitHistoryCache.set(key, { at: Date.now(), promise });
  return promise;
}

/**
 * Log out everywhere: the worker rotates this account's passcode and returns
 * the new one. We store it locally, so every OTHER device's saved login
 * becomes invalid instantly. Requires the updated worker (404 = not deployed).
 */
export async function logoutEverywhere() {
  const response = await fetch(`${APEX_KV_URL}/logout-all`, { method: 'POST', headers: getAdminHeaders() }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  return { ok: !!(response && response.ok), status: response ? response.status : 0, passcode: data.passcode, error: data.error };
}

/** Delete the live announcement for everyone (admin/owner). */
export async function clearActiveAnnouncement() {
  const response = await fetch(`${APEX_KV_URL}/announcements/clear`, { method: 'POST', headers: getAdminHeaders() }).catch(() => null);
  return !!(response && response.ok);
}

/** Site-wide unit deletion registry (any unit, incl. built-ins). */
export async function addDeletedUnit(slug) {
  const response = await fetch(`${APEX_KV_URL}/deletedunits/${encodeURIComponent(slug)}`, { method: 'POST', headers: getAdminHeaders() }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  return { ok: !!(response && response.ok), status: response ? response.status : 0, version: data.version, error: data.error };
}

export async function restoreDeletedUnit(slug) {
  const response = await fetch(`${APEX_KV_URL}/deletedunits/${encodeURIComponent(slug)}`, { method: 'DELETE', headers: getAdminHeaders() }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  return { ok: !!(response && response.ok), status: response ? response.status : 0, version: data.version, error: data.error };
}

/** Undo the last publish (restores worker `backup:previous`). Admin only. */
export async function restoreOverridesBackup() {
  const response = await fetch(`${APEX_KV_URL}/overrides/restore-backup`, {
    method: 'POST',
    headers: getAdminHeaders(),
  }).catch(() => null);
  if (!response || !response.ok) return null;
  try { return await response.json(); } catch { return null; }
}
