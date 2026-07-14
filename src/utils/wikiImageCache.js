const WIKI_IMAGE_CACHE_KEY = 'apex-wiki-image-overrides-v1';

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
}

export function removeCachedWikiImage(slug) {
  if (!slug || typeof localStorage === 'undefined') return;
  const next = { ...loadCachedWikiImages() };
  delete next[slug];
  localStorage.setItem(WIKI_IMAGE_CACHE_KEY, JSON.stringify(next));
}
