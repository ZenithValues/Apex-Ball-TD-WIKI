import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UNIT_VALUES as STATIC_UNIT_VALUES, CONSUMABLE_VALUES as STATIC_CONSUMABLE_VALUES } from '../data/values';
import { computeTradeValue } from '../utils/calculator';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';
import { rowToWikiCustomUnit, rowToWikiOverride } from '../utils/wikiOverrides';
import { ALL_MAPS } from '../data/maps';
import { CRATES } from '../data/items';
import { loadLocalValueOverrides, loadLocalWikiOverrides } from '../utils/localOverrides';

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
    liveTag: row.liveTag || 'live',
  };
}

function withLiveValue(entry, rowsBySlug, localOverrides) {
  const local = localOverrides[entry.slug];
  if (local) {
    const tradeValue = computeTradeValue(local.base_value ?? entry.baseValue, local.demand ?? entry.demand, local.scarcity ?? entry.scarcity);
    return {
      ...entry,
      baseValue: Number(local.base_value ?? entry.baseValue),
      gems: Number(local.gems ?? entry.gems),
      coins: Number(local.coins ?? entry.coins),
      demand: local.demand || entry.demand,
      scarcity: local.scarcity || entry.scarcity,
      trend: local.trend || entry.trend,
      notes: local.notes || entry.notes,
      tradeValue,
      hasValue: true,
      isLocalOverride: true,
      liveTag: 'prvw',
    };
  }

  const live = rowToValueData(rowsBySlug.get(entry.slug));
  if (!live) return entry;
  const tradeValue = computeTradeValue(live.baseValue, live.demand, live.scarcity);
  return { ...entry, ...live, tradeValue, hasValue: true, liveTag: 'live' };
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

export function DataProvider({ children }) {
  const [rows, setRows] = useState([]);
  const [wikiRows, setWikiRows] = useState([]);
  const [mapRows, setMapRows] = useState([]);
  const [crateRows, setCrateRows] = useState([]);
  const [localValueOverrides, setLocalValueOverrides] = useState(() => loadLocalValueOverrides());
  const [localWikiOverrides, setLocalWikiOverrides] = useState(() => loadLocalWikiOverrides());

  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [wikiLoading, setWikiLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);
  const [wikiError, setWikiError] = useState(null);

  const syncLocal = useCallback(() => {
    setLocalValueOverrides(loadLocalValueOverrides());
    setLocalWikiOverrides(loadLocalWikiOverrides());
  }, []);

  const refresh = useCallback(async () => {
    syncLocal();
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);
    const { data, fetchError } = await supabase
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
  }, [syncLocal]);

  const refreshWiki = useCallback(async () => {
    syncLocal();
    if (!isSupabaseConfigured) return;
    setWikiLoading(true);
    setWikiError(null);
    const { data, fetchError } = await supabase
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
  }, [syncLocal]);

  const refreshContent = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [maps, crates] = await Promise.all([
      supabase.from('map_wiki_overrides').select('*').order('updated_at', { ascending: false }),
      supabase.from('crate_wiki_overrides').select('*').order('updated_at', { ascending: false }),
    ]);
    if (!maps.error) setMapRows(maps.data || []);
    if (!crates.error) setCrateRows(crates.data || []);
  }, []);

  useEffect(() => {
    refresh();
    refreshWiki();
    refreshContent();
  }, [refresh, refreshWiki, refreshContent]);

  useEffect(() => {
    const onValuesUpdated = () => refresh();
    const onWikiUpdated = () => refreshWiki();
    window.addEventListener('apex-values-updated', onValuesUpdated);
    window.addEventListener('apex-wiki-updated', onWikiUpdated);
    window.addEventListener('storage', syncLocal);

    return () => {
      window.removeEventListener('apex-values-updated', onValuesUpdated);
      window.removeEventListener('apex-wiki-updated', onWikiUpdated);
      window.removeEventListener('storage', syncLocal);
    };
  }, [refresh, refreshWiki, syncLocal]);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'map_wiki_overrides' }, (payload) => setMapRows((current) => applyRealtimeRow(current, payload)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crate_wiki_overrides' }, (payload) => setCrateRows((current) => applyRealtimeRow(current, payload)))
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      ...STATIC_UNIT_VALUES.map((entry) => withLiveValue(entry, rowsBySlug, localValueOverrides)),
      ...customUnitValueEntries.map((entry) => withLiveValue(entry, rowsBySlug, localValueOverrides)),
    ],
    [rowsBySlug, customUnitValueEntries, localValueOverrides]
  );

  const consumableValues = useMemo(
    () => STATIC_CONSUMABLE_VALUES.map((entry) => withLiveValue(entry, rowsBySlug, localValueOverrides)),
    [rowsBySlug, localValueOverrides]
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
    (slug) => {
      const local = localWikiOverrides[slug];
      if (local) {
        return { ...local, isLocalOverride: true, liveTag: 'prvw' };
      }
      return rowToWikiOverride(wikiRowsBySlug.get(slug));
    },
    [wikiRowsBySlug, localWikiOverrides]
  );

  const maps = useMemo(() => ALL_MAPS.map((item) => { const row = mapRows.find((entry) => entry.slug === item.slug); return row ? { ...item, ...row, unlockRequirement: row.unlock_requirement, image: row.image_url, documented: true } : item; }), [mapRows]);
  const crates = useMemo(() => CRATES.map((item) => { const row = crateRows.find((entry) => entry.slug === item.slug); return row ? { ...item, ...row, imageUrl: row.image_url } : item; }), [crateRows]);

  const value = useMemo(
    () => ({
      rows,
      wikiRows,
      mapRows,
      crateRows,
      maps,
      crates,
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
      refreshContent,
    }),
    [
      rows,
      wikiRows,
      mapRows,
      crateRows,
      maps,
      crates,
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
      refreshContent,
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

export function useLiveValues() {
  return useData();
}
