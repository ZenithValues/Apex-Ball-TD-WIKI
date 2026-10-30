# Release handoff — October 30, 2026

This archive contains source changes only. Neither the shared worker nor either hosted website was deployed as part of this update.

## What changed

- The landing showcase follows the selected theme. Montserrat is used across the interface, including value displays.
- Thirteen provided unit images are integrated; existing dedicated shiny art takes precedence over a normal-image fallback.
- Spreadsheet editing loads existing values, preserves unedited fields and notes, retains filtered edits and validates a batch before queueing it. Publishing is blocked until the coordinated worker update is available.
- The shared activity feed is separated from browser-local actions. The updated worker reports audit-write failures and archives entries before they leave its recent lists. A previous field snapshot can be applied from the log; that operation merges the prior fields and does not remove later-added fields.
- Theme controls include glass, hero tint, motion and scene settings. The new 3D scene is loaded only on supported fine-pointer devices; touch, reduced-motion and WebGL-failure cases receive a static fallback. Desktop fine-pointer scrolling uses Lenis; touch and reduced motion use native scrolling.
- Shared dropdowns and official, MIT-licensed Coolicons are bundled. See `COOLICONS-LICENSE.txt`.

## Verification

- `npm test`: 161 tests passed in 26 files.
- `npm run lint`: 0 errors, 96 warnings.
- Production build and prerender: 758 routes. The lazy-loaded Three.js chunk produces a size warning; it is not preloaded for the initial page or requested by the tested mobile fallback.
- Mocked desktop and mobile checks covered Chromium and Firefox pickers; Chromium checks also covered spreadsheet saving, shared log details, themes and the production build. No live admin data was modified during these checks.

## Before any deployment

Read `LAUNCH_COMPLIANCE.md` in full. The deployed worker was still `2026-09-02.1` when last checked; the source in this archive reports `2026-10-30.2`. Back up the shared KV and coordinate the worker and both frontends, including credential rotation, before deploying. Spreadsheet publishing and applying prior log fields require the updated worker. KV audit and concurrency behavior remain best effort, not transactional; previously deleted history cannot be reconstructed by this update.

The live unauthenticated bug-report endpoint returned HTTP 200 when checked without retrieving report bodies. Have the authorized operator assess the exposure and deploy the protections after review. Ads remain disabled. Operator identity/contact, privacy/legal review for an audience including children under 13, and the CMP decision are still pending. The staging UI gate does not make public static hosting private. Deployment helpers must be reviewed before use; the shell helpers use force push.
