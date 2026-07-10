import { useMemo, useState } from 'react';
import PageShell from '../../components/PageShell';
import { VALUES_NAV } from '../../data/navTree';
import { DEMAND_LABELS, SCARCITY_LABELS } from '../../data/taxonomy';
import { computeTradeValue, evaluateTrade } from '../../utils/calculator';
import './TradeCalculator.css';

let idCounter = 0;
const nextId = () => ++idCounter;

function makeEntry() {
  return {
    id: nextId(),
    name: '',
    baseValue: '',
    demand: 'Normal',
    scarcity: 'Standard',
  };
}

export default function TradeCalculator() {
  const [sideA, setSideA] = useState([makeEntry()]);
  const [sideB, setSideB] = useState([makeEntry()]);

  const computedA = useMemo(() => computeSide(sideA), [sideA]);
  const computedB = useMemo(() => computeSide(sideB), [sideB]);

  const result = useMemo(() => evaluateTrade(computedA, computedB), [computedA, computedB]);

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <h1>Trade Calculator</h1>
      <p className="crumb">Values / Trade Calculator</p>

      <div className="formula-box">
        <code>TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier</code>
      </div>

      <div className="calc-columns">
        <TradeSide
          label="Side A"
          entries={sideA}
          setEntries={setSideA}
          computed={computedA}
        />
        <TradeSide
          label="Side B"
          entries={sideB}
          setEntries={setSideB}
          computed={computedB}
        />
      </div>

      <div className={`verdict-box ${verdictClass(result)}`}>
        <div className="verdict-totals">
          <div>
            <span className="verdict-label">Side A Total</span>
            <span className="verdict-value">{result.totalA.toLocaleString()}</span>
          </div>
          <div className="verdict-vs">VS</div>
          <div>
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

function computeSide(entries) {
  return entries.map((e) => ({
    ...e,
    tradeValue: computeTradeValue(e.baseValue, e.demand, e.scarcity),
  }));
}

function verdictClass(result) {
  if (result.verdict === 'Fair Trade') return 'fair';
  if (result.verdict.includes('Slightly')) return 'slight';
  return 'strong';
}

function TradeSide({ label, entries, setEntries, computed }) {
  const total = computed.reduce((sum, e) => sum + e.tradeValue, 0);

  const updateEntry = (id, field, value) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const addEntry = () => setEntries((prev) => [...prev, makeEntry()]);
  const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="calc-side card">
      <div className="calc-side-header">
        <h2>{label}</h2>
        <span className="badge filled">{total.toLocaleString()}</span>
      </div>

      <div className="calc-entries">
        {entries.map((entry, idx) => {
          const tradeValue = computed[idx]?.tradeValue ?? 0;
          return (
            <div key={entry.id} className="calc-entry">
              <input
                type="text"
                placeholder="Item / Unit name"
                value={entry.name}
                onChange={(e) => updateEntry(entry.id, 'name', e.target.value)}
                className="calc-input calc-input-name"
              />
              <input
                type="number"
                placeholder="Base Value"
                value={entry.baseValue}
                onChange={(e) => updateEntry(entry.id, 'baseValue', e.target.value)}
                className="calc-input calc-input-number"
              />
              <select
                value={entry.demand}
                onChange={(e) => updateEntry(entry.id, 'demand', e.target.value)}
                className="calc-input"
              >
                {DEMAND_LABELS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={entry.scarcity}
                onChange={(e) => updateEntry(entry.id, 'scarcity', e.target.value)}
                className="calc-input"
              >
                {SCARCITY_LABELS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="calc-entry-value">{tradeValue.toLocaleString()}</div>
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

      <button type="button" className="calc-add" onClick={addEntry}>
        + Add Item
      </button>
    </div>
  );
}
