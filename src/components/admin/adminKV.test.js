import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFullPublishBundle } from './adminKV';
import { markLocalOverrideDeleted, clearLocalDeletedOverrides } from '../../utils/localOverrides';

// Field-level merge regression tests: a layer that omits a key (quota-pruned
// local draft, shiny payload without image_url) must not erase a stored image.
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
globalThis.localStorage = localStorageMock;

const BAKED = {
  wikiOverrides: {
    alpha: { slug: 'alpha', name: 'Alpha', rarity: 'Normie' },
    beta: { slug: 'beta', name: 'Beta', rarity: 'Rare' },
  },
  valueOverrides: {},
  mapOverrides: {},
  crateOverrides: {},
};
const KV = {
  __v: 12,
  wikiOverrides: {
    alpha: { slug: 'alpha', name: 'Alpha', rarity: 'Omega', image_url: 'https://img.example/alpha' },
  },
  valueOverrides: {},
};

function mockFetch() {
  globalThis.fetch = vi.fn(async (url) => {
    const u = String(url);
    if (u.includes('staticOverrides.json')) return { ok: true, json: async () => BAKED };
    if (u.includes('/overrides?')) return { ok: true, json: async () => KV };
    throw new Error(`Unexpected fetch: ${u}`);
  });
}

describe('buildFullPublishBundle field-level merge', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearLocalDeletedOverrides();
    mockFetch();
  });

  it('keeps the KV image when the local draft row omits image_url', async () => {
    localStorage.setItem('apex-local-wiki-overrides-v1', JSON.stringify({
      alpha: { slug: 'alpha', name: 'Alpha Renamed' },
    }));
    const bundle = await buildFullPublishBundle();
    const alpha = bundle.wikiOverrides.alpha;
    expect(alpha.image_url).toBe('https://img.example/alpha'); // not erased
    expect(alpha.name).toBe('Alpha Renamed'); // local still wins per field
    expect(alpha.rarity).toBe('Omega'); // kv field survives a partial local row
  });

  it('honours an explicit local null for image_url', async () => {
    localStorage.setItem('apex-local-wiki-overrides-v1', JSON.stringify({
      alpha: { slug: 'alpha', image_url: null },
    }));
    const bundle = await buildFullPublishBundle();
    expect(bundle.wikiOverrides.alpha.image_url).toBeNull();
  });

  it('keeps baked rows the other layers never touched', async () => {
    const bundle = await buildFullPublishBundle();
    expect(bundle.wikiOverrides.beta).toEqual({ slug: 'beta', name: 'Beta', rarity: 'Rare' });
    expect(bundle.wikiOverrides.alpha.image_url).toBe('https://img.example/alpha');
    expect(bundle.__v).toBe(12);
  });

  it('still honours tombstone deletions', async () => {
    markLocalOverrideDeleted('wiki', 'beta');
    const bundle = await buildFullPublishBundle();
    expect(bundle.wikiOverrides.beta).toBeUndefined();
    expect(bundle.wikiOverrides.alpha).toBeDefined();
  });
});
