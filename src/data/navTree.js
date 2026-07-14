import { UNIT_RARITIES } from './taxonomy';

// ============================================================================
// SITE NAVIGATION TREE
// ----------------------------------------------------------------------------
// Scope is currently reduced to Units (Normie / Shiny Normie only) while
// real data/art gets built out — Items, Maps, Traits, and Skins are removed
// from navigation for now. Re-add sections here once ready; the underlying
// data/pages for them still exist and aren't deleted.
// ============================================================================

export const WIKI_NAV = [
  {
    label: 'Units',
    base: '/wiki/units',
    searchPath: '/wiki/units/search',
    children: UNIT_RARITIES.map((r) => ({ label: r, path: `/wiki/units/${encodeURIComponent(r)}` })),
  },
  { label: 'Unit Compare', base: '/wiki/compare', path: '/wiki/compare' },
  { label: 'Leaderboards', base: '/wiki/leaderboards', path: '/wiki/leaderboards' },
];

export const VALUES_NAV = [
  {
    label: 'Units',
    base: '/values/units',
    searchPath: '/values/units/search',
    children: UNIT_RARITIES.map((r) => ({ label: r, path: `/values/units/${encodeURIComponent(r)}` })),
  },
  { label: 'Trade Calculator', base: '/values/calculator', path: '/values/calculator' },
];