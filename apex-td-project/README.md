# Apex Values & WIKI — Ball Tower Defense

Companion site for **Ball Tower Defense** (Roblox) by Cash Grab Studios $$$$.

## Run locally
```bash
npm install
npm run dev      # dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Putting this on GitHub

### 1. Push the code
```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```
(`node_modules` and `dist` are already git-ignored — don't commit them.)

### 2. Turn on GitHub Pages (one-time, in the browser)
In your repo on GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

That's it. A workflow is already included at `.github/workflows/deploy.yml` —
every push to `main`/`master` automatically runs `npm run build` and deploys
`dist/` to GitHub Pages. After the first push finishes (check the **Actions**
tab for progress), your site will be live at:
```
https://<your-username>.github.io/<your-repo>/
```

### Why this works out of the box
Two things were configured specifically so a plain `git push` results in a
working site with no extra fiddling:
- **`vite.config.js` uses `base: './'`** — all built asset paths are relative,
  so the build works regardless of subfolder (GitHub Pages project site,
  custom domain, Netlify, Vercel, or even opened straight from disk).
- **`HashRouter` instead of `BrowserRouter`** (`src/main.jsx`) — URLs look
  like `.../#/wiki/units/Rares` instead of `.../wiki/units/Rares`. This means
  refreshing a page or sharing a direct link always works on a static host,
  which doesn't do server-side route rewriting like a Node server would.

### Alternative hosts
The same `dist/` folder works unmodified on **Netlify** or **Vercel** — just
connect the repo and set build command `npm run build`, output directory
`dist`. No config changes needed there either.

## Project shape
```
src/
  data/
    taxonomy.js   # ALL category/rarity/formula constants — edit here first
    units.js      # Units data, sourced from generated/units.generated.js
    generated/
      units.generated.js  # AUTO-GENERATED from the stat sheet — don't hand-edit
    items.js      # Consumables / Materials / Currencies / Crates
    maps.js       # 18 maps
    traits.js     # 17 traits
    skins.js      # Skins + Shiny Skins, by category
    values.js     # Market data (baseValue/demand/scarcity) -> derived tradeValue
    navTree.js    # Sidebar nav config for WIKI and Values sections
    stubs.js      # Placeholder-entry + override-merge helpers
  utils/
    calculator.js # TradeValue formula, trade evaluator, DPS helpers
    slug.js
  components/      # Header, Sidebar, PageShell, EntityGrid (shared UI)
  pages/
    wiki/          # WikiHome, Units/Items/Maps/Traits/Skins list+detail pages
    values/        # ValuesHome, ValueUnits list+detail, TradeCalculator
scripts/
  parse_units.py      # Parses the raw stat-sheet .txt into JSON
  build_units_js.py   # Converts that JSON into units.generated.js
```

## How to add / update real data
**Units:** re-run the parser pipeline whenever you have an updated stat sheet:
```bash
python3 scripts/parse_units.py "path/to/stat sheet.txt" src/data/raw/units_parsed.json
python3 scripts/build_units_js.py src/data/raw/units_parsed.json src/data/generated/units.generated.js
```
To hand-correct a single unit without touching the sheet, add an entry to
`UNIT_OVERRIDES` in `src/data/units.js`, keyed by `slugify(name)` — it merges
on top of the generated data.

**Items / Maps / Traits / Skins:** same override pattern — every named entity
from `taxonomy.js` auto-generates a placeholder page, and adding an entry to
that file's `*_OVERRIDES` object (keyed by slug) fills it in with real data.

**Values:** every unit currently has `baseValue: 1` (placeholder). Add real
market data to `VALUE_OVERRIDES` in `src/data/values.js`, keyed by slug — it
takes priority over the generated 1s.

## Trade Calculator formula
```
TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier
```
Multiplier tables live in `src/data/taxonomy.js` (`DEMAND`, `SCARCITY`).
The calculator engine (`src/utils/calculator.js`) is the single place this
formula is implemented — used by both the Values pages and the Trade
Calculator UI, so they can never drift out of sync.
