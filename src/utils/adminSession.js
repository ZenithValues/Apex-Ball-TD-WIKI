// Editor credentials.
//
// rev 8 (operator): "add persistent admin login" — a signed editor used to be
// logged out the moment the tab closed, because the credentials lived in
// sessionStorage. They now live in **localStorage** with a 30-day shift, so a
// browser refresh, a new tab or a full browser restart keeps you signed in.
//
// sessionStorage is still read (and mirrored) so older bundles and existing
// tests keep working, and a signed `/session` token is always preferred over
// the plaintext passcode.

const EMAIL_KEY = 'apex-admin-email-v1';
const PASSCODE_KEY = 'apex-admin-passcode-v1';
const TOKEN_KEY = 'apex-admin-session-v1';
const EXPIRES_KEY = 'apex-admin-expires-v1';
// The signed worker token has its OWN, shorter lifetime. When it lapses the
// editor falls back to their passcode instead of being thrown out.
const TOKEN_EXPIRES_KEY = 'apex-admin-token-expires-v1';

// One "shift" used to be 8h in a single tab. Persistent login = 30 days.
const PERSIST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function local() {
  try { return typeof localStorage === 'undefined' ? null : localStorage; }
  catch { return null; }
}

function session() {
  try { return typeof sessionStorage === 'undefined' ? null : sessionStorage; }
  catch { return null; }
}

/** Every store that may hold credentials, most durable first. */
function stores() {
  return [local(), session()].filter(Boolean);
}

function read(key) {
  for (const store of stores()) {
    try {
      const value = store.getItem(key);
      if (value !== null && value !== '') return value;
    } catch { /* blocked */ }
  }
  return null;
}

function write(key, value) {
  for (const store of stores()) {
    try { store.setItem(key, value); } catch { /* quota / blocked */ }
  }
}

function drop(key) {
  for (const store of stores()) {
    try { store.removeItem(key); } catch { /* blocked */ }
  }
}

function expired() {
  const expires = Number(read(EXPIRES_KEY) || 0);
  return Boolean(expires) && Date.now() > expires;
}

export function saveAdminCredentials(email, passcode) {
  write(EMAIL_KEY, String(email || '').trim().toLowerCase());
  write(PASSCODE_KEY, String(passcode || ''));
  write(EXPIRES_KEY, String(Date.now() + PERSIST_TTL_MS));
  drop(TOKEN_KEY);
}

export function getAdminCredentials() {
  if (expired()) {
    clearAdminCredentials();
    return { email: '', passcode: '' };
  }
  return {
    email: (read(EMAIL_KEY) || '').trim().toLowerCase(),
    passcode: read(PASSCODE_KEY) || '',
  };
}

export function saveAdminSessionToken(token, expiresAt, email) {
  write(TOKEN_KEY, String(token || ''));
  write(TOKEN_EXPIRES_KEY, String(Number(expiresAt) || Date.now() + 8 * 60 * 60 * 1000));
  // The LOGIN itself keeps its own (30-day) shift, so an expiring token does
  // not sign the editor out — see getAdminSessionToken().
  if (!read(EXPIRES_KEY)) write(EXPIRES_KEY, String(Date.now() + PERSIST_TTL_MS));
  if (email) write(EMAIL_KEY, String(email).trim().toLowerCase());
}

export function getAdminSessionToken() {
  if (expired()) {
    clearAdminCredentials();
    return '';
  }
  const token = read(TOKEN_KEY) || '';
  if (!token) return '';
  const tokenExpires = Number(read(TOKEN_EXPIRES_KEY) || 0);
  // The token lapsed: drop it (so the client uses the passcode path) but keep
  // the editor signed in, which is the whole point of a persistent login.
  if (tokenExpires && Date.now() > tokenExpires) {
    drop(TOKEN_KEY);
    drop(TOKEN_EXPIRES_KEY);
    return '';
  }
  return token;
}

export function getAdminEmail() {
  return (read(EMAIL_KEY) || '').trim().toLowerCase();
}

export function clearAdminCredentials() {
  [EMAIL_KEY, PASSCODE_KEY, TOKEN_KEY, TOKEN_EXPIRES_KEY, EXPIRES_KEY].forEach(drop);
}

export function hasAdminAuth() {
  return Boolean(getAdminSessionToken() || getAdminCredentials().passcode);
}

/** When the current shift ends (ms epoch), or 0 when signed out. */
export function getAdminExpiry() {
  return Number(read(EXPIRES_KEY) || 0);
}
