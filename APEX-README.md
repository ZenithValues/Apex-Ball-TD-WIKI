# APEX WIKI & VALUES — master notes

One file. Everything that still matters about this project: what it is, what is
built, how to ship it, what is deliberately blocked, the unit art that is still
waiting, and the full 150-item suggestion list. Screenshots, demo bundles and
the one-off audits were deleted to save space — the workspace is just the source
tree, the two ZIPs, the kept unit images and this document.

Last updated: **2026-11-13 (Batch 4 · rev 7)** · Build **`2026-11-13-80247edf`** · **958 prerendered pages / 958 social cards** (`routes=958 expected=958 pruned=0`) · Nothing deployed · Ads OFF · R$0

---

## 1. What this is

A fan-made companion site for **Ball Tower Defense** (Roblox): a WIKI for units,
items, maps and skins, plus a live trade-value database with a calculator.
Free hosting on GitHub Pages (`apexballvalueswiki.github.io`), **R$0 spent** — no
domain, DNS, CNAME, paid CMP or purchase. Ads are **OFF**.

- **Values site**: per-unit trade value in value / gems / coins, demand,
  scarcity, status, O/C and N/A markers, trade calculator, "What can I afford?".
- **WIKI site**: units (stats, upgrades, passives), items (artifacts — which now
  include keys —, gamepasses, crates, consumables, currencies, materials),
  skins, maps, traits, reforges, unit compare.
- **Admin panel**: role-gated editors for everything above, self-service team
  accounts, drafts, change log, announcements, bug reports.
- **Worker** (`scripts/cloudflare-proxy-worker.js`): the only backend — KV
  overrides, sessions, roster, O/C ranks, exist counts. **Needs an operator
  deploy** (`WORKER_VERSION` in the file is now `2026-11-03.1` — the build that
  adds batch commits and the write budget. `EXPECTED_WORKER_VERSION` stays
  `2026-11-02.5`, so nothing is blocked while the older worker is still live).

Source of truth lives in `/home/user/_build/apex-td-final/`.

---

## 2. Build & ship

```bash
cd /home/user/_build/apex-td-final
npm run build      # bake data -> social cards -> vite build -> prerender
npm test           # vitest
npm run lint       # oxlint
node scripts/cloudflare-proxy-worker.js --check   # or: node --check
node scripts/prune-cards.mjs                      # delete orphaned social cards
```

- `npm run build` = `bake-data` → `generate-social-cards` → `vite build` → `prerender`.
  Running only `vite build` leaves stale pages/cards — always run the full build
  (or `npm run cards && npx vite build && node scripts/prerender.mjs`).
- Incremental cards: `APEX_CARDS_ONLY_MISSING=1 npm run cards`.
- Deliverables: `/home/user/apex-td-project.zip` (always) and
  `/home/user/apex-td-final.zip` (only on request). Both are source packages —
  `dist/` is excluded and rebuilt by the operator.
- **Deploy order**: deploy the worker FIRST (see `DEPLOY-WORKER.md` inside the
  ZIP), then publish the site. No deploy, push, merge or live KV/site/worker
  write has been performed by me; every "live" claim in the code is a plan until
  the operator runs it.

---

## 3. Locked decisions (do not silently reverse)

| Decision | Detail |
|---|---|
| **Keys = Artifacts** | One section: `/wiki/artifacts` lists group `Artifact` **and** legacy `Key` rows. `/wiki/keys*` redirects there. There is no Keys page. |
| **No shiny skins** | The shiny-skin system was removed entirely (page, route, data, creator, cards). Shiny **unit** variants (Shiny Normie … Shiny ???, O/C ranks) are untouched. |
| **Byline format** | `updated by <display name> | <time>` on value cards and unit pages. Emails are mapped to roster display names and never rendered. |
| **Notes & Rationale** | Removed from the admin panel and the spreadsheet. |
| **Unit dividers** | Lists group Standard → Seasonal → Exclusive → Limited → Unobtainable with `── // SEASONAL // ──` bars. |
| Ads | OFF. No paid CMP, no static ad script. Needs `VITE_ADS_ENABLED`, a free certified CMP URL and legal review first. |
| Hosting | `github.io` only. No custom domain. |
| Artwork | Never generate, source or substitute artwork. Material/item art waits for the operator's images. |
| Exist counts | Must be fully automatic from a sanctioned machine-readable source. No bots, headless agents, scraping, OCR, executors, or manual snapshots as the final answer. |
| Privacy | Staff emails never rendered publicly; the worker and the bake both strip author fields. |
| **Coin-keyed gem ladder** | The gem↔coin rate is expressed **per coin amount**: ≤1k = 100 🪙 = 1 💎, 1k–10k = 95, 10k–100k = 88, 100k–1M = 80, 1M–10M = 72, 10M–50M = 66, 50M–100M = 60, **100M+ coins = 55**. Never write "100M+ gems = 1:55". |
| **Two currencies only** | `ITEM_CURRENCIES = ['Gems', 'Coins']`. EXP and Christmas Tokens were deleted outright — not kept as "not tradable" rows. |
| **Every skin rarity has its own colour** | Skins use `SKIN_RARITY_COLORS` (silver / green / sky / purple / amber / rose / cyan / white). A skin rarity shares a *name* with a unit rarity, never its colour. |
| **Persistent identity** | An admin login survives a reload for **30 days** (localStorage, mirrored to sessionStorage); achievement progress always persists — it is site state, not analytics. |

---

## 4. Feature inventory

### Public site
Units (list by rarity, detail, search, compare), values (list, detail, search,
calculator, afford), items (artifacts/keys, gamepasses, crates, consumables,
currencies, materials, generic items), skins, maps, traits, reforges, minigames
(Balling, Ballonomics, Ball Knowledge), achievements, theme studio, changelog,
credits, about/contact, legal pages, bug report, fan art, invite claim.

### Values pages (rev 8)
- `/values/units*` (rarity lists + detail), `/values/calculator`, `/values/afford`,
  and one page per item family:
  `/values/artifacts`, `/values/gamepasses`, `/values/crates`, `/values/consumables`,
  `/values/materials`, `/values/items` — each with the same value pillow as a unit card.
- Every one of those routes is registered in `scripts/lib/route-manifest.mjs`, so it
  ships prerendered HTML **and** a greyscale social card (960 routes / 960 cards).

### Values + WIKI data
- Value row: `base_value`, `base_value_max`, `gems`, `gems_max`, `coins`,
  `coins_max`, `demand`, `scarcity`, `trend`, `getsOverpays`, `getsUnderpays`,
  `updated_at`, `updated_by_name`.
- `O/C` (overpay/check) and `N/A` markers are preserved as text, never turned
  into `0`; a marker clears any stale range.
- Rarity value floors (`src/utils/valueRules.js`) keep zero rows from showing 0;
  the Shiny O/C ranking is editable by Owner + Hellfire only.
- Update bylines resolve through `src/utils/publicName.js`.

### Admin (`/admin`)
- **Sidebar dropdown menus**: Start here · Editors (Values, WIKI, Maps, Crates,
  Materials, Skins, Traits, Reforges) · Create · Community.
- **Top-bar "Go to…" dropdown** plus the original quick pills.
- **Team & access** is a dropdown section (open by default): create / rename /
  re-role / remove accounts, invite links, passcode reset, presence, O/C editor.
- **Create hub** picks the entity type from a dropdown: Unit, Map, Skin,
  Material, Trait, Reforge, Item (gamepass / artifact+key / crate / consumable /
  currency / skin / material / generic).
- **Editors**: Values (form + spreadsheet), WIKI, Maps, Crates (odds, pity,
  effect), Materials, Skins (with artwork upload), Traits, Reforges — each with
  a searchable dropdown picker.
- Drafts per slug, stale-form warning, multi-step undo, change log, blame log,
  contribution graph, announcement studio, bug-report triage.

