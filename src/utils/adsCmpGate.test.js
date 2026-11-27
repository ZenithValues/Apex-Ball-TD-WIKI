import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function setupBuild({ consented = false, disabled = false, host = 'apexballvalueswiki.github.io' } = {}) {
  if (disabled) vi.stubEnv('VITE_ADS_ENABLED', 'false');
  else vi.stubEnv('VITE_ADS_ENABLED', 'true');
  const dispatchEvent = vi.fn();
  vi.stubGlobal('window', { location: { hostname: host }, dispatchEvent });
  vi.stubGlobal('document', { querySelectorAll: () => [] });
  vi.stubGlobal('localStorage', {
    getItem: (k) => (k === 'apex-privacy-choice-v2'
      ? JSON.stringify({ version: 2, localStats: consented, ads: consented })
      : null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
  return import('./ads');
}

describe('AdsTerra consent and kill-switch gates', () => {
  it('fails closed when visitor has not opted into advertising consent', async () => {
    const ads = await setupBuild({ consented: false });
    ads.setAdsEnabled(true);
    ads.setAdsRoute('/');
    expect(ads.areAdsAllowed()).toBe(false);
  });

  it('allows AdsTerra placements on production once visitor consents', async () => {
    const ads = await setupBuild({ consented: true });
    ads.setAdsEnabled(true);
    ads.setAdsRoute('/');
    expect(ads.areAdsAllowed()).toBe(true);
    ads.setAdsRoute('/values/calculator');
    expect(ads.areAdsAllowed()).toBe(true);
  });

  it('respects VITE_ADS_ENABLED=false kill switch even with consent', async () => {
    const ads = await setupBuild({ consented: true, disabled: true });
    ads.setAdsEnabled(true);
    ads.setAdsRoute('/');
    expect(ads.ADS_LAUNCH_READY).toBe(false);
    expect(ads.areAdsAllowed()).toBe(false);
  });

  it('never allows ads on legal or admin routes even with consent', async () => {
    const ads = await setupBuild({ consented: true });
    ads.setAdsEnabled(true);
    for (const p of ['/about', '/contact', '/privacy', '/cookies', '/admin']) {
      ads.setAdsRoute(p);
      expect(ads.areAdsAllowed()).toBe(false);
    }
  });
});
