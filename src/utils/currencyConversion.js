/**
 * currencyConversion.js — Gems ↔ Coins.
 *
 * Operator (2026-11-13, rev 8 correction): the bands are COIN amounts, not gem
 * amounts. "100M+ COINS is 55:1" — i.e. buying 100,000,000 coins costs one gem
 * per 55 coins. Low amounts are 1:100 (one gem buys 100 coins); the more coins
 * you take at once, the fewer coins each gem buys.
 *
 * So the table is read as: "if the trade is this many COINS, each gem is worth
 * this many coins". `rateForCoins(coins)` is the single source, and both
 * directions of the converter are derived from it.
 */

export const GEM_COIN_BANDS = [
  { upTo: 1_000, rate: 100, label: 'up to 1k coins' },
  { upTo: 10_000, rate: 95, label: '1k – 10k coins' },
  { upTo: 100_000, rate: 88, label: '10k – 100k coins' },
  { upTo: 1_000_000, rate: 80, label: '100k – 1M coins' },
  { upTo: 10_000_000, rate: 72, label: '1M – 10M coins' },
  { upTo: 50_000_000, rate: 66, label: '10M – 50M coins' },
  { upTo: 100_000_000, rate: 60, label: '50M – 100M coins' },
  { upTo: Infinity, rate: 55, label: '100M+ coins' },
];

/** Coins per gem for a trade of this many COINS. */
export function rateForCoins(coins) {
  const amount = Math.max(0, Number(coins) || 0);
  const band = GEM_COIN_BANDS.find((entry) => amount <= entry.upTo);
  return band ? band.rate : GEM_COIN_BANDS[GEM_COIN_BANDS.length - 1].rate;
}

/** How many gems a stack of coins is worth (coins ÷ the band's rate). */
export function coinsToGems(coins) {
  const amount = Math.max(0, Number(coins) || 0);
  if (!amount) return 0;
  return amount / rateForCoins(amount);
}

/**
 * How many coins a stack of gems buys.
 *
 * The rate depends on the resulting coin amount, so this walks the ladder: it
 * buys coins band by band until the gems run out. That makes `coinsToGems` and
 * `gemsToCoins` exact inverses instead of two different guesses.
 */
export function gemsToCoins(gems) {
  let remainingGems = Math.max(0, Number(gems) || 0);
  if (!remainingGems) return 0;
  let coins = 0;
  let floor = 0;
  for (const band of GEM_COIN_BANDS) {
    const span = Number.isFinite(band.upTo) ? band.upTo - floor : Infinity;
    const coinsFromBand = remainingGems * band.rate;
    if (coinsFromBand <= span) {
      return coins + coinsFromBand;
    }
    coins += span;
    remainingGems -= span / band.rate;
    floor = band.upTo;
    if (remainingGems <= 0) return coins;
  }
  return coins;
}

/** "100 coins = 1 gem" → used as the label above a ladder row. */
export function rateLabel(rate) {
  return `${rate} 🪙 = 1 💎`;
}
