import { useEffect, useMemo, useRef, useState } from 'react';
import { OVERPAY_OPTIONS, UNDERPAY_OPTIONS, OVERPAY_COLORS, UNDERPAY_COLORS } from '../../utils/overpayOptions';
import { DEMAND_COLORS, DEMAND_LABELS, SCARCITY_COLORS, SCARCITY_LABELS, UNIT_RARITIES, getCardGlow, getRarityGlow } from '../../data/taxonomy';
import './SpreadsheetMode.css';
import Dropdown from '../Dropdown';
import { makeSpreadsheetRow } from '../../utils/spreadsheetValues';
import { parseCompactValue, formatSiteNumber, isSpecialBaseValue } from '../../utils/formatNumber';
import { resolveImageUrl } from '../../utils/localAssets';

// SPREADSHEET MODE — bulk value editing (v3, 2026-11-12).
//   * EVERYTHING is visible by default. Columns can still be hidden, but the
//     sheet opens complete — no more "where is the rest?" toggle hunt.
//   * Value, Gems and Coins are ONE column each holding min AND max
//     ("1.2K – 1.5K"), instead of a separate "Max" column per stat.
//   * Calm, modern table: sticky header + unit column, rarity-tinted avatars,
//     monospaced figures, edited rows flagged on the left edge.
//   * Mobile keeps the vertical card list.
//   * Same canonical save path as the single-unit editor.

const TREND_OPTIONS = ['stable', 'rising', 'falling', 'fluctuating'];
const TREND_COLORS = { rising: '#42d392', stable: '#cfd6e4', falling: '#ff5c5c', fluctuating: '#ffd24d' };

// One entry per VISIBLE column. Number stats are `pair` columns.
const COLUMNS = [
  {
    key: 'value',
    label: 'Value',
    type: 'pair',
    accent: '#59d1ff',
    min: { key: 'base_value', label: 'Value' },
    max: { key: 'base_value_max', label: 'Value max' },
  },
  {
    key: 'gems',
    label: 'Gems',
    type: 'pair',
    accent: '#c084fc',
    min: { key: 'gems', label: 'Gems' },
    max: { key: 'gems_max', label: 'Gems max' },
  },
  {
    key: 'coins',
    label: 'Coins',
    type: 'pair',
    accent: '#facc15',
    min: { key: 'coins', label: 'Coins' },
    max: { key: 'coins_max', label: 'Coins max' },
  },
  { key: 'demand', label: 'Demand', type: 'chip', options: DEMAND_LABELS, colors: DEMAND_COLORS },
  { key: 'scarcity', label: 'Scarcity', type: 'chip', options: SCARCITY_LABELS, colors: SCARCITY_COLORS },
  { key: 'trend', label: 'Status', type: 'chip', options: TREND_OPTIONS, colors: TREND_COLORS },
  { key: 'getsOverpays', label: 'Gets Overpays', type: 'chip', options: OVERPAY_OPTIONS, colors: OVERPAY_COLORS },
  { key: 'getsUnderpays', label: 'Gets Underpays', type: 'chip', options: UNDERPAY_OPTIONS, colors: UNDERPAY_COLORS },
];
const ALL_KEYS = COLUMNS.map((column) => column.key);

function useIsMobile() {
  const [mobile, setMobile] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false));
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

function ChipSelect({ value, options, colors = {}, onChange, title, disabled }) {
  return (
    <Dropdown
      compact
      className="sms-chip-dropdown"
      value={value ?? ''}
      onChange={onChange}
      options={[{ value: '', label: '— none' }, ...options.map((v) => ({ value: v, label: v }))]}
      accent={colors[value]}
      ariaLabel={title}
      disabled={disabled}
    />
  );
}

