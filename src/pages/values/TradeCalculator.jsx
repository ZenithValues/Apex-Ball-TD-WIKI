import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../../components/PageShell';
import { VALUES_NAV } from '../../config/navigation';
import { DEMAND, SCARCITY, getRarityGlow, isShinyRarity } from '../../data/taxonomy';
import { useLiveValues } from '../../hooks/useLiveValues';
import { evaluateTrade } from '../../utils/calculator';
import { encodeState, decodeState, loadFromLocalStorage, saveToLocalStorage } from '../../utils/tradePersistence';
import UnitIcon from '../../components/UnitIcon';
import { getUnitIcon } from '../../data/unitIcons';
import ValueEntryPicker from '../../components/ValueEntryPicker';
import { formatCompactNumber, formatFullNumber } from '../../utils/formatNumber';
import './TradeCalculator.css';

let idCounter = 0;
const nextId = () => ++idCounter;

const HISTORY_KEY = 'apex-trade-history-v1';
const RECENT_KEY = 'apex-trade-recent-v1';
const MAX_HISTORY = 12;
const MAX_RECENT = 10;
const ITEM_CAP = 8000;

function loadStoredList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function makeLinkedEntry(slug, quantity = 1) {
  return { id: nextId(), slug, quantity: Math.min(ITEM_CAP, Math.max(1, quantity)) };
}

function resolveEntry(entry, valueEntries) {
  const source = valueEntries.find((valueEntry) => valueEntry.slug === entry.slug);
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
  return entries.filter((e) => e.slug).map((e) => [e.slug, Math.min(ITEM_CAP, e.quantity)]);
}

function deserializeSide(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((row) => Array.isArray(row) && row[0])
    .map(([slug, quantity]) => makeLinkedEntry(slug, Math.min(ITEM_CAP, Math.max(1, Number(quantity) || 1))));
}

