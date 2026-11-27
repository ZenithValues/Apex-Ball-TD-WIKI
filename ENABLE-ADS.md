# AdsTerra Advertising Configuration

Advertising is powered by **AdsTerra** with three placements configured in `src/utils/ads.js` and rendered via `src/components/AdSlot.jsx`:

| Placement | Format | Key / Container | Where Rendered |
|---|---|---|---|
| **Native Banner** | Async container (`container-e0c885251e9929836e281ac4ae518b0c`) | `e0c885251e9929836e281ac4ae518b0c` | Landing page, WIKI Hub, Values Hub |
| **Desktop Leaderboard** | `728×90` sandboxed iframe | `1dc2e19c430f34e5e1d924aeb166ae89` | Responsive banner slot (`>= 768px`) on Landing & Trade Calculator |
| **Mobile Banner** | `320×50` sandboxed iframe | `7b13c295ef63ac5deb4e243191de0df6` | Responsive banner slot (`< 768px`) on Landing & Trade Calculator |

## Safety & Gating Rules

1. **Test Realm block:** `zenithvalues.github.io` never serves ads (`isTestRealmHost()` hard-blocks).
2. **Consent gate:** Visitors opt in via the first-party **Privacy choices** banner (`adsConsentAllowed()`).
3. **Excluded routes:** `/privacy`, `/terms`, `/cookies`, `/disclaimer`, `/about`, `/contact`, `/admin`, `/theme-editor`, and unknown 404 routes never render ads.
4. **Kill switch:** Set `VITE_ADS_ENABLED=false` in GitHub Actions variables to turn all ads off without code changes.
5. **Optional host overrides:** Set `VITE_ADSTERRA_NATIVE_URL` (your full `https://pl.../e0c885251e9929836e281ac4ae518b0c/invoke.js` URL from the AdsTerra dashboard) or `VITE_ADSTERRA_BANNER_BASE` if AdsTerra assigns a custom invoke host.
