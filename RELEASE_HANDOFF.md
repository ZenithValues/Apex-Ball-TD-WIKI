# Release handoff — October 30, 2026

This archive contains source changes only. Neither the shared worker nor either hosted website was deployed as part of this update.

## What changed

- The landing page has been redesigned around a spacious editorial composition: oversized type, existing game cutouts, a quieter navigation, restrained controls, and sections for the live values, wiki and calculator. Its colors follow the selected theme.
- The unit-image lookup is restored to its original behavior, including shiny variants: explicit/live/cached wiki artwork and the project's original fallbacks take precedence. The 13 supplied images are optional website icons, **not replacement unit artwork**; three are used only as decorative links on the landing page.
- Montserrat is used across the interface, including value displays. Theme controls include glass, hero tint, motion and scene settings.
- A subtle, lazy-loaded 3D star field responds to scrolling on supported fine-pointer devices. Touch, reduced-motion, scene-disabled and WebGL-failure cases use a static fallback. Desktop fine-pointer scrolling uses Lenis; touch and reduced motion use native scrolling.
- Spreadsheet editing loads existing values, preserves unedited fields and notes, retains filtered edits and validates a batch before queueing it. Publishing is blocked until the coordinated worker update is available.
- The shared activity feed is separated from browser-local actions. The updated worker reports audit-write failures and archives entries before they leave its recent lists. A previous field snapshot can be applied from the log; that operation merges the prior fields and does not remove later-added fields.
- Shared dropdowns and official, MIT-licensed Coolicons are bundled. See `COOLICONS-LICENSE.txt`.

## Verification

- `npm test`: 163 tests passed in 27 files.
- `npm run lint`: 0 errors, 96 warnings.
- Production build and prerender: 758 routes. The lazy-loaded Three.js chunk produces a size warning; it is not preloaded or requested by the tested mobile and reduced-motion fallbacks. A staging-base build was also checked.
- Chromium and Firefox checks covered the landing page on phone, tablet and desktop widths, carousel and sample-trade keyboard controls, theme and reduced-motion fallbacks, and the original image URLs. Mocked admin checks covered spreadsheet saving and shared log details. No live admin data was modified during these checks.

## Before any deployment

Read `LAUNCH_COMPLIANCE.md` in full. The deployed worker was still `2026-09-02.1` when last checked; the source in this archive reports `2026-10-30.2`. Back up the shared KV and coordinate the worker and both frontends, including credential rotation, before deploying. Spreadsheet publishing and applying prior log fields require the updated worker. KV audit and concurrency behavior remain best effort, not transactional; previously deleted history cannot be reconstructed by this update.

The live unauthenticated bug-report endpoint returned HTTP 200 when checked without retrieving report bodies. Have the authorized operator assess the exposure and deploy the protections after review. Ads remain disabled. Operator identity/contact, privacy/legal review for an audience including children under 13, and the CMP decision are still pending. The staging UI gate does not make public static hosting private. Deployment helpers must be reviewed before use; the shell helpers use force push.