function NumCell({ rowIdx, col, value, disabled, onChange, onKey }) {
  const [focused, setFocused] = useState(false);
  // O/C and N/A are legitimate values in the Value / Gems / Coins columns.
  const special = isSpecialBaseValue(value);
  const numeric = !special && value !== '' && value != null && parseCompactValue(value) !== null;
  const display = !focused && numeric ? formatSiteNumber(parseCompactValue(value)) : (value ?? '');
  return (
    <input
      data-cell={`${rowIdx}:${col.key}`}
      className="sms-input sms-input-num"
      inputMode="text"
      value={display}
      disabled={disabled}
      onFocus={(e) => { e.target.select?.(); }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        setFocused(true);
        // Store exactly what was typed; K/M/B/T is parsed on save.
        onChange(col.key, e.target.value);
      }}
      onKeyDown={(e) => onKey(e, rowIdx, col.key)}
      aria-label={col.label}
      title={special ? `${special} — no numeric value applies` : (numeric ? `${formatSiteNumber(parseCompactValue(value), { full: true })} — K/M/B/T accepted` : undefined)}
    />
  );
}

function UnitAvatar({ imageUrl }) {
  return imageUrl
    ? <img className="sms-unit-img" src={resolveImageUrl(imageUrl)} alt="" loading="lazy" decoding="async" />
    : <span className="sms-unit-img fallback" aria-hidden="true" />;
}

