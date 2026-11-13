import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { getRarityGlow, isShinyRarity, getCardGlow, getRarityPalette } from '../../data/taxonomy';
import UnitIcon from '../../components/UnitIcon';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import StatPillow from '../../components/StatPillow';
import ValuePillow from '../../components/ValuePillow';
import { getBaseStats, getUnitDps } from '../../utils/unitStats';
import { WIKI_NAV } from '../../config/navigation';
import { formatCompactNumber } from '../../utils/formatNumber';
import './UnitCompareV2.css';

/**
 * Unit Compare V2.
 *
 * Operator (rev 7): "improve the current design, add the card vs card
 * comparison and redesign the min -> max stats and upgrade paths too."
 *
 * So there are three honest sections, in the order a trader reads them:
 *   1. CARD VS CARD  — the real unit cards (same pillow as the Values grid),
 *      so the trade numbers are compared in the format the site already uses.
 *   2. MIN → MAX     — every stat as a rail from its level-1 value to its maxed
 *      value, one rail per unit, with the winner marked.
 *   3. UPGRADE PATH  — the level-by-level ladder for both units side by side.
 */

/* ---------- parsing ------------------------------------------------------- */

function parseNumericish(value) {
  if (value === null || value === undefined) return null;
  const head = String(value)
    .split('→')[0]
    .split('->')[0]
    .split('/')[0]
    .split('-')[0]
    .trim()
    .replace(/[$,\s%]/g, '');
  const match = head.match(/^([+-]?\d*\.?\d+)([kmbt])?$/i);
  if (!match) return null;
  const multipliers = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
  const factor = match[2] ? multipliers[match[2].toLowerCase()] : 1;
  const parsed = Number(match[1]) * factor;
  return Number.isFinite(parsed) ? parsed : null;
}

/** "10 -> 20" / "1.75" / "25k → 300.5k" → { min, max } */
function parseRange(value) {
  if (value === null || value === undefined) return null;
  const parts = String(value).split(/→|->/).map((part) => parseNumericish(part.trim()));
  const min = parts[0];
  const max = parts.length > 1 ? parts[1] : parts[0];
  if (min == null && max == null) return null;
  return { min: min ?? max, max: max ?? min };
}

/** Fallback when a unit has no minMaxStats: last upgrade level − first. */
function rangeFromUpgrades(unit, read) {
  const levels = Array.isArray(unit?.upgrades) ? unit.upgrades : [];
  if (!levels.length) return null;
  const first = read(levels[0]);
  const last = read(levels[levels.length - 1]);
  const min = parseRange(first)?.min;
  const max = parseRange(last)?.max;
  if (min == null && max == null) return null;
  return { min: min ?? max, max: max ?? min };
}

const MIN_MAX_LABELS = {
  Range: 'Range',
  Pierce: 'Pierce',
  Bullets: 'Bullets',
  Cooldown: 'Cooldown',
  Damage: 'Damage',
  DPS: 'DPS',
};

function statLabel(key) {
  if (MIN_MAX_LABELS[key]) return MIN_MAX_LABELS[key];
  // "Gun/Damage" → "Gun · Damage"
  return String(key).replace(/\//g, ' · ');
}

const LOWER_IS_BETTER = /cooldown/i;

/* ---------- small pieces -------------------------------------------------- */

function UnitSearchBox({ label, side, value, onChange, query, setQuery, units }) {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? units.filter((unit) => unit.name?.toLowerCase().includes(q) || unit.slug?.includes(q) || unit.rarity?.toLowerCase().includes(q))
      : units.filter((unit) => !unit.shiny).slice(0, 8);
    return pool.slice(0, 8);
  }, [query, units]);

  return (
    <div className={`cmp-picker cmp-picker-${side}`}>
      <div className="cmp-picker-head">
        <span className="cmp-picker-slot">{label}</span>
        {value && <button type="button" className="cmp-clear" onClick={() => onChange(null)}>Clear</button>}
      </div>
      <input
        className="cmp-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${label}…`}
        aria-label={`Search ${label}`}
      />
      <div className="cmp-results" hidden={Boolean(value) && !query.trim()}>
        {results.map((unit) => (
          <button
            type="button"
            key={unit.slug}
            className={value === unit.slug ? 'cmp-option active' : 'cmp-option'}
            onClick={() => { onChange(unit.slug); setQuery(''); }}
          >
            <UnitIcon
              slug={unit.slug}
              name={unit.name}
              glowColor={getRarityGlow(unit.rarity)}
              shiny={isShinyRarity(unit.rarity)}
              size={26}
              imageUrl={unit.imageUrl}
            />
            <span className="cmp-option-name">{unit.name}</span>
            <span className="cmp-option-rarity" style={{ color: getCardGlow(unit) }}>{unit.rarity}</span>
          </button>
        ))}
        {!results.length && <span className="cmp-empty">No unit matches that.</span>}
        {value && !query.trim() && <span className="cmp-empty">Use Clear to pick a different unit.</span>}
      </div>
    </div>
  );
}

