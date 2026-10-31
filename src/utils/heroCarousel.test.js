import { describe, expect, it } from 'vitest';
import { HERO_START_SLUG, heroUnitName, nextHeroSlug, orderHeroUnits } from './heroCarousel';

describe('hero unit rotation', () => {
  it('visits every distinct unit, including shiny and units with no image, before repeating', () => {
    const units = Array.from({ length: 349 }, (_, index) => ({
      slug: `${index % 2 ? 'shiny-' : ''}unit-${index}`,
      name: `Unit ${index}`,
      imageUrl: index % 3 ? `/original-${index}.png` : null,
    }));
    units.push({ slug: units[2].slug, name: 'Duplicate' }, { slug: 'coins', kind: 'item' });
    const roster = orderHeroUnits(units);
    expect(roster).toHaveLength(349);
    const seen = new Set();
    let current = roster[0].slug;
    for (let i = 0; i < roster.length; i += 1) {
      seen.add(current);
      current = nextHeroSlug(roster, current);
    }
    expect(seen.size).toBe(349);
    expect(current).toBe(roster[0].slug);
    expect(nextHeroSlug(roster, roster[0].slug, -1)).toBe(roster.at(-1).slug);
    expect(roster.some((unit) => unit.slug.startsWith('shiny-'))).toBe(true);
    expect(roster.some((unit) => !unit.imageUrl)).toBe(true);
  });

  it('orders deterministically and gives the original opening unit priority', () => {
    const units = [{ slug: 'ball' }, { slug: HERO_START_SLUG }, { slug: 'shiny-ball' }, { slug: 'newly-published' }];
    expect(orderHeroUnits(units)[0].slug).toBe(HERO_START_SLUG);
    expect(orderHeroUnits(units).map((u) => u.slug)).toEqual(orderHeroUnits([...units].reverse()).map((u) => u.slug));
    expect(heroUnitName({ slug: 'shiny-ball', name: 'Ball' })).toBe('Shiny Ball');
    expect(heroUnitName({ slug: 'shiny-ball', name: 'Shiny Ball' })).toBe('Shiny Ball');
  });
});
