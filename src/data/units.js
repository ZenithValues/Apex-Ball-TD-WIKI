import { UNIT_RARITIES } from './taxonomy';
import { GENERATED_UNITS } from './generated/units.generated';
import { slugify } from '../utils/slug';

// ============================================================================
// UNITS DATABASE
// ----------------------------------------------------------------------------
// Data is sourced from the community "Ball TD Units stat sheet", parsed by
// scripts/parse_units.py + scripts/build_units_js.py into
// src/data/generated/units.generated.js (GENERATED_UNITS).
//
// 148 units were parsed from the sheet (147 documentable + notes on
// unobtainable ones). A unit with `unavailableData: true` means the source
// sheet explicitly had no stat data for it (marked "UNAVAILABLE DATA").
//
// To hand-correct or enrich any single unit (fix a name, add a description,
// add real min/max derived stats, etc.) add an entry to UNIT_OVERRIDES below,
// keyed by slug — it is merged on top of the generated data.
// ============================================================================

export const UNIT_OVERRIDES = {
  // 'ball': { description: 'The original Ball. Everyone starts here.' },
};

function applyOverrides(unit) {
  const override = UNIT_OVERRIDES[unit.slug];
  return override ? { ...unit, ...override } : unit;
}

export const ALL_UNITS = GENERATED_UNITS.map(applyOverrides);

export const UNITS_BY_RARITY = Object.fromEntries(
  UNIT_RARITIES.map((rarity) => [rarity, ALL_UNITS.filter((u) => u.rarity === rarity)])
);

export function getUnitBySlug(slug) {
  return ALL_UNITS.find((u) => u.slug === slugify(slug));
}

export function getUnitsByType(type) {
  return ALL_UNITS.filter((u) => u.type === type);
}

export function getUnitsByCategory(category) {
  return ALL_UNITS.filter((u) => u.category === category);
}