/**
 * itemIcons.js — ONE icon per non-unit entity type.
 *
 * Operator (rev 8): "add icons to the other things like artifacts, gamepasses,
 * etc…". Every place that lists a non-unit type (WIKI browse tiles, section
 * headers, the Values → items pages, the admin category tabs and the Ctrl-K
 * search) reads this map, so a gamepass looks the same everywhere.
 *
 * Keys are lower-case and singular; `itemIconFor()` accepts plurals, the
 * human label ("Gamepasses") and the admin group name ("Key", "Crate").
 */

export const ITEM_TYPE_ICONS = {
  artifact: '🗝️',
  key: '🗝️',
  gamepass: '🎟️',
  crate: '📦',
  material: '🪨',
  currency: '💎',
  item: '🎒',
  skin: '🎨',
  map: '🗺️',
  trait: '🧬',
  unit: '🗿',
};

const ALIASES = {
  artifacts: 'artifact',
  keys: 'key',
  gamepasses: 'gamepass',
  crates: 'crate',
  materials: 'material',
  currencies: 'currency',
  items: 'item',
  skins: 'skin',
  maps: 'map',
  traits: 'trait',
  units: 'unit',
};

export function itemIconFor(key, fallback = '•') {
  const raw = String(key || '').trim().toLowerCase();
  if (!raw) return fallback;
  const singular = ALIASES[raw] || raw.replace(/s$/, '');
  return ITEM_TYPE_ICONS[raw] || ITEM_TYPE_ICONS[singular] || fallback;
}
