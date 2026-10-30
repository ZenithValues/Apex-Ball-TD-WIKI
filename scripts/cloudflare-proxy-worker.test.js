import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from './cloudflare-proxy-worker';

const TEAM_EMAIL = 'gustavo.rb1410@gmail.com';
const TEST_PASSWORD = 'a-unique-test-passcode';
const auth = { 'x-admin-email': TEAM_EMAIL, 'x-admin-passcode': TEST_PASSWORD };
let database;
let env;
let ipCounter = 1;

function call(path, options = {}) {
  const headers = { 'cf-connecting-ip': `198.51.100.${ipCounter++}`, ...options.headers };
  const request = new Request(`https://worker.example${path}`, { ...options, headers });
  return worker.fetch(request, env, { waitUntil: () => {} });
}

beforeEach(() => {
  database = new Map(Object.entries({
    adminPasswords: JSON.stringify({ [TEAM_EMAIL]: TEST_PASSWORD }),
    bugReports: JSON.stringify([{ id: 1, title: 'Legacy report', contact: 'private@example.test' }]),
    fanartEntries: JSON.stringify([
      { id: 1, title: 'Public art', approved: true, updated_by: TEAM_EMAIL },
      { id: 2, title: 'Pending art', approved: false, updated_by: TEAM_EMAIL },
    ]),
    staticOverrides: JSON.stringify({ __v: 10, wikiOverrides: { unit: { name: 'Unit', updated_by: TEAM_EMAIL, upgrades: [{ value: 1, editor_email: TEAM_EMAIL }] } }, materialOverrides: { material: { name: 'Material' } }, deletedUnits: ['hidden-unit'] }),
    maintenance: JSON.stringify({ on: false, message: '', by: TEAM_EMAIL }),
    'history:value:unit': JSON.stringify([{ by: TEAM_EMAIL, before: { updated_by: TEAM_EMAIL, baseValue: 4 } }]),
    announcements: JSON.stringify([{ id: 1, message: 'Update', sentBy: TEAM_EMAIL }]),
  }));
  env = { APEX_OVERRIDES: {
    get: vi.fn(async (key) => database.get(key) || null),
    put: vi.fn(async (key, value) => { database.set(key, value); }),
  } };
});

