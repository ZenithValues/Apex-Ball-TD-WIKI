import { describe, expect, it } from 'vitest';
import { HERO_ARTWORK } from '../data/heroArtwork';
import { HERO_ROTATION_MS, nextHeroSlug } from './heroCarousel';

const expectedSlugs = [
  'wukong', 'brainball', 'fancyball', 'hephaestus', 'autumn', 'baller',
  'showman', 'omega-knight', 'golem', 'dictator', 'plasma', 'mummy',
  'frutiger', 'king-ball', 'laser-minigunner', 'party-man', 'elf-commander',
];

describe('supplied artwork rotation', () => {
  it('contains only the seventeen supplied images, in their provided order', () => {
    expect(HERO_ARTWORK.map((item) => item.slug)).toEqual(expectedSlugs);
    expect(new Set(HERO_ARTWORK.map((item) => item.image)).size).toBe(17);
    expect(HERO_ARTWORK.every((item) => item.image.includes('/provided/') && item.name)).toBe(true);
    expect(HERO_ROTATION_MS).toBe(5000);
  });

  it('visits each supplied image exactly once before wrapping', () => {
    const seen = [];
    let current = HERO_ARTWORK[0].slug;
    for (let i = 0; i < HERO_ARTWORK.length; i += 1) {
      seen.push(current);
      current = nextHeroSlug(HERO_ARTWORK, current);
    }
    expect(seen).toEqual(expectedSlugs);
    expect(current).toBe(expectedSlugs[0]);
    expect(nextHeroSlug(HERO_ARTWORK, current, -1)).toBe(expectedSlugs.at(-1));
    expect(nextHeroSlug(HERO_ARTWORK, 'not-provided')).toBe(expectedSlugs[0]);
    expect(nextHeroSlug([], current)).toBeNull();
  });
});
