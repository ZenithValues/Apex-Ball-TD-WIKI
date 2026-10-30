import { describe, expect, it } from 'vitest';
import { getUnitIcon, PROVIDED_UNIT_ICONS } from './unitIcons';
describe('provided unit renders', () => {
  it('maps all thirteen images to their canonical normal slugs', () => {
    expect(Object.keys(PROVIDED_UNIT_ICONS)).toHaveLength(13);
    for (const slug of Object.keys(PROVIDED_UNIT_ICONS)) {
      expect(getUnitIcon(slug, false)).toBe(PROVIDED_UNIT_ICONS[slug]);
      expect(getUnitIcon(`shiny-${slug}`, true)).toBe(PROVIDED_UNIT_ICONS[slug]);
    }
  });
  it('preserves dedicated original shiny art', () => {
    expect(getUnitIcon('shiny-ball', true)).not.toBe(getUnitIcon('ball', false));
  });
});