export default function SpreadsheetMode({ units, valueRows, onSaveRows, saving, canEdit, edits: sharedEdits, setEdits: setSharedEdits }) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [rarity, setRarity] = useState('All');
  // EVERY column is on from the start.
  const [visibleKeys, setVisibleKeys] = useState(() => new Set(ALL_KEYS));
  const [showCols, setShowCols] = useState(false);
  const [localEdits, setLocalEdits] = useState({});
  const edits = sharedEdits ?? localEdits; // slug -> { col: value }
  const setEdits = setSharedEdits ?? setLocalEdits;
  const [committing, setCommitting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const tableRef = useRef(null);

  const columns = COLUMNS.filter((column) => visibleKeys.has(column.key));

  const allRows = useMemo(() => {
    const bySlug = new Map((valueRows || []).map((row) => [row.slug, row]));
    return (units || []).map((unit) => makeSpreadsheetRow(unit, bySlug.get(unit.slug)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [units, valueRows]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((u) => (rarity === 'All' || u.rarity === rarity)
      && (!q || String(u.name || '').toLowerCase().includes(q) || String(u.slug || '').toLowerCase().includes(q)));
  }, [allRows, query, rarity]);

  const dirtySlugs = useMemo(() => Object.keys(edits).filter((slug) => Object.keys(edits[slug] || {}).length), [edits]);
  const dirtyCount = dirtySlugs.length;

  const cellValue = (row, key) => (edits[row.slug] && edits[row.slug][key] !== undefined ? edits[row.slug][key] : row[key]);
  const isDirty = (slug) => !!(edits[slug] && Object.keys(edits[slug]).length);

  function setCell(slug, key, value) {
    setEdits((prev) => ({ ...prev, [slug]: { ...(prev[slug] || {}), [key]: value } }));
  }

  function moveFocus(rowIdx, colKey, delta) {
    const next = tableRef.current?.querySelector(`[data-cell="${rowIdx + delta}:${colKey}"]`);
    if (next) { next.focus(); next.select?.(); }
  }
  function handleKey(e, rowIdx, colKey) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); moveFocus(rowIdx, colKey, 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(rowIdx, colKey, -1); }
  }

  async function saveAll() {
    if (!dirtyCount || !onSaveRows) return;
    const changed = dirtySlugs.map((slug) => {
      const base = allRows.find((row) => row.slug === slug);
      return base ? { slug, name: base.name, form: { ...base, ...edits[slug] }, changes: { ...edits[slug] } } : null;
    });
    if (changed.some((row) => !row)) { setSaveError('A modified unit is no longer available. Refresh before saving.'); return; }
    setCommitting(true);
    setSaveError('');
    try {
      const ok = await onSaveRows(changed);
      if (ok) setEdits({});
    } catch (error) {
      setSaveError(error?.message || 'Could not save these changes. Your edits are still here.');
    } finally { setCommitting(false); }
  }

  useEffect(() => {
    if (!showCols) return undefined;
    const onDown = (e) => { if (!e.target.closest('.sms-cols, .sms-cols-pop')) setShowCols(false); };
    const onKey = (e) => { if (e.key === 'Escape') setShowCols(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [showCols]);

  const rarityOptions = useMemo(
    () => [{ value: 'All', label: 'All rarities' }, ...UNIT_RARITIES.map((r) => ({ value: r, label: r }))],
    []
  );

  const renderChip = (row, column) => (
    <ChipSelect
      value={cellValue(row, column.key) ?? ''}
      options={column.options}
      colors={column.colors}
      onChange={(v) => setCell(row.slug, column.key, v)}
      title={`${column.label} for ${row.name}`}
      disabled={!canEdit || saving || committing}
    />
  );

  const renderPair = (row, column, rowIdx) => (
    <div className="sms-pair" style={{ '--pair-accent': column.accent }}>
      <NumCell rowIdx={rowIdx} col={column.min} value={cellValue(row, column.min.key)} disabled={!canEdit || saving || committing}
        onChange={(k, v) => setCell(row.slug, k, v)} onKey={handleKey} />
      <span className="sms-pair-dash" aria-hidden="true">–</span>
      <NumCell rowIdx={rowIdx} col={column.max} value={cellValue(row, column.max.key)} disabled={!canEdit || saving || committing}
        onChange={(k, v) => setCell(row.slug, k, v)} onKey={handleKey} />
    </div>
  );

  const visibleCount = allKeysCount(visibleKeys);

  return (
    <section className="sms-wrap card">
      <header className="sms-head">
        <div className="sms-head-text">
          <span className="sms-kicker">Bulk editing</span>
          <h2>Spreadsheet mode</h2>
          <p className="sms-hint">
            {dirtyCount > 0
              ? `${dirtyCount} unit${dirtyCount > 1 ? 's' : ''} modified — Save All publishes just those.`
              : `All ${visibleCount} columns visible · min – max per stat · Tab / Enter / ↑↓ to move`}
          </p>
        </div>

        <div className="sms-tools">
          <div className="sms-search-wrap">
            <svg className="sms-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="7" cy="7" r="4.6" />
              <path d="M10.4 10.4 L14 14" strokeLinecap="round" />
            </svg>
            <input className="sms-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter units…" aria-label="Filter units" />
          </div>
          <Dropdown compact className="sms-select" value={rarity} onChange={setRarity} options={rarityOptions} ariaLabel="Filter by rarity" />
          <div className="sms-cols">
            <button type="button" className={`sms-cols-btn${showCols ? ' open' : ''}`} onClick={() => setShowCols((v) => !v)} aria-expanded={showCols}>
              Columns <span className="sms-cols-count">{visibleCount}/{COLUMNS.length}</span>
            </button>
            {showCols && (
              <div className="sms-cols-pop" role="menu">
                {COLUMNS.map((column) => (
                  <label key={column.key} className="sms-cols-item">
                    <input
                      type="checkbox"
                      checked={visibleKeys.has(column.key)}
                      onChange={(e) => {
                        const next = new Set(visibleKeys);
                        if (e.target.checked) next.add(column.key); else next.delete(column.key);
                        if (next.size) setVisibleKeys(next);
                      }}
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {saveError && <p className="sms-error" role="alert">{saveError}</p>}

      {dirtyCount > 0 && (
        <div className="sms-actionbar" role="status">
          <strong>✏️ {dirtyCount} modified</strong>
          <span className="sms-actionbar-spacer" />
          <button type="button" disabled={saving || committing} onClick={() => setEdits({})}>Discard</button>
          <button type="button" className="filled" onClick={saveAll} disabled={saving || committing || !canEdit}>
            {saving || committing ? 'Saving…' : `💾 Save All (${dirtyCount})`}
          </button>
        </div>
      )}

      {isMobile ? (
        <div className="sms-cards" data-lenis-prevent>
          {rows.map((row) => (
            <div key={row.slug} className={`sms-card${isDirty(row.slug) ? ' dirty' : ''}`}>
              <div className="sms-card-head">
                <UnitAvatar imageUrl={row.imageUrl} />
                <strong className="sms-card-name">{row.name}</strong>
                <span className="sms-card-rarity" style={{ color: getRarityGlow(row.rarity) }}>{row.rarity}</span>
              </div>
              <div className="sms-card-grid">
                {columns.filter((c) => c.type === 'pair').map((c) => (
                  <div key={c.key} className="sms-card-field sms-card-pair" style={{ '--pair-accent': c.accent }}>
                    <span>{c.label} <em>min – max</em></span>
                    <div className="sms-pair">
                      <input
                        className="sms-input"
                        value={cellValue(row, c.min.key) ?? ''}
                        disabled={!canEdit || saving || committing}
                        onChange={(e) => setCell(row.slug, c.min.key, e.target.value)}
                        aria-label={`${c.min.label} for ${row.name}`}
                      />
                      <span className="sms-pair-dash" aria-hidden="true">–</span>
                      <input
                        className="sms-input"
                        value={cellValue(row, c.max.key) ?? ''}
                        disabled={!canEdit || saving || committing}
                        onChange={(e) => setCell(row.slug, c.max.key, e.target.value)}
                        aria-label={`${c.max.label} for ${row.name}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="sms-card-chips">
                {columns.filter((c) => c.type === 'chip').map((c) => (
                  <span key={c.key} className="sms-card-chip-slot">
                    <small>{c.label}</small>
                    {renderChip(row, c)}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="sms-empty">No units match that filter.</div>}
        </div>
      ) : (
        <div className="sms-table-wrap" ref={tableRef} data-lenis-prevent>
          <table className="sms-table">
            <thead>
              <tr>
                <th className="sms-th-name">Unit</th>
                {columns.map((c) => (
                  <th key={c.key} className={c.type === 'pair' ? 'sms-th-pair' : ''} style={c.accent ? { '--pair-accent': c.accent } : undefined}>
                    {c.type === 'pair' ? (
                      <span className="sms-th-pair-label">
                        <span className="sms-th-dot" aria-hidden="true" />
                        {c.label}
                        <em>min – max</em>
                      </span>
                    ) : c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.slug} className={isDirty(row.slug) ? 'sms-row-dirty' : ''}>
                  <td className="sms-td-name">
                    <UnitAvatar imageUrl={row.imageUrl} />
                    <span className="sms-unit-id">
                      <span className="sms-unit-name" title={row.name}>{row.name}</span>
                      <span className="sms-unit-rarity" style={{ color: getCardGlow(row) }}>{row.rarity}</span>
                    </span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className={c.type === 'chip' ? 'sms-td-chip' : 'sms-td-num'}>
                      {c.type === 'pair' ? renderPair(row, c, idx) : renderChip(row, c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="sms-empty">No units match that filter.</div>}
        </div>
      )}

      {isMobile && dirtyCount > 0 && (
        <div className="sms-mobile-save">
          <span>{dirtyCount} modified</span>
          <button type="button" disabled={saving || committing} onClick={() => setEdits({})}>Discard</button>
          <button type="button" className="filled" onClick={saveAll} disabled={saving || committing || !canEdit}>
            {saving || committing ? 'Saving…' : `💾 Save ${dirtyCount}`}
          </button>
        </div>
      )}
    </section>
  );
}

function allKeysCount(setRef) {
  return ALL_KEYS.filter((key) => setRef.has(key)).length;
}