### Worker endpoints (already in the repo, awaiting deploy)
`/status`, `/overrides`, `/overrides/version`, `/overrides/wait`,
`/overrides/restore-backup`, `/changes`, `/history/:section/:slug`, `/roles`,
`/login`, `/session`, `/logout-all`, `/change-password`, `/announcements`,
`/maintenance`, `/bug-reports`, `/fanart`, `/exist-counts`,
`/exist-counts/publish`, `/deletedunits`, `/admin/roster`, `/admin/accounts`,
`/admin/invite`, `/admin/reset-passcode`, `/oc-ranks`, `/admin/oc-ranks`, `/time`,
`/health`.

---

## 5. Change log

**LATEST PASS — rev 8 (2026-11-13).** Build `2026-11-13-dfd4882e`, **959 routes / 959 cards**.

**rev 8 — the eight operator items**

1. **Values now update on the first load.** Root cause was *browser HTTP caching of the
   live bundle*, which is why "clear your cookies" appeared to fix it. `fetchKvBundle()`
   is now always `cache: 'no-store'`; `applyBundle()` refuses any bundle whose `__v` is
   older than the version this device already has; `syncFromKV()` compares the payload's
   `__v` with `/status`'s `v` and re-asks cache-busted (`?__=<ts>`) when they disagree.
   A new `apex-cache-bundle-version-v1` key records the snapshot version, so a warm
   visitor no longer downloads 7.5 MB to see the same numbers, and can never be served
   an older snapshot by an edge cache.
2. **Gem↔coin ladder re-keyed on coins** (`src/utils/currencyConversion.js`):
   `GEM_COIN_BANDS`, `rateForCoins()`, `coinsToGems()`, `gemsToCoins()` (band-walking, so
   the two are exact inverses) and `rateLabel()`. **The Values → Currencies page was then
   removed entirely on operator request** (route, sidebar entry, page component, CSS,
   prerender entry and social card — `/values/currencies` now 404s); the ladder lives on
   as a utility only.
3. **EXP and Christmas Tokens deleted** — gone from the taxonomy, the value editor, the
   value cards and the currencies page; `NON_TRADABLE_CURRENCIES` no longer exists.
4. **Values pages for the other item families.** `/values/artifacts`, `/gamepasses`,
   `/crates`, `/consumables`, `/materials`, `/items` — each one merges the built-in
   database, its dedicated KV lane and the generic item lane, and renders the *same*
   value pillow as a unit card. Non-unit rows now join the value index
   (`itemValueEntries` in `DataContext`), so an artifact / gamepass / crate value saved in
   the admin panel is publicly readable.
5. **Icons for the item families.** `src/config/itemIcons.js` is the single map
   (artifact 🗝️, gamepass 🎟️, crate 📦, consumable 🧪, material 🪨, currency 💎,
   item 🎒, skin 🎨, map 🗺️, trait 🧬) used by the WIKI "Browse WIKI sections" tiles
   (previously text-only), the Values item pages, the admin tabs and the search.
6. **Every skin rarity gets its own colour** — `SKIN_RARITY_COLORS` + `getSkinRarityColor()`,
   applied to the skin list headers, cards, detail badges and facts.
7. **Persistent login and persistent achievements.** `adminSession.js` keeps the editor
   signed in for 30 days (a lapsed worker token falls back to the passcode instead of
   signing out). Achievement progress is always written to
   `apex-achievement-progress-v1` — the old `localStatsAllowed()` gate silently threw it
   away whenever a visitor declined optional statistics; that was analytics logic in a
   functional feature and is gone.
8. **"What can I afford?"** now sorts **by rarity** by default (the "Best value (closest
   to budget)" sort was removed), the "Top pick" pillow survives but is the dearest
   **non-shiny** unit in reach — shinies are so expensive they always won it and meant
   nothing — and O/C / Shiny Omega rows stay in the visible window instead of being cut
   off by the 120-card cap.

**rev 8 follow-ups (same day, build `2026-11-13-5917cae2`, 959 routes)**

- **Values → Currencies page removed entirely** — no route, no sidebar entry, no page
  component (`ValuesCurrencies.jsx` / `.css` deleted), no prerender/social-card entry.
  `/values/currencies` is a 404 again. The coin-keyed ladder stays as
  `src/utils/currencyConversion.js` because the data is still correct; the WIKI
  Currencies section (`/wiki/currencies`) is untouched.
- **`EXPECTED_WORKER_VERSION` was one release behind the worker** (`2026-11-02.5` vs
  `2026-11-03.2`), so the admin dashboard reported "Outdated — deploy pending" for a
  worker that was actually newer. Both now read `2026-11-03.2`.
- **Item & gear editors (operator: "create editors for the missing items & gears")** —
  Artifacts, Gamepasses, Consumables, Currencies and Items now each have their own admin
  editor (`src/components/admin/ItemFamilyEditor.jsx`, one config-driven component:
  `ITEM_FAMILIES`). Before this they were only reachable through the flat *Create
  anything* form, which piles every non-unit row together and gives every family the same
  six boxes. Each family now declares the KV groups it owns (Artifacts also adopt legacy
  `Key` rows), the built-in list it starts from (Consumables, Currencies) and the fields
  that exist in the game — Artifact: name / rarity / description / effect / obtain / base
  value / artwork; Gamepass: name / Robux price / description / unlocks / where to buy;
  Consumable: name / description / effect / obtain / value; Currency: name / description /
  how you earn it; Item: the full set. Saves go through the same `item` KV lane the public
  pages read, so they are live immediately, each editor links to the public page it just
  wrote, and the five views are in the sidebar **and** the "Go to…" menu.
- **`push.cmd` rewritten** (operator: "I want the UPDATED PUSH.CMD in the zip"): it now
  compares the folder with `origin/main` *before* committing and stops with a loud
  `NOTHING TO PUSH` block + exit code 2 instead of letting git answer
  "Everything up-to-date" into the void; it prints which build is in the folder, the
  remote HEAD and the diff count up front; `push.cmd /dryrun` inspects without pushing
  and `push.cmd /retrigger` makes a deliberate empty commit. `git commit -F <file>`
  is used for the message instead of `-m "%MSG%"` (a message containing
  `"What can I afford?"` was truncated at the quote and the rest of the sentence became
  git pathspecs: `error: pathspec 'can' did not match any file(s)`); `scripts/stamp-build.mjs`
  now also writes `public/BUILD_ID.txt` (bare id, one line) so the release script reads
  the identity instead of parsing JSON — and the build label reads `rev 8` instead of
  the stale `Batch 4`.
- **`DEPLOY-NOW.md` added** to every package: what git's "Everything up-to-date" really
  means, the two-repo trap (project → `ZenithValues/Apex-Ball-TD-WIKI`,
  final → `ApexBallValuesWiki/…github.io`), and how to tell a stale *build* from stale
  *data* via `/build.json`.
- **Demand / Scarcity text back to the original tier colours** — the WORD and the bar fill
  in the value pillow are painted from `DEMAND_COLORS` / `SCARCITY_COLORS` again
  (Abysmal dark red, Godly purple, Flooded red, Rare purple, …), because a fixed green
  "ABYSMAL" read as good news. The `DEMAND` / `SCARCITY` **labels** keep the tooltip
  accents (`#4ade80` / `#fb923c`) asked for earlier, so each row still matches its
  tooltip.

**Previous pass — Batch 4 (2026-11-12).** Details further down this section.

**Passes before this one (November 5, 2026) — all still shipped in this package**
- **monochrome link images**: every prerendered route ships a greyscale social
  card (957 of them), so a shared link never looks like a different site.
- **Grey first, colour second**: the hero rotation paints its art greyscale and
  only reveals colour on hover/active (`HeroShowcase.css`), which keeps the
  landing page calm.
- **Real per-unit icons** instead of generated placeholders, and **live rarity
  counts** on the browse pages.
- **Cache busting** on every live bundle request (`fetchKvBundle({ cacheBust })`
  appends the current version), so a published edit is visible immediately
  instead of after a browser cache expiry.
- **Compare any trade** copy on the trade-calculator preview and the share text.

### 2026-11-12