export default function TradeCalculator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sideA, setSideA] = useState([]);
  const [sideB, setSideB] = useState([]);
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [history, setHistory] = useState(() => loadStoredList(HISTORY_KEY));
  const [recentSlugs, setRecentSlugs] = useState(() => loadStoredList(RECENT_KEY));
  const { allValueEntries, error: liveValuesError } = useLiveValues();
  const hydrated = useRef(false);
  const persistTimer = useRef(null);
  const lastEncoded = useRef(null);

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

  useEffect(() => {
    if (!hydrated.current) return undefined;

    const state = { a: serializeSide(sideA), b: serializeSide(sideB) };
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      saveToLocalStorage(state);
      const encoded = encodeState(state);

      if (encoded && encoded !== lastEncoded.current) {
        lastEncoded.current = encoded;
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('trade', encoded);
          return next;
        }, { replace: true });
      }
    }, 180);

    return () => clearTimeout(persistTimer.current);
  }, [sideA, sideB, setSearchParams]);

  const computedA = useMemo(() => sideA.map((entry) => resolveEntry(entry, allValueEntries)), [sideA, allValueEntries]);
  const computedB = useMemo(() => sideB.map((entry) => resolveEntry(entry, allValueEntries)), [sideB, allValueEntries]);
  const result = useMemo(() => evaluateTrade(computedA, computedB), [computedA, computedB]);
  const recentEntries = useMemo(
    () => recentSlugs.map((slug) => allValueEntries.find((entry) => entry.slug === slug)).filter(Boolean),
    [recentSlugs, allValueEntries]
  );

  function swapSides() {
    setSideA(sideB);
    setSideB(sideA);
  }

  function rememberRecent(valueEntry) {
    if (!valueEntry?.slug) return;
    setRecentSlugs((prev) => {
      const next = [valueEntry.slug, ...prev.filter((slug) => slug !== valueEntry.slug)].slice(0, MAX_RECENT);
      saveStoredList(RECENT_KEY, next);
      return next;
    });
  }

  function saveCurrentTrade() {
    const state = { a: serializeSide(sideA), b: serializeSide(sideB) };
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
      state,
      result,
      sideA: computedA.map((e) => ({ name: e.name, quantity: e.quantity, tradeValue: e.tradeValue })),
      sideB: computedB.map((e) => ({ name: e.name, quantity: e.quantity, tradeValue: e.tradeValue })),
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      saveStoredList(HISTORY_KEY, next);
      return next;
    });
  }

  function saveCompareSnapshot() {
    saveCurrentTrade();
    requestAnimationFrame(() => {
      document.querySelector('.calc-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function loadHistoryTrade(entry) {
    setSideA(deserializeSide(entry.state?.a));
    setSideB(deserializeSide(entry.state?.b));
  }

  function deleteHistoryTrade(id) {
    setHistory((prev) => {
      const next = prev.filter((entry) => entry.id !== id);
      saveStoredList(HISTORY_KEY, next);
      return next;
    });
  }

  async function exportTradeCard() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Montserrat, sans-serif';
      ctx.fillText('APEX VALUES — TRADE CARD', 50, 60);

      ctx.font = 'bold 28px Montserrat, sans-serif';
      ctx.fillStyle = '#4d9dff';
      ctx.fillText(`YOU (${formatCompactNumber(result.totalA)})`, 50, 140);

      ctx.fillStyle = '#ff4d5e';
      ctx.fillText(`THEM (${formatCompactNumber(result.totalB)})`, 650, 140);

      computedA.forEach((e, i) => {
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px Montserrat, sans-serif';
        ctx.fillText(`${e.quantity}x ${e.name} — ${formatCompactNumber(e.tradeValue)}`, 50, 190 + i * 35);
      });

      computedB.forEach((e, i) => {
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px Montserrat, sans-serif';
        ctx.fillText(`${e.quantity}x ${e.name} — ${formatCompactNumber(e.tradeValue)}`, 650, 190 + i * 35);
      });

      ctx.fillStyle = result.outcome === 'win' ? '#00ff88' : result.outcome === 'loss' ? '#ff4d4d' : '#ffffff';
      ctx.font = 'bold 42px Montserrat, sans-serif';
      ctx.fillText(`VERDICT: ${result.verdict.toUpperCase()}`, 50, 620);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          if (navigator.clipboard?.write && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setImageCopied(true);
            setTimeout(() => setImageCopied(false), 2000);
          } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `apex-trade-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(link.href);
          }
        } catch {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `apex-trade-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(link.href);
        }
      });
    } catch {
      window.alert('Unable to generate trade image.');
    }
  }

  async function copyShareLink() {
    try {
      const state = { a: serializeSide(sideA), b: serializeSide(sideB) };
      const encoded = encodeState(state);
      const shareUrl = new URL(window.location.href);

      if (encoded) {
        const cleanParams = new URLSearchParams(shareUrl.search);
        cleanParams.set('trade', encoded);
        shareUrl.search = cleanParams.toString();
      }

      await navigator.clipboard.writeText(shareUrl.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy trade link:', window.location.href);
    }
  }

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <div className="calc-header">
        <div>
          <span className="page-kicker">Real-time Calculator</span>
          <h1>Trade Calculator</h1>
        </div>
        <div className="calc-header-actions">
          <button type="button" className="calc-action-btn" onClick={swapSides} title="Swap Sides">
            ⇄ Swap
          </button>
          <button type="button" className="calc-action-btn" onClick={exportTradeCard} title="Export Trade Image">
            {imageCopied ? '✓ Image Copied' : '🖼️ Export Image'}
          </button>
          <button type="button" className="calc-action-btn" onClick={saveCompareSnapshot} title="Save to Recent Trades">
            ✦ Save Snapshot
          </button>
          <button type="button" className="calc-action-btn" onClick={copyShareLink}>
            {copied ? '✓ Link Copied' : '🔗 Share Link'}
          </button>
        </div>
      </div>

      {liveValuesError && (
        <div className="calc-error-notice">
          Market data failed to load. Using fallback values.
        </div>
      )}

      <div className="calc-cap-notice">
        <span>Item limit cap active: Maximum 8,000 quantity per trade item slot.</span>
      </div>

      <div className="calc-layout">
        <TradeSide
          side="A"
          label="YOU"
          entries={sideA}
          setEntries={setSideA}
          computed={computedA}
          valueEntries={allValueEntries}
          recentEntries={recentEntries}
          rememberRecent={rememberRecent}
        />

        <VerdictColumn result={result} />

        <TradeSide
          side="B"
          label="THEM"
          entries={sideB}
          setEntries={setSideB}
          computed={computedB}
          valueEntries={allValueEntries}
          recentEntries={recentEntries}
          rememberRecent={rememberRecent}
        />
      </div>

      <TradeHistory history={history} onLoad={loadHistoryTrade} onDelete={deleteHistoryTrade} />
    </PageShell>
  );
}

