import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../../components/PageShell';
import { VALUES_NAV } from '../../data/navTree';
import { DEMAND, SCARCITY, getRarityGlow, isShinyRarity } from '../../data/taxonomy';
import { getValueEntryBySlug } from '../../data/values';
import { evaluateTrade } from '../../utils/calculator';
import { encodeState, decodeState, loadFromLocalStorage, saveToLocalStorage } from '../../utils/calculatorState';
import UnitIcon from '../../components/UnitIcon';
import ValueEntryPicker from '../../components/ValueEntryPicker';
import './TradeCalculator.css';

let idCounter = 0;
const nextId = () => ++idCounter;

// Every row is LINKED to a real unit/item by slug — its baseValue/demand/
// scarcity always come live from the shared values data (src/data/values.js).
// Custom manual entries have been removed entirely per current design.
function makeLinkedEntry(slug, quantity = 1) {
  return { id: nextId(), slug, quantity };
}

function resolveEntry(entry) {
  const source = getValueEntryBySlug(entry.slug);
  if (!source) return { ...entry, missing: true, tradeValue: 0 };
  const unitValue = source.tradeValue ?? 0;
  return {
    ...entry,
    name: source.name,
    rarity: source.rarity,
    kind: source.kind,
    demand: source.demand,
    scarcity: source.scarcity,
    unitValue,
    tradeValue: unitValue * entry.quantity,
  };
}

function serializeSide(entries) {
  return entries.filter((e) => e.slug).map((e) => [e.slug, e.quantity]);
}

function deserializeSide(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((row) => Array.isArray(row) && row[0])
    .map(([slug, quantity]) => makeLinkedEntry(slug, Math.max(1, Number(quantity) || 1)));
}

