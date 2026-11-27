import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  ADS_LAUNCH_READY,
  ADSTERRA_PLACEMENTS,
  areAdsAllowed,
  buildAdsterraBannerSrcDoc,
  isAdsAllowedPath,
  resolvePlacement,
  setAdsEnabled,
  setAdsRoute,
} from './ads';

afterEach(() => vi.unstubAllGlobals());

describe('AdsTerra launch & placement configuration', () => {
  it('defines the three exact AdsTerra placement keys and containers', () => {
    expect(ADSTERRA_PLACEMENTS.native.key).toBe('e0c885251e9929836e281ac4ae518b0c');
    expect(ADSTERRA_PLACEMENTS.native.containerId).toBe('container-e0c885251e9929836e281ac4ae518b0c');
    expect(ADSTERRA_PLACEMENTS.banner320x50.key).toBe('7b13c295ef63ac5deb4e243191de0df6');
    expect(ADSTERRA_PLACEMENTS.banner320x50.width).toBe(320);
    expect(ADSTERRA_PLACEMENTS.banner320x50.height).toBe(50);
    expect(ADSTERRA_PLACEMENTS.banner728x90.key).toBe('1dc2e19c430f34e5e1d924aeb166ae89');
    expect(ADSTERRA_PLACEMENTS.banner728x90.width).toBe(728);
    expect(ADSTERRA_PLACEMENTS.banner728x90.height).toBe(90);
    expect(resolvePlacement('banner', false).key).toBe('1dc2e19c430f34e5e1d924aeb166ae89');
    expect(resolvePlacement('banner', true).key).toBe('7b13c295ef63ac5deb4e243191de0df6');
    expect(buildAdsterraBannerSrcDoc(ADSTERRA_PLACEMENTS.banner728x90)).toContain('1dc2e19c430f34e5e1d924aeb166ae89');
  });

  it('never serves ads on the Test Realm host or without consent', () => {
    vi.stubGlobal('window', { location: { hostname: 'zenithvalues.github.io' }, dispatchEvent: vi.fn() });
    vi.stubGlobal('document', { querySelectorAll: () => [] });
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ version: 2, localStats: true, ads: true }),
    });
    setAdsEnabled(true);
    setAdsRoute('/');
    expect(ADS_LAUNCH_READY).toBe(true);
    expect(areAdsAllowed()).toBe(false);
  });

  it('excludes legal, admin, theme-editor and unknown routes', () => {
    expect(isAdsAllowedPath('/privacy')).toBe(false);
    expect(isAdsAllowedPath('/terms')).toBe(false);
    expect(isAdsAllowedPath('/admin')).toBe(false);
    expect(isAdsAllowedPath('/theme-editor')).toBe(false);
    expect(isAdsAllowedPath('/not-a-page')).toBe(false);
    expect(isAdsAllowedPath('/wiki')).toBe(true);
    expect(isAdsAllowedPath('/values/calculator')).toBe(true);
  });
});
