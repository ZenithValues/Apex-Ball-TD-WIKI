import { SKIN_CATEGORIES } from '../data/taxonomy';

/**
 * Public WIKI sections that were hidden behind redirects. Every non-unit
 * entity created in the admin panel belongs to one of these admin groups.
 * `staticGroups` point at the built-in item database; `adminGroups` point at
 * the KV-backed item overrides.
 */
export const WIKI_ITEM_SECTIONS = [
  // Keys ARE artifacts (operator, 2026-11-12) — one section, one admin group.
  // Legacy rows saved with group 'Key' still resolve here.
  { path: 'artifacts', label: 'Artifacts', adminGroups: ['Artifact', 'Key'], staticGroups: [] },
  { path: 'gamepasses', label: 'Gamepasses', adminGroups: ['Gamepass'], staticGroups: [] },
  { path: 'consumables', label: 'Consumables', adminGroups: ['Consumable'], staticGroups: ['Consumables'] },
  { path: 'materials', label: 'Materials', adminGroups: ['Material'], staticGroups: ['Materials'] },
  { path: 'currencies', label: 'Currencies', adminGroups: ['Currency'], staticGroups: ['Currencies'] },
  { path: 'crates', label: 'Crates', adminGroups: ['Crate'], staticGroups: ['Crates'] },
  { path: 'items', label: 'Items', adminGroups: ['Item', 'Skin'], staticGroups: [] },
];

export function wikiSectionByPath(path) {
  return WIKI_ITEM_SECTIONS.find((section) => section.path === path) || null;
}

export function wikiSectionForAdminGroup(group) {
  return WIKI_ITEM_SECTIONS.find((section) => section.adminGroups.includes(group)) || null;
}

export const WIKI_SKIN_CATEGORIES = SKIN_CATEGORIES;
