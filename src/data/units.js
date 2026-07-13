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
// Shiny units are generated from the base units here so the WIKI can show
// both base rarity pages and Shiny rarity pages without duplicating the giant
// stat sheet by hand.
// ============================================================================

export const UNIT_OVERRIDES = {
  // 'ball': { description: 'The original Ball. Everyone starts here.' },
};

const SHINY_DAMAGE_MULTIPLIER = 1.5;
const SHINY_PARTYMAN_MULTIPLIER = 1.3;

const UTILITY_MINMAX_KEYS = /cooldown|range|health|income|cash|coin|gem|amount|level|duration|multiplier|buff|wait|spawn|max|crystal|energy|count|bullet|pierce|spacing|bounce|slam|threshold/i;

function applyOverrides(unit) {
  const override = UNIT_OVERRIDES[unit.slug];
  return override ? { ...unit, ...override } : unit;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function trimNumber(value) {
  return Number(value.toFixed(2)).toString();
}

function formatScaledNumber(value, preferredSuffix = '') {
  const abs = Math.abs(value);
  const suffix = preferredSuffix || (abs >= 1_000_000_000 ? 'B' : abs >= 1_000_000 ? 'M' : abs >= 1_000 ? 'K' : '');
  const divisor = suffix === 'B' ? 1_000_000_000 : suffix === 'M' ? 1_000_000 : suffix === 'K' ? 1_000 : 1;
  return `${trimNumber(value / divisor)}${suffix}`;
}

function scaleNumbersInString(raw, multiplier) {
  if (raw == null) return raw;
  return String(raw).replace(/(^|[^A-Za-z])(-?\d[\d,]*(?:\.\d+)?)([KMB]?)(?![A-Za-z])/gi, (match, prefix, numberPart, suffix = '') => {
    const cleaned = numberPart.replace(/,/g, '');
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return match;

    const suffixUpper = suffix.toUpperCase();
    const unitMultiplier = suffixUpper === 'B' ? 1_000_000_000 : suffixUpper === 'M' ? 1_000_000 : suffixUpper === 'K' ? 1_000 : 1;
    const scaled = parsed * unitMultiplier * multiplier;
    return `${prefix}${formatScaledNumber(scaled, suffixUpper)}`;
  });
}

function scaleObjectEntries(source, shouldScale, multiplier) {
  return Object.fromEntries(
    Object.entries(source || {}).map(([key, value]) => [key, shouldScale(key, value) ? scaleNumbersInString(value, multiplier) : value])
  );
}

function shouldScaleDamageStat(key) {
  return /damage/i.test(key);
}

function shouldScaleMinMaxDamage(key) {
  if (UTILITY_MINMAX_KEYS.test(key)) return false;
  // Most non-utility min/max keys are attack names (Melee, Aoe, Gun, Laser,
  // Pierce, etc.) whose values represent damage ranges.
  return true;
}

function createShinyUnit(baseUnit) {
  const unit = deepClone(baseUnit);
  const isPartyMan = unit.slug === 'partyman';

  unit.baseSlug = baseUnit.slug;
  unit.slug = `shiny-${baseUnit.slug}`;
  unit.name = `Shiny ${baseUnit.name}`;
  unit.rarity = `Shiny ${baseUnit.rarity}`;
  unit.shiny = true;

  if (isPartyMan) {
    unit.minMaxStats = scaleObjectEntries(
      unit.minMaxStats,
      (key) => /cooldown|range/i.test(key),
      SHINY_PARTYMAN_MULTIPLIER
    );
    unit.upgrades = (unit.upgrades || []).map((upgrade) => ({
      ...upgrade,
      cooldown: scaleNumbersInString(upgrade.cooldown, SHINY_PARTYMAN_MULTIPLIER),
      range: scaleNumbersInString(upgrade.range, SHINY_PARTYMAN_MULTIPLIER),
    }));
  } else {
    unit.minMaxStats = scaleObjectEntries(unit.minMaxStats, shouldScaleMinMaxDamage, SHINY_DAMAGE_MULTIPLIER);
    unit.upgrades = (unit.upgrades || []).map((upgrade) => ({
      ...upgrade,
      stats: scaleObjectEntries(upgrade.stats, shouldScaleDamageStat, SHINY_DAMAGE_MULTIPLIER),
      attacks: Object.fromEntries(
        Object.entries(upgrade.attacks || {}).map(([attackName, stats]) => [
          attackName,
          scaleObjectEntries(stats, shouldScaleDamageStat, SHINY_DAMAGE_MULTIPLIER),
        ])
      ),
      dps: scaleObjectEntries(upgrade.dps, () => true, SHINY_DAMAGE_MULTIPLIER),
      costPerDps: scaleNumbersInString(upgrade.costPerDps, 1 / SHINY_DAMAGE_MULTIPLIER),
    }));
  }

  return applyOverrides(unit);
}

export const BASE_UNITS = GENERATED_UNITS.map(applyOverrides);
export const SHINY_UNITS = BASE_UNITS.map(createShinyUnit);
export const ALL_UNITS = [...BASE_UNITS, ...SHINY_UNITS];

export const UNITS_BY_RARITY = Object.fromEntries(
  UNIT_RARITIES.map((rarity) => [rarity, ALL_UNITS.filter((u) => u.rarity === rarity)])
);

export function getUnitBySlug(slug) {
  const normalized = slugify(slug);
  return ALL_UNITS.find((u) => u.slug === normalized);
}

export function getUnitsByType(type) {
  return ALL_UNITS.filter((u) => u.type === type);
}

export function getUnitsByCategory(category) {
  return ALL_UNITS.filter((u) => u.category === category);
}
