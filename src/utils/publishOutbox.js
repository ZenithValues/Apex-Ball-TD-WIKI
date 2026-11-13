/**
 * PUBLISH OUTBOX
 *
 * When Cloudflare refuses a write (daily KV quota, offline, worker redeploy)
 * the edit is already safe in this browser, but until now the "Publish now"
 * retry lived only in React state — reload the tab and that intent was gone.
 *
 * The outbox keeps those pending publishes in localStorage so they survive a
 * reload, can be retried in one click, and can be flushed automatically once
 * the quota window rolls over. It never stores secrets: only section, slug and
 * the row/patch that was already written locally.
 */
const STORAGE_KEY = 'apex-publish-outbox-v1';
const MAX_ENTRIES = 500;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function readAll() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch { /* storage blocked: the in-memory queue in AdminHome still works */ }
  return entries;
}

function prune(entries) {
  const cutoff = Date.now() - MAX_AGE_MS;
  return entries.filter((entry) => entry && entry.slug && Number(entry.at || 0) >= cutoff);
}

/** Add (or merge) one pending publish. Same section+slug is merged, newest wins. */
export function enqueuePublish({ section, slug, row = null, patch = null, reason = '' }) {
  if (!section || !slug) return readAll();
  const entries = prune(readAll()).filter((entry) => !(entry.section === section && entry.slug === slug));
  entries.unshift({
    section,
    slug,
    row: row ?? null,
    patch: patch ?? null,
    reason: String(reason || ''),
    at: Date.now(),
  });
  return writeAll(entries);
}

export function listPublishes() {
  const entries = prune(readAll());
  writeAll(entries);
  return entries;
}

export function outboxSize() {
  return listPublishes().length;
}

export function removePublish(section, slug) {
  return writeAll(readAll().filter((entry) => !(entry.section === section && entry.slug === slug)));
}

export function clearOutbox() {
  return writeAll([]);
}

/** Group pending entries into the shape the batch endpoint wants. */
export function asBatchEntries(entries = listPublishes()) {
  return entries
    .filter((entry) => entry.section && entry.slug)
    .map((entry) => ({
      section: entry.section,
      slug: entry.slug,
      row: entry.row ?? entry.patch ?? null,
    }))
    .filter((entry) => entry.row && typeof entry.row === 'object');
}
