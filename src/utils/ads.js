// AdSense is deliberately fail-closed. The site is intended for all ages;
// its operator, privacy contact, child-privacy assessment and certified CMP
// are not yet configured. Merely changing a boolean is NOT a compliant launch.
// Follow LAUNCH_COMPLIANCE.md and implement/test the chosen CMP and applicable
// child/parental safeguards before enabling ad requests.
export const AD_CLIENT = 'ca-pub-2832011907708910';
export const ADS_LAUNCH_READY = false;
const ALLOWED_HOSTS = ['apexballvalueswiki.github.io'];
const CONTENT_PATHS = new Set(['/', '/wiki', '/values', '/values/calculator']);
let maintenanceClear = false;
let currentPath = '';
let injected = false;

export function isAdsAllowedHost() {
  return typeof window !== 'undefined' && ALLOWED_HOSTS.includes(window.location.hostname);
}

export function isAdsAllowedPath(path) {
  const clean = String(path || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return CONTENT_PATHS.has(clean);
}

function notifyChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('apex-ads-state'));
}

// Only used as best-effort cleanup. It cannot undo requests already made;
// blocking loading before consent is the actual protection.
function scrubAdCode() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('script[src*="pagead2.googlesyndication.com"]')
    .forEach((script) => script.remove());
  document.querySelectorAll('ins.adsbygoogle, iframe[src*="googlesyndication"], iframe[src*="google_ads"]')
    .forEach((element) => { if (!element.closest('.apex-ad-slot-wrapper')) element.remove(); });
  injected = false;
}

/** Maintenance must be confirmed off; defaults to off even on production. */
export function setAdsEnabled(on) {
  maintenanceClear = Boolean(on);
  if (!areAdsAllowed()) scrubAdCode();
  notifyChange();
}

/** Content routes only; never admin, gates, privacy, errors or empty pages. */
export function setAdsRoute(path) {
  currentPath = String(path || '');
  if (!areAdsAllowed()) scrubAdCode();
  notifyChange();
}

/** No ad request is possible in the delivered configuration. */
export function areAdsAllowed() {
  return ADS_LAUNCH_READY && isAdsAllowedHost() && maintenanceClear && isAdsAllowedPath(currentPath);
}

/** The host, route, maintenance AND launch guard are rechecked at the sink. */
export function ensureAdSenseScript() {
  if (!areAdsAllowed() || typeof document === 'undefined') return false;
  if (injected) return true;
  injected = true;
  window.adsbygoogle = window.adsbygoogle || [];
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
  document.head.appendChild(script);
  return true;
}
