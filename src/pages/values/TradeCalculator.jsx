import { useMemo, useState } from 'react';
import PageShell from '../../components/PageShell';
import { VALUES_NAV } from '../../data/navTree';
import { DEMAND_LABELS, SCARCITY_LABELS, getRarityGlow, isShinyRarity } from '../../data/taxonomy';
import { getValueEntryBySlug } from '../../data/values';
import { computeTradeValue, evaluateTrade } from '../../utils/calculator';
import UnitIcon from '../../components/UnitIcon';
import ValueEntryPicker from '../../components/ValueEntryPicker';
import './TradeCalculator.css';

let idCounter = 0;
const nextId = () => ++idCounter;

// A calculator row is either LINKED to a real unit/item (via slug — its
// baseValue/demand/scarcity always come live from the shared values data,
// see src/data/values.js) or CUSTOM (freeform name/base value/demand/
// scarcity typed by hand, for anything not in the database yet).
function makeLinkedEntry(valueEntry) {
  return {
    id: nextId(),
    slug: valueEntry.slug,
    quantity: 1,
  };
}

function makeCustomEntry() {
  return {
    id: nextId(),
    slug: null,
    name: '',
    baseValue: '',
    demand: 'Normal',
    scarcity: 'Standard',
    quantity: 1,
  };
}

/** Resolves a row to its live display data — for linked rows this always
 * re-reads the shared value index, so edits there show up immediately. */
function resolveEntry(entry) {
  if (entry.slug) {
    const source = getValueEntryBySlug(entry.slug);
    if (source) {
      return {
        ...entry,
        name: source.name,
        rarity: source.rarity,
        kind: source.kind,
        demand: source.demand,
        scarcity: source.scarcity,
        unitValue: source.tradeValue ?? 0,
        tradeValue: (source.tradeValue ?? 0) * entry.quantity,
      };
    }
  }
  const unitValue = computeTradeValue(entry.baseValue, entry.demand, entry.scarcity);
  return { ...entry, unitValue, tradeValue: unitValue * entry.quantity };
}

export default function TradeCalculator() {
  const [sideA, setSideA] = useState([makeCustomEntry()]);
  const [sideB, setSideB] = useState([makeCustomEntry()]);

  const computedA = useMemo(() => sideA.map(resolveEntry), [sideA]);
  const computedB = useMemo(() => sideB.map(resolveEntry), [sideB]);

  const result = useMemo(() => evaluateTrade(computedA, computedB), [computedA, computedB]);

  function swapSides() {
    setSideA(sideB);
    setSideB(sideA);
  }

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <h1>Trade Calculator</h1>
      <p className="crumb">Values / Trade Calculator</p>

      <div className="formula-box">
        <code>TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier</code>
        <span className="formula-note">
          Search a unit/item to pull its live Value, Demand &amp; Scarcity straight from the
          Values database — or add a custom entry for anything not tracked yet.
        </span>
      </div>

      <button type="button" className="calc-swap" onClick={swapSides}>
        ⇄ Swap Sides
      </button>

      <div className="calc-columns">
        <TradeSide label="Side A" entries={sideA} setEntries={setSideA} computed={computedA} />
        <TradeSide label="Side B" entries={sideB} setEntries={setSideB} computed={computedB} />
      </div>

      <div className={`verdict-box ${verdictClass(result)}`}>
        <div className="verdict-totals">
          <div className={result.higher === 'A' ? 'verdict-win' : ''}>
            <span className="verdict-label">Side A Total</span>
            <span className="verdict-value">{result.totalA.toLocaleString()}</span>
          </div>
          <div className="verdict-vs">VS</div>
          <div className={result.higher === 'B' ? 'verdict-win' : ''}>
            <span className="verdict-label">Side B Total</span>
            <span className="verdict-value">{result.totalB.toLocaleString()}</span>
          </div>
        </div>
        <div className="verdict-result">
          <span className="verdict-title">{result.verdict}</span>
          {result.diff !== 0 && (
            <span className="verdict-detail">
              Difference: {Math.abs(result.diff).toLocaleString()} ({result.percentDiff.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function verdictClass(result) {
  if (result.verdict === 'Fair Trade') return 'fair';
  if (result.verdict.includes('Slightly')) return 'slight';
  return 'strong';
}

function TradeSide({ label, entries, setEntries, computed }) {
  const total = computed.reduce((sum, e) => sum + (e.tradeValue || 0), 0);

  const updateEntry = (id, patch) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const addLinked = (valueEntry) => setEntries((prev) => [...prev, makeLinkedEntry(valueEntry)]);
  const addCustom = () => setEntries((prev) => [...prev, makeCustomEntry()]);
  const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const clearSide = () => setEntries([makeCustomEntry()]);

  return (
    <div className="calc-side card">
      <div className="calc-side-header">
        <h2>{label}</h2>
        <div className="calc-side-header-right">
          <span className="badge filled">{total.toLocaleString()}</span>
          <button type="button" className="calc-clear" onClick={clearSide}>
            Clear
          </button>
        </div>
      </div>

      <ValueEntryPicker onPick={addLinked} />

      <div className="calc-entries">
        {entries.map((entry, idx) => {
          const resolved = computed[idx];
          const isLinked = !!entry.slug;
          const glow = isLinked ? getRarityGlow(resolved.rarity) : null;

          return (
            <div key={entry.id} className={isLinked ? 'calc-entry calc-entry-linked' : 'calc-entry'}>
              {isLinked ? (
                <div className="calc-entry-linked-info">
                  <UnitIcon
                    slug={entry.slug}
                    name={resolved.name}
                    glowColor={glow}
                    shiny={isShinyRarity(resolved.rarity)}
                    size={34}
                  />
                  <div className="calc-entry-linked-text">
                    <span className="calc-entry-linked-name">{resolved.name}</span>
                    <span className="calc-entry-linked-meta" style={{ color: glow }}>
                      {resolved.rarity} · {resolved.demand} · {resolved.scarcity}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Custom item name"
                    value={entry.name}
                    onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                    className="calc-input calc-input-name"
                  />
                  <input
                    type="number"
                    placeholder="Base Value"
                    value={entry.baseValue}
                    onChange={(e) => updateEntry(entry.id, { baseValue: e.target.value })}
                    className="calc-input calc-input-number"
                  />
                  <select
                    value={entry.demand}
                    onChange={(e) => updateEntry(entry.id, { demand: e.target.value })}
                    className="calc-input"
                  >
                    {DEMAND_LABELS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={entry.scarcity}
                    onChange={(e) => updateEntry(entry.id, { scarcity: e.target.value })}
                    className="calc-input"
                  >
                    {SCARCITY_LABELS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </>
              )}

              <input
                type="number"
                min="1"
                value={entry.quantity}
                onChange={(e) => updateEntry(entry.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                className="calc-input calc-input-qty"
                title="Quantity"
              />

              <div className="calc-entry-value">{(resolved.tradeValue || 0).toLocaleString()}</div>

              <button
                type="button"
                className="calc-remove"
                onClick={() => removeEntry(entry.id)}
                disabled={entries.length === 1}
                aria-label="Remove entry"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className="calc-add" onClick={addCustom}>
        + Add Custom Item
      </button>
    </div>
  );
}
