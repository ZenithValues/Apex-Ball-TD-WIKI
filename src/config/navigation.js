export const TOP_NAV_LINKS = [
  { to: '/wiki', label: 'WIKI' },
  { to: '/values', label: 'VALUES' },
  { to: '/values/calculator', label: 'CALCULATOR' },
  { to: '/ball-knowledge', label: 'KNOWLEDGE' },
];

export const MOBILE_NAV_LINKS = [
  { to: '/wiki', label: 'Wiki' },
  { to: '/values', label: 'Values' },
  { to: '/values/calculator', label: 'Calc' },
  { to: '/ball-knowledge', label: 'Know' },
];

export const SHORTCUT_ROUTES = {
  w: '/wiki',
  v: '/values',
  c: '/values/calculator',
  b: '/ball-knowledge',
};

import { UNIT_RARITIES } from '../data/taxonomy';

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
