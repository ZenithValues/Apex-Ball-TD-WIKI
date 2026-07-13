import { useMemo, useRef, useState } from 'react';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { searchValueEntries } from '../data/values';
import UnitIcon from './UnitIcon';
import './ValueEntryPicker.css';

/**
 * Search-and-pick control backed by the shared ALL_VALUE_ENTRIES index
 * (src/data/values.js). Picking an entry links the calculator row to that
 * unit/item's live baseValue/demand/scarcity — nothing is re-typed or
 * duplicated, so any future update to the shared value data is reflected
 * automatically everywhere this picker is used.
 */
export default function ValueEntryPicker({ onPick, placeholder = 'Search units & items…' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    if (!open) return [];
    return searchValueEntries(query).slice(0, 30);
  }, [query, open]);

  function pick(entry) {
    onPick(entry);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="vep-wrap">
      <input
        ref={inputRef}
        type="text"
        className="calc-input vep-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && (
        <div className="vep-dropdown">
          {results.length === 0 ? (
            <div className="vep-empty">No units/items with market data match "{query}".</div>
          ) : (
            results.map((entry) => {
              const glow = getRarityGlow(entry.rarity);
              return (
                <button
                  type="button"
                  key={`${entry.kind}-${entry.slug}`}
                  className="vep-option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(entry)}
                >
                  {entry.kind === 'unit' ? (
                    <UnitIcon
                      slug={entry.slug}
                      name={entry.name}
                      glowColor={glow}
                      shiny={isShinyRarity(entry.rarity)}
                      size={28}
                    />
                  ) : (
                    <div className="vep-item-icon">{entry.name[0]}</div>
                  )}
                  <div className="vep-option-text">
                    <span className="vep-option-name">{entry.name}</span>
                    <span className="vep-option-meta" style={{ color: glow }}>
                      {entry.rarity || entry.group}
                    </span>
                  </div>
                  <span className="vep-option-value">{entry.tradeValue?.toLocaleString()}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}