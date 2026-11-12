import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);

// Read generated units data to fill in missing name/rarity. Importing the
// ESM module directly replaces the old array-extraction hack.
async function loadGeneratedUnits() {
  try {
    const filePath = path.join(ROOT, 'src', 'data', 'generated', 'units.generated.js');
    const module = await import(pathToFileURL(filePath).href);
    return Array.isArray(module.GENERATED_UNITS) ? module.GENERATED_UNITS : [];
  } catch (e) {
    console.warn('Could not load generated units:', e.message);
  }
  return [];
}
const ALL_UNITS = await loadGeneratedUnits();

const SUPABASE_PREFIX = 'https://rfeoicbcprziqlcmbjgi.supabase.co/storage/v1/object/public/';
function localImageName(url) {
  const rest = String(url).slice(SUPABASE_PREFIX.length).split('?')[0];
  return rest.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(-160);
}
function localizeImages(value) {
  if (typeof value === 'string') {
    return value.startsWith(SUPABASE_PREFIX) ? `/images/units/${localImageName(value)}` : value;
  }
  if (Array.isArray(value)) return value.map(localizeImages);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localizeImages(v)]));
  }
  return value;
}

// Builds can run before the worker privacy update is deployed. Strip staff
// identifiers recursively instead of baking them into publicly served files.
const PRIVATE_KEYS = new Set(['updated_by', 'updatedBy', 'created_by', 'createdBy', 'changed_by', 'changedBy', 'editor_email', 'editorEmail', 'author_email', 'authorEmail', 'email', 'sentBy', 'by']);
function publicData(value) {
  if (Array.isArray(value)) return value.map(publicData);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !PRIVATE_KEYS.has(key)).map(([key, item]) => [key, publicData(item)]));
}

// APEX BUILD-TIME DATA BAKE (SUPABASE FULLY DEPRECATED)
// Pulls the ENTIRE live database (values, WIKI, maps & crates overrides) from
// our serverless Cloudflare Worker + KV store and bakes it into
// `public/overrides/staticOverrides.json`. The runtime app fetches the Worker
// first and gracefully falls back to this baked file if the Worker is ever
// offline — so the site always boots with a known-good snapshot and database
// egress stays at $0.00/month.
const KV_WORKER_URL =
  process.env.APEX_KV_URL ||
  process.env.VITE_APEX_KV_URL ||
  'https://apex-db.apexballtd-admin.workers.dev';

