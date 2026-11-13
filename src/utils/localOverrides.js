// Local draft storage — the editor's safety net.
//
// NEVER put picture bytes in here (2026-11-13). The browser gives a site ~5 MB
// of localStorage; one 512px unit render is ~19 KB of base64 and the old code
// stored each one twice (draft + image cache). After a few dozen units every
// `setItem` threw QuotaExceededError, the throw was swallowed, the draft
// disappeared, and the publish that read the draft back had nothing to send.
// From the outside that looked exactly like "the new unit image only saves
// locally, no matter what I try".
//
// Now: inline `data:image/...` values are stripped before writing (the picture
// lives in its own KV key and the row keeps a short URL), a full store is
// pruned and retried instead of dropping the edit, and every writer returns
// whether it really persisted so the admin panel can tell the truth.

const INLINE_IMAGE = /^data:image\//i;

/** Recursively drop inline base64 images (undefined = "leave this out"). */
export function withoutInlineImages(value) {
  if (typeof value === 'string') return INLINE_IMAGE.test(value) ? undefined : value;
  if (Array.isArray(value)) {
    return value.map((item) => {
      const next = withoutInlineImages(item);
      return next === undefined ? null : next;
    });
  }
  if (value && typeof value === 'object') {
    const out = {};
    Object.entries(value).forEach(([key, item]) => {
      const next = withoutInlineImages(item);
      if (next !== undefined) out[key] = next;
    });
    return out;
  }
  return value;
}

/** Approximate localStorage usage for this origin, in characters. */
export function localStorageUsed() {
  if (typeof localStorage === 'undefined') return 0;
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) || '';
      total += key.length + (localStorage.getItem(key)?.length || 0);
    }
  } catch { /* ignore */ }
  return total;
}

const REGENERABLE_KEYS = [
  'apex-wiki-image-overrides-v1',
  'apex-values-cache-v1',
  'apex-wiki-cache-v1',
  'apex-maps-cache-v1',
  'apex-crates-cache-v1',
];

/** Drop caches that can be rebuilt from the database at any time. */
export function pruneRegenerableStorage(exceptKey = null) {
  if (typeof localStorage === 'undefined') return [];
  const removed = [];
  for (const key of REGENERABLE_KEYS) {
    if (key === exceptKey) continue;
    try {
      if (localStorage.getItem(key) != null) { localStorage.removeItem(key); removed.push(key); }
    } catch { /* ignore */ }
  }
  if (removed.length) console.info(`[APEX Storage] Freed space by dropping ${removed.join(', ')}.`);
  return removed;
}

/**
 * Quota-safe JSON write. Returns true ONLY when the value is really persisted.
 * `value` has its inline images stripped first.
 */
export function writeLocalJson(key, value) {
  if (typeof localStorage === 'undefined') return false;
  const payload = JSON.stringify(withoutInlineImages(value) ?? {});
  try {
    localStorage.setItem(key, payload);
    return true;
  } catch {
    pruneRegenerableStorage(key);
    try {
      localStorage.setItem(key, payload);
      return true;
    } catch {
      // Keep the newest half of the table rather than losing everything.
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const entries = Object.entries(value);
        for (let keep = Math.max(1, Math.floor(entries.length / 2)); keep >= 1; keep = Math.floor(keep / 2)) {
          try {
            localStorage.setItem(key, JSON.stringify(withoutInlineImages(Object.fromEntries(entries.slice(-keep)))));
            console.warn(`[APEX Storage] Device storage was full — kept the newest ${keep} draft(s) in "${key}".`);
            return true;
          } catch { /* keep shrinking */ }
        }
      }
      console.warn(`[APEX Storage] Could not cache "${key}" on this device (storage full). Publishing still works.`);
      return false;
    }
  }
}

/** Storage health for the admin panel. */
export function storageHealth() {
  const used = localStorageUsed();
  const limit = 4 * 1024 * 1024;
  return { used, limit, percent: Math.min(100, Math.round((used / limit) * 100)), full: used > limit * 0.9 };
}

export const LOCAL_VALUE_OVERRIDES_KEY = 'apex-local-value-overrides-v1';
export const LOCAL_VALUE_CHANGE_LOG_KEY = 'apex-local-value-change-log-v1';
export const LOCAL_WIKI_OVERRIDES_KEY = 'apex-local-wiki-overrides-v1';

export function loadLocalValueOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_VALUE_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalValueOverrides(overrides) {
  return writeLocalJson(LOCAL_VALUE_OVERRIDES_KEY, overrides || {});
}

export function setLocalValueOverride(slug, override) {
  if (!slug) return;
  const current = loadLocalValueOverrides();
  if (override === null) {
    delete current[slug];
  } else {
    current[slug] = override;
  }
  const saved = saveLocalValueOverrides(current);
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('apex-values-updated'));
    }, 0);
  }
  return saved;
}

export function loadLocalWikiOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_WIKI_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalWikiOverrides(overrides) {
  return writeLocalJson(LOCAL_WIKI_OVERRIDES_KEY, overrides || {});
}

export function setLocalWikiOverride(slug, override) {
  if (!slug) return;
  const current = loadLocalWikiOverrides();
  if (override === null) {
    delete current[slug];
  } else {
    current[slug] = override;
  }
  const saved = saveLocalWikiOverrides(current);
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('apex-wiki-updated'));
    }, 0);
  }
  return saved;
}

