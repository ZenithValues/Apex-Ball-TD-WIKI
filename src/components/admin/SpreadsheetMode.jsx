import { useEffect, useMemo, useRef, useState } from 'react';
import { DEMAND_LABELS, SCARCITY_LABELS, UNIT_RARITIES } from '../../data/taxonomy';
import './SpreadsheetMode.css';

const TRENDS = [
  { value: 'stable', label: 'Stable' },
  { value: 'rising', label: 'Rising' },
  { value: 'falling', label: 'Dropping' },
  { value: 'fluctuating', label: 'Fluctuating' },
];

const NUM_COLS = [
  { key: 'base_value', label: 'Value' },
  { key: 'base_value_max', label: 'Max' },
  { key: 'gems', label: 'Gems' },
  { key: 'gems_max', label: 'Gems Max' },
  { key: 'coins', label: 'Coins' },
  { key: 'coins_max', label: 'Coins Max' },
];
const SELECT_COLS = [
  { key: 'demand', label: 'Demand', options: DEMAND_LABELS },
  { key: 'scarcity', label: 'Scarcity', options: SCARCITY_LABELS },
  { key: 'trend', label: 'Trend', options: TRENDS.map((t) => t.value) },
];

// SPREADSHEET MODE — edit every unit's values like Excel: Tab/Enter/arrows
// navigate, dirty cells glow, one Save All publishes only what changed
// (each row goes through the instant background publish queue).
export default function SpreadsheetMode({ units, valueRows, onSaveRows, saving, canEdit }) {
  const [query, setQuery] = useState('');
  const [rarity, setRarity] = useState('All');
  const [edits, setEdits] = useState({}); // slug -> { col: value }
  const [notice, setNotice] = useState('');
  const tableRef = useRef(null);

  const rows = useMemo(() => {
    const bySlug = new Map((valueRows || []).map((r) => [r.slug, r || {}]));
    const q = query.trim().toLowerCase();
    return (units || [])
      .filter((u) => (rarity === 'All' ? true : u.rarity === rarity))
      .filter((u) => (q ? String(u.name || '').toLowerCase().includes(q) || String(u.slug || '').includes(q) : true))
      .map((u) => {
        const v = bySlug.get(u.slug) || {};
        return {
          slug: u.slug,
          name: u.name,
          rarity: u.rarity,
          base_value: v.base_value ?? v.baseValue ?? '',
          base_value_max: v.base_value_max ?? v.baseValueMax ?? '',
          gems: v.gems ?? '',
          gems_max: v.gems_max ?? v.gemsMax ?? '',
          coins: v.coins ?? '',
          coins_max: v.coins_max ?? v.coinsMax ?? '',
          demand: v.demand || '',
          scarcity: v.scarcity || '',
          trend: v.trend || 'stable',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [units, valueRows, query, rarity]);

  const dirtySlugs = useMemo(() => Object.keys(edits).filter((s) => Object.keys(edits[s] || {}).length), [edits]);
  const dirtyCount = dirtySlugs.length;

  const cellValue = (row, col) => (edits[row.slug] && edits[row.slug][col] !== undefined ? edits[row.slug][col] : row[col]);

  function setCell(slug, col, value) {
    setEdits((prev) => ({ ...prev, [slug]: { ...(prev[slug] || {}), [col]: value } }));
    setNotice('');
  }

  // Excel-style keyboard navigation: Enter/↓ next row, ↑ previous row (same column)
  function moveFocus(rowIdx, colName, delta) {
    const next = tableRef.current?.querySelector(`[data-cell="${rowIdx + delta}:${colName}"]`);
    if (next) { next.focus(); next.select?.(); }
  }

  function handleKey(e, rowIdx, colName) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); moveFocus(rowIdx, colName, 1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(rowIdx, colName, -1); }
  }

  async function saveAll() {
    if (!dirtyCount || !onSaveRows) return;
    const changed = dirtySlugs.map((slug) => {
      const base = rows.find((r) => r.slug === slug) || {};
      return { slug, name: base.name, form: { ...base, ...edits[slug] } };
    });
    const ok = await onSaveRows(changed);
    if (ok) setEdits({});
  }

  return (
    <section className="sms-wrap card">
      <div className="sms-toolbar">
        <div className="sms-toolbar-left">
          <h2>📊 Spreadsheet Mode</h2>
          <span className="sms-hint">Tab / Enter / ↑↓ to move · edits glow amber · Save All publishes only changed rows in the background</span>
        </div>
        <div className="sms-toolbar-right">
          <input className="admin-search sms-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter units…" aria-label="Filter units" />
          <select className="sms-select" value={rarity} onChange={(e) => setRarity(e.target.value)} aria-label="Filter by rarity">
            <option value="All">All rarities</option>
            {UNIT_RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {dirtyCount > 0 && (
        <div className="sms-actionbar">
          <strong>✏️ {dirtyCount} unit{dirtyCount > 1 ? 's' : ''} modified</strong>
          <span>{notice}</span>
          <div className="sms-actionbar-buttons">
            <button type="button" className="filled" onClick={saveAll} disabled={saving || !canEdit}>{saving ? 'Publishing…' : `💾 Save All (${dirtyCount})`}</button>
            <button type="button" onClick={() => { setEdits({}); setNotice('Changes discarded.'); }}>Discard</button>
          </div>
        </div>
      )}

      <div className="sms-table-wrap" ref={tableRef} data-lenis-prevent>
        <table className="sms-table">
          <thead>
            <tr>
              <th className="sms-th-name">Unit</th>
              <th>Rarity</th>
              {NUM_COLS.map((c) => <th key={c.key} className="sms-th-num">{c.label}</th>)}
              {SELECT_COLS.map((c) => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const dirty = !!(edits[row.slug] && Object.keys(edits[row.slug]).length);
              return (
                <tr key={row.slug} className={dirty ? 'sms-row-dirty' : ''}>
                  <td className="sms-td-name"><span className="sms-unit-name">{row.name}</span><span className="sms-unit-slug">{row.slug}</span></td>
                  <td className="sms-td-rarity">{row.rarity}</td>
                  {NUM_COLS.map((c) => (
                    <td key={c.key} className="sms-td-num">
                      <input
                        data-cell={`${idx}:${c.key}`}
                        className="sms-input sms-input-num"
                        inputMode="numeric"
                        value={cellValue(row, c.key) ?? ''}
                        disabled={!canEdit}
                        onFocus={(e) => e.target.select?.()}
                        onChange={(e) => setCell(row.slug, c.key, e.target.value)}
                        onKeyDown={(e) => handleKey(e, idx, c.key)}
                      />
                    </td>
                  ))}
                  {SELECT_COLS.map((c) => (
                    <td key={c.key}>
                      <select
                        data-cell={`${idx}:${c.key}`}
                        className="sms-input sms-select-cell"
                        value={cellValue(row, c.key) || (c.key === 'trend' ? 'stable' : '')}
                        disabled={!canEdit}
                        onChange={(e) => setCell(row.slug, c.key, e.target.value)}
                        onKeyDown={(e) => handleKey(e, idx, c.key)}
                      >
                        <option value="">—</option>
                        {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className="sms-empty">No units match that filter.</div>}
      </div>
    </section>
  );
}
