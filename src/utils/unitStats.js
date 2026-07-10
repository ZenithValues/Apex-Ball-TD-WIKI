/**
 * Small helpers to pull a quick "at a glance" stat summary out of a unit's
 * raw parsed data (cooldown, range, first attack's damage, placement count)
 * for use on compact cards where showing every upgrade level isn't practical.
 */

export function getBaseStats(unit) {
  const first = unit?.upgrades?.[0];
  if (!first) return null;

  let damage = null;
  if (first.attacks) {
    const firstAttackBlock = Object.values(first.attacks)[0];
    if (firstAttackBlock) {
      const dmgKey = Object.keys(firstAttackBlock).find((k) => /damage|income/i.test(k));
      if (dmgKey) damage = firstAttackBlock[dmgKey];
    }
  }

  return {
    cooldown: first.cooldown,
    range: first.range,
    damage,
    placementLimit: unit.placementLimit,
  };
}
