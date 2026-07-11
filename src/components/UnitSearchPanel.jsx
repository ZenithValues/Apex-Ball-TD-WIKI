import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_UNITS } from '../data/units';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import UnitIcon from './UnitIcon';
import './UnitSearchPanel.css';

/**
 * The actual "jump to a unit" search UI — a centered panel with a text
 * input and a live-filtered result list. Used inline on the dedicated
 * Unit Search page (reached by clicking the "Units" label in the
 * sidebar), NOT as a popup/overlay. Picking a result navigates to that
 * unit's rarity list page and deep-links a `?highlight=<slug>` param so
 * the matching card scrolls into view and pulses (see useHighlightTarget).
 */
export default function UnitSearchPanel({ basePath, autoFocus = true }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q ? ALL_UNITS.filter((u) => u.name.toLowerCase().includes(q)) : ALL_UNITS;
    return pool.slice(0, 60);
  }, [query]);

  function goTo(unit) {
    navigate(`${basePath}/${encodeURIComponent(unit.rarity)}?highlight=${unit.slug}`);
  }

  return (
    <div className="usp-panel">
      <input
        type="text"
        className="usp-input"
        placeholder="Search for any unit…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
      />
      <div className="usp-results" data-lenis-prevent>
        {results.length === 0 ? (
          <div className="usp-empty">No units match &quot;{query}&quot;.</div>
        ) : (
          results.map((unit) => {
            const glow = getRarityGlow(unit.rarity);
            return (
              <button type="button" key={unit.slug} className="usp-option" onClick={() => goTo(unit)}>
                <UnitIcon
                  slug={unit.slug}
                  name={unit.name}
                  glowColor={glow}
                  shiny={isShinyRarity(unit.rarity)}
                  size={44}
                />
                <div className="usp-option-text">
                  <span className="usp-option-name">{unit.name}</span>
                  <span className="usp-option-meta" style={{ color: glow }}>
                    {unit.rarity}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
