// Public unit artwork used to be served from a third-party Supabase bucket.
// Self-hosting removes an unnecessary cross-origin request (and the visitor IP
// disclosure that comes with it) without changing any editor-facing URL: old
// URLs stored in KV/localStorage are rewritten at render time.

const SUPABASE_PREFIX = 'https://rfeoicbcprziqlcmbjgi.supabase.co/storage/v1/object/public/';

export function localImageName(url) {
  const rest = String(url).slice(SUPABASE_PREFIX.length).split('?')[0];
  const safe = rest.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return safe.slice(-160);
}

const JUNK_IMAGE_VALUES = new Set(['none', 'null', 'undefined', 'nan', 'false', '-']);

/**
 * Some rows were saved with the literal text "None" (or "null") in the image
 * field — 7 unit rows in the live database have exactly that. Rendering those as
 * `src="None"` gives a broken-image icon on the card, which reads as "the image
 * is gone". Anything that is not a usable URL/path/data URI becomes null so the
 * card falls back to its initial-letter tile instead.
 */
export function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || JUNK_IMAGE_VALUES.has(trimmed.toLowerCase())) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('/') || trimmed.startsWith('http') || trimmed.startsWith('blob:')) return trimmed;
  // A bare word like "None.png" is fine; a bare word with no dot is not an image.
  return trimmed.includes('.') ? trimmed : null;
}

export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.startsWith(SUPABASE_PREFIX)) return url;
  const base = import.meta.env?.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}images/units/${localImageName(url)}`;
}