**Batch 1 — restored pages, bylines, admin cleanup**
- Restored WIKI pages: Artifacts, Gamepasses, Keys, Crates, Consumables,
  Materials, Currencies, generic Items, Skins, Shiny Skins, Maps, Traits,
  Reforges — routes, sidebar, WIKI home grid, search, static nav, prerender
  manifest and social cards.
- Byline is now `updated by <display name> | <time>`.
- `Notes & Rationale` removed from the admin panel and spreadsheet.

**Batch 2 — design overhaul + admin dropdowns**
- **Unit value page rebuilt** into three panels (Market value · Trade behaviour ·
  Market signals) with exact figures under each tile, an origin badge and a meta
  footer.
- **Tooltips redesigned**: real DOM popover with a heading row, body, stat accent
  colour, 2px accent top border and arrow (hover / keyboard focus only).
- **Value card**: Status, Gets Overpays and Gets Underpays now share one grid with
  one 10px gap, so all three strips are exactly the same distance apart.
- **Seasonal / Exclusive dividers** in the values list, the WIKI unit list and on
  the unit detail page.
- **Dropdown menus everywhere**: grouped admin sidebar, top-bar "Go to…",
  Create-hub type picker, Team & access section, and searchable pickers in the
  Materials / Crates / Maps editors.
- **New editors**: Traits, Reforges, Skins. **Fixed**: crate editor now has real
  Pity and Effect fields (it used to write pity into the description), material
  and map pickers are dropdowns and the form re-seeds correctly.
- **Keys merged into Artifacts**; **shiny skins deleted**.
- Page/card count 1045 → **960** (shiny-skin pages gone), stale cards pruned.

**Batch 3 — the editors actually save (2026-11-12, follow-up)**
- **Root cause found**: the public pages read the wrong lane. Crate edits land in
  the `crate` KV section and material edits in `materials`, but
  `/wiki/crates*` and `/wiki/materials*` only read the generic `itemOverrides`
  lane, so saves looked like they vanished. Both the section list and the detail
  page now merge the built-in database + the dedicated lane + itemOverrides
  (live row wins, de-duplicated by slug).
- **Crate content is now real**: the crate editor has *Contents / drop chances*,
  *Crate description*, *Pity* and *Specials & bonuses*, all persisted, and the
  public crate page renders Description → Specials & bonuses → Contents table →
  Pity table → Obtain.
- **Crates and Maps had no save confirmation at all** (the content editor never
  rendered `AdminMessage`). They now show "✅ Saved & published: <slug> (vN)".
- Empty sections are no longer rendered (a material with `obtain: []` printed an
  empty "How to Obtain" heading).
- New regression suite `verify_editors.mjs` (12 checks): saves a crate, a
  material and a map through the real UI, asserts the worker POST, the
  localStorage row, the confirmation message and the public page text.

**Batch 4 — operator nitpicks, premium WIKI, one data story (2026-11-12, latest)**

*Public / values side*
- **Origin dividers breathe**: `46px 0 24px` on `OriginDivider` so
  `----// Seasonal //----` never crowds the cards above or below it.
- **Unit card signal line** rebuilt as a real dashed rule
  (`repeating-linear-gradient` + a brighter `//` slash) instead of a 1px smear —
  the card now visibly reads `----//----`.
- **Demand · scarcity · overpay/underpay without navigating**: the value card
  carries all of it, the stat meta tiles carry demand/scarcity, and every
  tooltip is a **portal** (`position: fixed` on `<body>`, `.term-tip-pop-fixed`)
  with a heading row, an icon and a 2px accent top border, so no
  `overflow: hidden` card can ever clip it.
- **Names are one line**: `.entity-name` / `.entity-card-top` get
  `min-width: 0` + ellipsis, so "Mausoleum Crate" truncates instead of wrapping.
- **Shiny everywhere**: the shiny glow is on the value card, the WIKI unit card
  and the detail page; "Shiny" is no longer part of any unit name and skin pages
  that duplicated shiny variants are gone.
- `GoldenMonkey (GMK)` short-name handling, bylines render
  `Updated by <public name> | <n>h ago` with proper capitalisation, tag pills
  show **no counts**, and the Calculator / Search Values / Search WIKI buttons
  were removed from the unit pages.
- **Landing trade-calculator preview** is a real `Dropdown` component with a
  cancel button, not a fake select.

*Admin side*
- **Spreadsheet mode v3** (`SpreadsheetMode.jsx` rewritten, wired back into
  `AdminHome` through `edits` / `setEdits` / `onSaveRows`): **every** column is
  visible on open, Value / Gems / Coins are each **one editable range field**
  (`1.2K – 1.5K`) instead of a min column plus a max column, demand / scarcity /
  status / overpays / underpays are typed `Dropdown` chips, edited rows are
  flagged on the left edge, the header + unit column are sticky, and under 900px
  the sheet becomes a card list. It still saves through the canonical
  `base_value` + `base_value_max` keys — no new backend lane.