export function loadLocalValueChangeLog() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_VALUE_CHANGE_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalValueChangeLog(log) {
  return writeLocalJson(LOCAL_VALUE_CHANGE_LOG_KEY, log || {});
}

export const LOCAL_MAP_OVERRIDES_KEY = 'apex-local-map-overrides-v1';
export const LOCAL_CRATE_OVERRIDES_KEY = 'apex-local-crate-overrides-v1';

export function loadLocalMapOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_MAP_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalMapOverrides(overrides) {
  return writeLocalJson(LOCAL_MAP_OVERRIDES_KEY, overrides || {});
}

export function setLocalMapOverride(slug, override) {
  if (!slug) return;
  const current = loadLocalMapOverrides();
  if (override === null) {
    delete current[slug];
  } else {
    current[slug] = override;
  }
  const saved = saveLocalMapOverrides(current);
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('apex-maps-updated'));
    }, 0);
  }
  return saved;
}

export function loadLocalCrateOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_CRATE_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalCrateOverrides(overrides) {
  return writeLocalJson(LOCAL_CRATE_OVERRIDES_KEY, overrides || {});
}

export function setLocalCrateOverride(slug, override) {
  if (!slug) return;
  const current = loadLocalCrateOverrides();
  if (override === null) {
    delete current[slug];
  } else {
    current[slug] = override;
  }
  const saved = saveLocalCrateOverrides(current);
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('apex-crates-updated'));
    }, 0);
  }
  return saved;
}

// Override tombstones (reset/delete queue)
export const LOCAL_DELETED_OVERRIDES_KEY = 'apex-local-overrides-deleted-v1';

export function loadLocalDeletedOverrides() {
  const fallback = { value: [], wiki: [], map: [], crate: [] };
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_OVERRIDES_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        value: Array.isArray(parsed.value) ? parsed.value : [],
        wiki: Array.isArray(parsed.wiki) ? parsed.wiki : [],
        map: Array.isArray(parsed.map) ? parsed.map : [],
        crate: Array.isArray(parsed.crate) ? parsed.crate : [],
      };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalDeletedOverrides(deleted) {
  return writeLocalJson(LOCAL_DELETED_OVERRIDES_KEY, deleted || {});
}

export function unmarkLocalOverrideDeleted(kind, slug) {
  try {
    const deleted = loadLocalDeletedOverrides() || { value: [], wiki: [], map: [], crate: [] };
    if (Array.isArray(deleted[kind]) && deleted[kind].includes(slug)) {
      deleted[kind] = deleted[kind].filter((s) => s !== slug);
      saveLocalDeletedOverrides(deleted);
      window.dispatchEvent(new CustomEvent(`apex-${kind === 'value' ? 'values' : kind === 'wiki' ? 'wiki' : kind === 'map' ? 'maps' : 'crates'}-updated`));
    }
  } catch { /* ignore */ }
}

export function markLocalOverrideDeleted(kind, slug) {
  if (!slug || !kind) return;
  const current = loadLocalDeletedOverrides();
  if (current[kind]) {
    if (!current[kind].includes(slug)) {
      current[kind].push(slug);
    }
    saveLocalDeletedOverrides(current);
  }
}

export function clearLocalDeletedOverrides() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_DELETED_OVERRIDES_KEY);
  } catch {
    // Ignore
  }
}

// Site-wide deleted units (any unit, incl. built-ins)
// A deleted unit disappears from Values, WIKI, search, counts — everywhere —
// until restored. Local copy = instant effect + offline; the KV registry
// (bundle.deletedUnits) makes it global.
const DELETED_UNITS_KEY = 'apex-deleted-units-v1';

export function loadLocalDeletedUnits() {
  try {
    const raw = localStorage.getItem(DELETED_UNITS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function markLocalUnitDeleted(slug) {
  if (!slug) return;
  try {
    const list = loadLocalDeletedUnits();
    if (!list.includes(slug)) {
      list.push(slug);
      localStorage.setItem(DELETED_UNITS_KEY, JSON.stringify(list));
    }
    window.dispatchEvent(new CustomEvent('apex-deleted-units-updated'));
  } catch { /* ignore */ }
}

export function unmarkLocalUnitDeleted(slug) {
  if (!slug) return;
  try {
    const list = loadLocalDeletedUnits().filter((s) => s !== slug);
    localStorage.setItem(DELETED_UNITS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('apex-deleted-units-updated'));
  } catch { /* ignore */ }
}

// MATERIALS — a completely separate system. Materials are NOT units: no shiny
// variants, no unit pipeline, no wiki overrides. They have their own local
// lane here and their own KV section ('materials') on the worker.
export const LOCAL_MATERIAL_OVERRIDES_KEY = 'apex-local-material-overrides-v1';

export function loadLocalMaterialOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_MATERIAL_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalMaterialOverrides(overrides) {
  return writeLocalJson(LOCAL_MATERIAL_OVERRIDES_KEY, overrides || {});
}

export function setLocalMaterialOverride(slug, override) {
  if (!slug) return;
  const current = loadLocalMaterialOverrides();
  if (override === null) {
    delete current[slug];
  } else {
    current[slug] = override;
  }
  const saved = saveLocalMaterialOverrides(current);
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('apex-materials-updated'));
    }, 0);
  }
  return saved;
}
