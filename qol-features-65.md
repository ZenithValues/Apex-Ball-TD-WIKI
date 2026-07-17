# 65 Advanced & Distinct QoL Features for APEX TD Wiki & Values

This document defines **65 unique, technical, and gameplay Quality of Life (QoL) features** tailored specifically for APEX TD Wiki & Values, featuring zero duplicates and incorporating the requested **Instant Search**, **Persistent Theme Preferences**, **Advanced Theme Editor Page (`/theme`)**, and **Compact Number Suffixes (K, M, B)**.

---

### 🎨 Customization & Theme Overhaul (1–15)
1. **Dedicated Theme Editor Dashboard (`/theme`)**: Full-screen independent page featuring live CSS variable injection, palette generators, and real-time UI component stress-testing.
2. **Persistent Theme Preferences**: Cryptographically secure local storage sync preserving custom primary/secondary accents, animation speeds, and glassmorphism levels across sessions.
3. **Community Theme Share Codes**: Short base64 hash strings allowing users to export and import complete color palettes instantly.
4. **WCAG Contrast Auto-Validator**: Real-time ratio calculator warning users if custom theme background/text combinations fail accessibility standards.
5. **Dynamic Font Weight Slider**: Adjust global font rendering weight (boldness) from 700 to 900 for optimal readability on OLED vs. LCD screens.
6. **Custom Glassmorphism Blur Control**: Slider controlling backdrop blur intensity (`backdrop-filter: blur(Xpx)`) across modal cards and navigation bars.
7. **Retro CRT Scanline Overlay**: Toggleable nostalgic CRT monitor scanline filter with adjustable opacity for vintage tower defense vibes.
8. **Subtle Sci-Fi Audio Synthesizer**: Web Audio API-powered tactile click and hover sound effects with master volume control.
9. **Holographic Particle Density Engine**: Toggle floating background data embers and matrix dust particles with zero GPU lag.
10. **Animated Neon Border Shaders**: Custom CSS conic-gradient rotating border animations for pinned favorite unit cards.
11. **High-Contrast Monochromatic Mode**: Instant accessibility toggle stripping color gradients and relying on high-contrast black/white typography.
12. **Layout Density Switcher**: Toggle between immersive spacious card view and compact high-density spreadsheet view.
13. **Custom Wallpaper Image URL**: Inject any direct image URL as a background wallpaper with automatic darkness dimming masks.
14. **Cursor Neon Trail Effects**: Configurable trailing particle spark effect following mouse movements across interactive elements.
15. **Theme Export/Import JSON**: Complete backup and restore of user interface preferences via JSON files.

---

### 🔍 Advanced Search, Filtering & Navigation (16–30)
16. **Instant Fuzzy Search Indexing**: Client-side Lunr/Fuse-powered instant search indexing all entities with sub-5ms response times.
17. **Advanced Query Syntax**: Search operators supporting range and attribute filtering (e.g., `rarity:mythic cost<5000 dps>200`).
18. **Recent Search History Dropdown**: Quick access dropdown displaying the last 8 unique search queries with one-click clear.
19. **Keyboard Command Palette (`Ctrl+K`)**: Spotlight-style modal to jump to any page, open trade calculator, or toggle themes instantly.
20. **Pinned Favorites Bookmark Bar**: Customizable top bar anchoring up to 10 frequently accessed units or tools.
21. **Interactive Breadcrumb Dropdowns**: Single-click category switching directly from breadcrumb trail paths.
22. **Smart Tag Multi-Select Filter**: Combine multiple tactical tags (e.g., `Splash` + `Stun` + `Air`) with AND/OR logic toggles.
23. **Quick Slug Clipboard Copy**: One-click button on entity headers to copy markdown link or raw slug.
24. **QR Code Generator for Share URLs**: Popup QR code generator for sharing trade calculator links via mobile devices.
25. **Print-Optimized CSS Stylesheets**: Clean printer-friendly layout stripping sidebars and nav elements when exporting unit sheets.
26. **Split-Screen Unit Comparison Mode**: Compare two or three units side-by-side in a responsive split-column layout.
27. **Patch Version Diff Viewer**: Side-by-side visual diff highlighting stat changes between game updates.
28. **Lore Pronunciation Audio Tool**: Synthesized speech playback for complex unit names and lore snippets.
29. **Infinite Scroll vs. Pagination Toggle**: User preference setting to switch between lazy load infinite scrolling and numbered pages.
30. **Recently Viewed Drawer**: Slide-out drawer tracking browsing session history for quick re-visits.

