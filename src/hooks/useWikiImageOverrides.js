import { useEffect, useMemo, useState } from 'react';
import { loadCachedWikiImages, saveCachedWikiImage } from '../utils/wikiImageCache';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';

export function useWikiImageOverrides(slugs = []) {
  const stableSlugs = useMemo(() => [...new Set(slugs.filter(Boolean))], [slugs]);
  const [imageMap, setImageMap] = useState(() => {
    const cache = loadCachedWikiImages();
    return Object.fromEntries(stableSlugs.map((slug) => [slug, cache[slug]]).filter(([, url]) => Boolean(url)));
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cache = loadCachedWikiImages();
    const cachedMap = Object.fromEntries(stableSlugs.map((slug) => [slug, cache[slug]]).filter(([, url]) => Boolean(url)));
    setImageMap(cachedMap);

    async function load() {
      if (!isSupabaseConfigured || stableSlugs.length === 0) {
        setError(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('unit_wiki_overrides')
        .select('slug, image_url')
        .in('slug', stableSlugs)
        .not('image_url', 'is', null);

      if (cancelled) return;

      if (fetchError) {
        setError(isMissingTableError(fetchError) ? null : fetchError);
        return;
      }

      const liveMap = Object.fromEntries((data || []).map((row) => [row.slug, row.image_url]).filter(([, url]) => Boolean(url)));
      Object.entries(liveMap).forEach(([slug, url]) => saveCachedWikiImage(slug, url));
      setImageMap({ ...cachedMap, ...liveMap });
      setError(null);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [stableSlugs]);

  return { imageMap, error };
}
