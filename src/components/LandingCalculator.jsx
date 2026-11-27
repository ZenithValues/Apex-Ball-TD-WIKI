import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import UnitIcon from './UnitIcon';
import CoolIcon from './CoolIcon';
import Dropdown from './Dropdown';
import { evaluateTrade } from '../utils/calculator';
import { formatCompactNumber } from '../utils/formatNumber';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import './LandingCalculator.css';

const MAX_PER_SIDE = 3;

export function pickFairDefaultSides(priced) {
  if (!Array.isArray(priced) || priced.length < 2) return [[], []];
  const pool = priced.slice(0, 40);
  let best = null;

  const tryCandidate = (aUnits, bUnits) => {
    const slugs = new Set([...aUnits.map((u) => u.slug), ...bUnits.map((u) => u.slug)]);
    if (slugs.size !== aUnits.length + bUnits.length) return; // ensure strictly disjoint
    const res = evaluateTrade(aUnits, bUnits);
    if (res.outcome !== 'fair') return;
    const totalSum = res.totalA + res.totalB;
    const rel = res.percentDiff;
    const countPenalty = (aUnits.length + bUnits.length) >= 3 ? 0 : 1.5;
    const score = rel + countPenalty;
    if (!best || score < best.score || (score === best.score && totalSum > best.totalSum)) {
      best = {
        sideA: aUnits.map((u) => u.slug),
        sideB: bUnits.map((u) => u.slug),
        score,
        totalSum,
      };
    }
  };

  // 2 vs 2 across top 20
  const n2 = Math.min(pool.length, 20);
  for (let i = 0; i < n2; i++) {
    for (let j = i + 1; j < n2; j++) {
      for (let k = i + 1; k < n2; k++) {
        if (k === j) continue;
        for (let l = k + 1; l < n2; l++) {
          if (l === j) continue;
          tryCandidate([pool[i], pool[j]], [pool[k], pool[l]]);
        }
      }
    }
  }
  // 1 vs 2 across top 32
  const n12 = Math.min(pool.length, 32);
  for (let i = 0; i < n12; i++) {
    for (let j = i + 1; j < n12; j++) {
      for (let k = j + 1; k < n12; k++) {
        tryCandidate([pool[i]], [pool[j], pool[k]]);
      }
    }
  }
  // 1 vs 1 across all pool
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      tryCandidate([pool[i]], [pool[j]]);
    }
  }
  if (best) return [best.sideA, best.sideB];

  // Fallback closest adjacent pair
  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < pool.length - 1; i++) {
    const d = Math.abs(pool[i].tradeValue - pool[i + 1].tradeValue) / Math.max(pool[i].tradeValue, 1);
    if (d < minDiff) { minDiff = d; closestIdx = i; }
  }
  return [[pool[closestIdx].slug], [pool[closestIdx + 1].slug]];
}

/**
 * A compact, real calculator preview for the landing page.
 * It deliberately uses the same layout language as /values/calculator (two
 * "sides", live totals, an outcome badge) but keeps a deliberately small
 * feature set: pick up to three real units per side. Currencies, history,
 * sharing and saved trades stay in the full calculator.
 */
