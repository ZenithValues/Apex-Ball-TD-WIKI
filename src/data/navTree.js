import { UNIT_RARITIES, SKIN_CATEGORIES } from './taxonomy';

// ============================================================================
// SITE NAVIGATION TREE
// Drives the sidebar. Kept to category-level links (not every single unit/
// skin) so the sidebar stays usable — individual units/items/skins are
// reached via their category's list page.
// ============================================================================

export const WIKI_NAV = [
  {
    label: 'Units',
    base: '/wiki/units',
    children: UNIT_RARITIES.map((r) => ({ label: r, path: `/wiki/units/${encodeURIComponent(r)}` })),
  },
  {
    label: 'Items',
    base: '/wiki/items',
    children: [
      { label: 'Consumables', path: '/wiki/items/Consumables' },
      { label: 'Materials', path: '/wiki/items/Materials' },
      { label: 'Currencies', path: '/wiki/items/Currencies' },
      { label: 'Crates', path: '/wiki/items/Crates' },
    ],
  },
  { label: 'Maps', base: '/wiki/maps', path: '/wiki/maps' },
  { label: 'Traits', base: '/wiki/traits', path: '/wiki/traits' },
  {
    label: 'Skins',
    base: '/wiki/skins',
    children: SKIN_CATEGORIES.map((c) => ({ label: c, path: `/wiki/skins/${encodeURIComponent(c)}` })),
  },
  {
    label: 'Shiny Skins',
    base: '/wiki/shiny-skins',
    children: SKIN_CATEGORIES.map((c) => ({
      label: c,
      path: `/wiki/shiny-skins/${encodeURIComponent(c)}`,
    })),
  },
];

export const VALUES_NAV = [
  {
    label: 'Units',
    base: '/values/units',
    children: UNIT_RARITIES.map((r) => ({ label: r, path: `/values/units/${encodeURIComponent(r)}` })),
  },
  {
    label: 'Items',
    base: '/values/items',
    children: [{ label: 'Consumables', path: '/values/items/Consumables' }],
  },
  { label: 'Trade Calculator', base: '/values/calculator', path: '/values/calculator' },
];
