import { useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
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
    const requested = new Set(stableSlugs);
    const cachedMap = Object.fromEntries(stableSlugs.map((slug) => [slug, cache[slug]]).filter(([, url]) => Boolean(url)));
    const liveMap = Object.fromEntries(
      wikiRows
        .filter((row) => requested.has(row.slug) && row.image_url)
        .map((row) => [row.slug, row.image_url])
    );
    return { ...cachedMap, ...liveMap };
  }, [stableSlugs, wikiRows]);

  useEffect(() => {
    Object.entries(imageMap).forEach(([slug, url]) => saveCachedWikiImage(slug, url));
  }, [imageMap]);

  return { imageMap, error };
}
