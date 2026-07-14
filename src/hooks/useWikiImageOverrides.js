import { useEffect, useMemo, useState } from 'react';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';

export function useWikiImageOverrides(slugs = []) {
  const stableSlugs = useMemo(() => [...new Set(slugs.filter(Boolean))], [slugs]);
  const [imageMap, setImageMap] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSupabaseConfigured || stableSlugs.length === 0) {
        setImageMap({});
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
        setImageMap({});
        setError(isMissingTableError(fetchError) ? null : fetchError);
        return;
      }

      setImageMap(Object.fromEntries((data || []).map((row) => [row.slug, row.image_url]).filter(([, url]) => Boolean(url))));
      setError(null);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [stableSlugs]);

  return { imageMap, error };
}
