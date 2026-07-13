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

const HISTORY_KEY = 'apex-trade-history-v1';
const RECENT_KEY = 'apex-trade-recent-v1';
const MAX_HISTORY = 12;
const MAX_RECENT = 10;

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
    // ignore blocked storage
  }
}

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
  const [history, setHistory] = useState(() => loadStoredList(HISTORY_KEY));
  const [recentSlugs, setRecentSlugs] = useState(() => loadStoredList(RECENT_KEY));
  const hydrated = useRef(false);
  const persistTimer = useRef(null);
  const lastEncoded = useRef(null);

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

  // Persist after initial hydration. URL/localStorage writes are debounced
  // so quantity button spam stays responsive instead of forcing a router URL
  // update on every single click.
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

  const computedA = useMemo(() => sideA.map(resolveEntry), [sideA]);
  const computedB = useMemo(() => sideB.map(resolveEntry), [sideB]);
  const result = useMemo(() => evaluateTrade(computedA, computedB), [computedA, computedB]);
  const recentEntries = useMemo(
    () => recentSlugs.map((slug) => getValueEntryBySlug(slug)).filter(Boolean),
    [recentSlugs]
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

  function exportTradeCard() {
    const rootStyles = getComputedStyle(document.documentElement);
    const bg = rootStyles.getPropertyValue('--bg').trim() || '#000000';
    const text = rootStyles.getPropertyValue('--text').trim() || '#ffffff';
    const dim = rootStyles.getPropertyValue('--text-dim').trim() || '#bfbfbf';
    const faint = rootStyles.getPropertyValue('--text-faint').trim() || '#7a7a7a';
    const border = rootStyles.getPropertyValue('--border-strong').trim() || '#ffffff';
    const youColor = rootStyles.getPropertyValue('--you-color-theme').trim() || '#4d9dff';
    const themColor = rootStyles.getPropertyValue('--them-color-theme').trim() || '#ff4d5e';
    const success = rootStyles.getPropertyValue('--success').trim() || '#4dff88';
    const danger = rootStyles.getPropertyValue('--danger').trim() || '#ff4d4d';

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `${youColor}33`);
    gradient.addColorStop(0.5, `${border}12`);
    gradient.addColorStop(1, `${themColor}33`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

    ctx.fillStyle = text;
    ctx.font = '900 54px Montserrat, Arial';
    ctx.fillText('APEX VALUES', 60, 92);
    ctx.fillStyle = dim;
    ctx.font = '800 24px Montserrat, Arial';
    ctx.fillText('Trade Calculator Export', 62, 128);

    drawSide(ctx, 'YOU', computedA, result.totalA, 62, 182, youColor, text, dim, faint);
    drawSide(ctx, 'THEM', computedB, result.totalB, 650, 182, themColor, text, dim, faint);

    ctx.fillStyle = result.outcome === 'win' ? success : result.outcome === 'loss' ? danger : text;
    ctx.font = '900 52px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(result.verdict.toUpperCase(), canvas.width / 2, 668);
    ctx.fillStyle = dim;
    ctx.font = '800 23px Montserrat, Arial';
    ctx.fillText(`${Math.abs(result.diff).toLocaleString()} diff • ${result.percentDiff.toFixed(1)}%`, canvas.width / 2, 708);
    ctx.textAlign = 'left';

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'apex-trade-card.png';
    link.click();
  }

  async function copyShareLink() {
    try {
      const state = { a: serializeSide(sideA), b: serializeSide(sideB) };
      const encoded = encodeState(state);
      const shareUrl = new URL(window.location.href);

      if (encoded) {
        // HashRouter keeps the route query inside the # hash. Build the
        // copied URL directly from the current hash so Share is always
        // current, even while normal persistence is debounced for speed.
        const hash = shareUrl.hash.startsWith('#') ? shareUrl.hash.slice(1) : shareUrl.hash;
        const [hashPath, hashQuery = ''] = hash.split('?');
        const hashParams = new URLSearchParams(hashQuery);
        hashParams.set('trade', encoded);
        shareUrl.hash = `${hashPath || '/values/calculator'}?${hashParams.toString()}`;

        lastEncoded.current = encoded;
        saveToLocalStorage(state);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('trade', encoded);
          return next;
        }, { replace: true });
      }

      await navigator.clipboard.writeText(shareUrl.toString());
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
          <button type="button" className="calc-share" onClick={saveCurrentTrade}>
            💾 Save
          </button>
          <button type="button" className="calc-share" onClick={exportTradeCard}>
            🖼 Export Card
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
          recentEntries={recentEntries}
          rememberRecent={rememberRecent}
        />
      </div>

      <TradeHistory history={history} onLoad={loadHistoryTrade} onDelete={deleteHistoryTrade} />
    </PageShell>
  );
}

function drawSide(ctx, label, entries, total, x, y, color, text, dim, faint) {
  ctx.fillStyle = color;
  ctx.font = '900 34px Montserrat, Arial';
  ctx.fillText(label, x, y);
  ctx.fillStyle = text;
  ctx.font = '900 30px Montserrat, Arial';
  ctx.fillText(total.toLocaleString(), x + 130, y);

  ctx.font = '800 24px Montserrat, Arial';
  const rows = entries.length ? entries.slice(0, 8) : [{ name: 'No entries', quantity: 0, tradeValue: 0 }];
  rows.forEach((entry, index) => {
    const rowY = y + 54 + index * 42;
    ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.025)';
    ctx.fillRect(x - 8, rowY - 27, 500, 34);
    ctx.fillStyle = entry.quantity ? text : faint;
    ctx.fillText(`${entry.quantity ? `${entry.quantity}× ` : ''}${entry.name}`, x, rowY);
    ctx.fillStyle = dim;
    ctx.textAlign = 'right';
    ctx.fillText((entry.tradeValue || 0).toLocaleString(), x + 476, rowY);
    ctx.textAlign = 'left';
  });

  if (entries.length > 8) {
    ctx.fillStyle = faint;
    ctx.font = '800 20px Montserrat, Arial';
    ctx.fillText(`+${entries.length - 8} more`, x, y + 54 + 8 * 42);
  }
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
        <span key={`${row.name}-${index}`}>{row.quantity}× {row.name}</span>
      ))}
      {(rows || []).length > 3 && <em>+{rows.length - 3} more</em>}
    </div>
  );
}

function TradeSide({ side, label, entries, setEntries, computed, recentEntries, rememberRecent }) {
  const total = computed.reduce((sum, e) => sum + (e.tradeValue || 0), 0);
  const sideClass = side === 'A' ? 'calc-side-you' : 'calc-side-them';

  const updateQuantity = (id, quantity) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, quantity: Math.max(1, quantity) } : e)));
  };

  const addLinked = (valueEntry) => {
    rememberRecent?.(valueEntry);
    setEntries((prev) => {
      const existing = prev.find((e) => e.slug === valueEntry.slug);
      if (existing) {
        return prev.map((e) => (e.slug === valueEntry.slug ? { ...e, quantity: e.quantity + 1 } : e));
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
          <span className="calc-side-total">{total.toLocaleString()}</span>
          {entries.length > 0 && (
            <button type="button" className="calc-clear" onClick={clearSide}>
              Clear
            </button>
          )}
        </div>
      </div>

      <ValueEntryPicker onPick={addLinked} placeholder={`Add to ${label}'s side…`} />

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