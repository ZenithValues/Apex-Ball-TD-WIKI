# Release handoff — October 31, 2026

This archive contains source changes only. Neither the shared worker nor either hosted website was deployed as part of this update.

## What changed

- The landing hero rotates **only the 17 supplied images**, in the supplied order, every five seconds. `src/data/heroArtwork.js` is the explicit collection; it is independent of the live unit database. The selected theme accent tints the artwork. Previous, next and pause controls remain available, and reduced-motion settings stop automatic rotation.
- The 17 supplied images are also optional interface decoration across Home, Wiki, Values, Calculator, Minigames and Achievements. They are not replacements for unit pictures: normal and shiny Wiki/Values images retain their existing explicit/live/cached/fallback lookup. The hero keeps the transparent silhouettes intact; the extra whitespace around Party Man is adjusted with CSS rather than changing the source pixels.
- Lenis provides eased wheel and anchor scrolling across routes while touch keeps native momentum and nested controls retain their own scrolling. System reduced motion, the site's reduced-motion and animation-off settings, and the smooth-scroll opt-out are respected. The subtle 3D star field is lazy-loaded only on supported fine-pointer devices; touch, reduced-motion, scene-disabled and WebGL-failure cases use a static fallback.
- Ordinary copy is not selectable and text-specific hover changes are suppressed, as requested. Editable inputs, textareas and contenteditable fields remain selectable; controls retain their click, focus and keyboard behavior. The mobile report shortcut sits beside search instead of obscuring page content.
- Montserrat is used across the interface, including value displays. Theme controls include glass, hero tint, motion and scene settings. Shared dropdowns and official MIT-licensed Coolicons are bundled; see `COOLICONS-LICENSE.txt`.
- Spreadsheet editing loads existing values, preserves unedited fields and notes, retains filtered edits and validates a batch before queueing it. Publishing is blocked until the coordinated worker update is available.
- The shared activity feed is separated from browser-local actions. The updated worker reports audit-write failures and archives entries before they leave its recent lists. A previous field snapshot can be applied from the log; that operation merges the prior fields and does not remove later-added fields.

## Verification

- `npm test`: 168 tests passed in 29 files. `npm run lint`: 0 errors, 96 warnings. Worker syntax and the CRLF-aware Git diff check passed.
- The production build and prerender completed for 758 routes. The lazy-loaded Three.js chunk produces a size warning; it was not requested by the tested mobile, headless Firefox and reduced-motion fallbacks. A staging-base build and navigation under `/Apex-Ball-TD-WIKI/` were also checked.
- Chromium and Firefox checks covered the five-second automatic transition, pause/play and all 17 exact supplied images and wraparound, live theme tint, 320–1440px layouts, extra-large type and reduced motion. An accelerated Chromium traversal visited all 17 images; rotation paused offscreen and a mocked database update did not alter the hero collection. A broken asset displayed a generic placeholder rather than unrelated unit art.
- Normal and shiny Overclocked Overlord Wiki pages were checked against their original live-image data in both browsers. The four newly supplied images were verified as additional interface decoration. Earlier checks covered nested scrolling, editable text and native mobile touch momentum.
- The build's live data bake was tested, then the archive's existing static fallback snapshot was restored rather than silently changing packaged data. The running site continues to fetch the shared live database and normal deployment builds bake a fresh public snapshot. No live admin data was modified during verification.

## Before any deployment

Read `LAUNCH_COMPLIANCE.md` in full. The deployed worker was still `2026-09-02.1` when last checked on October 30; the source in this archive reports `2026-10-30.2`. Back up the shared KV and coordinate the worker and both frontends, including credential rotation, before deploying. Spreadsheet publishing and applying prior log fields require the updated worker. KV audit and concurrency behavior remain best effort, not transactional; previously deleted history cannot be reconstructed by this update.

The live unauthenticated bug-report endpoint returned HTTP 200 when checked without retrieving report bodies. Have the authorized operator assess the exposure and deploy the protections after review. Ads remain disabled. Operator identity/contact, privacy/legal review for an audience including children under 13, and the CMP decision are still pending. The staging UI gate does not make public static hosting private. Deployment helpers must be reviewed before use; the shell helpers use force push.
