import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getRarityGlow, isShinyRarity, MAPS } from '../data/taxonomy';
import { ALL_ITEMS } from '../data/items';
import { ALL_SKINS } from '../data/skins';
import { ALL_TRAITS } from '../data/traits';
import { wikiSectionForAdminGroup } from '../config/wikiSections';
import { sortUnitsByRarityThenName } from '../utils/sortUnits';
import { formatCompactNumber } from '../utils/formatNumber';
import { fuzzyContains } from '../utils/fuzzyMatch';
import UnitIcon from './UnitIcon';
import { useData } from '../context/DataContext';
import { saveRecentSearch, loadRecentSearches } from '../utils/searchHistory';
import { trackSearch } from '../utils/analytics';
import './GlobalUnitSearch.css';

// Operators: rarity:Omega, demand:High, group:Gamepass, value:>1M
function parseQuery(raw) {
  const ops = {};
  const terms = [];
  for (const token of String(raw || '').trim().toLowerCase().split(/\s+/).filter(Boolean)) {
    const match = token.match(/^(rarity|demand|group|type|value):(>=|<=|>|<)?(.+)$/i);
    if (match) ops[match[1].toLowerCase()] = { cmp: match[2] || '=', value: match[3] };
    else terms.push(token);
  }
  return { text: terms.join(' '), ops };
}