function overpayLabel(result) {
  if (result.diff > 0) {
    return `THEM overpays by ${formatCompactNumber(Math.abs(result.diff))} (${result.percentDiff.toFixed(1)}%)`;
  }
  if (result.diff < 0) {
    return `YOU overpay by ${formatCompactNumber(Math.abs(result.diff))} (${result.percentDiff.toFixed(1)}%)`;
  }
  return 'No overpay — perfectly even';
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
          {overpayLabel(result)}
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
        <span title={`${formatFullNumber(total)} exact`}>{formatCompactNumber(total)}</span>
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

function TradeHistory({ history, onLoad, onDelete }) {
  if (!history?.length) return null;

  return (
    <section className="calc-history">
      <h2>Recent Trades</h2>
      <div className="calc-history-grid">
        {history.map((entry) => (
          <div key={entry.id} className="calc-history-card">
            <div className="calc-history-head">
              <span>{new Date(entry.savedAt).toLocaleString()}</span>
              <b>{entry.result?.verdict || 'Trade'}</b>
            </div>
            <div className="calc-history-sides">
              <HistorySide label="YOU" rows={entry.sideA} />
              <HistorySide label="THEM" rows={entry.sideB} />
            </div>
            <div className="calc-history-actions">
              <button type="button" onClick={() => onLoad(entry)}>Load</button>
              <button type="button" onClick={() => onDelete(entry.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HistorySide({ label, rows }) {
  return (
    <div>
      <strong>{label}</strong>
      {(rows || []).slice(0, 3).map((row, index) => (
        <span key={`${row.name}-${index}`}>{row.quantity}× {row.name} ({formatCompactNumber(row.tradeValue)})</span>
      ))}
      {(rows || []).length > 3 && <em>+{rows.length - 3} more</em>}
    </div>
  );
}

function TradeSide({ side, label, entries, setEntries, computed, valueEntries, recentEntries, rememberRecent }) {
  const total = computed.reduce((sum, e) => sum + (e.tradeValue || 0), 0);
  const sideClass = side === 'A' ? 'calc-side-you' : 'calc-side-them';

  const updateQuantity = (id, quantity) => {
    const capped = Math.min(ITEM_CAP, Math.max(1, quantity));
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, quantity: capped } : e)));
  };

  const addLinked = (valueEntry) => {
    rememberRecent?.(valueEntry);
    setEntries((prev) => {
      const existing = prev.find((e) => e.slug === valueEntry.slug);
      if (existing) {
        return prev.map((e) => (e.slug === valueEntry.slug ? { ...e, quantity: Math.min(ITEM_CAP, e.quantity + 1) } : e));
      }
      return [...prev, makeLinkedEntry(valueEntry.slug)];
    });
  };

  const removeEntry = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const clearSide = () => setEntries([]);

  return (
    <div className={`calc-side ${sideClass}`}>
      <div className="calc-side-header">
        <h2 className="calc-side-title">{label}</h2>
        <div className="calc-side-header-right">
          <span className="calc-side-total" title={`${formatFullNumber(total)} exact`}>
            {formatCompactNumber(total)}
          </span>
          {entries.length > 0 && (
            <button type="button" className="calc-clear" onClick={clearSide}>
              Clear
            </button>
          )}
        </div>
      </div>

      <ValueEntryPicker onPick={addLinked} placeholder={`Add to ${label}'s side…`} entries={valueEntries} />

      {recentEntries?.length > 0 && (
        <div className="calc-quick-adds">
          <span>Recent</span>
          {recentEntries.slice(0, 5).map((entry) => (
            <button type="button" key={entry.slug} onClick={() => addLinked(entry)}>
              + {entry.name}
            </button>
          ))}
        </div>
      )}

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
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 120) removeEntry(entry.id);
                }}
                title="Drag sideways to remove"
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

                  <input
                    className="calc-qty-input"
                    type="number"
                    min="1"
                    max={ITEM_CAP}
                    value={entry.quantity}
                    onChange={(e) => updateQuantity(entry.id, Number(e.target.value) || 1)}
                    aria-label={`Quantity for ${resolved.name}`}
                  />

                  <button
                    type="button"
                    className="calc-qty-btn"
                    onClick={() => updateQuantity(entry.id, entry.quantity + 1)}
                    disabled={entry.quantity >= ITEM_CAP}
                  >
                    +
                  </button>
                </div>

                <div className="calc-entry-value" title={`${formatFullNumber(resolved.tradeValue)} exact`}>
                  {formatCompactNumber(resolved.tradeValue)}
                </div>

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
