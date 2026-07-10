import { DEMAND, SCARCITY } from '../data/taxonomy';

/**
 * Core Apex trade-value formula:
 *   TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier
 *
 * @param {number} baseValue - raw base value of the unit/item (Values page "BaseValue")
 * @param {string} demandLabel - one of the DEMAND keys, e.g. "Normal"
 * @param {string} scarcityLabel - one of the SCARCITY keys, e.g. "Standard"
 * @returns {number} computed trade value, rounded to nearest whole number
 */
export function computeTradeValue(baseValue, demandLabel, scarcityLabel) {
  const demandMult = DEMAND[demandLabel] ?? 1;
  const scarcityMult = SCARCITY[scarcityLabel] ?? 1;
  const base = Number(baseValue) || 0;
  return Math.round(base * demandMult * scarcityMult);
}

/** Returns the raw multiplier without applying to a base value (useful for display). */
export function getCombinedMultiplier(demandLabel, scarcityLabel) {
  const demandMult = DEMAND[demandLabel] ?? 1;
  const scarcityMult = SCARCITY[scarcityLabel] ?? 1;
  return demandMult * scarcityMult;
}

/**
 * Compares two "sides" of a trade (arrays of {tradeValue}) and returns
 * a verdict: which side is winning and by how much (value + percent).
 */
export function evaluateTrade(sideA, sideB) {
  const totalA = sideA.reduce((sum, e) => sum + (e.tradeValue || 0), 0);
  const totalB = sideB.reduce((sum, e) => sum + (e.tradeValue || 0), 0);
  const diff = totalA - totalB;
  const higher = totalA === totalB ? null : totalA > totalB ? 'A' : 'B';
  const lowerTotal = Math.min(totalA, totalB) || 1;
  const percentDiff = (Math.abs(diff) / lowerTotal) * 100;

  let verdict = 'Fair Trade';
  if (Math.abs(percentDiff) > 10) {
    verdict = higher === 'A' ? 'Side A Wins' : 'Side B Wins';
  } else if (Math.abs(percentDiff) > 2) {
    verdict = higher === 'A' ? 'Side A Slightly Favored' : 'Side B Slightly Favored';
  }

  return { totalA, totalB, diff, higher, percentDiff, verdict };
}

/** DPS helpers used across WIKI stat sheets */
export function computeDPS(damage, cooldownSeconds) {
  const cd = Number(cooldownSeconds);
  if (!cd || cd <= 0) return 0;
  return Number(damage) / cd;
}

export function computeCostPerDPS(cost, dps) {
  if (!dps || dps <= 0) return null;
  return Number(cost) / dps;
}