export default function LandingCalculator({ unitValues = [], imageMap = {} }) {
  const priced = useMemo(() => (unitValues || [])
    .filter((u) => u.kind !== 'item' && u.hasValue && !u.shiny
      && !isShinyRarity(u.rarity) && Number.isFinite(u.tradeValue) && u.tradeValue > 0)
    .sort((a, b) => b.tradeValue - a.tradeValue), [unitValues]);

  const [sideA, setSideA] = useState([]);
  const [sideB, setSideB] = useState([]);
  const [userEdited, setUserEdited] = useState(false);
  const [picking, setPicking] = useState(null); // 'A' | 'B' | null

  const bySlug = useMemo(() => new Map(priced.map((u) => [u.slug, u])), [priced]);
  const entries = (slugs) => slugs.map((s) => bySlug.get(s)).filter(Boolean).map((u) => ({ tradeValue: u.tradeValue }));
  const result = evaluateTrade(entries(sideA), entries(sideB));
  const maxTotal = Math.max(result.totalA, result.totalB, 1);

  useEffect(() => {
    if (userEdited || priced.length < 2) return;
    const currentRes = evaluateTrade(
      sideA.map((s) => bySlug.get(s)).filter(Boolean).map((u) => ({ tradeValue: u.tradeValue })),
      sideB.map((s) => bySlug.get(s)).filter(Boolean).map((u) => ({ tradeValue: u.tradeValue })),
    );
    if (sideA.length > 0 && sideB.length > 0 && currentRes.outcome === 'fair') return;
    const [defaultA, defaultB] = pickFairDefaultSides(priced);
    setSideA(defaultA);
    setSideB(defaultB);
  }, [userEdited, priced, bySlug, sideA, sideB]);



  function add(side, slug) {
    if (!slug || !bySlug.has(slug)) return;
    setUserEdited(true);
    const set = side === 'A' ? setSideA : setSideB;
    set((current) => (current.length >= MAX_PER_SIDE || current.includes(slug) ? current : [...current, slug]));
    setPicking(null);
  }

  function remove(side, slug) {
    setUserEdited(true);
    const set = side === 'A' ? setSideA : setSideB;
    set((current) => current.filter((s) => s !== slug));
  }

  function swap() {
    setUserEdited(true);
    setSideA(sideB);
    setSideB(sideA);
  }

  const Side = ({ side, label, slugs }) => {
    const total = side === 'A' ? result.totalA : result.totalB;
    return (
      <div className={`landing-calc-side landing-calc-side-${side === 'A' ? 'you' : 'them'}`}>
        <div className="landing-calc-side-head">
          <span>{label}</span>
          <strong title="Total trade value">{formatCompactNumber(total)}</strong>
        </div>
        <div className="landing-calc-rows">
          {slugs.map((slug) => {
            const unit = bySlug.get(slug);
            if (!unit) return null;
            return (
              <div className="landing-calc-row" key={slug}>
                <UnitIcon
                  slug={unit.slug}
                  name={unit.name}
                  size={34}
                  glowColor={getRarityGlow(unit.rarity)}
                  imageUrl={imageMap[unit.slug] || unit.imageUrl}
                />
                <span className="landing-calc-row-name">{unit.name}</span>
                <span className="landing-calc-row-value">{formatCompactNumber(unit.tradeValue)}</span>
                <button type="button" onClick={() => remove(side, slug)} aria-label={`Remove ${unit.name}`}>✕</button>
              </div>
            );
          })}
          {slugs.length === 0 && <p className="landing-calc-empty">No units added yet.</p>}
        </div>
        {slugs.length < MAX_PER_SIDE && (
          picking === side ? (
            /* A real searchable unit picker (icons, rarity, price) instead of
               the browser's native <select> — same dropdown as the rest of the
               site, so the landing preview feels like the product. */
            <div className="landing-calc-picker-wrap">
              <Dropdown
                className="landing-calc-picker"
                value=""
                searchable
                searchPlaceholder="Search units…"
                placeholder="Choose a unit…"
                ariaLabel={`Add a unit to ${label}`}
                onChange={(slug) => add(side, slug)}
                groups={[{
                  label: 'Prized units',
                  options: priced.slice(0, 80).filter((u) => !slugs.includes(u.slug)).map((u) => ({
                    value: u.slug,
                    label: `${u.name} — ${formatCompactNumber(u.tradeValue)}`,
                    icon: imageMap[u.slug] || u.imageUrl || undefined,
                  })),
                }]}
              />
              <button type="button" className="landing-calc-cancel" onClick={() => setPicking(null)} aria-label="Cancel adding a unit">✕</button>
            </div>
          ) : (
            <button type="button" className="landing-calc-add" onClick={() => setPicking(side)}>+ Add unit</button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="landing-calc" aria-label="Quick trade calculator preview">
      <div className="landing-calc-topbar">
        <span className="landing-calc-label">TRADE CALCULATOR</span>
      </div>
      <div className="landing-calc-grid">
        <Side side="A" label="Your side" slugs={sideA} />
        <button type="button" className="landing-calc-swap" onClick={swap} aria-label="Swap both sides" title="Swap sides">⇄</button>
        <Side side="B" label="Their side" slugs={sideB} />
      </div>
      <div className="landing-calc-verdict">
        <div className="landing-calc-verdict-head">
          <span className={`landing-calc-badge ${result.outcome}`}>{result.verdict}</span>
          <span className="landing-calc-diff">
            {result.diff === 0 ? 'Even trade' : `${result.diff > 0 ? '+' : '−'}${formatCompactNumber(Math.abs(result.diff))} for you`}
          </span>
        </div>
        <div className="landing-calc-bars">
          <div className="landing-calc-bar-track"><div className="landing-calc-bar you" style={{ width: `${(result.totalA / maxTotal) * 100}%` }} /></div>
          <div className="landing-calc-bar-track"><div className="landing-calc-bar them" style={{ width: `${(result.totalB / maxTotal) * 100}%` }} /></div>
        </div>
      </div>
      <div className="landing-calc-foot">
        <span>Quick preview · up to 3 units each side</span>
        <Link to="/values/calculator" className="landing-calc-open">Open full calculator <CoolIcon name="arrow-up-right" size={16} /></Link>
      </div>
    </div>
  );
}