function CardVersus({ unit, side }) {
  if (!unit) {
    return (
      <div className="cmp-card cmp-card-empty">
        <span>Pick a unit on the {side === 'a' ? 'left' : 'right'}</span>
      </div>
    );
  }
  const glow = getCardGlow(unit);
  const shiny = isShinyRarity(unit.rarity);
  return (
    <article
      className={`cmp-card unit-card uv-card ${shiny ? 'unit-card-shiny' : ''}`}
      style={{
        '--rarity-border': `linear-gradient(90deg, ${getRarityPalette(unit.rarity).join(', ')})`,
        '--rarity-glow': glow,
      }}
    >
      <div className="unit-card-stripe" />
      {shiny && <span className="card-shiny-fx" aria-hidden="true" />}
      <div className="unit-card-header uv-card-head">
        <div className="unit-card-icon-wrap">
          <UnitIcon slug={unit.slug} name={unit.name} glowColor={glow} shiny={shiny} size={72} imageUrl={unit.imageUrl} />
        </div>
        <div className="uv-card-head-text">
          <div className="unit-card-name">{unit.name}</div>
          <div className="uv-card-rarity" style={{ color: glow }}>{unit.rarity}</div>
        </div>
      </div>
      <div className="unit-card-body uv-card-body">
        {unit.hasValue ? <ValuePillow unit={unit} /> : <div className="uv-no-data">No market data yet</div>}
      </div>
    </article>
  );
}

function MinMaxRail({ range, other, lowerIsBetter, side }) {
  if (!range) return <span className="cmp-rail-empty">—</span>;
  const best = lowerIsBetter ? range.max <= other.max : range.max >= other.max;
  const min = range.min;
  const max = range.max;
  const same = min === max;
  return (
    <span className={`cmp-rail cmp-rail-${side} ${best ? 'is-best' : ''}`}>
      <span className="cmp-rail-nums">
        <strong>{formatCompactNumber(min)}</strong>
        <span className="cmp-rail-arrow" aria-hidden="true">{same ? '' : '→'}</span>
        <strong className={best ? 'cmp-win' : ''}>{formatCompactNumber(max)}</strong>
      </span>
      {!same && (
        <span className="cmp-rail-track" aria-hidden="true">
          <span className="cmp-rail-fill" />
        </span>
      )}
    </span>
  );
}

