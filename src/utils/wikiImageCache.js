const WIKI_IMAGE_CACHE_KEY = 'apex-wiki-image-overrides-v1';
const WIKI_IMAGE_EVENT = 'apex-wiki-image-cache-change';

function emitCacheChange(slug, imageUrl) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WIKI_IMAGE_EVENT, { detail: { slug, imageUrl } }));
}

export function onWikiImageCacheChange(listener) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(WIKI_IMAGE_EVENT, listener);
  return () => window.removeEventListener(WIKI_IMAGE_EVENT, listener);
}

export function loadCachedWikiImages() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WIKI_IMAGE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function getCachedWikiImage(slug) {
  return loadCachedWikiImages()[slug] || null;
}

export function saveCachedWikiImage(slug, imageUrl) {
  if (!slug || !imageUrl || typeof localStorage === 'undefined') return;
  const next = { ...loadCachedWikiImages(), [slug]: imageUrl };
  localStorage.setItem(WIKI_IMAGE_CACHE_KEY, JSON.stringify(next));
  emitCacheChange(slug, imageUrl);
}

export function removeCachedWikiImage(slug) {
  if (!slug || typeof localStorage === 'undefined') return;
  const next = { ...loadCachedWikiImages() };
  delete next[slug];
  localStorage.setItem(WIKI_IMAGE_CACHE_KEY, JSON.stringify(next));
  emitCacheChange(slug, null);
}