- **Value editor** lost the helper-text spam ("90–100 or 1M–2M …", "K / M / B / T
  supported") while still accepting `1M-2M`; the save button has a gradient
  border and demand / scarcity / trend / overpay / underpay selects are
  accented; the unit search is sorted rarity low → high.
- **Editors match the game, not invented attributes**: crates have name, source
  ("where it comes from"), contents with drop chances, pity and image — the
  invented *Crate description* and *Specials & bonuses* fields are gone; maps
  have name, difficulty and description and **no unlock requirement**; skins
  keep **only Rarity** (no duplicate Category); the Reforge editor is deleted and
  `/wiki/reforges*` redirects to Traits.
- **The content form seeds from the merged item** (`selectedContentItem` +
  `obtainText()`), so saving a bundled crate no longer writes `null` over fields
  the editor never touched.
- **Logs show 1000 entries** (worker `CHANGE_LOG_CAP`, client `MAX_LOG_ENTRIES`,
  120 per page) instead of 200.
- **Soft-lock banner no longer fires on your own publish** (`announceSelfPublish`
  re-baselines the watcher).

*Premium WIKI*
- One shared detail layout, `WikiEntryDetail`
  (`kicker title image accent badges summary facts sections footer crumb`), now
  renders **every** non-unit WIKI entry: crates, materials, consumables,
  currencies, artifacts / keys, gamepasses, items, skins, traits and maps — hero
  block, fact strip, drop table, text sections, footer nav, per-section accent.
- One shared list header, `WikiSectionHeader`
  (`title subtitle count accent actions`), is used by every WIKI list page; the
  generic `/wiki/:section` list (crates, materials, artifacts, gamepasses,
  currencies, consumables) merges the built-in database + the dedicated KV lane
  + `itemOverrides`, and `EntityGrid` gained an `accent` prop that paints a
  top stripe and tints the card. The unused `CratesList.jsx` stub was deleted —
  `/wiki/crates` has always been the shared section page.

*One data story*
- `bake-data.mjs` now passes override rows through verbatim instead of
  whitelisting fields (whitelisting was silently dropping newly added editor
  columns); the snapshot is re-baked with `__v 478`.
- `fetchKvBundle({ cacheBust, attempts: 2, timeoutMs: 25000 })` retries, times
  out cleanly, understands `304 → { __unchanged: true }`, and returns `null`
  instead of throwing; `DataContext` **refuses to downgrade** to a lower `__v`,
  so a failed live fetch can never regress published values.
- The header source chip is now **three honest states**: `LIVE` (worker bundle
  current), `CACHED` (online but the database did not answer — the page says it
  is showing the bundled snapshot, with the reason in the popover) and
  `OFFLINE` (visitor or network forced offline mode). No more "LIVE" label on
  stale numbers.

**Batch 4 · rev 2 (operator review of the sandbox preview)**
- **Shiny cards finally look different from each other.** `getCardGlow()` used to
  return one hard-coded magenta for *every* shiny. It now returns that unit's own
  rarity colour (`shinyAccent()`), and the reserved magenta `#e879f9` is kept
  **only** for shiny Omega and shiny ???. Verified across all nine shiny lists:
  Normie `#C0C0C0`, Odd `#33A033`, Rare `#0CEDE8`, Awesome `#C04DFF`,
  Legendary `#FFB84D`, Mythic `#FF6B6B`, Transcendent `#5FE8A8`,
  Omega/??? `#e879f9`.
- **Shiny cards got more character, tastefully**: a gradient stripe that flows in
  the unit's own colour, a slow diagonal sheen that sweeps the card every 7.5s,
  two tiny corner sparkles, a deeper two-layer halo, and a soft name glow on
  hover. All of it is a single decorative `.card-shiny-fx` layer, it never
  intercepts clicks, and reduced-motion kills the animation and the sheen.
- **The divider spacing bug was real and is fixed**: `OriginDivider.css` had
  `.origin-divider:first-child { margin-top: 10px; }`, and because every divider
  is the first child of its own `<section>`, *every* divider matched it — the
  roomier `46px` was being collapsed to `10px` everywhere. The override is gone
  and the values are now `margin: 62px 0 30px`, so the measured gap above a
  divider is 62px on every values list.
- **Value / Gems / Coins and Demand / Scarcity are one pillow now.** The card
  used to render two separately-bordered boxes joined by a dashed `----//----`
  rule, which read as choppy. They now live inside a single bordered panel split
  by one clean fading hairline (`.uv-row-divider`), and the demand/scarcity words
  are no longer ellipsised (`ABYSMAL` used to clip to `ABYSMA…`).
- **Shiny page headers follow the new colours**: `UnitValueDetail` and the WIKI
  `UnitDetail` hero both take `--rarity-accent` from `getCardGlow(unit)`, so a
  shiny Rare page is cyan, a shiny Mythic page is red, and shiny Omega keeps
  magenta — the header finally matches the card you clicked.
- New regression suite `verify_shiny_dividers.mjs` (**35 checks**): walks every
  shiny rarity, asserts the colour, the sheen layer, the real rendered divider
  gap, the single-panel card, the un-clipped labels, the hero accents and the
  reduced-motion path.

**Batch 4 · rev 3 — a dedicated colour for every shiny (operator request)**
- Shinies no longer borrow their base rarity's colour. `SHINY_GLOWS` in
  `src/data/taxonomy.js` defines one dedicated colour per shiny rarity, and
  `getRarityPalette()` / `getRarityGlow()` / `getCardGlow()` all resolve through
  it, so the card glow, the top stripe gradient, the rarity pill, the list
  header, the hero accent and the admin sheets agree everywhere:

  | Shiny rarity | Colour | reads as |
  |---|---|---|
  | Shiny Normie | `#F7F0CE` | yellowish white |
  | Shiny Odds | `#34E0B6` | aqua green |
  | Shiny Rares | `#2A66F5` | deep blue |
  | Shiny Awesome | `#7A2BD6` | dark purple |
  | Shiny Legendaries | `#FFE33B` | bright / neon yellow |
  | Shiny Mythics | `#FF5C7A` | pinkish red |
  | Shiny Transcendents | `#2E8C6E` | darker aqua-mould green |
  | Shiny ??? | `#FFFFFF` | pure white |
  | Shiny Omega | `#e879f9` | reserved shiny magenta |

- The 6-stop stripe gradient is generated from each shiny colour
  (`shadeHex()` light → dark), so the stripe, the pill and the glow on one card
  are always the same hue — no hand-maintained palette to drift out of sync.
- `baseRarityKey()` deliberately keeps `???` as its own key: only the shiny table
  has a white entry for it, while the plain (non-shiny) `???` palette still falls
  back to Omega, so nothing else shifted.
- `verify_shiny_dividers.mjs` now asserts the exact hex of all nine shiny lists
  (36/36), including `shiny ??? is pure white` and `only shiny Omega keeps the
  reserved magenta`.

**Batch 4 · rev 4 — "it says everything is up to date" (build identity)**
- **Root cause**: the only "up to date" sentence on the site was the admin
  dashboard's worker card — *"Up to date (2026-11-02.5) — all features live."* —
  and it only ever described the **Cloudflare worker**. Nothing on the site said
  which **front-end build** you were looking at, so an old GitHub Pages bundle
  could look "current" forever. Evidence at the time of writing: the live site
  served `assets/index-B9sAomCq.js` with no Batch-4 code in it, and
  `https://apexballvalueswiki.github.io/build.json` returned **404** — i.e. the
  deployed build predates all of Batch 4. Nothing has been deployed from here.
- **Every build now has an identity**: `scripts/stamp-build.mjs` runs first in
  `npm run build` and writes
  - `src/generated/buildStamp.js` — `{ id, hash, date, builtAt, label }` +
    the `RELEASE_ID` used by the service worker,
  - `public/build.json` — the same, fetchable from the deployed site,
  - a rotated `public/sw.js` cache name, so an installed client cannot keep
    serving the previous build's cached assets.
- **Where the stamp shows up**: `<meta name="apex-build">` in the shell **and in
  all 957 prerendered pages** (via a `transformIndexHtml` plugin), `<html
  data-apex-build>` / `data-apex-built-at>` at runtime, `/build.json` on the site,
  and a new **"🧱 Front-end build (this page)"** row in the admin dashboard that
  prints the label, build time and id.
- **The worker line is honest now**: *"Up to date (2026-11-02.5) — server-side
  features live. This only describes the worker, NOT the front-end build below."*
  The build row also states that GitHub Pages only changes after the ZIP is
  pushed, and that `/build.json` matching the dashboard id is the proof a deploy
  landed.
- New suite `verify_build_stamp.mjs` (**14 checks**): build.json shape, the meta
  tag on all 958 HTML files, service-worker cache rotation, the runtime
  `data-apex-build`, `/build.json` served over HTTP, and the admin row + wording.

**Batch 4 · rev 5 — the KV write budget ("KV put() limit exceeded for the day")**
- **There is no bypass.** The 1,000 writes/day cap is enforced by Cloudflare on
  the account, not by this project's code — no header, token, trick or retry
  gets around it, and it resets at **00:00 UTC**. The only real fix is to spend
  far fewer writes, and to fail honestly when they run out.
- **Where the writes went**: every single-row save used to publish the whole
  bundle (`overrides` + meta + backup + change log + one history put per changed
  field). Saving a 40-row spreadsheet did that **40 times** — roughly 200 writes,
  a fifth of the whole day, in one click. Measured cost of one full publish was
  ~5 writes; a batch of 20 rows cost ~100.
- **New `POST /overrides/batch`** in the worker applies many rows in **one
  commit**: one bundle write, one meta write, one change-log write and one
  history put per touched unit. Measured: **20 rows = 16 writes** (was ~100),
  **1 row = 4 writes** (no `backup:previous` churn any more).
- **The worker now counts its own budget** (`KV_DAILY_WRITE_LIMIT = 1000`,
  `BACKUP_MIN_INTERVAL_MS = 15 min`): every KV put goes through `putCounted()`, so
  the `writes` number in a response is exact. Over budget it returns a typed
  refusal instead of a Cloudflare error:
  `429 { code: 'kv_put_quota', resetAt, limit: { writes: 1000, window: 'day (UTC)' }, hint }`
  — **nothing is written when this fires**, so no half-published bundle.
- **`backup:previous` is throttled** to once per 15 minutes, except on a full
  bundle publish (which always refreshes it, so a restore never has to guess).
- **The editor can no longer lose an edit to the cap**: `src/utils/kvQuota.js`
  meters writes locally (~4 per single row, ~4 per batch, ~5 per full publish,
  key `apex-kv-writes-v1`), and `src/utils/publishOutbox.js` is a persistent
  retry queue (`apex-publish-outbox-v1`, merged by section+slug, 500 entries,
  7-day TTL). A quota refusal now means: *"Saved on this device — Cloudflare's
  daily KV write limit is used up, so nothing was published. Everything is queued
  (N pending) and the allowance resets in 3h 12m."* with a **🔄 Retry queued**
  button that flushes the whole queue as **one** commit. The queue survives a
  reload and an admin who comes back later is told it is there.
- **Spreadsheet "Save All" and shiny sync** now each send exactly one batch
  commit instead of one publish per row, and report the KV cost in the success
  message (`· 16 KV writes`).
- **The dashboard shows the budget**: a new **🧾 Cloudflare write budget (free
  plan)** row — `~37 / 1,000 KV writes used today`, a "963 left"/"⚠ Limit
  reached" badge, the reset countdown, the queued-edit count, and the reminder
  that a bulk save goes out as **one commit**.
- **What the cap now buys**: with batching, a 40-row sheet save is ~4–16 writes,
  so 1,000/day is roughly **60–200 sheet saves** instead of ~250 single rows.
- **A stale worker can no longer look capable**: `GET /version` now returns
  `{ version, capabilities: ['batch-commit','kv-write-budget','backup-throttle',
  'exact-put-counting'] }`, and the budget row in the dashboard adds a line from
  `data-admin-batch-capability` — "✓ Batch commits are live on the deployed
  worker", or "⚠ The deployed worker predates batch commits (needs 2026-11-03.1)
  — saves fall back to one publish per row, ~4 writes each." The client already
  falls back to per-row publishes on a `404`, so an undeployed worker is slow,
  never broken — it just says so.
- New suites: `worker_budget_verify.mjs` (**23 checks**, fresh worker module so
  it cannot collide with `worker_verify.mjs`) and `verify_kv_budget.mjs`
  (**22 browser checks**: one batch commit per Save All, the 429 wording, the
  outbox surviving a reload, the retry flush, the dashboard row, and both
  capability states of a live vs stale worker).
  New unit tests: `kvQuota.test.js` (8) and `publishOutbox.test.js` (7).

**Batch 4 · rev 6 — one pillow for every trade number (2026-11-13)**
- **Value / Gems / Coins / Demand / Scarcity / Status live in ONE bordered
  pillow** on both the card and the unit value page, and every pair — including
  demand → scarcity — is separated by the *same* 1px gradient hairline. Status
  stopped being a separate strip; it always renders as a row (a missing
  `unit.trend` is treated as `stable` everywhere, which used to hide the row on
  Normies).
- **Demand is the tooltip's green (`#4ade80`), Scarcity the tooltip's golden
  orange (`#fb923c`)** — `TERM_ACCENTS` in `StatMeta.jsx` is now exported and is
  the single source for both the popover and the rows, so they cannot drift.
- **The origin chip (NORMAL / SEASONAL / EXCLUSIVE / UNOBTAINABLE) is gone** from
  the card: the origin dividers already say it.
- **The card is centred**: artwork → name → rarity → pillow → hairline →
  `[Updated by X | Yh ago]`.
- **The demand bar can never overlap the DEMAND label**: the row is a grid
  (`minmax(0,auto) minmax(0,1fr)`), the bar is `flex: 0 1 34px`, hides under
  `@container (max-width: 240px)`, and the word wraps instead of ellipsising.
- **The unit value page lost its explanatory text and right-hand subtext** — it
  is the same pillow, oversized, plus the overpay/underpay rows.
- `src/components/ValuePillow.jsx` + `ValuePillow.css` are the single definition
  of every trade number; the card and the detail page both render it.
- New suite `verify_value_pillow.mjs` (**27 checks**).

**Batch 4 · rev 7 — WIKI parity, currencies, compare V2, admin polish (2026-11-13)**
- **Labels are coloured too** (operator: "the golden orange and green texts to be
  like on the left side"): `DEMAND` is `#4ade80` and `SCARCITY` is `#fb923c` as
  *label* text, exactly like `VALUE`/`GEMS`/`COINS`. Previously only the value
  word was coloured and the label stayed grey.
- **Gets Overpays / Gets Underpays moved INTO the pillow** — two more rows under
  Status, each separated by the same hairline, each with its own accent
  (`#34d399` / `#fb7185`). The separate `.apex-behaviour-pills` strip is gone
  from the card and from the value page.
- **The WIKI cards now use the same card design** (`StatPillow`): centred
  artwork → name → rarity, one stat pillow (damage, cooldown, range, placement,
  DPS, $/DPS, each label in its own colour), a hairline footer with the exist
  count, and no origin chip. `.uv-wiki-card` shares `ValuePillow.css`, so the two
  card families can never drift apart.
- **Shiny colours retuned**: Shiny Mythics `#FF5C7A → #FF3D6E` (pinker red),
  Shiny Transcendents `#2E8C6E → #1C6B55` (darker aqua-mould green). All nine
  shiny tiers keep their own colour.
- **Values → Currencies (new page `/values/currencies`)**: a sliding gem → coin
  ladder — `1:100` up to 1k gems, then 95 / 88 / 80 / 72 / 66 / 60 and **`1:55`
  at 100M+** — a live converter that highlights the band your amount falls in,
  and one card per currency. **Christmas Tokens and EXP are marked Not tradable**
  (no value, no gems, no coins is invented for them). `src/utils/currencyConversion.js`
  owns the table; `NON_TRADABLE_CURRENCIES` in `taxonomy.js` owns the rule, and
  the WIKI now spells **EXP**, not "Exp".
- **Unit Compare V2 is the live `/wiki/compare` page**: card-vs-card (both units
  rendered as real cards with their value pillow), an "At a glance" table with
  per-row winner marking, a **min → max** section where every stat is a rail from
  its level-1 value to its maxed value (falling back to the upgrade ladder when a
  unit has no `minMaxStats`), and an **upgrade path** with both ladders level by
  level — cost, DPS, and a highlight on the levels where one unit pulls ahead.
- **Admin — value editor categories**: the picker now has tabs for **Units /
  Artifacts / Gamepasses / Crates / Currencies**. Selecting a non-unit entity
  edits its trade value in the same form, and the editor meta line reads
  "Artifacts · not a unit" (never "Normie · Unit").
- **Admin — search redesign**: the picker search is a padded pill with an icon, a
  clear button and a `↑↓` hint; the rarity filter only shows on the Units tab.
- **Admin — the "N unsaved" popup is no longer clipped** (operator screenshot
  image-13): it was `position: absolute` inside `.admin-topbar`, which clips its
  own children with `overflow: hidden`. It now renders through
  `AdminDraftsPanel` in a **portal on `document.body`**, fixed-positioned from the
  pill, hangs off whichever bottom edge of the bar is lower, closes on outside
  click / Escape, and the pill refreshes the moment an autosaved draft is
  written (no reload needed).
- **Value editor graphic pass**: soft accent glow, gradient hairline on top, the
  "Exact live outputs" strip restyled as a panel, monospaced tabular inputs with
  focus rings, and a sticky save bar.
- New suite `verify_rev7.mjs` (**38 checks**: label accents, overpay rows inside
  the pillow, WIKI pillow parity, the currency ladder + non-tradables, compare V2
  card-vs-card/min→max/ladders, the admin tabs, and the portalled popup).
- Suites updated for the intentional changes: `verify_shiny_dividers` (new shiny
  hexes), `verify_v4_features` (WIKI stat boxes → stat pillow),
  `verify_link_and_trade` (overpay pills → pillow rows; the `reforges` page was
  removed by an earlier operator decision; byline regex case).

*Build*
- Bake → social cards → vite → prerender → prune: **958 pages, all social cards
  present**, stamp **`2026-11-13-80247edf`**, **958 routes**, lint 105 warnings / **0 errors**.

---

## 6. Verification (last run, all green)

| Suite | Result |
|---|---|
| `npm test` | 53 files / 290 tests |
| `npm run lint` | 0 errors (105 warnings, 315 files) |
| `node --check scripts/cloudflare-proxy-worker.js` | OK |
| verify_build | 29 |
| verify_bugfixes | 36/36 |
| verify_v4_features | 59/59 |
| verify_value_pillow | 28/28 |
| verify_rev7 | 37/37 |
| verify_live_updates | 12/12 |
| verify_image_publish | 13/13 |
| verify_new_features | 18/18 |
| verify_fixes_v3 | 29/29 |
| verify_adsense_meta | 7/7 |
| verify_free_prep (+browser) | 36/36 + 11 |
| verify_live_rarity_counts | 12/12 |
| verify_link_and_trade | 37/37 |
| verify_editors | 15/15 |
| worker_verify | 75 |
| verify_exist_counts | 36/36 |
| package validator | see ZIP build log |
| verify_shiny_dividers | 36/36 |
| verify_build_stamp | 14/14 (`2026-11-13-dfd4882e`, 959 routes) |
| worker_budget_verify | 23/23 |
| verify_kv_budget | 22/22 |
| verify_item_editors (new) | 40/40 |
| **All-suite total (rev 8)** | **527 checks green** across the 20 verifier suites |

Browser proofs (Playwright, local `dist`, worker mocked, **no live writes**) live
in `/home/user/_audit/tools/`: `proof-nov11.mjs`, `proof-nov12.mjs`,
`proof-nov12b.mjs`. The tools directory keeps the 14 verifier suites.

---

## 7. Team roster (source of truth: worker `TEAM_ROLES` + `src/utils/teamMembers.js`)

| Email | Display name | Role |
|---|---|---|
| gustavo.rb1410@gmail.com | JustABacon | Owner |
| bananatempest25@gmail.com | Nemuiito | Co-Owner |
| johnmustard129@gmail.com | Silly Goober | Admin |
| hellfiregamingytt@gmail.com | Hellfire | Admin |
| bigbig4780@gmail.com | HorrenBalls | Editor |
| mnightapexhelper@gmail.com | Moonlight | Editor |
| knwasdo@gmail.com | Marshadow | Editor |

Removed: `destroyha3@gmail.com`, both `isaacconn*` variants. Typos to avoid:
`mnlghtapexhelper@…` (wrong, must be `mnight`).

---

## 8. Exist counts — plan (not built against a real source yet)

Delivery is already coded end-to-end and works with a mocked feed:
`GET /exist-counts` (`{v, at, source, counts}`, no-store, ETag/304),
`POST /exist-counts/publish` (HMAC or `X-Exist-Key`, 5-minute replay window,
integers 0..1e12, ≤1000 units, 50 % drop guard, unchanged values suppressed),
`/status` carries `existV/existAt/existSource/existUnits`, and the cron
`*/15 * * * *` runs `scheduled()` which ingests `EXIST_FEED_URL` or the Open
Cloud variables. With no source configured it reports `no_source_configured`.
The frontend (`src/utils/existCountStore.js`) fetches only when `existV` changes,
renders nothing without data, labels the source and as-of time, and marks data
older than 24 h as stale.

**Still open**: which sanctioned source the numbers come from. Options are the
game's `HttpService` push, a public JSON/CSV/sheet feed, or owner Open
Cloud/DataStore — each needs dev/team approval. Spoon said it is "pretty nice"
but wants the rest of the team to check; no yes/no yet. Do not re-ask for owner
access; do not use bots, scraping, OCR or executors.

---

## 9. Backlog — recorded, not started

1. **Roblox ↔ Apex account linking**, and an **LF marketplace** that requires a
   linked account. Blocked on legal copy: `Privacy`, `About`, `Terms`, `Cookies`,
   `Disclaimer` and the static content currently promise "no accounts, no
   free-text submissions". Needs consent, moderation, retention and mixed-age
   safety written before code.
2. **Fully add the content types** (crates / keys / skins / materials /
   gamepasses / items) — the pages and editors exist; the rows are still being
   filled in.
3. **Material descriptions** — text is ready (below); artwork waits for images.
4. **Database consistency**: `fetchBakedBundle()` can overwrite newer live data
   with an older baked snapshot; `localStorage` boot cache can be stale;
   per-isolate public body cache; legacy `X-Apex-Sanitized`; admin vs public
   redaction drift.
5. **Operator-only**: deploy worker `2026-11-02.5`, set `APEX_SESSION_SECRET`,
   bind the KV namespace, add a physical postal address for AdSense later.

### Material descriptions (17, text only — no artwork)

Rarity ladder: Normie → Odd → Rare → Awesome → Legendary → Mythical → Transcendent → Ultra.

| # | Name | Rarity | Description | Drop source |
|---|---|---|---|---|
| 1 | Horseman's Cloak | Transcendent | "The myth.. the legend.. as they say. Extremely rare drop from The Hallows" | The Hallows |
| 2 | Rock | Odd | "What beats rock.. paper? I dont know.. Uncommon drop from Endless mode" | Endless mode |
| 3 | Perfect Circle | Awesome | "A perfect circle.. is it really perfect though? statistically it's circumference is 4 units because it's composed of pixels.. but those pixels are also composed of atoms..? Rare drop from Doodle map" | Doodle map |
| 4 | Moth Essence | Transcendent | "A mysterious essence, it floats like a Moth. Feels like the same air around SkyCastle. Common drop from MothBall" | MothBall |
| 5 | Moth Core | Ultra | "A heavy rock." | — |
| 6 | Gold | Rare | "A rare ore! Rare drop from Endless mode" | Endless mode |
| 7 | Eternal Snow | Legendary | "Snow that has been frozen for eternity, it's as pure as it gets! Extremely rare drop from Tundra & Northern Isles" | Tundra & Northern Isles |
| 8 | Pumpkin | Rare | "I carved this just for you! You're just looking on the wrong side... Rare drop from The Hallows" | The Hallows |
| 9 | Icicle | Normie | "A frozen piece of ice, sharp and cold.. Common drop from Tundra & Northern Isles" | Tundra & Northern Isles |
| 10 | CrookedTwig | Odd | "A stick but crooked... the devs are hella creative huh. Common drop from The Hallows" | The Hallows |
| 11 | Molten Core | Mythical | "Don't put your hand on it; it'll burn! Rare drop from InfernoAbyss" | InfernoAbyss |
| 12 | Twig | Normie | "A simple stick. It's not very special, but it's all you have right now. Common drop from Endless mode" | Endless mode |
| 13 | Magnum Opus | Mythical | "o Very rare drop from Doodle map" — screenshot text is cut off, needs a clearer image | Doodle map |
| 14 | Hardened Snowflake | Awesome | "Snowflake that's been frozen for years, now it's hard and brittle... Rare drop from Tundra & Northern Isles" | Tundra & Northern Isles |
| 15 | Obsidian | Mythical | "Let's build the nether portal together! Common drop from InfernoAbyss" | InfernoAbyss |
| 16 | Scribble | Odd | "Looks fluffy! Common drop from Doodle map" | Doodle map |
| 17 | Heart Strings | Ultra | "A powerful material used to craft the most lovely items in the game! Obtainable via Northern Isles & Valentines Map" | Northern Isles & Valentines Map |

Name mismatches to settle (prefer the in-game name): `Eternal Snow` ↔ taxonomy
`Eternal Snowflake`; `Heart Strings` ↔ `Heart String`; `CrookedTwig` ↔
`Crooked Twig`. All 17 have a taxonomy counterpart.

---

## 10. Unit images kept (`/home/user/unit-images/`, 20 files, 4 MB)

Real unit art supplied by the operator, waiting to be matched to slugs — nothing
is generated or substituted.

`Autumnpng.png` · `Baller.png` · `BrainBall.png` · `Dictator.png` ·
`ElfCommander.png` · `FancyBall.png` · `ForestBal.png` · `Frutiger.png` ·
`Golem.png` · `HackerBall.png` · `Hephaestus.png` · `KingBall.png` ·
`LaserMiniGunner.png` · `Mummy.png` · `OmegaKnight.png` ·
`OverclockedOverlordWSkin.png` · `PartyMan.png` · `Plasma.png` · `Showman.png` ·
`Wukong.png`

Note the filename quirks: `Autumnpng.png`, `ForestBal.png` (missing "l"),
`OverclockedOverlordWSkin.png` (a skin, not a unit icon).

---

## 11. Pull request

- **PR #1**: https://github.com/ApexBallValuesWiki/ApexBallValuesWiki.github.io/pull/1
  (open, `mergeable`, base `main` ← `release/2026-11-05-link-images-trade-png-nose-rarity`).
- It is a **PR only** — nothing was merged, pushed to `main` or deployed, and the
  remote PR is older than the current source.
- Refreshing it needs a fresh GitHub device authorisation; the earlier local
  branch clone was deleted with the cleanup. Re-clone, copy `_build/apex-td-final`
  over it, commit on the release branch, push, then update the PR body.

---

## 12. How to fix things without breaking them

- Don't run `vite build` alone — pages and cards go stale.
- `scripts/lib/*` import extensionless `src/` modules: run them through
  `scripts/lib/run-bundled.mjs` (esbuild), not plain `node`.
- The site-wide "quiet text hover" PostCSS plugin strips `opacity`/`transform`
  from non-decorative `:hover` rules. Selectors containing `.term-tip-pop` are
  exempted on purpose — remove that exemption and tooltips stop appearing.
- `verify_link_and_trade.mjs` used to hardcode the prerendered page count; it now
  reads the folder, so adding/removing routes no longer breaks it.
- Do not re-add filters (greyscale/tint) to `UnitIcon` or direct unit `<img>`;
  the rotating hero art already bakes its greyscale into the WebP files.
- Deleting a whole `TotalBar`/`TradeSide` block once broke `TradeHistory`; always
  grep for the component before removing a shared block.
- **Three data lanes, not one**: `itemOverrides` (generic item editor),
  `materials` + `crate` + `map` (the dedicated editors), and `wiki` (skins).
  A public page that reads only one lane will silently ignore the others — this
  is exactly what made crate/material saves look broken. Use
  `WikiItemSectionList/Detail` as the reference implementation.
- A save that only reaches `localStorage` is visible in the same browser and
  nowhere else. The message says "Saved on this device" when the worker refuses
  the publish — that is the signal to run `DEPLOY-WORKER.md`.

---

## 13. The 150 suggestions

Exactly 150 distinct ideas (read first at the operator's request), later
cross-checked against the source so nothing duplicates an existing feature.

## A · Accounts & identity (001–010)

001. **Self-service account creation** — Owner types a new email and picks a role in the admin panel; the worker roster updates without a code change or deploy.
002. **One-click account removal** — Delete a roster member and revoke every live session and pending invite in a single action.
003. **Role reassignment** — Move an account between owner / admin / editor from the UI, with a confirm step for owner transfers.
004. **Display-name editor** — Set or change the public nickname attached to any roster email without editing `teamMembers.js`.
005. **Email rename with history** — Move an account to a new address while keeping all of its past change-log entries attributed to the same person.
006. **Invite revocation** — Cancel a specific unused invite token instead of waiting for it to expire.
007. **Invite expiry presets** — Choose 15 min / 1 h / 24 h / 7 days when generating an invite.
008. **Active-session list** — Show each account's current sessions with approximate device and last-seen time.
009. **Last-login column** — Add a "last signed in" cell to the team panel so dormant accounts are obvious.
010. **Account status labels** — Mark accounts as active, on-break or retired without deleting their history.

## B · Editor tooling (011–020)

011. **Draft autosave** — Persist unsaved form edits in sessionStorage and restore them after an accidental tab close.
012. **Stale-form warning** — Warn while editing (not only on save) when another editor published a newer version of the same row.
013. **Field-level diff preview** — Show a compact before/after list of only the fields that changed, before the publish button is pressed.
014. **Publish checklist** — Block a save when a required field such as rarity or an icon is empty, naming the missing fields.
015. **Bulk rarity revalue** — Apply a chosen value/gems/coins triple to every zero row in one rarity, with a preview of affected slugs.
016. **Bulk image upload** — Drag several unit icons at once and match them to slugs by filename, showing unmatched files.
017. **Multi-step undo** — A per-editor undo stack keeping the last ten publishes, instead of only the single previous backup.
018. **Scheduled publish** — Queue a completed edit to go live at a chosen time, with a pending list and cancel option.
019. **Private editor notes** — A per-unit free-text note visible only inside `/admin`, never in the public bundle.
020. **Audit CSV export** — Download the full change log with timestamp, editor, section, slug, field, before and after.

## C · Change attribution (021–030)

021. **Card update byline** — Append the editor's public nickname to "Updated 2h ago" on value cards, using a pseudonymised field rather than an email.
022. **Value detail byline** — Show the nickname and exact timestamp beside the value on the unit's values page.
023. **WIKI edit byline** — Show who last edited the description/stats block of a WIKI unit.
024. **Per-field author tooltip** — Hover an individual value cell to see who last changed just that field and when.
025. ~~Change reason note~~ — **WITHDRAWN on operator request (2026-11-11).** ID kept so later references stay valid.
026. **Editor-filtered update history** — Filter the public changelog to one contributor's entries.
027. **Change permalink** — A URL that opens the changelog scrolled to and highlighting one specific entry.
028. **Side-by-side diff** — Old and new value rows shown next to each other with changed cells highlighted.
029. **Single-field revert** — Restore one historical field value without rolling back the whole database.
030. **Nickname hover card** — Hover an author name to see their role badge, join date and total edit count.

## D · Database consistency (031–040)

031. **Version banner** — Show "viewing v309" in the footer with a one-tap resync button when the tab is behind.
032. **Conflict merge screen** — Replace the bare 409 "refresh and retry" with a screen showing both versions and a field-by-field merge.
033. **Read-after-write check** — After a publish, re-read the version and confirm it equals the returned version before showing success.
034. **Cross-tab mismatch warning** — Detect when two open tabs hold different bundle versions and offer to resync the older one.
035. **Baked-fallback guard** — Never let `fetchBakedBundle()` overwrite newer live data with an older baked snapshot.
036. **Per-field timestamps** — Record and display when each individual field changed, not only the whole row's `updated_at`.
037. **Sync health dot** — A small connected / stale / offline indicator driven by the last successful status response.
038. **Retry with backoff** — Automatically retry a failed KV read with increasing delays instead of silently keeping stale data.
039. **Data freshness report** — An admin list of rows whose values have not been reviewed in N days, sortable by age.
040. **Publish receipt toast** — Show the new version number, timestamp and editor name in the save confirmation.

## E · Values & pricing (041–050)

041. **Price alert threshold** — Set a per-unit threshold and show a badge when the published value crosses it.
042. **Value confidence label** — Tag estimates as confirmed, community-based or unverified, with a short legend.
043. **Value source link** — Attach the origin (patch note, trade log, dev post) to a value row and surface it on the detail page.
044. **Outdated-value flag** — Let readers mark a value as looking stale, feeding an editor queue without changing the value.
045. **Percentage change badge** — Show +/− percent against the previous published value on each card.
046. **Default value tier settings** — Adjust the per-rarity default value/gems/coins triples from the admin panel.
047. **Currency conversion table** — A page showing value ↔ gems ↔ coins at each market tier in one grid.
048. **O/C rank editor** — Reorder the Shiny O/C ranking from the admin panel instead of editing `valueRules.js`.
049. **Marker audit list** — A report of every row carrying `O/C` or `N/A`, showing which fields hold the marker.
050. **Demand history timeline** — Show how a unit's demand tier moved over its last several edits.

## F · Trade calculator (051–060)

051. **Multi-unit paste** — Paste a newline list of names and quantities to populate one side in a single action.
052. **Quantity presets** — 1 / 5 / 10 / 100 chips on each row instead of only plus/minus.
053. **Per-trade notes** — A free-text note attached to the saved trade for your own record.
054. **Two-offer comparison** — Save two candidate offers and compare their totals and demand in one view.
055. **Demand weight slider** — Let the user decide how much demand counts against raw value in the verdict.
056. **Share-link expiry** — Mark a shared trade URL as valid for a chosen number of days.
057. **Offer template** — Save a standard offer and load it again with one click.
058. **Side composition totals** — Show distinct-unit count and total copy count for each side.
059. **Trade QR code** — Generate a scannable QR for the current share link.
060. **Print layout** — A printer-friendly stylesheet for the trade card with no buttons or chrome.

## G · What can I afford (061–070)

061. **Two-budget comparison** — Show results for two budgets side by side to see what the extra currency unlocks.
062. **Named budget presets** — Save custom budgets with labels and reuse them later.
063. **Owned-unit exclusion** — Hide units the user already owns from the results.
064. **Budget minus owned value** — Subtract the value of owned units from the entered budget.
065. **Rarity breakdown chart** — A small bar chart of how many results fall in each rarity.
066. **Demand filter** — Only show units at or above a chosen demand tier.
067. **Trend filter** — Restrict results to rising, falling or stable units.
068. **CSV result export** — Download the current result list with name, rarity, range and percentage of budget.
069. **Relevancy pin editor** — Change the pinned top units from the admin panel rather than in code.
070. **Budget slider** — Drag a logarithmic slider to set the budget instead of typing a number.

## H · WIKI units (071–080)

071. **Unit stat chart** — A bar chart comparing damage, cooldown and range across a chosen set of units.
072. **Upgrade cost graph** — Plot cumulative placement cost by level on a unit's detail page.
073. **Placement-limit filter** — Browse units by how many can be placed at once.
074. **Role filter** — Filter the unit list by DPS / support / farm / economy type.
075. **Obtain-method filter** — Find units obtainable from a specific crate, map or event.
076. **Unit tags** — Free-form chips such as "event", "limited" or "meta" on unit pages.
077. **Related units** — Suggest units from the same crate or rarity at the bottom of a detail page.
078. **Alias search** — Let community nicknames resolve to the official unit in search.
079. **Missing-data report** — List units with no icon, description or stat block so editors can fill them.
080. **Unit comparison image export** — Download a side-by-side unit comparison as a PNG.

## I · Items, materials, crates & keys (081–090)

081. **Material rarity ladder** — Add the eight-tier material rarity (Normie → Ultra) as its own taxonomy with colours.
082. **Material drop-source filter** — Browse materials by the map or mode they drop from.
083. **Material crafting recipes** — Show which item consumes each material and in what quantity.
084. **Crate contents table** — List every unit and skin in each crate with its published drop rate.
085. **Crate odds editor** — An admin form for entering and validating crate drop percentages.
086. **Key-to-crate mapping** — Show which key opens which crate on both the key and crate pages.
087. **Artifact register** — A dedicated page for Keys/Artifacts, separate from consumables.
088. **Gamepass catalogue** — List gamepasses with their Robux price, effect and obtain link.
089. **Item value column** — Show a trade value for materials and keys, not only for units.
090. **Bulk material artwork dropzone** — Assign several material images at once by matching filenames to slugs.

## J · Skins & gamepasses (091–100)

091. **Skin preview gallery** — A grid showing each skin applied to its unit with a before/after toggle.
092. **Skin rarity tags** — Tag skins with a rarity and filter the gallery by it.
093. **Skin obtain source** — Record crate, event, season or purchase for every skin.
094. **Shiny-skin toggle** — Switch between the normal and shiny galleries without navigating to a different route.
095. **Skin value tracking** — A value per skin with a short history, separate from unit values.
096. **Skin trade rows** — Allow skins to be added as rows in the trade calculator.
097. **Gamepass ownership badge** — Let a visitor mark owned gamepasses locally (no account needed).
098. **Gamepass bundle estimator** — Sum the Robux cost of a selected set of gamepasses with a value estimate.
099. **Skin set completion** — A progress bar for a themed skin collection.
100. **Skin art credits** — Credit the original artist or source for each skin image.

## K · Linking & marketplace (101–110)

101. **Link recovery after rename** — Re-verify a Roblox link when the linked username changes.
102. **Link visibility control** — Let a user choose whether their Roblox name appears on their listings.
103. **Unlink audit log** — Record link and unlink events with timestamps for moderators.
104. **Duplicate-link guard** — Prevent one Roblox account being linked to two site accounts.
105. **LF post expiry** — Auto-hide a listing after a chosen number of days.
106. **LF post filters** — Filter listings by unit, rarity, region and status.
107. **LF post status markers** — Open, negotiating and completed states set by the poster.
108. **LF post rate limit** — Cap listings per linked account per day and show the remaining allowance.
109. **LF saved searches** — Save a filter set and show a badge when a matching listing appears.
110. **LF trust badge** — Show account age and completed-trade count on a listing.

## L · Search & navigation (111–120)

111. **Unified item search** — One search box across units, items, skins, crates and maps.
112. **Search operators** — Support `rarity:`, `demand:` and `value:>` expressions in the search field.
113. **Recent searches** — A per-device list of the last few queries, clearable in one tap.
114. **Fuzzy typo matching** — Return near-miss unit names instead of an empty result.
115. **Empty-state suggestions** — Suggest popular units when a query matches nothing.
116. **Filter deep links** — Encode rarity, sort and budget in the URL so a filtered list can be shared.
117. **Sticky table of contents** — Section links that stay visible on long WIKI pages.
118. **Scroll position memory** — Restore the exact list scroll offset when returning from a unit page.
119. **Item breadcrumbs** — Show group → item hierarchy on item detail pages.
120. **Nav order customiser** — Let each visitor reorder the mobile shortcuts and save it locally.

## M · Sharing & embeds (121–130)

121. **Unit stat card image** — Download a single unit's stats as a shareable PNG.
122. **Embed preview tester** — An admin tool showing how a chosen page renders on Discord and X.
123. **Copy-page-link button** — One click to copy the canonical URL on every detail page.
124. **Embed stat selector** — Choose which stat appears on a unit's generated social card.
125. **Citation snippet** — Copyable "Apex WIKI & Values, accessed DATE" text for forum posts.
126. **Discord-friendly timestamp** — Show a relative "2h ago" plus an absolute date in the embed copy.
127. **Incremental card regeneration** — Rebuild social cards only for pages whose data changed.
128. **Link unfurl version badge** — Print the data version in the corner of a shared card.
129. **Short share codes** — Compact codes that expand to full deep links.
130. **Native mobile share sheet** — Use the device share menu when available, falling back to copy.

## N · Accessibility, performance & offline (131–140)

131. **Font-size control** — An A / A+ / A++ control independent of browser zoom.
132. **High-contrast preset** — A one-click theme with stronger borders and text.
133. **Colour-blind rarity shapes** — Add a distinct shape per rarity so colour is not the only cue.
134. **Keyboard table navigation** — Move through value-list rows with arrow keys and open with Enter.
135. **Text-only data table** — A plain HTML fallback table of values that works without scripts or images.
136. **Reduce-data mode** — Skip hero artwork and decorative cutouts on slow connections.
137. **Above-the-fold image priority** — Load the first grid row's icons before off-screen artwork.
138. **Explicit offline banner** — State clearly when the displayed values come from the local cache.
139. **Cache usage display** — Show how much localStorage the site is using and offer a clear button.
140. **Focus-visible polish** — A clearly visible focus ring on custom dropdowns, toggles and chips.

## O · Trust, safety & community (141–150)

141. **Wrong-value report button** — Report a suspicious value directly from a unit card.
142. **Value-correction triage** — An editor queue with resolve / dismiss and a note per report.
143. **Documentation poll** — A simple on-site vote for which section should be documented next.
144. **Translator credits** — List contributors who provided localised copy.
145. **Data provenance badge** — Distinguish "from official patch notes" from "community estimate".
146. **Trade safety tips** — A short static guide on avoiding scams in player-to-player trades.
147. **Public service health view** — Worker health, last publish time and data version visible to everyone.
148. **Contributor onboarding page** — A public explainer of how to join the editor team.
149. **Quarterly data audit checklist** — A page showing which sections were reviewed and when.
150. **Editor response templates** — Canned replies for resolving reports consistently.

---

**Count: 150 (001–150), 15 categories × 10.** Uniqueness was verified
programmatically: no duplicate titles, no duplicate normalised titles, and no
title matching any feature in the "already exists" list above.