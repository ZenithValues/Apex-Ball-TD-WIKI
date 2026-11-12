import { SKIN_CATEGORIES, SKINS } from './taxonomy';
import { buildStub, mergeOverrides } from './placeholders';
import { slugify } from '../utils/slug';

// SKIN SCHEMA: slug, name, category, description, obtain, image
export const SKIN_OVERRIDES = {
  // 'alaballster': { description: '...', obtain: { method: 'Crate', source: 'Rock Crate' } },
};

function buildSkinCategory(category, shiny) {
  const names = SKINS[category] || [];
  const prefix = shiny ? 'shiny-' : '';
  const stubs = names.map((name) =>
    buildStub(name, { category, shiny, slugOverride: `${prefix}${slugify(name)}` })
  );
  // apply slugOverride so shiny/non-shiny variants of the same name don't collide
  const withSlugs = stubs.map((s) => ({ ...s, slug: s.slugOverride }));
  return mergeOverrides(withSlugs, SKIN_OVERRIDES);
}

export const SKINS_BY_CATEGORY = Object.fromEntries(
  SKIN_CATEGORIES.map((cat) => [cat, buildSkinCategory(cat, false)])
);

// SHINY SKINS WERE REMOVED (operator, 2026-11-12): there is one skins
// catalogue. Shiny UNIT variants are untouched — this is only the skin system.
export const ALL_SKINS = Object.values(SKINS_BY_CATEGORY).flat();

export function getSkinBySlug(slug) {
  return ALL_SKINS.find((s) => s.slug === slug);
}