export const REFORGES = [
  { slug: 'damage-reforge', name: 'Damage Reforge', description: 'Improves offensive stats.' },
  { slug: 'range-reforge', name: 'Range Reforge', description: 'Improves unit range.' },
  { slug: 'speed-reforge', name: 'Speed Reforge', description: 'Improves attack speed.' },
];

export function getReforgeBySlug(slug) {
  return REFORGES.find((entry) => entry.slug === slug) || null;
}
