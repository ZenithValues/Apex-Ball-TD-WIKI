// Advertising via AdsTerra (Native Banner, 320x50 Mobile Banner, 728x90 Desktop Banner).
// Test Realm (zenithvalues.github.io) NEVER serves ads.
// Production (apexballvalueswiki.github.io) serves AdsTerra ads only on allowed
// content routes when maintenance is clear, VITE_ADS_ENABLED !== 'false', and
// the visitor has opted into advertising via Privacy Choices.
import { adsConsentAllowed } from './privacyChoices';

export const ADS_LAUNCH_READY = import.meta.env.VITE_ADS_ENABLED !== 'false';

const PRODUCTION_HOSTS = new Set(['apexballvalueswiki.github.io']);
const TEST_REALM_HOSTS = new Set(['zenithvalues.github.io']);

const CONTENT_EXACT = new Set([
  '/',
  '/wiki',
  '/wiki/compare',
  '/wiki/maps',
  '/wiki/traits',
  '/values',
  '/values/calculator',
  '/values/afford',
  '/minigames',
  '/minigames/ball-knowledge',
  '/minigames/ballonomics',
  '/minigames/balling',
  '/fanart',
]);

const CONTENT_PREFIXES = ['/wiki/', '/values/'];

const EXCLUDED_EXACT = new Set([
  '/privacy',
  '/terms',
  '/cookies',
  '/cookie-policy',
  '/disclaimer',
  '/legal',
  '/about',
  '/contact',
  '/credits',
  '/changelog',
  '/achievements',
  '/bug-report',
  '/theme-editor',
  '/themes',
  '/invite',
  '/admin',
]);

const DEFAULT_BANNER_BASE = (import.meta.env.VITE_ADSTERRA_BANNER_BASE || 'https://www.highperformanceformat.com').replace(/\/+$/, '');
const DEFAULT_NATIVE_URL = import.meta.env.VITE_ADSTERRA_NATIVE_URL || 'https://www.effectivegatecpm.com/e0c885251e9929836e281ac4ae518b0c/invoke.js';

export const ADSTERRA_PLACEMENTS = Object.freeze({
  native: Object.freeze({
    id: 'native',
    format: 'native',
    key: 'e0c885251e9929836e281ac4ae518b0c',
    containerId: 'container-e0c885251e9929836e281ac4ae518b0c',
    invokeUrl: DEFAULT_NATIVE_URL,
  }),
  banner320x50: Object.freeze({
    id: 'banner320x50',
    format: 'iframe',
    key: '7b13c295ef63ac5deb4e243191de0df6',
    width: 320,
    height: 50,
    invokeUrl: `${DEFAULT_BANNER_BASE}/7b13c295ef63ac5deb4e243191de0df6/invoke.js`,
  }),
  banner728x90: Object.freeze({
    id: 'banner728x90',
    format: 'iframe',
    key: '1dc2e19c430f34e5e1d924aeb166ae89',
    width: 728,
    height: 90,
    invokeUrl: `${DEFAULT_BANNER_BASE}/1dc2e19c430f34e5e1d924aeb166ae89/invoke.js`,
  }),
});

let maintenanceClear = false;
let currentPath = '';

export function isTestRealmHost() {
  if (typeof window === 'undefined') return false;
  const host = String(window.location?.hostname || '').toLowerCase();
  return TEST_REALM_HOSTS.has(host) || host.includes('zenithvalues');
}

export function isAdsAllowedHost() {
  if (typeof window === 'undefined' || isTestRealmHost()) return false;
  const host = String(window.location?.hostname || '').toLowerCase();
  return PRODUCTION_HOSTS.has(host);
}

export function isAdsAllowedPath(path) {
  const clean = String(path || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (EXCLUDED_EXACT.has(clean) || clean.startsWith('/admin/')) return false;
  if (CONTENT_EXACT.has(clean)) return true;
  return CONTENT_PREFIXES.some((prefix) => clean.startsWith(prefix));
}

function notifyChange() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('apex-ads-state'));
  }
}

export function scrubAdCode() {
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
  document.querySelectorAll('script[data-apex-adsterra="true"]').forEach((el) => el.remove());
  document.querySelectorAll('[data-apex-adsterra-container="true"]').forEach((el) => {
    el.innerHTML = '';
  });
}

export function setAdsEnabled(on) {
  maintenanceClear = Boolean(on);
  if (!areAdsAllowed()) scrubAdCode();
  notifyChange();
}

export function setAdsRoute(path) {
  currentPath = String(path || '');
  if (!areAdsAllowed()) scrubAdCode();
  notifyChange();
}

export function areAdsAllowed() {
  return ADS_LAUNCH_READY
    && isAdsAllowedHost()
    && adsConsentAllowed()
    && maintenanceClear
    && isAdsAllowedPath(currentPath);
}

export function resolvePlacement(placement, isMobile = false) {
  if (placement === 'native') return ADSTERRA_PLACEMENTS.native;
  if (placement === 'banner320x50') return ADSTERRA_PLACEMENTS.banner320x50;
  if (placement === 'banner728x90') return ADSTERRA_PLACEMENTS.banner728x90;
  if (placement === 'banner' || placement === 'home' || placement === 'calculator') {
    return isMobile ? ADSTERRA_PLACEMENTS.banner320x50 : ADSTERRA_PLACEMENTS.banner728x90;
  }
  return null;
}

export function buildAdsterraBannerSrcDoc(spec) {
  if (!spec || spec.format !== 'iframe') return '';
  const safeKey = String(spec.key || '').replace(/[^a-f0-9]/gi, '');
  const width = Number(spec.width) || 320;
  const height = Number(spec.height) || 50;
  const invokeUrl = String(spec.invokeUrl || '');
  const optionsJson = JSON.stringify({
    key: safeKey,
    format: 'iframe',
    height,
    width,
    params: {},
  });
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; display: grid; place-items: center; }
    </style>
  </head>
  <body>
    <script type="text/javascript">var atOptions = ${optionsJson};</script>
    <script type="text/javascript" src="${invokeUrl}"></script>
  </body>
</html>`;
}
