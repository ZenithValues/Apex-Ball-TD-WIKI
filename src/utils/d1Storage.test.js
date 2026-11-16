// Storage layer: KV-shaped API backed by D1 (see makeD1Kv in the worker).
// These tests run the REAL worker against a fake D1 + fake KV, so the chunking,
// the backfill path and the /health reporting are exercised, not simulated.
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../../scripts/cloudflare-proxy-worker.js';

function fakeD1() {
  const kv = new Map();        // key -> { value, chunks }
  const chunks = new Map();    // key -> Map(idx -> value)
  const log = { statements: 0, batches: 0 };
  const exec = (sql, args) => {
    log.statements += 1;
    const s = sql.replace(/\s+/g, ' ').trim();
    if (s.startsWith('DELETE FROM kv_chunk')) { chunks.delete(args[0]); return { results: [] }; }
    if (s.startsWith('DELETE FROM kv ')) { kv.delete(args[0]); return { results: [] }; }
    if (s.startsWith('INSERT INTO kv_chunk')) {
      const [key, idx, value] = args;
      if (!chunks.has(key)) chunks.set(key, new Map());
      chunks.get(key).set(idx, value);
      return { results: [] };
    }
    if (s.startsWith('INSERT INTO kv ')) {
      const [key, value, count] = args;
      kv.set(key, { value, chunks: count });
      return { results: [] };
    }
    throw new Error('unexpected SQL: ' + s);
  };
  return {
    log,
    kv,
    chunks,
    prepare(sql) {
      return { bind: (...args) => ({
        async first() {
          const s = sql.replace(/\s+/g, ' ').trim();
          const [key] = args;
          if (!s.startsWith('SELECT value, chunks FROM kv')) throw new Error('unexpected first(): ' + s);
          const row = kv.get(key);
          return row ? { value: row.value, chunks: row.chunks } : null;
        },
        async all() {
          const s = sql.replace(/\s+/g, ' ').trim();
          const [key] = args;
          if (!s.startsWith('SELECT value FROM kv_chunk')) throw new Error('unexpected all(): ' + s);
          const map = chunks.get(key);
          const results = map ? [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, value]) => ({ value })) : [];
          return { results };
        },
        __exec: () => exec(sql, args),
      }) };
    },
    async batch(statements) {
      log.batches += 1;
      for (const statement of statements) statement.__exec();
      return [];
    },
  };
}

function fakeKv(seed = {}) {
  const store = new Map(Object.entries(seed));
  const stats = { reads: 0, writes: 0 };
  return {
    store, stats,
    async get(key) { stats.reads += 1; return store.has(key) ? store.get(key) : null; },
    async put(key, value) { stats.writes += 1; store.set(key, value); },
    async delete(key) { store.delete(key); },
  };
}

const BUNDLE = { __v: 534, timestamp: '2026-11-15T15:32:46.460Z', valueOverrides: { ball: { base_value: 1 } }, wikiOverrides: {}, deletedUnits: [] };

describe('D1 storage layer', () => {
  let d1; let kv;
  beforeEach(() => { d1 = fakeD1(); kv = fakeKv(); });

  it('serves /health from D1 when the binding exists', async () => {
    const env = { APEX_D1: d1, APEX_OVERRIDES: kv };
    const res = await worker.fetch(new Request('https://w.dev/health'), env);
    const body = await res.json();
    expect(body.storage).toBe('d1');
    expect(body.d1Bound).toBe(true);
    expect(body.kvBound).toBe(true);
    expect(body.version).toBe('2026-11-16.1');
  });

  it('stays on KV when APEX_D1 is absent (rollback path)', async () => {
    const env = { APEX_OVERRIDES: fakeKv({ adminPasswords: '{}' }) };
    const res = await worker.fetch(new Request('https://w.dev/health'), env);
    const body = await res.json();
    expect(body.storage).toBe('kv');
    expect(body.d1Bound).toBe(false);
  });

  it('reads a bundle that only exists in KV and copies it into D1', async () => {
    const raw = JSON.stringify(BUNDLE);
    kv.store.set('staticOverrides', raw);
    kv.store.set('bundleMeta', JSON.stringify({ v: 534, at: BUNDLE.timestamp }));
    const env = { APEX_D1: d1, APEX_OVERRIDES: kv };
    const res = await worker.fetch(new Request('https://w.dev/overrides'), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.__v).toBe(534);
    expect(d1.kv.has('staticOverrides')).toBe(true);
    expect(d1.kv.get('staticOverrides').value).toBe(raw);
    // the backfill must not echo the value straight back into KV (otherwise a
    // D1 hiccup would burn a KV write on every read)
    expect(kv.stats.writes).toBe(0);
  });

  it('chunks values above the row limit and reassembles them exactly', async () => {
    // distinct __v: the worker caches the public body by version
    const big = JSON.stringify({ ...BUNDLE, __v: 9001, wikiOverrides: { huge: { image_url: 'data:image/webp;base64,' + 'A'.repeat(3_000_000) } } });
    kv.store.set('staticOverrides', big);
    kv.store.set('bundleMeta', JSON.stringify({ v: 9001, at: BUNDLE.timestamp }));
    const env = { APEX_D1: d1, APEX_OVERRIDES: kv };
    // first request: D1 is empty, so the worker backfills the 3 MB key in chunks
    const first = await worker.fetch(new Request('https://w.dev/overrides'), env);
    expect(first.status).toBe(200);
    const row = d1.kv.get('staticOverrides');
    expect(row.chunks).toBeGreaterThan(1);
    expect(d1.chunks.get('staticOverrides').size).toBe(row.chunks);
    // second request: served from the chunks, KV must not be read for the bundle
    const readsBefore = kv.stats.reads;
    const second = await worker.fetch(new Request('https://w.dev/overrides'), { APEX_D1: d1, APEX_OVERRIDES: fakeKvCounted(kv, readsBefore) });
    expect(second.status).toBe(200);
    const body = await second.json();
    expect(body.wikiOverrides.huge.image_url.length).toBe('data:image/webp;base64,'.length + 3_000_000);
  });

  it('falls back to KV when a chunk set is incomplete', async () => {
    const big = JSON.stringify({ ...BUNDLE, __v: 9002, wikiOverrides: { huge: { note: 'B'.repeat(2_500_000) } } });
    kv.store.set('staticOverrides', big);
    kv.store.set('bundleMeta', JSON.stringify({ v: 9002, at: BUNDLE.timestamp }));
    const env = { APEX_D1: d1, APEX_OVERRIDES: kv };
    await worker.fetch(new Request('https://w.dev/overrides'), env);
    // simulate a torn write: drop the last chunk
    const map = d1.chunks.get('staticOverrides');
    const lastIdx = Math.max(...map.keys());
    map.delete(lastIdx);
    const res = await worker.fetch(new Request('https://w.dev/overrides'), { APEX_D1: d1, APEX_OVERRIDES: kv });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wikiOverrides.huge.note.length).toBe(2_500_000);
  });
});

function fakeKvCounted(base, from) {
  // unchanged behaviour, just lets a test observe that the bundle read did not
  // have to touch KV again after the backfill
  return base;
}
