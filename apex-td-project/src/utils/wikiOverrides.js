function cleanEmpty(value) {
  return value === '' || value === null ? undefined : value;
}

export function rowToWikiCustomUnit(row) {
  if (!row?.slug || !row?.custom_unit) return null;
  const category = cleanEmpty(row.category) || 'Standard';
  return {
    slug: row.slug,
    name: cleanEmpty(row.name) || row.slug,
    rarity: cleanEmpty(row.rarity) || 'Normie',
    type: cleanEmpty(row.type) || 'DPS',
    rawType: cleanEmpty(row.raw_type) || cleanEmpty(row.type) || 'Custom Unit',
    category,
    categories: [category],
    placementLimit: cleanEmpty(row.placement_limit),
    totalCost: cleanEmpty(row.total_cost),
    obtain: Array.isArray(row.obtain) ? row.obtain : [],
    passive: cleanEmpty(row.passive),
    ability: cleanEmpty(row.ability),
    synergy: cleanEmpty(row.synergy),
    minMaxStats: row.min_max_stats && typeof row.min_max_stats === 'object' ? row.min_max_stats : {},
    upgrades: Array.isArray(row.upgrades) ? row.upgrades : [],
    imageUrl: cleanEmpty(row.image_url),
    documented: true,
    unavailableData: false,
    customUnit: true,
    liveWikiOverride: true,
    wikiUpdatedAt: row.updated_at,
  };
}

export function rowToWikiOverride(row) {
  if (!row) return null;
  return {
    name: cleanEmpty(row.name),
    rarity: cleanEmpty(row.rarity),
    imageUrl: cleanEmpty(row.image_url),
    description: cleanEmpty(row.description),
    type: cleanEmpty(row.type),
    rawType: cleanEmpty(row.raw_type),
    category: cleanEmpty(row.category),
    placementLimit: cleanEmpty(row.placement_limit),
    totalCost: cleanEmpty(row.total_cost),
    customUnit: row.custom_unit || undefined,
    earlyGameRank: row.early_game_rank ?? undefined,
    lateGameRank: row.late_game_rank ?? undefined,
    obtain: Array.isArray(row.obtain) ? row.obtain : undefined,
    passive: cleanEmpty(row.passive),
    ability: cleanEmpty(row.ability),
    synergy: cleanEmpty(row.synergy),
    minMaxStats: row.min_max_stats && typeof row.min_max_stats === 'object' ? row.min_max_stats : undefined,
    upgrades: Array.isArray(row.upgrades) ? row.upgrades : undefined,
    liveWikiOverride: true,
    wikiUpdatedAt: row.updated_at,
  };
}

export function mergeWikiOverride(unit, override) {
  if (!unit || !override) return unit;
  const cleanOverride = Object.fromEntries(
    Object.entries(override).filter(([, value]) => value !== undefined)
  );
  return { ...unit, ...cleanOverride };
}
