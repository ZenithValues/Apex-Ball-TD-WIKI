// ============================================================================
// ADSENSE POLICY GUARD — ads may ONLY serve on the production host, on real
// content pages. Google AdSense policy forbids ads on screens with no
// publisher content (login screens, maintenance, 404s, "under construction"
// / testing realms). Enforcement:
//   1. The AdSense loader script is NOT in index.html. It is injected here,
//      once, only when the hostname is the production site.
//   2. AdSlot renders nothing until that check passes — so the prerendered
//      HTML, the Test Realm (staging), the access gate, the maintenance
//      page and the 404 page never contain or load ad code.
//   3. AdSlot is only used on content-rich pages (Home, WIKI, Values,
//      Trade Calculator).
// ============================================================================
const AD_CLIENT = 'ca-pub-2832011907708910';
const ALLOWED_HOSTS = ['apexballvalueswiki.github.io'];

let injected = false;

/** True only on the production host (never staging, localhost, or SSG). */
export function isAdsAllowedHost() {
  if (typeof window === 'undefined') return false; // prerender/SSG: no ads in static HTML
  return ALLOWED_HOSTS.includes(window.location.hostname);
}

/** Inject the AdSense loader once (production only). Safe to call often. */
export function ensureAdSenseScript() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  window.adsbygoogle = window.adsbygoogle || [];
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
  document.head.appendChild(script);
}