export default function TradeCalculator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sideA, setSideA] = useState([]);
  const [sideB, setSideB] = useState([]);
  const [copied, setCopied] = useState(false);
  const hydrated = useRef(false);

  // Hydrate once on mount: prefer the ?trade= URL param (shareable link),
  // fall back to the last session saved in localStorage.
  useEffect(() => {
    const fromUrl = searchParams.get('trade');
    const decoded = fromUrl ? decodeState(fromUrl) : null;
    const initial = decoded || loadFromLocalStorage();
    if (initial) {
      setSideA(deserializeSide(initial.a));
      setSideB(deserializeSide(initial.b));
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change (after initial hydration) to both localStorage
  // and the URL, so refreshing or sharing the link preserves the trade.
  useEffect(() => {
    if (!hydrated.current) return;
    const state = { a: serializeSide(sideA), b: serializeSide(sideB) };
    saveToLocalStorage(state);
    const encoded = encodeState(state);
    if (encoded) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('trade', encoded);
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideA, sideB]);

  const computedA = useMemo(() => sideA.map(resolveEntry), [sideA]);
  const computedB = useMemo(() => sideB.map(resolveEntry), [sideB]);
  const result = useMemo(() => evaluateTrade(computedA, computedB), [computedA, computedB]);

  function swapSides() {
    setSideA(sideB);
    setSideB(sideA);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <div className="calc-page-head">
        <div>
          <h1>Trade Calculator</h1>
          <p className="crumb">Values / Trade Calculator</p>
        </div>
        <div className="calc-page-actions">
          <button type="button" className="calc-swap" onClick={swapSides}>
            ⇄ Swap
          </button>
          <button type="button" className="calc-share" onClick={copyShareLink}>
            {copied ? '✓ Copied!' : '🔗 Share Trade'}
          </button>
        </div>
      </div>

      <div className="calc-arena">
        <TradeSide
          side="A"
          label="YOU"
          entries={sideA}
          setEntries={setSideA}
          computed={computedA}
        />

        <VerdictColumn result={result} />

        <TradeSide
          side="B"
          label="THEM"
          entries={sideB}
          setEntries={setSideB}
          computed={computedB}
        />
      </div>
    </PageShell>
  );
}

function VerdictColumn({ result }) {
  return (
    <div className="calc-verdict-col">
      <div className="calc-vs-mark">VS</div>
      <motion.div
        key={result.verdict}
        className={`calc-verdict-badge ${verdictClass(result)}`}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {result.verdict}
      </motion.div>
      {result.diff !== 0 && (
        <div className="calc-verdict-diff">
          {Math.abs(result.diff).toLocaleString()} diff ({result.percentDiff.toFixed(1)}%)
        </div>
      )}
      <div className="calc-verdict-bars">
        <TotalBar label="YOU" total={result.totalA} max={Math.max(result.totalA, result.totalB, 1)} colorVar="--you-color" />
        <TotalBar label="THEM" total={result.totalB} max={Math.max(result.totalA, result.totalB, 1)} colorVar="--them-color" />
      </div>
    </div>
  );
}

function TotalBar({ label, total, max, colorVar }) {
  const percent = Math.max(4, (total / max) * 100);
  return (
    <div className="calc-total-bar-block">
      <div className="calc-total-bar-label">
        <span>{label}</span>
        <span>{total.toLocaleString()}</span>
      </div>
      <div className="calc-total-bar-track">
        <motion.div
          className="calc-total-bar-fill"
          style={{ background: `var(${colorVar})`, boxShadow: `0 0 12px var(${colorVar})` }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function verdictClass(result) {
  if (result.outcome === 'win') return 'win';
  if (result.outcome === 'loss') return 'loss';
  return 'fair';
}

function multiplierLabel(table, label) {
  const mult = table[label];
  if (mult == null) return label;
  return `${label} (${mult}×)`;
}

function TradeSide({ side, label, entries, setEntries, computed }) {
  const total = computed.reduce((sum, e) => sum + (e.tradeValue || 0), 0);
  const sideClass = side === 'A' ? 'calc-side-you' : 'calc-side-them';

  const updateQuantity = (id, quantity) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, quantity: Math.max(1, quantity) } : e)));
  };

  const addLinked = (valueEntry) =>
    setEntries((prev) => {
      const existing = prev.find((e) => e.slug === valueEntry.slug);
      if (existing) {
        return prev.map((e) => (e.slug === valueEntry.slug ? { ...e, quantity: e.quantity + 1 } : e));
      }
      return [...prev, makeLinkedEntry(valueEntry.slug)];
    });

  const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const clearSide = () => setEntries([]);

  return (
    <div className={`calc-side ${sideClass}`}>
      <div className="calc-side-header">
        <h2 className="calc-side-title">{label}</h2>
        <div className="calc-side-header-right">
          <span className="calc-side-total">{total.toLocaleString()}</span>
          {entries.length > 0 && (
            <button type="button" className="calc-clear" onClick={clearSide}>
              Clear
            </button>
          )}
        </div>
      </div>

      <ValueEntryPicker onPick={addLinked} placeholder={`Add to ${label}'s side…`} />

      <div className="calc-entries">
        <AnimatePresence initial={false}>
          {entries.map((entry, idx) => {
            const resolved = computed[idx];
            if (!resolved) return null;
            const glow = getRarityGlow(resolved.rarity);

            return (
              <motion.div
                key={entry.id}
                className="calc-entry"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 10 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <UnitIcon
                  slug={entry.slug}
                  name={resolved.name}
                  glowColor={glow}
                  shiny={isShinyRarity(resolved.rarity)}
                  size={44}
                />
                <div className="calc-entry-text">
                  <span className="calc-entry-name">{resolved.name}</span>
                  <span className="calc-entry-meta" style={{ color: glow }}>
                    {resolved.rarity}
                  </span>
                  <span className="calc-entry-tiers">
                    {multiplierLabel(DEMAND, resolved.demand)} · {multiplierLabel(SCARCITY, resolved.scarcity)}
                  </span>
                </div>

                <div className="calc-qty-control">
                  <button
                    type="button"
                    className="calc-qty-btn"
                    onClick={() => updateQuantity(entry.id, entry.quantity - 1)}
                    disabled={entry.quantity <= 1}
                  >
                    −
                  </button>
                  <span className="calc-qty-value">{entry.quantity}×</span>
                  <button type="button" className="calc-qty-btn" onClick={() => updateQuantity(entry.id, entry.quantity + 1)}>
                    +
                  </button>
                </div>

                <div className="calc-entry-value">{(resolved.tradeValue || 0).toLocaleString()}</div>

                <button
                  type="button"
                  className="calc-remove"
                  onClick={() => removeEntry(entry.id)}
                  aria-label="Remove entry"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="calc-empty-side">Search above to add units or items to {label}'s side.</div>
        )}
      </div>
    </div>
  );
}
