import { useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { getUnitIcon, PROVIDED_UNIT_ICONS } from '../data/unitIcons';
import { loadCachedWikiImages, saveCachedWikiImage } from '../utils/wikiImageCache';

function makeSlugKey(slugs) {
  return [...new Set((slugs || []).filter(Boolean))].sort().join('|');
}

export function useWikiImageOverrides(slugs = []) {
  const { wikiRows, wikiError: error } = useData();
  const slugKey = makeSlugKey(slugs);
  const stableSlugs = useMemo(() => (slugKey ? slugKey.split('|') : []), [slugKey]);

  const imageMap = useMemo(() => {
    const cache = loadCachedWikiImages();
    const requested = stableSlugs.length > 0 ? new Set(stableSlugs) : null;
    const map = {};
    // First apply cached image overrides
    Object.entries(cache).forEach(([slug, url]) => {
      if (url && (!requested || requested.has(slug))) map[slug] = url;
    });
    // Then apply live rows from the KV worker's unit WIKI overrides
    (Array.isArray(wikiRows) ? wikiRows : []).forEach((row) => {
      if (row?.slug && (row.image_url || row.imageUrl) && (!requested || requested.has(row.slug))) {
        map[row.slug] = row.image_url || row.imageUrl;
      }
    });
    // Prefer the newly supplied normal artwork; keep any genuine shiny-specific
    // render and use the normal artwork only as a clearly shared fallback.
    stableSlugs.forEach((slug) => {
      const shiny = slug.startsWith('shiny-');
      const supplied = PROVIDED_UNIT_ICONS[shiny ? slug.slice(6) : slug];
      if (supplied && (!shiny || !map[slug])) map[slug] = getUnitIcon(slug, shiny);
    });
    return map;
  }, [stableSlugs, wikiRows]);

  return { imageMap, error };
}
