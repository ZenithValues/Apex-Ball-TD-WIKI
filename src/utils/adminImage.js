// APEX UNIT / CONTENT IMAGE PREP
//
// Editors pick an image; it is resized + re-encoded in the browser to a compact
// WebP, then stored ONCE under its own KV key (`unitImage:<slug>`) through
// PUT /image/:slug. The database row only keeps a short URL
// (https://<worker>/image/<slug>?v=<upload-time>).
//
// Why this changed (2026-11-13, operator report "changing unit images is STILL
// BUGGED — only saves locally no matter what I try"):
//   • the old flow inlined the whole base64 picture into `staticOverrides`, so
//     the shared bundle had grown to 7.7 MB (6.2 MB of artwork). Every image
//     save rewrote that entire record, every visitor re-downloaded all of it
//     after any edit, and
//   • the editor ALSO cached the same base64 in localStorage — twice (draft +
//     image cache) — so after a few dozen units the 5 MB quota filled up. Every
//     later save silently failed to persist its draft, the publish lost its
//     payload and the edit stayed local. That is the bug.
// One KV key per image fixes all of it: 1 write, tiny rows, no localStorage
// bloat, and the browser caches the picture like any other asset.
import { APEX_KV_URL, getAdminHeaders } from './apexClient';

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read selected image.'));
    };
    image.src = url;
  });
}

/**
 * Resize + re-encode an image file to a compact WebP File object.
 */
export async function prepareUnitImage(file, maxSize = 1024, quality = 0.84) {
  if (!file?.type?.startsWith('image/')) throw new Error('Please choose an image file.');
  const image = await loadImageFromFile(file);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('Could not convert this image to WebP.');
  return new File([blob], `${(file.name || 'unit').replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
}

export async function fileToUnitRenderDataUrl(file, size = 512, quality = 0.9) {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const scale = Math.min(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = (size - width) / 2;
  const y = (size - height) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, x, y, width, height);

  return canvas.toDataURL('image/webp', quality);
}

/** Absolute, cache-busted URL for a stored unit image. */
export function unitImageUrl(slug, rev = null) {
  const stamp = rev || Date.now();
  return `${APEX_KV_URL}/image/${encodeURIComponent(slug)}?v=${stamp}`;
}

export function isInlineImage(value) {
  return typeof value === 'string' && /^data:image\//i.test(value);
}

/**
 * Store a data URL under its own KV key. Returns `{ ok, url, error }`.
 * A caller that gets `ok: false` still has the data URL, so the edit is never
 * lost — but it must SAY so instead of pretending the picture was published.
 */
export async function storeUnitImage(slug, dataUrl) {
  if (!slug || !isInlineImage(dataUrl)) return { ok: false, error: 'Nothing to store.' };
  try {
    const response = await fetch(`${APEX_KV_URL}/image/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { ...getAdminHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    }).catch(() => null);
    if (!response) return { ok: false, error: 'Network error while uploading the image.' };
    if (response.status === 404 || response.status === 405) {
      // Older deployed worker without the image store: keep the inline data URL
      // so the picture still works, and tell the caller why.
      return { ok: false, legacy: true, error: 'This worker predates the image store (needs 2026-11-03.2).' };
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, status: response.status, error: data?.error || `HTTP ${response.status}` };
    return { ok: true, url: unitImageUrl(slug, Date.now()), bytes: data?.bytes || dataUrl.length, writes: data?.writes ?? 1 };
  } catch (error) {
    return { ok: false, error: error?.message || 'Upload failed.' };
  }
}

/**
 * Compress, then store. Returns a short URL on success; on failure returns the
 * data URL (so the preview and the row still work) with `ok: false`.
 */
export async function uploadAndStoreImage(file, slug, { size = 512, quality = 0.86 } = {}) {
  const prepared = await prepareUnitImage(file);
  const dataUrl = await fileToUnitRenderDataUrl(prepared, size, quality);
  const stored = await storeUnitImage(slug, dataUrl);
  if (stored.ok) return { url: stored.url, ok: true, bytes: stored.bytes, writes: stored.writes };
  return { url: dataUrl, ok: false, inline: true, error: stored.error, legacy: Boolean(stored.legacy) };
}

/** Back-compat: the editors just want a URL string. */
export async function uploadUnitImage(file, slug, _session) {
  const result = await uploadAndStoreImage(file, slug);
  return result.url;
}

export async function uploadContentImage(file, _prefix, slug, _session) {
  const result = await uploadAndStoreImage(file, slug);
  return result.url;
}

/**
 * Move a row's inline base64 picture into the image store and return the short
 * URL. Used when an editor saves any row that still carries legacy base64, so
 * the shared bundle shrinks a little on every save instead of growing.
 */
export async function migrateInlineImage(slug, value) {
  if (!slug || !isInlineImage(value)) return { url: value, migrated: false };
  const stored = await storeUnitImage(slug, value);
  if (!stored.ok) return { url: value, migrated: false, error: stored.error };
  return { url: stored.url, migrated: true, writes: stored.writes };
}

/**
 * No-op kept for API compatibility: images live in their own KV keys, which are
 * removed together with the row when a unit is deleted.
 */
export async function removeUnitImages() {
  // nothing to do
}
