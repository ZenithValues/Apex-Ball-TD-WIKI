import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAdminRedirectUrl } from './supabase';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getAdminRedirectUrl', () => {
  it('uses the current deployment root instead of a HashRouter admin route', () => {
    vi.stubGlobal('window', {
      location: {
        href: 'https://zenithvalues.github.io/Apex-Ball-TD-WIKI/#/admin',
      },
    });

    expect(getAdminRedirectUrl()).toBe('https://zenithvalues.github.io/Apex-Ball-TD-WIKI/');
  });

  it('removes recovery query parameters before returning the redirect URL', () => {
    vi.stubGlobal('window', {
      location: {
        href: 'http://localhost:5173/?code=one-time-code&type=recovery#/admin/reset-password',
      },
    });

    expect(getAdminRedirectUrl()).toBe('http://localhost:5173/');
  });
});