---

### 🧮 Trade Calculator & Economy (31–45)
31. **Compact Number Suffixes (K, M, B)**: Automatic thousand (K), million (M), and billion (B) abbreviation formatting across the trade calculator and all value tables.
32. **Live Market Price Ticker**: Scrolling marquee ticker header tracking community trade value trends.
33. **Trade Profit Margin & ROI Calculator**: Automatically computes net profit, ROI percentage, and value disparity ratios.
34. **Raw Text Trade Importer**: Paste text lists (e.g., `3x Fireball, 1x Iceball`) to auto-populate calculator slots.
35. **Multi-Currency Conversion Toggle**: Instant live recalculation between Base Value, Gems, and Coins.
36. **Value Inflation/Deflation Badges**: Visual trend indicators highlighting units gaining or losing market demand.
37. **Stackable Quantity Multipliers**: Fast quantity multiplier steppers (`+10`, `+50`) for bulk trade balancing.
38. **Trade History Cloud Sync**: Optional user account syncing of saved trade comparisons across browsers.
39. **Community Trade Offer Board**: Public submission board for posting and rating community trades.
40. **Item Scarcity Heatmap**: Color-coded rarity heatmap across trade items for quick visual valuation.
41. **Auto-Balance Suggestion Button**: One-click algorithm calculating exactly what item to add to make a trade 50/50 fair.
42. **Saved Trade Templates**: Name and save reusable trade bundles (e.g., "Standard Carry Package") for instant loading.
43. **Exportable Trade Card Designer**: Customize trade report card backgrounds, watermarks, and badge aesthetics before exporting PNG.
44. **Currency Exchange Rate Estimator**: Community-driven trade ratio reference guide for game currencies.
45. **Historical 30-Day Value Charts**: Interactive SVG line graphs displaying value trajectory over time.

---

### 🛡️ Admin & Editor QoL (46–65)
46. **Batch Value Multiplier Tool**: Apply percentage inflation or deflation across entire rarity tiers in a single operation.
47. **Admin Activity Contribution Graph**: GitHub-style activity matrix tracking edit frequencies per admin.
48. **Conflict Resolution Merge Tool**: Side-by-side diff resolver when concurrent admin edits conflict on the same entity.
49. **Scheduled Global Value Releases**: Set future timestamps for value updates to go live automatically during patches.
50. **Markdown Preview Split-Editor**: Side-by-side live preview when editing wiki descriptions and patch logs.
51. **AI-Assisted Image Background Removal**: Smart cropping and background isolation when uploading raw unit renders.
52. **Bulk CSV Data Importer**: Drag-and-drop CSV importer for updating large batches of unit stats or item values.
53. **Admin Quick-Action Floating Dock**: Floating action bar for fast saving, previewing, and resetting edits without scrolling.
54. **Audit Log CSV/JSON Exporter**: Download raw audit change logs for transparency and external reporting.
55. **Test Environment Sandbox Toggle**: Sandbox toggle to test experimental stat changes locally without touching production tables.
56. **Role Permission Matrix Modal**: Interactive visual guide detailing exact capabilities per admin role.
57. **Broken External Image Link Crawler**: Automated scanner detecting and flagging dead image URLs in wiki overrides.
58. **Session Expiry Warning Banner**: Proactive countdown banner before Supabase auth tokens expire with one-click refresh.
59. **Active Session Security Log**: Track active IP addresses and client devices currently logged into the admin portal.
60. **Discord Webhook Broadcaster**: Automatic webhook notifications dispatched to Discord whenever global values or custom units are saved.
61. **Cache Purge & Prerender Trigger**: One-click button to clear CDN/browser cache and rebuild static pages.
62. **Editor Auto-Recovery Drafts**: LocalStorage auto-save capturing unsaved form drafts every 5 seconds to prevent browser crash loss.
63. **Interactive Stat Curve Simulator**: Visual graph simulator testing custom damage, range, and cooldown growth curves.
64. **Site-Wide Announcement Banner Injector**: Admin tool to broadcast emergency notices or patch alerts at the top of all pages.
65. **Supabase Database Health Widget**: Real-time monitoring dashboard displaying API latency, table row counts, and storage bucket quotas.