function UpgradeLadder({ unit, other, side }) {
  const levels = Array.isArray(unit?.upgrades) ? unit.upgrades : [];
  const otherLevels = Array.isArray(other?.upgrades) ? other.upgrades : [];
  if (!levels.length) return <div className="cmp-empty-ladder">No upgrade data recorded.</div>;

  return (
    <ol className={`cmp-ladder cmp-ladder-${side}`}>
      {levels.map((level, index) => {
        const dps = parseRange(level?.dps?.DPS)?.max ?? null;
        const otherDps = parseRange(otherLevels[index]?.dps?.DPS)?.max ?? null;
        const ahead = dps != null && otherDps != null && dps > otherDps;
        return (
          <li key={`${unit.slug}-lvl-${level.level ?? index}`} className={ahead ? 'cmp-level ahead' : 'cmp-level'}>
            <span className="cmp-level-tag">L{level.level ?? index + 1}</span>
            <span className="cmp-level-name">{level.label || `Upgrade ${index}`}</span>
            <span className="cmp-level-cost">{level.costRaw || (level.cost != null ? formatCompactNumber(level.cost) : '—')}</span>
            <span className="cmp-level-dps" title="DPS at this level">
              {dps != null ? formatCompactNumber(dps) : (level.dps?.DPS || '—')}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- page ---------------------------------------------------------- */

export default function UnitCompareV2() {
  const { unitValues } = useData();
  const [slugA, setSlugA] = useState(null);
  const [slugB, setSlugB] = useState(null);
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');

  const units = useMemo(() => (unitValues || []).filter((unit) => unit && unit.slug), [unitValues]);
  const unitA = units.find((unit) => unit.slug === slugA) || null;
  const unitB = units.find((unit) => unit.slug === slugB) || null;

  // MIN → MAX rows, union of both units' keys so nothing is hidden.
  const minMaxRows = useMemo(() => {
    if (!unitA || !unitB) return [];
    const keys = new Set([
      ...Object.keys(unitA.minMaxStats || {}),
      ...Object.keys(unitB.minMaxStats || {}),
    ]);
    const fallback = (unit, patterns) => {
      for (const pattern of patterns) {
        const found = rangeFromUpgrades(unit, (level) => {
          if (pattern === 'cooldown') return level.cooldown;
          if (pattern === 'range') return level.range;
          if (pattern === 'dps') return level.dps?.DPS;
          const attackStats = level.attacks?.[0]?.stats || {};
          const key = Object.keys(attackStats).find((k) => /damage/i.test(k));
          return key ? attackStats[key] : null;
        });
        if (found) return found;
      }
      return null;
    };

    const rows = [...keys].map((key) => ({
      key,
      label: statLabel(key),
      a: parseRange(unitA.minMaxStats?.[key]),
      b: parseRange(unitB.minMaxStats?.[key]),
    }));

    if (!rows.length) {
      rows.push(
        { key: 'damage', label: 'Damage', a: fallback(unitA, ['damage']), b: fallback(unitB, ['damage']) },
        { key: 'cooldown', label: 'Cooldown', a: fallback(unitA, ['cooldown']), b: fallback(unitB, ['cooldown']) },
        { key: 'range', label: 'Range', a: fallback(unitA, ['range']), b: fallback(unitB, ['range']) },
        { key: 'dps', label: 'DPS', a: fallback(unitA, ['dps']), b: fallback(unitB, ['dps']) },
      );
    }

    return rows
      .filter((row) => row.a || row.b)
      .map((row) => ({ ...row, lower: LOWER_IS_BETTER.test(row.key) }));
  }, [unitA, unitB]);

  const quickStats = useMemo(() => {
    if (!unitA || !unitB) return [];
    const statsA = getBaseStats(unitA) || {};
    const statsB = getBaseStats(unitB) || {};
    const dpsA = getUnitDps(unitA);
    const dpsB = getUnitDps(unitB);
    return [
      { term: 'damage', label: 'Base damage', a: statsA.damage, b: statsB.damage },
      { term: 'cooldown', label: 'Base cooldown', a: statsA.cooldown, b: statsB.cooldown, suffix: 's', lower: true },
      { term: 'range', label: 'Base range', a: statsA.range, b: statsB.range },
      { term: 'dps', label: 'DPS', a: dpsA?.dps, b: dpsB?.dps },
      { term: 'costPerDps', label: '$ / DPS', a: dpsA?.costPerDps, b: dpsB?.costPerDps, lower: true, money: true },
      { term: 'placement', label: 'Total cost', a: unitA.totalCost, b: unitB.totalCost },
    ].filter((row) => row.a != null || row.b != null);
  }, [unitA, unitB]);

  const both = Boolean(unitA && unitB);

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <PageIntro eyebrow="WIKI" title="Unit Comparison" cutoutVariant="hacker">
        <p>
          Pick any two units. Their real value cards sit side by side, then every stat as a level-1 → maxed rail,
          then both upgrade ladders level by level.
        </p>
      </PageIntro>

      <div className="cmp-v2">
        <div className="cmp-pickers">
          <UnitSearchBox
            label="Unit A"
            side="a"
            value={slugA}
            onChange={setSlugA}
            query={queryA}
            setQuery={setQueryA}
            units={units}
          />
          <div className="cmp-vs" aria-hidden="true"><span>VS</span></div>
          <UnitSearchBox
            label="Unit B"
            side="b"
            value={slugB}
            onChange={setSlugB}
            query={queryB}
            setQuery={setQueryB}
            units={units}
          />
        </div>

        <section className="cmp-cards" aria-label="Card versus card">
          <CardVersus unit={unitA} side="a" />
          <div className="cmp-cards-vs" aria-hidden="true">VS</div>
          <CardVersus unit={unitB} side="b" />
        </section>

        {both && (
          <>
            <motion.section
              className="cmp-panel card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              aria-label="Quick stats"
            >
              <header className="cmp-panel-head">
                <h2>At a glance</h2>
                <span>Base level values, straight from the WIKI</span>
              </header>
              <div className="cmp-quick">
                {quickStats.map((row) => {
                  const aNum = parseNumericish(row.a);
                  const bNum = parseNumericish(row.b);
                  const aWins = aNum != null && bNum != null && (row.lower ? aNum < bNum : aNum > bNum);
                  const bWins = aNum != null && bNum != null && (row.lower ? bNum < aNum : bNum > aNum);
                  const fmt = (value) => {
                    if (value == null || value === '') return '—';
                    if (typeof value === 'number') return formatCompactNumber(value);
                    return String(value);
                  };
                  return (
                    <div key={row.term} className="cmp-quick-row" data-stat={row.term}>
                      <span className={aWins ? 'cmp-quick-val win' : 'cmp-quick-val'}>
                        {fmt(row.a)}{row.suffix && row.a != null ? row.suffix : ''}
                      </span>
                      <span className="cmp-quick-label">{row.label}</span>
                      <span className={bWins ? 'cmp-quick-val win' : 'cmp-quick-val'}>
                        {fmt(row.b)}{row.suffix && row.b != null ? row.suffix : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            <motion.section
              className="cmp-panel card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              aria-label="Minimum to maximum stats"
            >
              <header className="cmp-panel-head">
                <h2>Min → max</h2>
                <span>Where each stat starts and where it ends when fully upgraded</span>
              </header>
              <div className="cmp-minmax">
                <div className="cmp-minmax-legend">
                  <span style={{ color: getCardGlow(unitA) }}>{unitA.name}</span>
                  <span>Stat</span>
                  <span style={{ color: getCardGlow(unitB) }}>{unitB.name}</span>
                </div>
                {minMaxRows.map((row) => (
                  <div key={row.key} className="cmp-minmax-row">
                    <MinMaxRail range={row.a || row.b} other={row.b || row.a} lowerIsBetter={row.lower} side="a" />
                    <span className="cmp-minmax-label">
                      {row.label}
                      {row.lower && <small>lower is better</small>}
                    </span>
                    <MinMaxRail range={row.b || row.a} other={row.a || row.b} lowerIsBetter={row.lower} side="b" />
                  </div>
                ))}
                {!minMaxRows.length && <p className="cmp-empty">Neither unit has recorded stat ranges yet.</p>}
              </div>
            </motion.section>

            <motion.section
              className="cmp-panel card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              aria-label="Upgrade paths"
            >
              <header className="cmp-panel-head">
                <h2>Upgrade path</h2>
                <span>Level, price and DPS — the highlighted levels are where this unit pulls ahead</span>
              </header>
              <div className="cmp-ladders">
                <div className="cmp-ladder-col">
                  <h3 style={{ color: getCardGlow(unitA) }}>{unitA.name}</h3>
                  <UpgradeLadder unit={unitA} other={unitB} side="a" />
                </div>
                <div className="cmp-ladder-col">
                  <h3 style={{ color: getCardGlow(unitB) }}>{unitB.name}</h3>
                  <UpgradeLadder unit={unitB} other={unitA} side="b" />
                </div>
              </div>
            </motion.section>
          </>
        )}

        {!both && (
          <p className="cmp-hint">
            Pick two units above — the comparison fills in as soon as both slots are set.
          </p>
        )}
      </div>
    </PageShell>
  );
}
