import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { UNIT_VALUES as STATIC_UNIT_VALUES, CONSUMABLE_VALUES as STATIC_CONSUMABLE_VALUES } from '../data/values';
import { computeTradeValue } from '../utils/calculator';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';
import { rowToWikiCustomUnit, rowToWikiOverride } from '../utils/wikiOverrides';
import { loadLocalValueOverrides, loadLocalWikiOverrides } from '../utils/localOverrides';
import { ALL_MAPS } from '../data/maps';
import { CRATES } from '../data/items';

const DataContext = createContext(null);

function rowToValueData(row) {
  if (!row) return null;
  return {
    baseValue: Number(row.base_value ?? row.baseValue ?? 0),
    gems: Number(row.gems ?? 1),
    coins: Number(row.coins ?? 1),
    demand: row.demand || 'Normal',
    scarcity: row.scarcity || 'Standard',
    trend: row.trend || 'stable',
    notes: row.notes || '',
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    updatedBy: row.updated_by || row.updatedBy,
    liveValue: true,
  };
}

function withLiveValue(entry, rowsBySlug, localValueOverrides = {}) {
  const dbRow = rowsBySlug.get(entry.slug);
  const localOver = localValueOverrides?.[entry.slug];
  if (!dbRow && !localOver) return entry;

  const live = rowToValueData(localOver ? { ...(dbRow || {}), ...localOver } : dbRow);
  if (!live) return entry;
  const tradeValue = computeTradeValue(live.baseValue, live.demand, live.scarcity);
  const isPrvw = Boolean(localOver || live.isPrvw);
  return { ...entry, ...live, tradeValue, hasValue: true, isPrvw, prvw: isPrvw, livePrvwOverride: isPrvw };
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
  const [mapRows, setMapRows] = useState([]);
  const [crateRows, setCrateRows] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [wikiLoading, setWikiLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);
  const [wikiError, setWikiError] = useState(null);
  const [localValueOverrides, setLocalValueOverrides] = useState(() => loadLocalValueOverrides());
  const [localWikiOverrides, setLocalWikiOverrides] = useState(() => loadLocalWikiOverrides());

  useEffect(() => {
    const onValues = () => setLocalValueOverrides(loadLocalValueOverrides());
    const onWiki = () => setLocalWikiOverrides(loadLocalWikiOverrides());
    window.addEventListener('apex-values-updated', onValues);
    window.addEventListener('apex-wiki-updated', onWiki);
    return () => {
      window.removeEventListener('apex-values-updated', onValues);
      window.removeEventListener('apex-wiki-updated', onWiki);
    };
  }, []);

  const lastFetchRef = useRef({ values: 0, wiki: 0, content: 0 });
  const inFlightRef = useRef({ values: false, wiki: false, content: false });
  const channelJoinedRef = useRef(false);

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!isSupabaseConfigured) return;
    const now = Date.now();
    if (!force && (inFlightRef.current.values || now - lastFetchRef.current.values < 30000)) return;
    inFlightRef.current.values = true;
    lastFetchRef.current.values = now;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('value_entries')
      .select('*')
      .order('updated_at', { ascending: false });
    inFlightRef.current.values = false;
    if (fetchError) {
      setRows([]);
      setError(isMissingTableError(fetchError) ? null : fetchError);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, []);

  const refreshWiki = useCallback(async ({ force = false } = {}) => {
    if (!isSupabaseConfigured) return;
    const now = Date.now();
    if (!force && (inFlightRef.current.wiki || now - lastFetchRef.current.wiki < 30000)) return;
    inFlightRef.current.wiki = true;
    lastFetchRef.current.wiki = now;
    setWikiLoading(true);
    setWikiError(null);
    const { data, error: fetchError } = await supabase
      .from('unit_wiki_overrides')
      .select('*')
      .order('updated_at', { ascending: false });
    inFlightRef.current.wiki = false;
    if (fetchError) {
      setWikiRows([]);
      setWikiError(isMissingTableError(fetchError) ? null : fetchError);
    } else {
      setWikiRows(data || []);
    }
    setWikiLoading(false);
  }, []);

  const refreshContent = useCallback(async ({ force = false } = {}) => {
    if (!isSupabaseConfigured) return;
    const now = Date.now();
    if (!force && (inFlightRef.current.content || now - lastFetchRef.current.content < 30000)) return;
    inFlightRef.current.content = true;
    lastFetchRef.current.content = now;
    const [maps, crates] = await Promise.all([
      supabase.from('map_wiki_overrides').select('*').order('updated_at', { ascending: false }),
      supabase.from('crate_wiki_overrides').select('*').order('updated_at', { ascending: false }),
    ]);
    inFlightRef.current.content = false;
    if (!maps.error) setMapRows(maps.data || []);
    if (!crates.error) setCrateRows(crates.data || []);
  }, []);

  useEffect(() => {
    refresh({ force: true });
    refreshWiki({ force: true });
    refreshContent({ force: true });
  }, [refresh, refreshWiki, refreshContent]);

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
      .subscribe((status) => {
        channelJoinedRef.current = status === 'SUBSCRIBED';
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Resilience & Egress Debloat: only revalidate on window focus if we have NOT
  // fetched in the last 15 minutes OR if our websocket channel is disconnected!
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const onWake = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        const now = Date.now();
        if (!channelJoinedRef.current || now - lastFetchRef.current.values > 15 * 60 * 1000) {
          refresh({ force: true });
          refreshWiki({ force: true });
          refreshContent({ force: true });
        }
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
  }, [refresh, refreshWiki, refreshContent]);

  const rowsBySlug = useMemo(() => new Map(rows.map((row) => [row.slug, row])), [rows]);
  const wikiRowsBySlug = useMemo(() => new Map(wikiRows.map((row) => [row.slug, row])), [wikiRows]);
  const customUnits = useMemo(() => {
    const list = wikiRows.map((row) => {
      const localOver = localWikiOverrides?.[row.slug];
      const item = rowToWikiCustomUnit(localOver ? { ...row, ...localOver } : row);
      if (item && localOver) {
        item.isPrvw = true;
        item.prvw = true;
        item.livePrvwOverride = true;
      }
      return item;
    }).filter(Boolean);
    Object.entries(localWikiOverrides || {}).forEach(([slug, over]) => {
      if ((over.customUnit || over.custom_unit) && !list.some((u) => u.slug === slug)) {
        const item = rowToWikiCustomUnit({ slug, ...over, custom_unit: true });
        if (item) {
          item.isPrvw = true;
          item.prvw = true;
          item.livePrvwOverride = true;
          list.push(item);
        }
      }
    });
    return list;
  }, [wikiRows, localWikiOverrides]);

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
      const dbOver = rowToWikiOverride(wikiRowsBySlug.get(slug));
      const localOver = localWikiOverrides?.[slug];
      if (!localOver) return dbOver;
      return { ...dbOver, ...localOver, isPrvw: true, prvw: true, livePrvwOverride: true };
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

/** Back-compat shim so existing useLiveValues() callers get the shared data. */
export function useLiveValues() {
  return useData();
}