async function fetchKVBundle() {
  const response = await fetch(`${KV_WORKER_URL}/overrides`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${KV_WORKER_URL}/overrides: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// The KV bundle may contain BOTH snake_case DB-row payloads (base_value,
// image_url, unlock_requirement) and camelCase bundle entries (baseValue,
// imageUrl, unlockRequirement) depending on which editor wrote them.
//
// IMPORTANT (2026-11-12): these used to be WHITELISTS, so any field an editor
// saved that was not listed here silently disappeared from the baked snapshot —
// getsOverpays / getsUnderpays, crate pity, bylines and every itemOverride were
// lost whenever the site fell back to the baked file. That is exactly what made
// the live site disagree with the database ("OCO is right in the test realm,
// outdated on the main site"). They are now PASSTHROUGH functions that only
// drop private / sandbox-only keys.
const BAKE_DROP_KEYS = new Set([
  'updated_by', 'updatedBy', 'created_by', 'createdBy', 'changed_by', 'changedBy',
  'editor_email', 'editorEmail', 'author_email', 'authorEmail', 'email', 'sentBy',
  'isPrvw', 'prvw', 'PRVW',
]);

function passthroughRows(raw = {}) {
  const out = {};
  Object.entries(raw || {}).forEach(([slug, row]) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return;
    const clean = Object.fromEntries(
      Object.entries(row).filter(([key, value]) => !BAKE_DROP_KEYS.has(key) && value !== undefined)
    );
    // Normalize the handful of aliases the rest of the app reads directly.
    if (clean.baseValue === undefined && clean.base_value !== undefined) clean.baseValue = clean.base_value;
    if (clean.baseValueMax === undefined && clean.base_value_max !== undefined) clean.baseValueMax = clean.base_value_max;
    if (clean.gemsMax === undefined && clean.gems_max !== undefined) clean.gemsMax = clean.gems_max;
    if (clean.coinsMax === undefined && clean.coins_max !== undefined) clean.coinsMax = clean.coins_max;
    if (clean.image_url === undefined && clean.imageUrl !== undefined) clean.image_url = clean.imageUrl;
    if (clean.imageUrl === undefined && clean.image_url !== undefined) clean.imageUrl = clean.image_url;
    out[slug] = clean;
  });
  return out;
}

const normalizeValueOverrides = passthroughRows;
const normalizeWikiOverrides = passthroughRows;
const normalizeMapOverrides = passthroughRows;
const normalizeCrateOverrides = passthroughRows;
const normalizeMaterialOverrides = passthroughRows;
const normalizeItemOverrides = passthroughRows;

async function main() {
  console.log('⏳ Baking live Cloudflare KV data into public/overrides/staticOverrides.json...');
  try {
    const bundle = await fetchKVBundle();

    const valueOverrides = normalizeValueOverrides(bundle?.valueOverrides);
    const wikiOverrides = normalizeWikiOverrides(bundle?.wikiOverrides);
    const mapOverrides = normalizeMapOverrides(bundle?.mapOverrides);
    const crateOverrides = normalizeCrateOverrides(bundle?.crateOverrides);
    const materialOverrides = normalizeMaterialOverrides(bundle?.materialOverrides);
    // Item overrides (artifacts, gamepasses, traits, skins, generic items) were
    // never baked, so editor-created entries vanished from the fallback.
    const itemOverrides = normalizeItemOverrides(bundle?.itemOverrides);

    // Build a units lookup from generated data (has name, rarity, type for ALL units)
    const unitsLookup = {};
    for (const unit of ALL_UNITS) {
      if (unit && unit.slug) {
        unitsLookup[unit.slug] = {
          name: unit.name,
          rarity: unit.rarity,
          type: unit.type,
          category: unit.category,
          raw_type: unit.rawType,
        };
      }
    }

    // Fill in missing name/rarity in wiki overrides from generated units
    for (const [slug, wiki] of Object.entries(wikiOverrides)) {
      if (!wiki.name && unitsLookup[slug]) wiki.name = unitsLookup[slug].name;
      if (!wiki.rarity && unitsLookup[slug]) wiki.rarity = unitsLookup[slug].rarity;
      if (!wiki.type && unitsLookup[slug]) wiki.type = unitsLookup[slug].type;
    }

    const out = {
      // Keep the baked snapshot versioned so /status and /overrides/version
      // agree even before the first editor publish (bundleMeta may be empty).
      __v: typeof bundle?.__v === 'number' ? bundle.__v : 1,
      timestamp: new Date().toISOString(),
      valueOverrides,
      wikiOverrides,
      mapOverrides,
      crateOverrides,
      materialOverrides,
      itemOverrides,
      deletedUnits: Array.isArray(bundle?.deletedUnits) ? bundle.deletedUnits : [],
      unitsLookup,
    };

    const targetPath = path.join(ROOT, 'public', 'overrides', 'staticOverrides.json');
    
    // Safety Threshold Guard:
    // If the fetched bundle has fewer than 10 overrides, but our current backup file has more,
    // do NOT overwrite it! This prevents empty/fresh KV databases from wiping our git backup!
    if (fs.existsSync(targetPath)) {
      try {
        const currentData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
        const currentWikiCount = Object.keys(currentData?.wikiOverrides || {}).length;
        const newWikiCount = Object.keys(wikiOverrides || {}).length;
        
        if (newWikiCount < currentWikiCount && newWikiCount < 10) {
          console.warn(`\x1b[33m⚠️ [Bake Safety Guard] Fetched bundle has only ${newWikiCount} WIKI overrides, but current backup has ${currentWikiCount}. Bypassing overwrite to protect your backup data!\x1b[0m`);
          return;
        }
      } catch (err) {
        console.warn('Failed to parse existing overrides file, skipping safety check', err);
      }
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(localizeImages(publicData(out))), 'utf-8');
    console.log(`\x1b[32m✅ Successfully baked data from Cloudflare KV! Wrote ${Object.keys(valueOverrides).length} value, ${Object.keys(wikiOverrides).length} WIKI, ${Object.keys(mapOverrides).length} map, ${Object.keys(crateOverrides).length} crate + ${Object.keys(materialOverrides).length} material + ${Object.keys(itemOverrides).length} item overrides to ${targetPath}\x1b[0m`);
  } catch (error) {
    console.error('\x1b[31m⚠️ Error baking data from Cloudflare KV, using existing fallback staticOverrides.json\x1b[0m');
    console.error(error.message);
  }
}

main();
