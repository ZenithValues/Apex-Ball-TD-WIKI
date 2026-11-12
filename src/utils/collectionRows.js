/**
 * Merge a built-in WIKI collection (traits, …) with the rows editors
 * created in the admin panel. KV rows win, and they keep their own slugs so a
 * renamed built-in still gets a stable URL.
 */
export function mergeCollection(builtIn = [], itemRows = [], group) {
  const overrides = (itemRows || []).filter((row) => row.group === group);
  const overrideSlugs = new Set(overrides.map((row) => row.slug));
  return [
    ...overrides,
    ...builtIn.filter((row) => !overrideSlugs.has(row.slug)),
  ];
}
