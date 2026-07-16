import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UNIT_VALUES as STATIC_UNIT_VALUES, CONSUMABLE_VALUES as STATIC_CONSUMABLE_VALUES } from '../data/values';
import { computeTradeValue } from '../utils/calculator';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';
import { rowToWikiCustomUnit, rowToWikiOverride } from '../utils/wikiOverrides';

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

function applyRealtimeRow(rows, payload) {
  const nextRow = payload.new;
  const oldRow = payload.old;
  const slug = nextRow?.slug || oldRow?.slug;
  if (!slug) return rows;

  if (payload.eventType === 'DELETE') {
    return rows.filter((row) => row.slug !== slug);
  }

  if (!nextRow) return rows;
  const exists = rows.some((row) => row.slug === slug);
  const nextRows = exists
    ? rows.map((row) => (row.slug === slug ? nextRow : row))
    : [nextRow, ...rows];

  return nextRows.sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
}

/**
 * Single source of live Values + WIKI data for the whole app.
 *
 * It loads value_entries and unit_wiki_overrides once, then keeps both stores
 * current with ONE Supabase Realtime channel. Realtime payloads are applied
 * directly to local state instead of refetching whole tables on every change.
 */
export function DataProvider({ children }) {
  const [rows, setRows] = useState([]);
  const [wikiRows, setWikiRows] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [wikiLoading, setWikiLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);
  const [wikiError, setWikiError] = useState(null);

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

  const refreshWiki = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setWikiLoading(true);
    setWikiError(null);
    const { data, error: fetchError } = await supabase
      .from('unit_wiki_overrides')
      .select('*')
      .order('updated_at', { ascending: false });
    if (fetchError) {
      setWikiRows([]);
      setWikiError(isMissingTableError(fetchError) ? null : fetchError);
    } else {
      setWikiRows(data || []);
    }
    setWikiLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    refreshWiki();
  }, [refresh, refreshWiki]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const channel = supabase
      .channel('apex_live_data_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'value_entries' }, (payload) => {
        setRows((current) => applyRealtimeRow(current, payload));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unit_wiki_overrides' }, (payload) => {
        setWikiRows((current) => applyRealtimeRow(current, payload));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Resilience: silently revalidate when the tab regains focus or the network
  // comes back online, so admin changes are picked up even if a realtime
  // event was somehow missed — nobody needs to hit refresh.
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const onWake = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        refresh();
        refreshWiki();
      }
    };
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    return () => {
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
    };
  }, [refresh, refreshWiki]);

  const rowsBySlug = useMemo(() => new Map(rows.map((row) => [row.slug, row])), [rows]);
  const wikiRowsBySlug = useMemo(() => new Map(wikiRows.map((row) => [row.slug, row])), [wikiRows]);
  const customUnits = useMemo(() => wikiRows.map(rowToWikiCustomUnit).filter(Boolean), [wikiRows]);

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

  const getWikiOverride = useCallback(
    (slug) => rowToWikiOverride(wikiRowsBySlug.get(slug)),
    [wikiRowsBySlug]
  );

  const value = useMemo(
    () => ({
      rows,
      wikiRows,
      unitValues,
      consumableValues,
      allValueEntries,
      customUnits,
      getUnitValueBySlug,
      getValueEntryBySlug,
      getWikiOverride,
      loading,
      wikiLoading,
      error,
      wikiError,
      refresh,
      refreshWiki,
    }),
    [
      rows,
      wikiRows,
      unitValues,
      consumableValues,
      allValueEntries,
      customUnits,
      getUnitValueBySlug,
      getValueEntryBySlug,
      getWikiOverride,
      loading,
      wikiLoading,
      error,
      wikiError,
      refresh,
      refreshWiki,
    ]
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
