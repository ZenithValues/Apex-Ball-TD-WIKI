import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isOfflineValuesMode, setOfflineValuesMode, isBrowserOnline, OFFLINE_VALUES_EVENT } from '../utils/offlineValues';
import { UNIT_VALUES as STATIC_UNIT_VALUES, CONSUMABLE_VALUES as STATIC_CONSUMABLE_VALUES } from '../data/values';
import { ALL_UNITS, createShinyUnit } from '../data/units';
import { isSpecialBaseValue } from '../utils/adminForms';
import { withUnitDisplayName } from '../utils/unitNames';
import { publicDisplayName } from '../utils/publicName';
import { computeTradeValue } from '../utils/calculator';
import { APEX_KV_URL, fetchKvBundle, fetchBundleMeta } from '../utils/apexClient';
import { startLiveStatus, ensureLiveStatus, subscribeLiveStatus, refreshLiveStatus } from '../utils/liveStatus';

// Cross-tab live sync: one tab's poll refreshes every open tab.
let liveChannel = null;
function apexLiveChannel() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!liveChannel) liveChannel = new BroadcastChannel('apex-kv-live');
  return liveChannel;
}
import { rowToWikiOverride, mergeWikiOverride } from '../utils/wikiOverrides';
import { loadLocalValueOverrides, loadLocalWikiOverrides, loadLocalMapOverrides, loadLocalCrateOverrides, loadLocalMaterialOverrides, loadLocalDeletedOverrides, loadLocalDeletedUnits, markLocalUnitDeleted, unmarkLocalUnitDeleted } from '../utils/localOverrides';
import { PUBLIC_LIVE_SYNC_ENABLED } from '../config/egressControl';
import { defaultValuesFor } from '../utils/valueRules';
import { resolveImageUrl } from '../utils/localAssets';
import staticOverridesJson from '../data/overrides/staticOverrides.json';
import { ALL_MAPS } from '../data/maps';
import { CRATES, MATERIALS } from '../data/items';

// How often a change-triggered resync may hit the network. Publishing more
// often than this is fine — the request is deferred, never dropped.
const SYNC_MIN_INTERVAL_MS = 8000;

// Lets the deferred-resync timer call the latest syncFromKV without creating a
// dependency cycle inside useCallback.
const syncRef = { current: null };

const DataContext = createContext(null);

function rowToValueData(row) {
  if (!row) return null;
  const max = row.base_value_max ?? row.baseValueMax ?? null;
  const special = isSpecialBaseValue(row.base_value ?? row.baseValue);
  const specialGems = isSpecialBaseValue(row.gems);
  const specialCoins = isSpecialBaseValue(row.coins);
  return {
    specialValue: special,
    specialGems,
    specialCoins,
    baseValue: special ? null : Number(row.base_value ?? row.baseValue ?? 0),
    baseValueMax: (max !== "" && max != null) ? Number(max) : null,
    gems: Number(row.gems ?? 0),
    coins: Number(row.coins ?? 0),
    gemsMax: row.gems_max ?? row.gemsMax ?? null,
    coinsMax: row.coins_max ?? row.coinsMax ?? null,
    demand: row.demand || "Normal",
    scarcity: row.scarcity || "Standard",
    trend: row.trend || "stable",
    notes: row.notes || "",
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    updatedBy: row.updated_by || row.updatedBy,
    // Display name only — an email is resolved to the public name, never shown.
    updatedByName: publicDisplayName(row),
    getsOverpays: row.getsOverpays ?? row.gets_overpays ?? null,
    getsUnderpays: row.getsUnderpays ?? row.gets_underpays ?? null,
    liveValue: true,
  };
}

function withLiveValue(entry, rowsBySlug, localValueOverrides = {}) {
  const dbRow = rowsBySlug.get(entry.slug);
  const localOver = localValueOverrides?.[entry.slug];
  if (!dbRow && !localOver) return entry;

  const live = rowToValueData(localOver ? { ...(dbRow || {}), ...localOver } : dbRow);
  if (!live) return entry;
  // O/C and N/A apply to Value, Gems AND Coins — a marker replaces that
  // number; the other fields still show whatever was entered.
  const tradeValue = live.specialValue ? null : computeTradeValue(live.baseValue);
  const gems = live.specialGems ? null : computeTradeValue(live.gems);
  const coins = live.specialCoins ? null : computeTradeValue(live.coins);

  let tradeValueMax = null;
  let gemsMax = null;
  let coinsMax = null;
  if (live.baseValueMax && Number(live.baseValueMax) > Number(live.baseValue)) {
    tradeValueMax = computeTradeValue(Number(live.baseValueMax));
    const gemsMaxVal = live.gemsMax != null ? Number(live.gemsMax) : Math.round(Number(live.gems) * (Number(live.baseValueMax) / Number(live.baseValue)));
    const coinsMaxVal = live.coinsMax != null ? Number(live.coinsMax) : Math.round(Number(live.coins) * (Number(live.baseValueMax) / Number(live.baseValue)));
    gemsMax = computeTradeValue(gemsMaxVal);
    coinsMax = computeTradeValue(coinsMaxVal);
  }

  return {
    ...entry, ...live, gems, coins, tradeValue,
    gemsMax, coinsMax, tradeValueMax,
    updatedByName: live?.updatedByName ?? publicDisplayName(dbRow) ?? null,
    getsOverpays: live?.getsOverpays ?? dbRow?.getsOverpays ?? null,
    getsUnderpays: live?.getsUnderpays ?? dbRow?.getsUnderpays ?? null,
    hasValue: true
  };
}

