export const TOP_NAV_LINKS = [
  { to: '/wiki', label: 'WIKI' },
  { to: '/values', label: 'VALUES' },
  { to: '/values/calculator', label: 'CALCULATOR' },
  { to: '/minigames', label: 'MINIGAMES' },
  { to: '/achievements', label: 'ACHIEVEMENTS' },
  { to: '/theme-editor', label: 'THEME' },
];

export const MOBILE_NAV_LINKS = [
  { to: '/wiki', label: 'Wiki', icon: '📖' },
  { to: '/values', label: 'Values', icon: '💰' },
  { to: '/values/calculator', label: 'Calc', icon: '🧮' },
  { to: '/minigames', label: 'Games', icon: '🎮' },
  { to: '/achievements', label: 'Awards', icon: '🏆' },
  { to: '/theme-editor', label: 'Theme', icon: '🎨' },
];

export const SHORTCUT_ROUTES = {
  w: '/wiki',
  v: '/values',
  c: '/values/calculator',
  b: '/minigames',
  t: '/theme-editor',
};

import { UNIT_RARITIES, SKIN_CATEGORIES } from '../data/taxonomy';
import { WIKI_ITEM_SECTIONS } from './wikiSections';
import { encodeRouteParam } from '../utils/routeParams';

// SITE NAVIGATION TREE
// Restored on 2026-11-12: Items, Maps, Traits, Skins, Shiny Skins, Reforges
// and every admin-created item type are back in the WIKI sidebar.

export const WIKI_NAV = [
  {
    label: 'Units',
    base: '/wiki/units',
    searchPath: '/wiki/units/search',
    children: UNIT_RARITIES.map((r) => ({ label: r, path: `/wiki/units/${encodeRouteParam(r)}` })),
  },
  { label: 'Unit Compare', base: '/wiki/compare', path: '/wiki/compare' },
  {
    label: 'Items & Gear',
    base: '/wiki/items',
    children: [
      ...WIKI_ITEM_SECTIONS.map((section) => ({ label: section.label, path: `/wiki/${section.path}` })),
    ],
  },
  {
    label: 'Skins',
    base: '/wiki/skins',
    children: SKIN_CATEGORIES.map((c) => ({ label: c, path: `/wiki/skins/${encodeRouteParam(c)}` })),
  },
  {
    label: 'Shiny Skins',
    base: '/wiki/shiny-skins',
    children: SKIN_CATEGORIES.map((c) => ({ label: c, path: `/wiki/shiny-skins/${encodeRouteParam(c)}` })),
  },
  { label: 'Maps', base: '/wiki/maps', path: '/wiki/maps' },
  { label: 'Traits', base: '/wiki/traits', path: '/wiki/traits' },
  { label: 'Reforges', base: '/wiki/reforges', path: '/wiki/reforges' },
];

export const VALUES_NAV = [
  {
    label: 'Units',
    base: '/values/units',
    searchPath: '/values/units/search',
    children: UNIT_RARITIES.map((r) => ({ label: r, path: `/values/units/${encodeRouteParam(r)}` })),
  },
  { label: 'Trade Calculator', base: '/values/calculator', path: '/values/calculator' },
  { label: 'What can I afford?', base: '/values/afford', path: '/values/afford' },
];