function opMatches(ops, item) {
  for (const [key, rule] of Object.entries(ops)) {
    if (key === 'value') {
      const value = Number(item.tradeValue ?? item.baseValue ?? 0) || 0;
      const suffix = String(rule.value).match(/^(\d+(?:\.\d+)?)([kmbt])$/i);
      const bound = suffix
        ? Number(suffix[1]) * ({ k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[suffix[2].toLowerCase()] || 1)
        : Number(rule.value);
      if (!Number.isFinite(bound)) return false;
      if (rule.cmp === '>' && !(value > bound)) return false;
      if (rule.cmp === '<' && !(value < bound)) return false;
      if (rule.cmp === '>=' && !(value >= bound)) return false;
      if (rule.cmp === '<=' && !(value <= bound)) return false;
      if (rule.cmp === '=' && Math.abs(value - bound) > 0.5) return false;
      continue;
    }
    const field = key === 'type' ? item.group : item[key];
    const actual = String(field ?? '').toLowerCase();
    if (rule.cmp === '=' ? !actual.includes(rule.value) : actual !== rule.value) return false;
  }
  return true;
}

export default function GlobalUnitSearch({ open, onClose, basePath }) {
  const { unitValues, crates, itemRows, consumableValues, maps, createdSkins, createdMaps, createdMaterials } = useData();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const recentSearches = loadRecentSearches();

  useEffect(() => {
    if (open) { setQuery(''); setSelectedIdx(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[selectedIdx]) goTo(results[selectedIdx]);
    }
    if (open) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, selectedIdx, results]);

  // ONE pool (#111): units, every item group, skins, crates and maps.
  const pool = useMemo(() => {
    const byKey = new Map();
    const push = (row, kind, group, to, meta) => {
      const slug = row?.slug;
      if (!slug) return;
      const key = `${kind}:${slug}`;
      if (!byKey.has(key)) byKey.set(key, {
        slug,
        name: row.name || row.title || slug,
        rarity: row.rarity || group || 'Item',
        group, kind, meta: meta || row.rarity || group || 'Item',
        tradeValue: row.tradeValue ?? row.baseValue ?? null,
        imageUrl: row.imageUrl || row.image_url || row.image || null,
        demand: row.demand || null,
        to,
      });
    };
    for (const u of unitValues || []) push(u, 'unit', 'Units', `${basePath}/${encodeURIComponent(u.rarity)}/${u.slug}`, u.rarity);
    for (const row of ALL_ITEMS || []) push(row, 'item', row.group || 'Items', `/wiki/items/${encodeURIComponent(row.group || 'Items')}/${encodeURIComponent(row.slug)}`, row.group);
    for (const row of crates || []) push(row, 'item', 'Crates', `/wiki/items/Crates/${encodeURIComponent(row.slug)}`, 'Crates');
    for (const row of consumableValues || []) push(row, 'item', 'Consumables', `/wiki/items/Consumables/${encodeURIComponent(row.slug)}`, 'Consumables');
    for (const row of itemRows || []) {
      const section = wikiSectionForAdminGroup(row.group);
      const to = section && section.path !== 'items'
        ? `/wiki/${section.path}/${encodeURIComponent(row.slug)}`
        : `/wiki/items/${encodeURIComponent(row.group || 'Items')}/${encodeURIComponent(row.slug)}`;
      push(row, 'item', row.group || 'Items', to, row.group);
    }
    for (const row of [...(ALL_SKINS || []), ...(createdSkins || [])]) {
      const category = row.category || 'Normie';
      const base = '/wiki/skins';
      push(row, 'item', 'Skins', `${base}/${encodeURIComponent(category)}/${encodeURIComponent(row.slug)}`, 'Skins');
    }
    for (const row of [...(MAPS || []), ...(maps || []), ...(createdMaps || [])]) {
      const slug = row.slug || (typeof row === 'string' ? row.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null);
      push({ ...(typeof row === 'string' ? { name: row, slug } : row), slug }, 'item', 'Maps', `/wiki/maps/${encodeURIComponent(slug)}`, 'Maps');
    }
    for (const row of (ALL_TRAITS || [])) push(row, 'item', 'Traits', `/wiki/traits/${encodeURIComponent(row.slug)}`, 'Traits');
    for (const row of (createdMaterials || [])) push(row, 'item', 'Materials', `/wiki/items/Materials/${encodeURIComponent(row.slug)}`, 'Materials');
    return [...byKey.values()];
  }, [unitValues, crates, itemRows, consumableValues, maps, createdSkins, createdMaps, createdMaterials, basePath]);

  const { text, ops } = parseQuery(query);
  const hasOperators = Object.keys(ops).length > 0;

  const results = useMemo(() => {
    if (!text && !hasOperators) {
      if (recentSearches.length > 0) return recentSearches.slice(0, 5).map((s) => ({ slug: s, name: s, rarity: 'Recent', isRecent: true }));
      return sortUnitsByRarityThenName(pool.filter((p) => p.kind === 'unit')).slice(0, 12);
    }
    const matched = pool.filter((item) => {
      if (!opMatches(ops, item)) return false;
      if (!text) return true;
      return fuzzyContains(`${item.name} ${item.slug}`, text) || String(item.meta || '').toLowerCase().includes(text);
    });
    return matched.slice(0, 20);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, query, pool]);

  function goTo(item) {
    if (item.isRecent) { setQuery(item.name); return; }
    saveRecentSearch(item.name);
    trackSearch(item.name);
    navigate(item.to);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="gus-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose}>
          <motion.div className="gus-panel" initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -6 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}>
            <div className="gus-input-wrap">
              <span className="gus-icon">🔍</span>
              <input ref={inputRef} type="text" className="gus-input"
                placeholder="Search units, items, skins, crates, maps… try rarity:Omega or value:>1M"
                value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }} />
              {query && <button className="gus-clear" onClick={() => { setQuery(''); setSelectedIdx(0); }}>✕</button>}
            </div>

            {hasOperators && <div className="gus-section-label">Filtering by {Object.keys(ops).join(', ')}</div>}
            {!query && recentSearches.length > 0 && <div className="gus-section-label">Recent Searches</div>}

            <div className="gus-results">
              {results.length === 0 ? (
                <div className="gus-empty">Nothing matches "{query}"</div>
              ) : results.map((item, i) => {
                const glow = getRarityGlow(item.rarity);
                const isSelected = i === selectedIdx;
                if (item.isRecent) {
                  return (
                    <button type="button" key={item.slug} className="gus-option gus-recent" onClick={() => goTo(item)}>
                      <span className="gus-recent-icon">🕐</span><span className="gus-option-name">{item.name}</span>
                    </button>
                  );
                }
                return (
                  <button type="button" key={`${item.kind}-${item.slug}`} className={`gus-option ${isSelected ? 'selected' : ''}`} onClick={() => goTo(item)} onMouseEnter={() => setSelectedIdx(i)}>
                    {item.kind === 'unit'
                      ? <UnitIcon slug={item.slug} name={item.name} glowColor={glow} shiny={isShinyRarity(item.rarity)} size={36} />
                      : <span className="gus-item-icon" aria-hidden="true">📦</span>}
                    <div className="gus-option-text">
                      <span className="gus-option-name">{item.name}</span>
                      <span className="gus-option-meta" style={{ color: glow }}>{item.kind === 'item' ? item.group : item.rarity}</span>
                    </div>
                    {item.tradeValue != null && <span className="gus-option-value">{formatCompactNumber(item.tradeValue)}</span>}
                  </button>
                );
              })}
            </div>

            <div className="gus-footer"><span>↑↓ Navigate</span><span>↵ Select</span><span>Esc Close</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
