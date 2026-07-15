import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UNIT_VALUES as STATIC_UNIT_VALUES, CONSUMABLE_VALUES as STATIC_CONSUMABLE_VALUES } from '../data/values';
import { computeTradeValue } from '../utils/calculator';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';
import { useWikiCustomUnits } from '../hooks/useWikiCustomUnits';

const DataContext = createContext(null);

function rowToValueData(row) {
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
  const live = rowToValueData(rowsBySlug.get(entry.slug));
  if (!live) return entry;
  const tradeValue = computeTradeValue(live.baseValue, live.demand, live.scarcity);
  return { ...entry, ...live, tradeValue, hasValue: true };
}

/**
 * Single source of live market data for the whole app.
 *
 * Previously every Values page (list, detail, home, calculator) called
 * useLiveValues() independently — each spinning up its OWN Supabase realtime
 * subscription to value_entries, plus its own fetch of custom units. Navigating
 * the Values section meant N simultaneous subscriptions and N redundant
 * fetches. This provider loads + subscribes ONCE and shares the result, so the
 * whole app reacts to a value edit through a single channel.
 */
export function DataProvider({ children }) {
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
      setRows([]);
      setError(isMissingTableError(fetchError) ? null : fetchError);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ONE realtime subscription for the whole app (was N before).
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

  const { customUnits } = useWikiCustomUnits();
  const rowsBySlug = useMemo(() => new Map(rows.map((row) => [row.slug, row])), [rows]);

  // Custom units participate in values (they show as "no market data yet" until
  // an editor sets one). Merged here so every Values view + the calculator see them.
  const customUnitValueEntries = useMemo(
    () =>
      customUnits.map((unit) => ({
        ...unit,
        baseValue: null,
        gems: null,
        coins: null,
        demand: null,
        scarcity: null,
        trend: null,
        tradeValue: null,
        hasValue: false,
      })),
    [customUnits]
  );

  const unitValues = useMemo(
    () => [
      ...STATIC_UNIT_VALUES.map((entry) => withLiveValue(entry, rowsBySlug)),
      ...customUnitValueEntries.map((entry) => withLiveValue(entry, rowsBySlug)),
    ],
    [rowsBySlug, customUnitValueEntries]
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

  const value = useMemo(
    () => ({
      rows,
      unitValues,
      consumableValues,
      allValueEntries,
      customUnits,
      getUnitValueBySlug,
      getValueEntryBySlug,
      loading,
      error,
      refresh,
    }),
    [rows, unitValues, consumableValues, allValueEntries, customUnits, getUnitValueBySlug, getValueEntryBySlug, loading, error, refresh]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a <DataProvider>');
  }
  return ctx;
}

/** Back-compat shim so existing useLiveValues() callers get the shared data. */
export function useLiveValues() {
  return useData();
}
