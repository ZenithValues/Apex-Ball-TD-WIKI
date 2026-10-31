// Keep the rotation deterministic and well mixed so normal, shiny and newly
// published units all get a turn. No image or value filter is applied: a unit
// without artwork is still part of the roster.
export const HERO_START_SLUG = 'overclockedoverlord-oco';
export const HERO_ROTATION_MS = 5000;

function slugHash(slug) {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    hash = Math.imul(hash ^ slug.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

export function orderHeroUnits(units = []) {
  const seen = new Set();
  const roster = [];
  for (const unit of Array.isArray(units) ? units : []) {
    if (!unit?.slug || unit.kind === 'item' || seen.has(unit.slug)) continue;
    seen.add(unit.slug);
    roster.push(unit);
  }
  return roster.sort((a, b) => {
    if (a.slug === HERO_START_SLUG) return b.slug === HERO_START_SLUG ? 0 : -1;
    if (b.slug === HERO_START_SLUG) return 1;
    return slugHash(a.slug) - slugHash(b.slug) || a.slug.localeCompare(b.slug);
  });
}

export function nextHeroSlug(roster, current, direction = 1) {
  if (!roster.length) return null;
  const index = roster.findIndex((unit) => unit.slug === current);
  const safeIndex = index < 0 ? 0 : index;
  return roster[((safeIndex + direction) % roster.length + roster.length) % roster.length].slug;
}

export function heroUnitName(unit) {
  if (!unit) return 'Unit';
  const name = unit.name || unit.slug || 'Unit';
  const shiny = unit.shiny || String(unit.rarity || '').startsWith('Shiny ') || unit.slug?.startsWith('shiny-');
  return shiny && !/^shiny\s/i.test(name) ? `Shiny ${name}` : name;
}
