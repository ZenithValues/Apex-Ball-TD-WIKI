import { useEffect, useState } from 'react';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';

function cleanEmpty(value) {
  return value === '' || value === null ? undefined : value;
}

function rowToOverride(row) {
  if (!row) return null;
  return {
    name: cleanEmpty(row.name),
    rarity: cleanEmpty(row.rarity),
    imageUrl: cleanEmpty(row.image_url),
    description: cleanEmpty(row.description),
    type: cleanEmpty(row.type),
    rawType: cleanEmpty(row.raw_type),
    category: cleanEmpty(row.category),
    placementLimit: cleanEmpty(row.placement_limit),
    totalCost: cleanEmpty(row.total_cost),
    customUnit: row.custom_unit || undefined,
    earlyGameRank: row.early_game_rank ?? undefined,
    lateGameRank: row.late_game_rank ?? undefined,
    obtain: Array.isArray(row.obtain) ? row.obtain : undefined,
    passive: cleanEmpty(row.passive),
    ability: cleanEmpty(row.ability),
    synergy: cleanEmpty(row.synergy),
    minMaxStats: row.min_max_stats && typeof row.min_max_stats === 'object' ? row.min_max_stats : undefined,
    upgrades: Array.isArray(row.upgrades) ? row.upgrades : undefined,
    liveWikiOverride: true,
    wikiUpdatedAt: row.updated_at,
  };
}

export function mergeWikiOverride(unit, override) {
  if (!unit || !override) return unit;
  const cleanOverride = Object.fromEntries(
    Object.entries(override).filter(([, value]) => value !== undefined)
  );
  return { ...unit, ...cleanOverride };
}

export function useWikiUnitOverride(slug) {
  const [override, setOverride] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug && isSupabaseConfigured));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug || !isSupabaseConfigured) {
        setOverride(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('unit_wiki_overrides')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;
      if (fetchError) {
        setError(isMissingTableError(fetchError) ? null : fetchError);
        setOverride(null);
      } else {
        setOverride(rowToOverride(data));
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { override, loading, error };
}
