/**
 * KV WRITE BUDGET (client-side meter)
 *
 * Cloudflare's free plan gives the KV namespace 1,000 writes (puts) per day,
 * counted per key write — not per request. One published row costs ~4 puts
 * (bundle, bundle metadata, change log, unit history), a full bundle publish
 * costs a couple more because it also refreshes the rollback copy.
 *
 * Nothing here can bypass the limit (it is enforced by Cloudflare, per account),
 * but knowing where you are stops an editor from discovering it the hard way:
 * the admin panel shows publishes left today, and the reset time is always the
 * next midnight UTC.
 *
 * The counter is a LOCAL ESTIMATE kept in this browser — the worker cannot tell
 * us the account-wide number without spending a read on every request — so it
 * is deliberately labelled as an estimate and never blocks a save.
 */
const STORAGE_KEY = 'apex-kv-writes-v1';

export const KV_DAILY_WRITE_LIMIT = 1000;

/** Conservative cost of one publish, by kind. */
export const WRITE_COST = {
  row: 4,        // staticOverrides + bundleMeta + changeLog + history
  batch: 4,      // + one history per row (capped server-side), reported back
  bundle: 5,     // full publish also refreshes the rollback copy
};

function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function readState() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return { day: utcDayKey(), writes: 0, publishes: 0 };
    if (parsed.day !== utcDayKey()) return { day: utcDayKey(), writes: 0, publishes: 0 };
    return {
      day: parsed.day,
      writes: Number(parsed.writes) || 0,
      publishes: Number(parsed.publishes) || 0,
    };
  } catch {
    return { day: utcDayKey(), writes: 0, publishes: 0 };
  }
}

function writeState(next) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* storage blocked — the meter just stops counting */ }
  return next;
}

/** Record the writes a publish actually cost (pass the worker's `writes` when known). */
export function noteWrites(writes, { publishes = 1 } = {}) {
  const state = readState();
  const cost = Number.isFinite(Number(writes)) && Number(writes) > 0 ? Number(writes) : WRITE_COST.row;
  return writeState({ ...state, writes: state.writes + cost, publishes: state.publishes + publishes });
}

/** When the free allowance comes back: next midnight UTC. */
export function quotaResetAt(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

/** Milliseconds until the reset (never negative). */
export function msUntilReset(now = new Date()) {
  return Math.max(0, quotaResetAt(now).getTime() - now.getTime());
}

/** "3h 12m" / "48m" / "less than a minute" — for banner copy. */
export function formatResetIn(now = new Date()) {
  const ms = msUntilReset(now);
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'less than a minute';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Snapshot for the UI. */
export function quotaState(now = new Date()) {
  const state = readState();
  const used = state.writes;
  const remaining = Math.max(0, KV_DAILY_WRITE_LIMIT - used);
  const percent = Math.min(100, Math.round((used / KV_DAILY_WRITE_LIMIT) * 100));
  return {
    day: state.day,
    used,
    remaining,
    percent,
    publishes: state.publishes,
    limit: KV_DAILY_WRITE_LIMIT,
    level: percent >= 100 ? 'exhausted' : percent >= 80 ? 'warning' : 'ok',
    resetsAt: quotaResetAt(now).toISOString(),
    resetIn: formatResetIn(now),
  };
}

/** True when a publish result was refused because the daily quota is gone. */
export function isQuotaFailure(result) {
  if (!result) return false;
  if (result.code === 'kv_put_quota') return true;
  return /limit exceeded|quota/i.test(String(result.error || ''));
}

export function resetQuotaMeter() {
  return writeState({ day: utcDayKey(), writes: 0, publishes: 0 });
}
