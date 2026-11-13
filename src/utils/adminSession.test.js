import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import {
  saveAdminCredentials,
  getAdminCredentials,
  saveAdminSessionToken,
  getAdminSessionToken,
  clearAdminCredentials,
  hasAdminAuth,
} from './adminSession';
import { resolveImageUrl, localImageName } from './localAssets';

function storage() {
  const data = new Map();
  return {
    get length() { return data.size; },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', storage());
  vi.stubGlobal('sessionStorage', storage());
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe('editor credentials', () => {
  // rev 8 (operator): "add persistent admin login" — a refresh, a new tab or a
  // browser restart must NOT sign the editor out, so the credentials are kept
  // in localStorage (30-day shift) and mirrored to sessionStorage.
  it('persists the editor login across browser restarts', () => {
    saveAdminCredentials('Editor@Example.com', 'new-secret');
    expect(localStorage.getItem('apex-admin-passcode-v1')).toBe('new-secret');
    expect(sessionStorage.getItem('apex-admin-passcode-v1')).toBe('new-secret');
    expect(Number(localStorage.getItem('apex-admin-expires-v1'))).toBeGreaterThan(Date.now() + 29 * 24 * 3600 * 1000);
    expect(getAdminCredentials()).toEqual({ email: 'editor@example.com', passcode: 'new-secret' });
  });

  it('prefers the signed token but keeps the login after it lapses', () => {
    saveAdminCredentials('editor@example.com', 'secret');
    saveAdminSessionToken('aaa.bbb.ccc.ddd', Date.now() + 3600_000, 'editor@example.com');
    expect(getAdminSessionToken()).toBe('aaa.bbb.ccc.ddd');
    expect(hasAdminAuth()).toBe(true);
    // Token lapses → the token is dropped, the editor stays signed in on the
    // passcode path (persistent login).
    saveAdminSessionToken('aaa.bbb.ccc.ddd', Date.now() - 1000, 'editor@example.com');
    expect(getAdminSessionToken()).toBe('');
    expect(getAdminCredentials().passcode).toBe('secret');
    expect(hasAdminAuth()).toBe(true);
  });

  it('expires the whole shift after 30 days', () => {
    saveAdminCredentials('editor@example.com', 'secret');
    localStorage.setItem('apex-admin-expires-v1', String(Date.now() - 1000));
    expect(getAdminSessionToken()).toBe('');
    expect(hasAdminAuth()).toBe(false);
  });

  it('clearAdminCredentials removes every scoped key', () => {
    saveAdminCredentials('editor@example.com', 'secret');
    clearAdminCredentials();
    expect(hasAdminAuth()).toBe(false);
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});

describe('self-hosted unit artwork', () => {
  const SUPABASE = 'https://rfeoicbcprziqlcmbjgi.supabase.co/storage/v1/object/public/unit-images/Basic%20Ball.png';

  it('rewrites Supabase URLs to same-origin local files', () => {
    const resolved = resolveImageUrl(SUPABASE);
    expect(resolved.startsWith('/images/units/')).toBe(true);
    expect(resolved.endsWith(localImageName(SUPABASE))).toBe(true);
    expect(resolved).not.toContain('supabase');
  });

  it('leaves data URIs, relative paths and other hosts untouched', () => {
    expect(resolveImageUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
    expect(resolveImageUrl('/images/local.png')).toBe('/images/local.png');
    expect(resolveImageUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(resolveImageUrl(null)).toBeNull();
  });

  it('sanitises filenames', () => {
    expect(localImageName(SUPABASE)).toMatch(/^[a-zA-Z0-9._-]+$/);
  });
});
