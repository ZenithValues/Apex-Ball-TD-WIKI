/**
 * Site-wide display-name corrections.
 *
 * Slugs, ids and database keys are intentionally untouched — only the human
 * readable `name` changes. Keep this in the data layer so WIKI cards, value
 * cards, search, the palette, the calculator, pre-rendered titles and the
 * "What can I afford?" page all agree.
 *
 * The rarity badge already says "SHINY …", so shiny variants drop the
 * redundant "Shiny " prefix.
 */
const NAME_OVERRIDES = {
  ShadowPrince: 'ShadowPrince (SP)',
  GoldenMonkey: 'GoldenMonkey (GMK)',
  NightmareBall: 'NightmareBall (NM)',
  'Shiny NightmareBall': 'NightmareBall',
  'Shiny CorruptMalware': 'CorruptMalware',
  'Shiny ShadowPrince': 'ShadowPrince (SP)',
};

// Fallbacks for entries whose live/wiki name differs but whose slug is known.
const SLUG_OVERRIDES = {
  shadowprince: 'ShadowPrince (SP)',
  goldenmonkey: 'GoldenMonkey (GMK)',
  nightmareball: 'NightmareBall (NM)',
  'shiny-nightmareball': 'NightmareBall',
  corruptmalware: 'CorruptMalware',
  'shiny-corruptmalware': 'CorruptMalware',
};

// The rarity badge already spells out "Shiny …" and the card glows, so the
// word itself is stripped from every display name (operator, 2026-11-12).
export function stripShinyWord(name) {
  return String(name || '')
    .replace(/^\s*shiny\s+/i, '')
    .replace(/\s*\(shiny\)\s*$/i, '')
    .replace(/\s+shiny\s*$/i, '')
    .trim();
}

export function unitDisplayName(unit) {
  if (!unit) return '';
  const name = SLUG_OVERRIDES[unit.slug]
    || NAME_OVERRIDES[unit.name]
    || NAME_OVERRIDES[stripShinyWord(unit.name)]
    || stripShinyWord(unit.name)
    || '';
  // The creator forbids a trailing "?" on unit names (e.g. "SurvivorBall?").
  // Slugs/ids are untouched — only the human-readable label is cleaned.
  return String(name).replace(/\s*\?+\s*$/, '').trim();
}

/** Return a copy with the corrected name, or the same object if unchanged. */
export function withUnitDisplayName(unit) {
  if (!unit) return unit;
  const name = unitDisplayName(unit);
  if (!name || name === unit.name) return unit;
  return { ...unit, name };
}