describe('worker privacy and authorization', () => {
  it('does not expose the report inbox or roster without verified credentials', async () => {
    expect((await call('/bug-reports')).status).toBe(401);
    expect((await call('/roles')).status).toBe(401);
    expect((await call('/bug-reports', { headers: { 'x-admin-email': TEAM_EMAIL, 'x-admin-passcode': 'wrong' } })).status).toBe(401);
    expect((await call('/bug-reports', { headers: auth })).status).toBe(200);
  });

  it('rejects old free-text reports and stores only allow-listed selections', async () => {
    const old = await call('/bug-reports', { method: 'POST', body: JSON.stringify({ title: 'free text', contact: 'child@example.test' }) });
    expect(old.status).toBe(400);
    const response = await call('/bug-reports', {
      method: 'POST',
      body: JSON.stringify({ type: 'structured-v1', category: 'Broken Link', area: 'Wiki', description: 'Sensitive free text', contact: 'child@example.test', page_url: 'https://private.test/' }),
    });
    expect(response.status).toBe(200);
    const stored = database.get('bugReports');
    expect(stored).toContain('Broken Link');
    expect(stored).not.toContain('child@example.test');
    expect(stored).not.toContain('Sensitive free text');
    expect(stored).not.toContain('private.test');
  });

  it('redacts staff metadata recursively for visitors, but preserves it for editors', async () => {
    const publicBundle = await (await call('/overrides')).json();
    expect(publicBundle.wikiOverrides.unit.name).toBe('Unit');
    expect(publicBundle.wikiOverrides.unit.updated_by).toBeUndefined();
    expect(publicBundle.wikiOverrides.unit.upgrades[0].editor_email).toBeUndefined();
    const editorBundle = await (await call('/overrides', { headers: auth })).json();
    expect(editorBundle.wikiOverrides.unit.updated_by).toBe(TEAM_EMAIL);
    const history = await (await call('/history/value/unit')).json();
    expect(history[0].by).toBeUndefined();
    expect(history[0].before.updated_by).toBeUndefined();
  });

  it('requires a current bundle version and preserves omitted sections and staff metadata on publish', async () => {
    const missingVersion = await call('/overrides', { method: 'POST', headers: auth, body: JSON.stringify({ wikiOverrides: {} }) });
    expect(missingVersion.status).toBe(409);
    const response = await call('/overrides', { method: 'POST', headers: auth, body: JSON.stringify({ __baseVersion: 10, wikiOverrides: { unit: { name: 'Renamed' } } }) });
    expect(response.status).toBe(200);
    const saved = JSON.parse(database.get('staticOverrides'));
    expect(saved.__v).toBe(11);
    expect(saved.materialOverrides.material.name).toBe('Material');
    expect(saved.deletedUnits).toEqual(['hidden-unit']);
    expect(saved.wikiOverrides.unit.updated_by).toBe(TEAM_EMAIL);
    expect(saved.wikiOverrides.unit.name).toBe('Renamed');
  });

  it('fails closed rather than writing when the current database cannot be read', async () => {
    env.APEX_OVERRIDES.get = vi.fn(async (key) => {
      if (key === 'staticOverrides') throw new Error('temporary KV failure');
      return database.get(key) || null;
    });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await call('/overrides', { method: 'POST', headers: auth, body: JSON.stringify({ __baseVersion: 0, wikiOverrides: {} }) });
      expect(response.status).toBe(500);
      expect(JSON.parse(database.get('staticOverrides')).__v).toBe(10);
    } finally { log.mockRestore(); }
  });

  it('redacts a public edge-cache response created by an older worker', async () => {
    const oldCached = new Response(JSON.stringify({ wikiOverrides: { unit: { updated_by: TEAM_EMAIL, name: 'Unit' } } }), { headers: { 'Content-Type': 'application/json' } });
    vi.stubGlobal('caches', { default: { match: vi.fn(async () => oldCached) } });
    try {
      const cachedBundle = await (await call('/overrides')).json();
      expect(cachedBundle.wikiOverrides.unit.name).toBe('Unit');
      expect(cachedBundle.wikiOverrides.unit.updated_by).toBeUndefined();
    } finally { vi.unstubAllGlobals(); }
  });

  it('hides pending fan art and public staff metadata', async () => {
    const publicEntries = await (await call('/fanart')).json();
    expect(publicEntries).toHaveLength(1);
    expect(publicEntries[0].title).toBe('Public art');
    expect(publicEntries[0].updated_by).toBeUndefined();
    expect(await (await call('/fanart', { headers: auth })).json()).toHaveLength(2);
    expect((await (await call('/maintenance')).json()).by).toBeUndefined();
    expect((await (await call('/announcements')).json()).announcements[0].sentBy).toBeUndefined();
  });

  it('does not silently create default passwords for new roster members', async () => {
    await call('/bug-reports', { headers: auth });
    expect(JSON.parse(database.get('adminPasswords'))).toEqual({ [TEAM_EMAIL]: TEST_PASSWORD });
    database.set('adminPasswords', JSON.stringify({ [TEAM_EMAIL]: 'apex2026' }));
    expect((await call('/bug-reports', { headers: { 'x-admin-email': TEAM_EMAIL, 'x-admin-passcode': 'apex2026' } })).status).toBe(401);
    expect((await call('/login', { method: 'POST', body: JSON.stringify({ email: TEAM_EMAIL, password: 'apex2026' }) })).status).toBe(401);
    expect((await call('/change-password', { method: 'POST', body: JSON.stringify({ email: TEAM_EMAIL, currentPassword: 'apex2026', newPassword: 'a-new-strong-password' }) })).status).toBe(403);
  });
});
