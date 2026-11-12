// Admin safety & efficiency helpers (backlog batch utilities).
// - fuzzyMatch: typo-tolerant search scoring for the unit picker
// - compressImage: shrink uploads in-browser before they hit the database
// - scorePasscode: strength meter for passcode changes
// - form drafts: autosave/restore unsaved editor forms
// - recent edits: "recently touched" quick-row memory

/** True when every word of `query` matches `text` as a subsequence
 *  (order-preserving, gaps allowed) — "shade d" matches "Shade Demon". */
export function fuzzyMatch(query, text) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const t = String(text || '').toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  return words.every((word) => {
    if (t.includes(word)) return true;
    let i = 0;
    for (const ch of t) {
      if (ch === word[i]) {
        i += 1;
        if (i === word.length) return true;
      }
    }
    return false;
  });
}

/** Downscale an image file in-browser. PNG keeps its format (transparency);
 *  everything else becomes JPEG at `quality`. If compression would not help
 *  (small file / larger output), the original file is returned untouched. */
export function compressImage(file, maxDim = 1280, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        // No downscale needed and already a compressed format → keep original.
        if (scale >= 1 && !['image/png', 'image/webp'].includes(file.type)) {
          resolve(file);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          if (!blob || blob.size >= file.size) resolve(file);
          else resolve(new File([blob], file.name.replace(/\.\w+$/, type === 'image/png' ? '.png' : '.jpg'), { type, lastModified: Date.now() }));
        }, type, quality);
      } catch {
        resolve(file);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/** Passcode strength: 0–5. Weak (< 3) passcodes are rejected client-side. */
export function scorePasscode(pw) {
  const p = String(pw || '');
  let score = 0;
  if (p.length >= 8) score += 1;
  if (p.length >= 12) score += 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1;
  if (/\d/.test(p)) score += 1;
  if (/[^A-Za-z0-9]/.test(p)) score += 1;
  const labels = ['Very weak', 'Very weak', 'Weak', 'Okay', 'Strong', 'Very strong'];
  return { score, label: labels[score] };
}

// Form draft autosave (#11, redesigned 2026-11-11).
// One draft PER SLUG, not one per editor kind: editing unit B no longer
// silently destroys the unsaved draft for unit A. Kept in sessionStorage for
// the active tab AND mirrored to localStorage so an accidental tab close is
// recoverable. Legacy single-draft keys are migrated on read.
const DRAFT_PREFIX = 'apex-formdraft-';
const scopedKey = (kind, slug) => `${DRAFT_PREFIX}${kind}-${slug}`;
const legacyKey = (kind) => `${DRAFT_PREFIX}${kind}`;

function stores() {
  if (typeof window === 'undefined') return [];
  const out = [];
  try { if (window.sessionStorage) out.push(window.sessionStorage); } catch { /* blocked */ }
  try { if (window.localStorage) out.push(window.localStorage); } catch { /* blocked */ }
  return out;
}
function readDraft(store, key) {
  try {
    const raw = store?.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    return draft && draft.slug && draft.form ? draft : null;
  } catch { return null; }
}
function writeDraft(store, key, draft) {
  try { store?.setItem(key, JSON.stringify(draft)); } catch { /* quota / disabled */ }
}
function removeDraft(store, key) {
  try { store?.removeItem(key); } catch { /* ignore */ }
}
function draftKeys(store) {
  try {
    const out = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith(DRAFT_PREFIX)) out.push(key);
    }
    return out;
  } catch { return []; }
}

export function saveFormDraft(kind, slug, form) {
  if (!slug || !form) return;
  const draft = { slug, form, savedAt: Date.now() };
  for (const store of stores()) writeDraft(store, scopedKey(kind, slug), draft);
  // Keep the historical single-draft key working for older admin bundles.
  const legacy = stores().find((store) => {
    try { return store === window?.localStorage; } catch { return false; }
  });
  if (legacy) writeDraft(legacy, legacyKey(kind), draft);
}

export function loadFormDraft(kind, slug = null) {
  const candidates = [];
  if (slug) for (const store of stores()) candidates.push(readDraft(store, scopedKey(kind, slug)));
  for (const store of stores()) candidates.push(readDraft(store, legacyKey(kind)));
  const usable = candidates.filter((d) => d && (!slug || d.slug === slug));
  if (!usable.length) return null;
  return usable.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0];
}

/** All unsaved form drafts, newest first, de-duplicated by kind + slug. */
export function listFormDrafts() {
  const byKey = new Map();
  for (const store of stores()) {
    for (const key of draftKeys(store)) {
      const draft = readDraft(store, key);
      if (!draft) continue;
      const kind = key.slice(DRAFT_PREFIX.length).split('-')[0];
      const id = `${kind}:${draft.slug}`;
      const prev = byKey.get(id);
      if (!prev || (draft.savedAt || 0) > (prev.savedAt || 0)) {
        byKey.set(id, { ...draft, kind });
      }
    }
  }
  return [...byKey.values()].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

export function clearFormDraft(kind, slug = null) {
  const keys = new Set();
  if (slug) keys.add(scopedKey(kind, slug));
  else keys.add(legacyKey(kind));
  for (const store of stores()) {
    for (const key of draftKeys(store)) {
      const rest = key.slice(DRAFT_PREFIX.length);
      if (rest === kind || rest.startsWith(`${kind}-`)) {
        if (!slug || key === scopedKey(kind, slug) || readDraft(store, key)?.slug === slug) keys.add(key);
      }
    }
  }
  for (const store of stores()) for (const key of keys) removeDraft(store, key);
}

// Recently edited units (quick-row)

const RECENT_KEY = 'apex-recent-edits-v1';

export function loadRecentEdits() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function pushRecentEdit(entry) {
  if (!entry?.slug) return;
  try {
    const list = loadRecentEdits().filter((e) => !(e.slug === entry.slug && e.kind === entry.kind));
    list.unshift({ slug: entry.slug, name: entry.name || entry.slug, kind: entry.kind || 'value', at: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  } catch { /* ignore */ }
}
