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
// Restored 2026-11-12: Items, Maps, Traits, Skins and every
// admin-created item type are back in the WIKI sidebar. Keys live inside
// Artifacts and shiny skins were removed (both operator decisions).

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
  { label: 'Maps', base: '/wiki/maps', path: '/wiki/maps' },
  { label: 'Traits', base: '/wiki/traits', path: '/wiki/traits' },
];

export const VALUES_NAV = [
  {
    label: 'Units',
    base: '/values/units',
    searchPath: '/values/units/search',
    children: UNIT_RARITIES.map((r) => ({ label: r, path: `/values/units/${encodeRouteParam(r)}` })),
  },
  {
    label: 'Items & Gear',
    base: '/values/items',
    children: [
      { label: 'Artifacts', path: '/values/artifacts' },
      { label: 'Gamepasses', path: '/values/gamepasses' },
      { label: 'Consumables', path: '/values/consumables' },
      { label: 'Materials', path: '/values/materials' },
      { label: 'Crates', path: '/values/crates' },
      { label: 'Items', path: '/values/items' },
    ],
  },
  { label: 'Trade Calculator', base: '/values/calculator', path: '/values/calculator' },
  { label: 'What can I afford?', base: '/values/afford', path: '/values/afford' },
];