function loadCachedTable(key) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The version of the snapshot currently cached in localStorage.
//
// rev 8: this is what stops a visitor seeing yesterday's values. Without it the
// cached tables had no version, so a returning tab could paint the cache, fail
// the version check for any reason, and keep showing old numbers until the
// whole storage was cleared. Now the cache carries the `__v` it came from and
// an older payload can never overwrite it.
const CACHE_VERSION_KEY = 'apex-cache-bundle-version-v1';

function readCachedVersion() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_VERSION_KEY);
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch { return null; }
}

function writeCachedVersion(version) {
  if (typeof localStorage === 'undefined' || typeof version !== 'number') return;
  try { localStorage.setItem(CACHE_VERSION_KEY, String(version)); } catch { /* quota */ }
}

function saveCachedTable(key, rows) {
  if (typeof localStorage === 'undefined' || !Array.isArray(rows)) return;
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

// KV bundle -> row mappers. The bundle may contain BOTH snake_case DB-row
// payloads (base_value, image_url) and camelCase entries (baseValue,
// imageUrl) depending on which editor wrote them — normalize both.
function bundleToValueRows(data = {}) {
  return Object.entries(data?.valueOverrides || {}).map(([slug, val]) => ({
    slug,
    base_value: val.baseValue ?? val.base_value,
    base_value_max: val.baseValueMax ?? val.base_value_max ?? null,
    gems_max: val.gemsMax ?? val.gems_max ?? null,
    coins_max: val.coinsMax ?? val.coins_max ?? null,
    demand: val.demand,
    scarcity: val.scarcity,
    trend: val.trend,
    notes: val.notes,
    gems: val.gems,
    coins: val.coins,
    getsOverpays: val.getsOverpays ?? val.gets_overpays ?? null,
    getsUnderpays: val.getsUnderpays ?? val.gets_underpays ?? null,
    updatedByName: publicDisplayName(val),
    updated_at: val.updated_at || new Date().toISOString(),
  }));
}

function bundleToWikiRows(data = {}) {
  // Spread FIRST: custom_unit / kind / any editor-added field must survive a
  // round trip through KV. Dropping them is what made created units vanish on
  // refresh and let material rows leak into the unit list.
  return Object.entries(data?.wikiOverrides || {}).map(([slug, wiki]) => ({
    ...(wiki && typeof wiki === 'object' ? wiki : {}),
    slug,
    name: wiki.name,
    rarity: wiki.rarity,
    image_url: resolveImageUrl(wiki.image_url ?? wiki.imageUrl),
    description: wiki.description,
    type: wiki.type,
    raw_type: wiki.raw_type ?? wiki.rawType,
    category: wiki.category,
    placement_limit: wiki.placement_limit ?? wiki.placementLimit,
    total_cost: wiki.total_cost ?? wiki.totalCost,
    early_game_rank: wiki.early_game_rank ?? wiki.earlyGameRank,
    late_game_rank: wiki.late_game_rank ?? wiki.lateGameRank,
    obtain: wiki.obtain,
    passive: wiki.passive,
    ability: wiki.ability,
    synergy: wiki.synergy,
    min_max_stats: wiki.min_max_stats ?? wiki.minMaxStats,
    upgrades: wiki.upgrades,
    updated_at: wiki.updated_at || new Date().toISOString(),
  }));
}

function bundleToItemRows(data = {}) {
  // Every non-unit entity (Gamepass, Artifact/Key, Crate, Consumable,
  // Currency, Skin, Material, Item) created in the admin panel lives here.
  return Object.entries(data?.itemOverrides || {}).map(([slug, row]) => ({
    ...(row && typeof row === 'object' ? row : {}),
    slug,
    name: row?.name || slug,
    group: row?.group || 'Items',
    imageUrl: row?.image_url ?? row?.imageUrl ?? null,
    updatedAt: row?.updated_at ?? null,
  }));
}

function bundleToMaterialRows(data = {}) {
  // MATERIALS ARE NOT UNITS — their own section, their own shape. Nothing
  // here ever flows through the unit/wiki pipeline, so no shiny variants can
  // exist for materials, ever.
  return Object.entries(data?.materialOverrides || {}).map(([slug, row]) => ({
    slug,
    name: row?.name || slug,
    kind: 'material',
    description: row?.description || '',
    effect: row?.effect || '',
    obtain: Array.isArray(row?.obtain) ? row.obtain : [],
    image_url: row?.image_url ?? row?.imageUrl ?? null,
    updated_at: row?.updated_at || null,
  }));
}

function bundleToMapRows(data = {}) {
  return Object.entries(data?.mapOverrides || {}).map(([slug, map]) => ({
    slug,
    name: map.name,
    description: map.description,
    difficulty: map.difficulty,
    unlock_requirement: map.unlock_requirement ?? map.unlockRequirement,
    image_url: map.image_url ?? map.imageUrl,
    updated_at: map.updated_at || new Date().toISOString(),
  }));
}

function bundleToCrateRows(data = {}) {
  return Object.entries(data?.crateOverrides || {}).map(([slug, crate]) => ({
    slug,
    name: crate.name,
    description: crate.description,
    image_url: crate.image_url ?? crate.imageUrl,
    chances: crate.chances,
    obtain: crate.obtain,
    effect: crate.effect,
    updated_at: crate.updated_at || new Date().toISOString(),
  }));
}

/** Fallback: read the baked snapshot shipped with the static bundle. */
async function fetchBakedBundle() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const response = await fetch(`${cleanBase}/overrides/staticOverrides.json`).catch(() => null);
  if (!response || !response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const VALUE_CACHE_KEY = 'apex-cache-value-entries-v1';
const WIKI_CACHE_KEY = 'apex-cache-wiki-overrides-v1';
const MAP_CACHE_KEY = 'apex-cache-map-overrides-v1';
const CRATE_CACHE_KEY = 'apex-cache-crate-overrides-v1';

/**
 * Single source of live Values + WIKI data for the whole app.
 *
 * Cloudflare KV mode: the app boots instantly from the baked static snapshot
 * (or the localStorage cache of the last bundle), then pulls the LIVE bundle
 * from the KV worker. Edits published by admins appear for everyone on the
 * next sync — on mount, on tab focus, on reconnect, or via the lightweight
 * polling interval below. No realtime socket required.
 */
export function DataProvider({ children }) {
  const [rows, setRows] = useState(() => {
    const cached = loadCachedTable(VALUE_CACHE_KEY);
    if (cached && cached.length > 0) return cached;
    return bundleToValueRows(staticOverridesJson);
  });

  const [wikiRows, setWikiRows] = useState(() => {
    const cached = loadCachedTable(WIKI_CACHE_KEY);
    if (cached && cached.length > 0) return cached;
    return bundleToWikiRows(staticOverridesJson);
  });
  const [mapRows, setMapRows] = useState(() => {
    const cached = loadCachedTable(MAP_CACHE_KEY);
    if (cached && cached.length > 0) return cached;
    const local = loadLocalMapOverrides();
    if (local && Object.keys(local).length > 0) {
      return Object.values(local);
    }
    return [];
  });
  const [itemRows, setItemRows] = useState(() => bundleToItemRows(staticOverridesJson || {}));
  const [materialRows, setMaterialRows] = useState([]);
  const [crateRows, setCrateRows] = useState(() => {
    const cached = loadCachedTable(CRATE_CACHE_KEY);
    if (cached && cached.length > 0) return cached;
    const local = loadLocalCrateOverrides();
    if (local && Object.keys(local).length > 0) {
      return Object.values(local);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wikiError, setWikiError] = useState(null);
  // OFFLINE Values mode — persistent, visitor-switchable, no live data calls.
  const [offlineMode, setOfflineModeState] = useState(() => isOfflineValuesMode());
  const [browserOnline, setBrowserOnline] = useState(() => isBrowserOnline());
  const [bundleSource, setBundleSource] = useState('baked');
  const setOfflineMode = useCallback((enabled) => {
    const next = setOfflineValuesMode(enabled);
    setOfflineModeState(next);
    return next;
  }, []);
  useEffect(() => {
    const onPreference = (event) => setOfflineModeState(!!event?.detail?.enabled);
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener(OFFLINE_VALUES_EVENT, onPreference);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener(OFFLINE_VALUES_EVENT, onPreference);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  const [localValueOverrides, setLocalValueOverrides] = useState(() => loadLocalValueOverrides());
  const [localWikiOverrides, setLocalWikiOverrides] = useState(() => loadLocalWikiOverrides());
  const [localMapOverrides, setLocalMapOverrides] = useState(() => loadLocalMapOverrides());
  const [localMaterialOverrides, setLocalMaterialOverrides] = useState(() => loadLocalMaterialOverrides());
  const [localCrateOverrides, setLocalCrateOverrides] = useState(() => loadLocalCrateOverrides());
  const [localDeleted, setLocalDeleted] = useState(() => loadLocalDeletedOverrides() || { value: [], wiki: [], map: [], crate: [] });
  const [localDeletedUnits, setLocalDeletedUnits] = useState(() => loadLocalDeletedUnits());
  const [kvDeletedUnits, setKvDeletedUnits] = useState([]);
  useEffect(() => {
    const reread = () => setLocalDeletedUnits(loadLocalDeletedUnits());
    window.addEventListener('apex-deleted-units-updated', reread);
    return () => window.removeEventListener('apex-deleted-units-updated', reread);
  }, []);

  useEffect(() => {
    const onValues = () => {
      setLocalValueOverrides(loadLocalValueOverrides());
      setLocalDeleted(loadLocalDeletedOverrides() || { value: [], wiki: [], map: [], crate: [] });
    };
    const onWiki = () => {
      setLocalWikiOverrides(loadLocalWikiOverrides());
      setLocalDeleted(loadLocalDeletedOverrides() || { value: [], wiki: [], map: [], crate: [] });
    };
    const onMaps = () => {
      setLocalMapOverrides(loadLocalMapOverrides());
      setLocalDeleted(loadLocalDeletedOverrides() || { value: [], wiki: [], map: [], crate: [] });
    };
    const onMaterials = () => {
      setLocalMaterialOverrides(loadLocalMaterialOverrides());
    };
    const onCrates = () => {
      setLocalCrateOverrides(loadLocalCrateOverrides());
      setLocalDeleted(loadLocalDeletedOverrides() || { value: [], wiki: [], map: [], crate: [] });
    };
    window.addEventListener('apex-values-updated', onValues);
    window.addEventListener('apex-wiki-updated', onWiki);
    window.addEventListener('apex-maps-updated', onMaps);
    window.addEventListener('apex-materials-updated', onMaterials);
    window.addEventListener('apex-crates-updated', onCrates);
    return () => {
      window.removeEventListener('apex-values-updated', onValues);
      window.removeEventListener('apex-wiki-updated', onWiki);
      window.removeEventListener('apex-maps-updated', onMaps);
    window.removeEventListener('apex-materials-updated', onMaterials);
      window.removeEventListener('apex-crates-updated', onCrates);
    };
  }, []);

  const lastFetchRef = useRef(0);
  const inFlightRef = useRef(false);
  // A publish can land while the 15s anti-thrash window is still open. The old
  // code returned silently and the change was simply DROPPED — visitors kept
  // the old numbers until the next 60s poll (or a reload). Now the request is
  // remembered and replayed the moment the window closes.
  const pendingSyncRef = useRef(null);

  // Public visitors sync from the KV worker unless the egress kill switch is
  // on; the admin dashboard always syncs so editors see live data.
  const canSync = useCallback(() => {
    return PUBLIC_LIVE_SYNC_ENABLED || (typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin'));
  }, []);

  // Seeded from the cache's own version: a warm visitor with an up-to-date
  // snapshot skips the 7.5 MB download, but the /status check below still runs.
  const lastVersionRef = useRef(readCachedVersion());

  const applyBundle = useCallback((data, metaVersion = null) => {
    if (!data) return;
    const version = typeof data.__v === 'number' ? data.__v : metaVersion;
    // NEVER GO BACKWARDS (rev 8). If a stale copy of the bundle arrives — an
    // edge cache hit, a bfcache snapshot, a slow in-flight response — it must
    // not replace a newer snapshot the visitor is already looking at.
    const cached = readCachedVersion();
    if (typeof version === 'number' && cached !== null && version < cached) {
      console.info(`[APEX] Ignored an older bundle (v${version}); this device already has v${cached}.`);
      return;
    }
    const changed = version === null || lastVersionRef.current === null || version !== lastVersionRef.current;
    lastVersionRef.current = version;
    writeCachedVersion(version);

    const nextValues = bundleToValueRows(data);
    const nextWiki = bundleToWikiRows(data);
    const nextMaps = bundleToMapRows(data);
    const nextCrates = bundleToCrateRows(data);
    const nextMaterials = bundleToMaterialRows(data);
    const nextItems = bundleToItemRows(data);

    // The KV/static bundle ALWAYS wins over any stale localStorage cache so
    // every visitor converges on the newest published snapshot.
    if (Array.isArray(data.deletedUnits)) setKvDeletedUnits(data.deletedUnits);
    setRows(nextValues);
    setWikiRows(nextWiki);
    setMapRows(nextMaps);
    setCrateRows(nextCrates);
    setMaterialRows(nextMaterials);
    setItemRows(nextItems);
    saveCachedTable(VALUE_CACHE_KEY, nextValues);
    saveCachedTable(WIKI_CACHE_KEY, nextWiki);
    saveCachedTable(MAP_CACHE_KEY, nextMaps);
    saveCachedTable(CRATE_CACHE_KEY, nextCrates);
    setLoading(false);
    setWikiLoading(false);
  }, []);

  const syncFromKV = useCallback(async ({ force = false, applyAnyway = false } = {}) => {
    if (!canSync()) return;
    if (offlineMode || !browserOnline) return; // OFFLINE Values mode: baked + cache only
    const now = Date.now();
    const since = now - lastFetchRef.current;
    if (!force && (inFlightRef.current || since < SYNC_MIN_INTERVAL_MS)) {
      if (inFlightRef.current) return;
      if (!pendingSyncRef.current) {
        pendingSyncRef.current = setTimeout(() => {
          pendingSyncRef.current = null;
          syncRef.current?.({ force: true });
        }, Math.max(0, SYNC_MIN_INTERVAL_MS - since) + 60);
      }
      return;
    }
    inFlightRef.current = true;
    lastFetchRef.current = now;
    try {
      // ONE shared database: probes are ~80 bytes, so polling every minute is
      // cheap. An editor publishing on the Test Realm bumps __v and BOTH
      // realms pick up the change within ~60s without re-downloading 7.5 MB.
      // The consolidated /status poll already carries the bundle version,
      // so no extra request is needed on the hot path. Legacy workers (or a
      // slow first load) still use the tiny standalone version probe.
      let meta = null;
      if (!applyAnyway) {
        const status = await ensureLiveStatus(1000);
        meta = status && typeof status.v === 'number'
          ? { version: status.v, updatedAt: status.at }
          : await fetchBundleMeta();
      }
      if (meta && lastVersionRef.current !== null && meta.version === lastVersionRef.current) {
        setError(null);
        setWikiError(null);
        return;
      }

      let data = await fetchKvBundle();

      // STALE-PAYLOAD GUARD (rev 8). /status says the database is at version N;
      // if the payload that just arrived is older than N it came from a cache,
      // not from KV. Re-ask with a cache-busting query so the request misses
      // every cache layer, and if it is STILL behind, keep the newer local
      // snapshot and retry on the next tick instead of applying old numbers.
      const serverV = typeof meta?.version === 'number' ? meta.version : null;
      const payloadV = data && typeof data.__v === 'number' ? data.__v : null;
      if (serverV !== null && payloadV !== null && payloadV < serverV) {
        console.info(`[APEX] Bundle came back stale (v${payloadV} < v${serverV}) — forcing a cache-busted refetch.`);
        const fresh = await fetchKvBundle({ cacheBust: true });
        if (fresh && !fresh.__unchanged) {
          const freshV = typeof fresh.__v === 'number' ? fresh.__v : null;
          if (freshV === null || freshV >= payloadV) data = fresh;
        }
      }
      let source = data && !data.__unchanged ? 'live' : bundleSource;
      if (data?.__unchanged) {
        // Only claim the new version when the snapshot on this device really is
        // that version — otherwise we would mark a stale cache "up to date".
        if (meta && typeof meta.version === 'number' && readCachedVersion() === meta.version) {
          lastVersionRef.current = meta.version;
        }
        setError(null);
        return;
      }
      if (!data) { data = await fetchBakedBundle(); source = 'baked'; }
      if (data) {
        // NEVER GO BACKWARDS. If the live database is unreachable and the
        // baked snapshot is older than what this tab already has, keep the
        // newer data instead of silently regressing published values.
        const incomingV = typeof data.__v === 'number' ? data.__v : null;
        const knownV = typeof lastVersionRef.current === 'number' ? lastVersionRef.current : null;
        if (source === 'baked' && incomingV !== null && knownV !== null && incomingV < knownV) {
          console.info(`[APEX] Live database unavailable — keeping newer snapshot v${knownV} (baked file is v${incomingV}).`);
          setError(null);
          setWikiError(null);
          return;
        }
        setBundleSource(source);
        const v = typeof data.__v === 'number' ? data.__v : (meta?.version ?? null);
        const unchanged = v !== null && v === lastVersionRef.current;
        if (!unchanged || applyAnyway) {
          applyBundle(data, meta?.version ?? null);
        }
        setError(null);
        setWikiError(null);
      } else if (!force) {
        // Keep serving whatever we already have — no need to alarm anyone.
        setError(null);
      }
    } catch (e) {
      // Honest, single-line diagnosis: name what failed and which snapshot the
      // visitor is looking at, so "the database is disconnected" is not a
      // mystery. The baked file is refreshed by `node scripts/bake-data.mjs`.
      console.warn(`[APEX] Live database unavailable (${e?.message || 'network error'}) — showing the baked snapshot.`);
    } finally {
      inFlightRef.current = false;
    }
  }, [applyBundle, canSync, offlineMode, browserOnline, bundleSource]);

  // Keep the deferral timer pointed at the newest syncFromKV.
  syncRef.current = syncFromKV;

  // Stable public API — AdminHome calls these after publishing edits.
  const refresh = useCallback(async () => syncFromKV({ force: true, applyAnyway: true }), [syncFromKV]);
  const refreshWiki = refresh;
  const refreshContent = refresh;

  // Initial sync on mount: pull the live KV bundle (or baked fallback).
  useEffect(() => {
    syncFromKV({ force: true });
  }, [syncFromKV]);

  // Revalidate when the visitor returns to the tab or comes back online,
  // throttled to one request per minute.
  useEffect(() => {
    if (!canSync()) return undefined;
    const onWake = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (Date.now() - lastFetchRef.current > 60000) {
        syncFromKV();
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
  }, [canSync, syncFromKV]);

  // ONE consolidated 60s poll (version + maintenance + announcements) is
  // owned by liveStatus. DataContext only reacts when the version changes;
  // the multi-megabyte bundle is fetched only on an actual editor publish.
  useEffect(() => {
    if (!canSync() || offlineMode || !browserOnline) return undefined;
    startLiveStatus();
    return subscribeLiveStatus((status) => {
      if (typeof status?.v !== 'number') return;
      if (status.v !== lastVersionRef.current) {
        // On BOOT the initial sync is already in flight — a second forced fetch
        // would download the whole database twice. A version that changes while
        // we already have data is a real publish, so that one bypasses the
        // anti-thrash window (and is deferred, never dropped, if it is busy).
        if (lastVersionRef.current === null) syncFromKV();
        else syncFromKV({ force: true });
      }
    });
  }, [canSync, syncFromKV, offlineMode, browserOnline]);

  // Switching OFFLINE Values back off immediately re-syncs the live bundle.
  const wasOfflineRef = useRef(offlineMode);
  useEffect(() => {
    if (wasOfflineRef.current && !offlineMode && browserOnline) syncFromKV({ force: true });
    wasOfflineRef.current = offlineMode;
  }, [offlineMode, browserOnline, syncFromKV]);

  // Other tabs refreshed already: pull the new data here too (instant).
  useEffect(() => {
    const ch = apexLiveChannel();
    if (!ch) return undefined;
    const onMsg = (event) => {
      if (event?.data?.type === 'apex-sync' && event.data.version !== lastVersionRef.current) {
        syncFromKV();
      }
    };
    ch.addEventListener('message', onMsg);
    return () => ch.removeEventListener('message', onMsg);
  }, [syncFromKV]);

  // Static roster: slugs shipped in the data files. Any WIKI database row
  // whose slug is NOT here is a unit an editor created at runtime — it is
  // treated as a real unit everywhere (no separate concept).
  const staticSlugs = useMemo(() => new Set(ALL_UNITS.map((u) => u.slug)), []);

  const rowsBySlug = useMemo(() => new Map(rows.map((row) => [row.slug, row])), [rows]);
  const wikiRowsBySlug = useMemo(() => new Map(wikiRows.map((row) => [row.slug, row])), [wikiRows]);

  // Site-wide deleted units: union of the KV registry and this browser's
  // local marks. Deleting a base unit hides its shiny variant too.
  const deletedUnitSlugs = useMemo(() => {
    const set = new Set([...kvDeletedUnits, ...localDeletedUnits]);
    return set;
  }, [kvDeletedUnits, localDeletedUnits]);

  const isUnitDeleted = useCallback(
    (slug) => {
      if (!slug) return false;
      if (deletedUnitSlugs.has(slug)) return true;
      const base = slug.replace(/^shiny-/, '');
      return base !== slug && deletedUnitSlugs.has(base);
    },
    [deletedUnitSlugs]
  );

  // Units created by editors (WIKI rows for slugs outside the static
  // roster). Each gets an auto-generated shiny variant, exactly like the
  // built-in units. Local drafts are included so a just-created unit is
  // visible instantly in this browser.
  const createdUnits = useMemo(() => {
    const clean = (v) => (v === null || v === undefined || v === '' ? null : v);
    const mapRow = (slug, row) => {
      const rarity = clean(row.rarity) || 'Normie';
      const category = clean(row.category) || 'Standard';
      return {
        slug,
        name: clean(row.name) || slug,
        rarity,
        type: clean(row.type) || 'DPS',
        rawType: clean(row.raw_type) || clean(row.type) || '',
        category,
        categories: [category],
        documented: true,
        placementLimit: clean(row.placement_limit),
        totalCost: clean(row.total_cost),
        obtain: Array.isArray(row.obtain) ? row.obtain : [],
        passive: clean(row.passive),
        ability: clean(row.ability),
        synergy: clean(row.synergy),
        upgrades: Array.isArray(row.upgrades) ? row.upgrades : [],
        minMaxStats: row.min_max_stats || {},
        description: clean(row.description) || '',
        imageUrl: clean(row.image_url) || clean(row.imageUrl),
        updatedAt: clean(row.updated_at),
        shiny: false,
      };
    };
    const fromSource = (source) => Object.entries(source || {})
      .filter(([slug, row]) => row && !row.kind && !staticSlugs.has(slug) && !slug.startsWith('shiny-'))
      .map(([slug, row]) => mapRow(slug, row));
    const seen = new Set();
    const bases = [];
    const rowMap = Object.fromEntries(wikiRows.map((r) => [r.slug, r]));
    for (const unit of [...fromSource(localWikiOverrides), ...fromSource(rowMap)]) {
      if (!seen.has(unit.slug)) { seen.add(unit.slug); bases.push(unit); }
    }
    const deleted = new Set(localDeleted?.wiki || []);
    const visible = bases.filter((unit) => !deleted.has(unit.slug) && !isUnitDeleted(unit.slug));
    return [...visible, ...visible.map(createShinyUnit)].map(withUnitDisplayName);
  }, [wikiRows, localWikiOverrides, staticSlugs, localDeleted, isUnitDeleted]);

  // Editor-created maps: map rows whose slug is outside the static map list.
  const createdMaps = useMemo(() => {
    const staticMapSlugs = new Set(ALL_MAPS.map((m) => m.slug));
    const fromRows = (rows) => (Array.isArray(rows) ? rows : []).filter((r) => r && r.slug && !staticMapSlugs.has(r.slug));
    const seen = new Set();
    const list = [];
    const localList = Object.values(localMapOverrides || {});
    for (const row of [...fromRows(localList), ...fromRows(mapRows)]) {
      if (seen.has(row.slug)) continue;
      seen.add(row.slug);
      list.push({
        slug: row.slug,
        name: row.name || row.slug,
        description: row.description || '',
        difficulty: row.difficulty || '',
        unlockRequirement: row.unlock_requirement ?? row.unlockRequirement ?? '',
        image: row.image_url ?? row.imageUrl ?? row.image ?? null,
        documented: true,
      });
    }
    return list;
  }, [mapRows, localMapOverrides]);

  // Skins created/edited by editors live as WIKI rows with a `kind` marker
  // so they never pollute unit lists. (Materials used to live here too —
  // they now have their own dedicated system, see materialRowMap.)
  const kindRows = useMemo(() => {
    const rows = {};
    const collect = (source) => Object.entries(source || {}).forEach(([slug, row]) => {
      // Skins live as wiki rows. Materials DO NOT — they have their own
      // dedicated system (see materialRowMap below) and never appear here.
      if (row && row.kind === 'skin') rows[slug] = row;
    });
    collect(localWikiOverrides);
    collect(Object.fromEntries(wikiRows.map((r) => [r.slug, r])));
    return rows;
  }, [wikiRows, localWikiOverrides]);

  const staticMaterialSlugs = useMemo(() => new Set(MATERIALS.map((m) => m.slug)), []);

  // The materials system: EVERY row in the materials lane (local first, then
  // the KV 'materials' section). This is the ONLY source of material data —
  // nothing is derived from wiki/unit rows, so no shiny variants can ever be
  // generated for materials.
  const materialRowMap = useMemo(() => {
    const map = {};
    for (const row of materialRows) if (row && row.slug) map[row.slug] = row;
    for (const row of Object.values(localMaterialOverrides || {})) if (row && row.slug) map[row.slug] = row; // local beats KV
    return map;
  }, [materialRows, localMaterialOverrides]);

  const createdMaterials = useMemo(
    () => Object.values(materialRowMap)
      .filter((row) => row.slug && !staticMaterialSlugs.has(row.slug) && !row.slug.startsWith('shiny-'))
      .map((row) => ({ slug: row.slug, name: row.name || row.slug, kind: 'material', description: row.description || '', effect: row.effect || '', obtain: Array.isArray(row.obtain) ? row.obtain : [], imageUrl: row.image_url ?? row.imageUrl ?? null, documented: true })),
    [materialRowMap, staticMaterialSlugs]
  );

  const createdSkins = useMemo(
    () => Object.entries(kindRows).filter(([, row]) => row.kind === 'skin')
      .map(([slug, row]) => ({ slug, name: row.name || slug, category: row.category || 'Exclusive', shiny: !!row.shiny, description: row.description || '', imageUrl: row.image_url ?? row.imageUrl ?? null, documented: true })),
    [kindRows]
  );
  const getWikiOverride = useCallback(
    (slug) => {
      const dbRow = wikiRowsBySlug.get(slug);
      const dbOver = rowToWikiOverride(dbRow, slug);
      const localOver = localWikiOverrides?.[slug];
      if (!localOver) return dbOver;

      return { ...dbOver, ...localOver };
    },
    [wikiRowsBySlug, localWikiOverrides]
  );

  const unitValues = useMemo(() => {
    const mergeWiki = (entry) => {
      const withVal = withLiveValue(entry, rowsBySlug, localValueOverrides);
      const wikiOver = getWikiOverride(entry.slug);
      return wikiOver ? mergeWikiOverride(withVal, wikiOver) : withVal;
    };
    const createdValueEntries = createdUnits.map((unit) => ({
      ...unit,
      baseValue: null, gems: null, coins: null,
      demand: null, scarcity: null, trend: null, tradeValue: null, hasValue: false,
    }));
    const list = [...STATIC_UNIT_VALUES.map(mergeWiki), ...createdValueEntries.map(mergeWiki)];
    return list
      .filter((u) => !localDeleted?.wiki?.includes(u.slug) && !localDeleted?.value?.includes(u.slug) && !isUnitDeleted(u.slug))
      // Live KV rows can still be zero (e.g. a unit added after the snapshot
      // was baked). Apply the same rarity floor everywhere, so the admin
      // editor, the Values pages and the calculator never disagree.
      .map((unit) => {
        const floor = defaultValuesFor(unit, unit);
        if (!floor) return unit;
        return {
          ...unit,
          ...floor,
          tradeValue: computeTradeValue(floor.baseValue, unit.demand, unit.scarcity),
          hasValue: true,
        };
      })
      .map(withUnitDisplayName);
  }, [rowsBySlug, createdUnits, localValueOverrides, getWikiOverride, localDeleted, isUnitDeleted]);

  const consumableValues = useMemo(
    () => STATIC_CONSUMABLE_VALUES.map((entry) => withLiveValue(entry, rowsBySlug, localValueOverrides)),
    [rowsBySlug, localValueOverrides]
  );

  // Non-unit entities (Artifacts, Gamepasses, Crates, ...) can hold a trade
  // value too (rev 7 admin tabs), so their rows join the value index and the
  // Values → <section> pages can render the same pillow.
  const itemValueEntries = useMemo(
    () => (itemRows || [])
      .filter((entry) => entry?.slug)
      .map((entry) => withLiveValue(entry, rowsBySlug, localValueOverrides)),
    [itemRows, rowsBySlug, localValueOverrides]
  );

  const allValueEntries = useMemo(
    () => [
      ...unitValues.map((entry) => ({ ...entry, kind: 'unit' })),
      ...consumableValues.map((entry) => ({ ...entry, kind: 'item' })),
      ...itemValueEntries.map((entry) => ({ ...entry, kind: 'item' })),
    ],
    [unitValues, consumableValues, itemValueEntries]
  );

  const getUnitValueBySlug = useCallback(
    (slug) => unitValues.find((entry) => entry.slug === slug),
    [unitValues]
  );

  const getValueEntryBySlug = useCallback(
    (slug) => allValueEntries.find((entry) => entry.slug === slug),
    [allValueEntries]
  );

  const maps = useMemo(() => [...ALL_MAPS, ...createdMaps].map((item) => {
    const row = mapRows.find((entry) => entry.slug === item.slug);
    const localOver = localMapOverrides?.[item.slug];
    if (!row && !localOver) return item;
    const merged = { ...(row || {}), ...(localOver || {}) };
    return {
      ...item,
      ...merged,
      unlockRequirement: merged.unlock_requirement ?? merged.unlockRequirement ?? item.unlockRequirement,
      image: resolveImageUrl(merged.image_url ?? merged.imageUrl ?? item.image),
      documented: true,
    };
  }), [mapRows, localMapOverrides, createdMaps]);
  const crates = useMemo(() => CRATES.map((item) => {
    const row = crateRows.find((entry) => entry.slug === item.slug);
    const localOver = localCrateOverrides?.[item.slug];
    if (!row && !localOver) return item;
    const merged = { ...(row || {}), ...(localOver || {}) };
    return {
      ...item,
      ...merged,
      imageUrl: resolveImageUrl(merged.image_url ?? merged.imageUrl ?? item.imageUrl),
      documented: true,
    };
  }), [crateRows, localCrateOverrides]);

  const value = useMemo(
    () => ({
      rows,
      wikiRows,
      mapRows,
      crateRows,
      maps,
      crates,
      unitValues,
      createdUnits,
      createdMaps,
      createdSkins,
      createdMaterials,
      materialRowMap,
      itemRows,
      kindRows,
      deletedUnitSlugs,
      isUnitDeleted,
      consumableValues,
      itemValueEntries,
      allValueEntries,
      getUnitValueBySlug,
      getValueEntryBySlug,
      getWikiOverride,
      loading,
      wikiLoading,
      error,
      wikiError,
      offlineMode,
      setOfflineMode,
      browserOnline,
      dataSource: (offlineMode || !browserOnline) ? 'offline' : bundleSource,
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
      createdUnits,
      createdMaps,
      createdSkins,
      createdMaterials,
      materialRowMap,
      kindRows,
      deletedUnitSlugs,
      isUnitDeleted,
      consumableValues,
      itemValueEntries,
      allValueEntries,
      getUnitValueBySlug,
      getValueEntryBySlug,
      getWikiOverride,
      loading,
      wikiLoading,
      error,
      wikiError,
      offlineMode,
      setOfflineMode,
      browserOnline,
      bundleSource,
      refresh,
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
