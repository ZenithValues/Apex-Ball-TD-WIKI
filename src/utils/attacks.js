// ============================================================================
// ATTACK DATA MODEL
// ----------------------------------------------------------------------------
// A unit can have MULTIPLE attacks of the same type — e.g. two separate "AoE"
// attacks with different damage values. The old model stored attacks as an
// object keyed by attack name ({ "AoE": {...} }), so every attack after the
// first with the same type silently overwrote the previous one and only one
// value was ever shown.
//
// Attacks are now stored as an ORDERED LIST:
//   attacks: [ { name: "AoE", stats: { Damage: "500" } }, { name: "AoE", ... } ]
//
// normalizeAttacks() accepts BOTH the new list shape and the legacy object
// shape (older generated data + wiki overrides already stored in Supabase),
// so historic data keeps rendering exactly as before.
// ============================================================================

function toStatsObject(stats) {
  if (stats && typeof stats === 'object' && !Array.isArray(stats)) return { ...stats };
  return {};
}

/**
 * Returns attacks as an ordered array of { name, stats } no matter which
 * shape the input is in (legacy object, new array, null/undefined).
 */
export function normalizeAttacks(attacks) {
  if (!attacks) return [];

  if (Array.isArray(attacks)) {
    return attacks
      .map((attack) => {
        if (!attack || typeof attack !== 'object') return null;
        // Tolerate [name, stats] tuple entries if hand-written data uses them.
        if (Array.isArray(attack)) {
          const [name, stats] = attack;
          return { name: String(name || 'Stats'), stats: toStatsObject(stats) };
        }
        return {
          name: String(attack.name ?? attack.type ?? 'Stats'),
          stats: toStatsObject(attack.stats),
        };
      })
      .filter((attack) => attack && (attack.name || Object.keys(attack.stats).length > 0));
  }

  if (typeof attacks === 'object') {
    return Object.entries(attacks).map(([name, stats]) => ({ name, stats: toStatsObject(stats) }));
  }

  return [];
}

/** True when the unit has at least one attack block with displayable data. */
export function hasAttacks(attacks) {
  return normalizeAttacks(attacks).length > 0;
}

/**
 * Returns normalized attacks with a `label` that disambiguates repeated
 * types: two "AoE" blocks render as "AoE (1)" / "AoE (2)"; single blocks keep
 * their plain name.
 */
export function labelAttacks(attacks) {
  const list = normalizeAttacks(attacks);
  const totals = new Map();
  for (const attack of list) totals.set(attack.name, (totals.get(attack.name) || 0) + 1);

  const seen = new Map();
  return list.map((attack) => {
    const nth = (seen.get(attack.name) || 0) + 1;
    seen.set(attack.name, nth);
    const label = (totals.get(attack.name) || 0) > 1 ? `${attack.name} (${nth})` : attack.name;
    return { ...attack, label };
  });
}

/** Stable React key for an attack block (unique even for repeated types). */
export function attackKey(attack, index) {
  return `${attack.name}#${index}`;
}

/**
 * Flattens attacks into the admin textarea line format:
 *   "AoE / Damage: 500"
 * Repeated types appear once per stat line, so duplicate same-type attacks
 * survive the round-trip through the textarea.
 */
export function attacksToLines(attacks) {
  return normalizeAttacks(attacks)
    .flatMap((attack) =>
      Object.entries(attack.stats).map(([key, value]) => `${attack.name} / ${key}: ${value}`)
    )
    .join('\n');
}

/**
 * Parses the admin textarea line format back into an ORDERED LIST of attacks.
 *
 * Key rule for duplicate same-type attacks: when a stat key is typed a second
 * time under an attack name that already has a value for that key, that line
 * begins a NEW attack block of the same type instead of overwriting the old
 * value:
 *
 *   AoE / Damage: 500      -> block 1
 *   AoE / Damage: 950      -> block 2 (was previously lost!)
 *
 * Stat lines with distinct keys keep grouping into the currently open block.
 */
export function linesToAttacks(text) {
  const blocks = [];
  const openByName = new Map();

  for (const rawLine of String(text || '').split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;

    const left = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    const parts = left.split('/').map((part) => part.trim()).filter(Boolean);
    const attackName = parts.length > 1 ? parts[0] : 'Stats';
    const key = parts.length > 1 ? parts.slice(1).join(' / ') : parts[0];
    if (!key) continue;

    let block = openByName.get(attackName);
    if (!block || Object.prototype.hasOwnProperty.call(block.stats, key)) {
      block = { name: attackName, stats: {} };
      blocks.push(block);
      openByName.set(attackName, block);
    }
    block.stats[key] = value;
  }

  return blocks;
}
