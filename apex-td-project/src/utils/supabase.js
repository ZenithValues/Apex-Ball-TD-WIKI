import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://rfeoicbcprziqlcmbjgi.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_PPGNsXC7Uc-Sr8m4Z_DaRQ_AZxl36bg';

const RECOVERY_KEYS = ['code', 'access_token', 'refresh_token', 'type', 'token_type', 'expires_in', 'expires_at'];

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

function getWindowLocation() {
  return typeof window !== 'undefined' ? window.location : null;
}

function paramsFromHash(hash = '') {
  const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!rawHash) return new URLSearchParams();
  if (rawHash.startsWith('access_token=') || rawHash.startsWith('code=') || rawHash.startsWith('type=')) {
    return new URLSearchParams(rawHash);
  }
  const queryIndex = rawHash.indexOf('?');
  if (queryIndex >= 0) return new URLSearchParams(rawHash.slice(queryIndex + 1));
  return new URLSearchParams();
}

function allRecoveryParams(location = getWindowLocation()) {
  const searchParams = new URLSearchParams(location?.search || '');
  const hashParams = paramsFromHash(location?.hash || '');
  return { searchParams, hashParams };
}

function isRecoveryParams(params) {
  return params.get('type') === 'recovery' || params.has('code') || (params.has('access_token') && params.has('refresh_token'));
}

export function getAdminRedirectUrl() {
  // CRITICAL: return a URL with NO hash fragment.
  //
  // This app uses a HashRouter, but Supabase's auth server appends recovery
  // params as a QUERY STRING (?type=recovery&code=...). If the redirect URL
  // contains a "#" (e.g. …/#/admin/reset-password), those params land INSIDE
  // the fragment, producing a malformed URL that GoTrue rejects with HTTP 500.
  //
  // Instead we land the recovery link at the clean site root and detect the
  // recovery code on app load (see App.jsx) to route to the reset form.
  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  return url.origin + url.pathname;
}

export function hasRecoveryCallback(location = getWindowLocation()) {
  const { searchParams, hashParams } = allRecoveryParams(location);
  return isRecoveryParams(searchParams) || isRecoveryParams(hashParams);
}

/**
 * Supabase implicit-flow links can arrive as a raw hash:
 *   #access_token=...&refresh_token=...&type=recovery
 * Convert that into a HashRouter route that AdminHome can read.
 */
export function getRecoveryRedirectPath(location = getWindowLocation()) {
  const { searchParams, hashParams } = allRecoveryParams(location);
  if (hashParams.get('access_token') && hashParams.get('refresh_token')) {
    return `/admin/reset-password?${hashParams.toString()}`;
  }
  if (isRecoveryParams(searchParams) || isRecoveryParams(hashParams)) return '/admin/reset-password';
  return null;
}

/**
 * The password-recovery code Supabase appends to the redirect URL can land in
 * the query string OR (with a HashRouter) inside the hash fragment. Pull it
 * from wherever it is so we can exchange it for a recovery session.
 */
export function getRecoveryCodeFromUrl(location = getWindowLocation()) {
  const { searchParams, hashParams } = allRecoveryParams(location);
  return searchParams.get('code') || hashParams.get('code') || null;
}

export function getImplicitRecoveryTokensFromUrl(location = getWindowLocation()) {
  const { searchParams, hashParams } = allRecoveryParams(location);
  const params = hashParams.get('access_token') ? hashParams : searchParams;
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { access_token: accessToken, refresh_token: refreshToken, type: params.get('type') };
}

export function clearRecoveryCredentialsFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  RECOVERY_KEYS.forEach((key) => url.searchParams.delete(key));

  const rawHash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (rawHash) {
    if (rawHash.startsWith('access_token=') || rawHash.startsWith('code=') || rawHash.startsWith('type=')) {
      url.hash = '#/admin/reset-password';
    } else {
      const [route, query = ''] = rawHash.split('?');
      if (query) {
        const hashParams = new URLSearchParams(query);
        RECOVERY_KEYS.forEach((key) => hashParams.delete(key));
        const nextQuery = hashParams.toString();
        url.hash = `#${route}${nextQuery ? `?${nextQuery}` : ''}`;
      }
    }
  }

  window.history.replaceState(window.history.state, document.title, url.toString());
}

export function normalizeRecoveryCallbackUrlForHashRouter(input) {
  try {
    let url;
    let isProvided = false;

    if (typeof input === 'string') {
      url = new URL(input);
      isProvided = true;
    } else if (input instanceof URL) {
      url = new URL(input.toString());
      isProvided = true;
    } else if (input && typeof input.href === 'string') {
      url = new URL(input.href);
      isProvided = true;
    } else if (input && (typeof input.search === 'string' || typeof input.hash === 'string')) {
      const baseOrigin =
        (typeof window !== 'undefined' && window.location?.origin) || 'https://zenithvalues.github.io';
      const basePathname =
        input.pathname ||
        (typeof window !== 'undefined' && window.location?.pathname) ||
        '/Apex-Ball-TD-WIKI/';
      const origin = input.origin || baseOrigin;
      url = new URL(origin + basePathname);
      url.search = input.search || '';
      url.hash = input.hash || '';
      isProvided = true;
    } else {
      if (typeof window === 'undefined') return;
      url = new URL(window.location.href);
    }

    const rawHash = url.hash || '';
    const searchParams = new URLSearchParams(url.search || '');
    const hashParams = paramsFromHash(rawHash);

    // Already on the correct reset-password hash route: keep as-is unless a recovery query still lingers.
    if (rawHash.startsWith('#/admin/reset-password')) {
      if (isRecoveryParams(searchParams)) {
        // Merge lingering recovery query into hash? Spec wants #/admin/reset-password?code=...
        // Simplest: move search params into hash if they contain recovery.
        const merged = new URL(url.toString());
        merged.search = '';
        // If hash already has query, preserve it unless search provides recovery code tokens.
        // To avoid double encoding, if hash query exists, we keep it; else use search.
        const existingHashQuery = rawHash.includes('?') ? rawHash.slice(rawHash.indexOf('?') + 1) : '';
        const finalQuery = existingHashQuery || searchParams.toString();
        merged.hash = `#/admin/reset-password${finalQuery ? `?${finalQuery}` : ''}`;
        if (isProvided) return merged.toString();
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          try {
            window.history.replaceState(window.history.state, document.title, merged.toString());
          } catch {
            // ignore
          }
        }
        return merged.toString();
      }
      return isProvided ? url.toString() : undefined;
    }

    let nextHash = null;
    let shouldClearSearch = false;

    if (isRecoveryParams(searchParams)) {
      nextHash = `#/admin/reset-password?${searchParams.toString()}`;
      shouldClearSearch = true;
    } else if (rawHash && !rawHash.startsWith('#/') && isRecoveryParams(hashParams)) {
      nextHash = `#/admin/reset-password?${hashParams.toString()}`;
    }

    if (!nextHash) {
      return isProvided ? url.toString() : undefined;
    }

    const normalized = new URL(url.toString());
    if (shouldClearSearch) normalized.search = '';
    normalized.hash = nextHash;

    if (isProvided) {
      return normalized.toString();
    }

    if (typeof window !== 'undefined' && window.history?.replaceState) {
      try {
        window.history.replaceState(window.history.state, document.title, normalized.toString());
      } catch {
        // ignore
      }
    }
    return normalized.toString();
  } catch {
    // Best effort: on error, return original input when provided.
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return undefined;
  }
}

export function isMissingTableError(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return error?.code === 'PGRST205' || message.includes('could not find the table') || message.includes('schema cache');
}
