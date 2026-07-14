import { useEffect, useMemo, useState } from 'react';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';

function cleanEmpty(value) {
  return value === '' || value === null ? undefined : value;
}

export function rowToWikiCustomUnit(row) {
  if (!row?.slug || !row?.custom_unit) return null;
  const category = cleanEmpty(row.category) || 'Standard';
  return {
    slug: row.slug,
    name: cleanEmpty(row.name) || row.slug,
    rarity: cleanEmpty(row.rarity) || 'Normie',
    type: cleanEmpty(row.type) || 'DPS',
    rawType: cleanEmpty(row.raw_type) || cleanEmpty(row.type) || 'Custom Unit',
    category,
    categories: [category],
    placementLimit: cleanEmpty(row.placement_limit),
    totalCost: cleanEmpty(row.total_cost),
    obtain: Array.isArray(row.obtain) ? row.obtain : [],
    passive: cleanEmpty(row.passive),
    ability: cleanEmpty(row.ability),
    synergy: cleanEmpty(row.synergy),
    minMaxStats: row.min_max_stats && typeof row.min_max_stats === 'object' ? row.min_max_stats : {},
    upgrades: Array.isArray(row.upgrades) ? row.upgrades : [],
    imageUrl: cleanEmpty(row.image_url),
    documented: true,
    unavailableData: false,
    customUnit: true,
    liveWikiOverride: true,
    wikiUpdatedAt: row.updated_at,
  };
}

export function useWikiCustomUnits() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSupabaseConfigured) {
        setRows([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('unit_wiki_overrides')
        .select('*')
        .eq('custom_unit', true)
        .order('rarity', { ascending: true })
        .order('name', { ascending: true });

      if (cancelled) return;
      if (fetchError) {
        setRows([]);
        setError(isMissingTableError(fetchError) ? null : fetchError);
      } else {
        setRows(data || []);
        setError(null);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const customUnits = useMemo(
    () => rows.map(rowToWikiCustomUnit).filter(Boolean),
    [rows]
  );

  return { customUnits, loading, error };
}
