// The home showcase cycles the supplied artwork, not the live unit database.
export const HERO_ROTATION_MS = 5000;

export function nextHeroSlug(roster, current, direction = 1) {
  if (!roster.length) return null;
  const index = roster.findIndex((entry) => entry.slug === current);
  if (index < 0) return roster[0].slug;
  return roster[((index + direction) % roster.length + roster.length) % roster.length].slug;
}
