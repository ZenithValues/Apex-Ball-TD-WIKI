import { useCallback, useEffect, useMemo, useState } from 'react';
import { UNIT_VALUES as STATIC_UNIT_VALUES, CONSUMABLE_VALUES as STATIC_CONSUMABLE_VALUES } from '../data/values';
import { computeTradeValue } from '../utils/calculator';
import { isSupabaseConfigured, supabase } from '../utils/supabase';

function rowToData(row) {
  if (!row) return null;
  return {
    baseValue: Number(row.base_value ?? 0),
    gems: Number(row.gems ?? 1),
    coins: Number(row.coins ?? 1),
    demand: row.demand || 'Normal',
    scarcity: row.scarcity || 'Standard',
    trend: row.trend || 'stable',
    notes: row.notes || '',
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    liveValue: true,
  };
}

function withLiveValue(entry, rowsBySlug) {
  const live = rowToData(rowsBySlug.get(entry.slug));
  if (!live) return entry;

  const tradeValue = computeTradeValue(live.baseValue, live.demand, live.scarcity);
  return {
    ...entry,
    ...live,
    tradeValue,
    hasValue: true,
  };
}

export function useLiveValues() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('value_entries')
      .select('*')
      .order('updated_at', { ascending: false });

    if (fetchError) {
      setError(fetchError);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const channel = supabase
      .channel('value_entries_live_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'value_entries' }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const rowsBySlug = useMemo(() => new Map(rows.map((row) => [row.slug, row])), [rows]);

  const unitValues = useMemo(
    () => STATIC_UNIT_VALUES.map((entry) => withLiveValue(entry, rowsBySlug)),
    [rowsBySlug]
  );

  const consumableValues = useMemo(
    () => STATIC_CONSUMABLE_VALUES.map((entry) => withLiveValue(entry, rowsBySlug)),
    [rowsBySlug]
  );

  const allValueEntries = useMemo(
    () => [
      ...unitValues.map((entry) => ({ ...entry, kind: 'unit' })),
      ...consumableValues.map((entry) => ({ ...entry, kind: 'item' })),
    ],
    [unitValues, consumableValues]
  );

  const getUnitValueBySlug = useCallback(
    (slug) => unitValues.find((entry) => entry.slug === slug),
    [unitValues]
  );

  const getValueEntryBySlug = useCallback(
    (slug) => allValueEntries.find((entry) => entry.slug === slug),
    [allValueEntries]
  );

  return {
    rows,
    unitValues,
    consumableValues,
    allValueEntries,
    getUnitValueBySlug,
    getValueEntryBySlug,
    loading,
    error,
    refresh,
  };
}
