const NUMBER_RE = /(-?\d[\d,]*(?:\.\d+)?)([KMB]?)/gi;

export function parseStatNumber(raw) {
  if (raw == null) return null;
  const text = String(raw);
  let best = null;
  for (const match of text.matchAll(NUMBER_RE)) {
    const value = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    const suffix = match[2]?.toUpperCase();
    const mult = suffix === 'B' ? 1_000_000_000 : suffix === 'M' ? 1_000_000 : suffix === 'K' ? 1_000 : 1;
    const parsed = value * mult;
    best = best == null ? parsed : Math.max(best, parsed);
  }
  return best;
}

export function parseBestLowNumber(raw) {
  if (raw == null) return null;
  const text = String(raw);
  let best = null;
  for (const match of text.matchAll(NUMBER_RE)) {
    const value = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(value)) continue;
    const suffix = match[2]?.toUpperCase();
    const mult = suffix === 'B' ? 1_000_000_000 : suffix === 'M' ? 1_000_000 : suffix === 'K' ? 1_000 : 1;
    const parsed = value * mult;
    best = best == null ? parsed : Math.min(best, parsed);
  }
  return best;
}

import { formatCompactNumber as formatCompactBase, formatFullNumber } from './formatNumber';

export { formatFullNumber };

export function formatCompactNumber(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return formatCompactBase(value);
}

export function getUnitMaxDps(unit) {
  let best = null;
  let label = null;
  (unit.upgrades || []).forEach((upgrade) => {
    Object.entries(upgrade.dps || {}).forEach(([key, raw]) => {
      if (/n\/?a/i.test(String(raw))) return;
      const value = parseStatNumber(raw);
      if (value != null && (best == null || value > best)) {
        best = value;
        label = `${upgrade.label} · ${key}: ${raw}`;
      }
    });
  });
  return { value: best, label };
}

export function getUnitBestCostEfficiency(unit) {
  let best = null;
  let label = null;
  (unit.upgrades || []).forEach((upgrade) => {
    if (!upgrade.costPerDps || /n\/?a/i.test(String(upgrade.costPerDps))) return;
    const value = parseBestLowNumber(upgrade.costPerDps);
    if (value != null && (best == null || value < best)) {
      best = value;
      label = `${upgrade.label}: ${upgrade.costPerDps}`;
    }
  });
  return { value: best, label };
}

export function getRankingValue(unit, rankingRows, key) {
  const row = rankingRows.find((entry) => entry.slug === unit.slug);
  const value = Number(row?.[key]);
  return Number.isFinite(value) && value > 0 ? value : null;
}
