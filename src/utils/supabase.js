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

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getAdminRedirectUrl(path = '/admin/reset-password') {
  const url = new URL(window.location.href);
  // Drop any stray query params (e.g. a leftover recovery code) and set a
  // clean hash route. This must match an entry in Supabase's "Redirect URLs".
  url.search = '';
  url.hash = `#${path}`;
  return url.toString();
}

/**
 * The password-recovery code Supabase appends to the redirect URL can land in
 * the query string OR (with a HashRouter) inside the hash fragment. Pull it
 * from wherever it is so we can exchange it for a recovery session.
 */
export function getRecoveryCodeFromUrl() {
  const direct = new URLSearchParams(window.location.search).get('code');
  if (direct) return direct;
  const hashQuery = window.location.hash.split('?')[1];
  return hashQuery ? new URLSearchParams(hashQuery).get('code') : null;
}

export function isMissingTableError(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return error?.code === 'PGRST205' || message.includes('could not find the table') || message.includes('schema cache');
}
