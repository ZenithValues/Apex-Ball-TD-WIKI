import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber } from '../utils/formatNumber';
import UnitIcon from './UnitIcon';
import ThemeCutout from './ThemeCutout';
import './UnitExplorer.css';

const EASE_OUT = [0.23, 1, 0.32, 1];

const RARITY_FILTERS = [
  { id: 'all', label: 'All', color: 'var(--accent)', cutout: 'overlord' },
  { id: 'Normie', label: 'Normie', color: '#C0C0C0', cutout: 'drone' },
  { id: 'Odds', label: 'Odds', color: '#33A033', cutout: 'forest' },
  { id: 'Rares', label: 'Rare', color: '#0CEDE8', cutout: 'poseidon' },
  { id: 'Awesome', label: 'Awesome', color: '#C04DFF', cutout: 'hacker' },
  { id: 'Legendaries', label: 'Legendary', color: '#FFB84D', cutout: 'poseidon' },
  { id: 'Mythics', label: 'Mythic', color: '#FF6B6B', cutout: 'hacker' },
  { id: 'Transcendents', label: 'Transcendent', color: '#5FE8A8', cutout: 'forest' },
  { id: 'Omegas', label: 'Omega', color: '#6366f1', cutout: 'overlord' },
  { id: '???', label: '???', color: '#9aa7c7', cutout: 'overlord' },
];

const CUTOUT_BY_RARITY = {
  Normie: 'drone',
  Odds: 'forest',
  Rares: 'poseidon',
  Awesome: 'hacker',
  Legendaries: 'poseidon',
  Mythics: 'hacker',
  Transcendents: 'forest',
  Omegas: 'overlord',
  '???': 'overlord',
};

export default function UnitExplorer({ section = 'wiki', mode }) {
  const scope = (mode || section) === 'values' ? 'values' : 'wiki';
  const { unitValues, wikiRows } = useData();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(() => Math.floor(Math.random() * 40) + 10);
  const [paused, setPaused] = useState(false);

  const wikiImages = useMemo(() => {
    const map = {};
    wikiRows.forEach((r) => {
      if (r.slug && r.image_url) map[r.slug] = r.image_url;
    });
    return map;
  }, [wikiRows]);

  const pool = useMemo(() => {
    let units = unitValues;
    if (filter !== 'all') {
      units = units.filter((u) => {
        const base = u.rarity?.replace(/^Shiny\s+/i, '');
        return base === filter || u.rarity === filter;
      });
    }
    const q = query.trim().toLowerCase();
    if (q) {
      units = units.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.rarity?.toLowerCase().includes(q) ||
          u.type?.toLowerCase().includes(q)
      );
    }
    return units;
  }, [unitValues, filter, query]);

  const safeIndex = pool.length > 0 ? ((index % pool.length) + pool.length) % pool.length : 0;
  const featured = pool.length > 0 ? pool[safeIndex] : null;
  const prevUnit = pool.length > 1 ? pool[(safeIndex - 1 + pool.length) % pool.length] : null;
  const nextUnit = pool.length > 1 ? pool[(safeIndex + 1) % pool.length] : null;

  // Auto-cycle when not paused and user is not typing a search query
  useEffect(() => {
    if (paused || query.trim() || pool.length <= 1) return undefined;
    const interval = setInterval(() => {
      setIndex((prev) => Math.floor(Math.random() * pool.length) || (prev + 1) % pool.length);
    }, 4400);
    return () => clearInterval(interval);
  }, [paused, query, pool.length]);

  function rerollRandom() {
    if (pool.length <= 1) return;
    let next = Math.floor(Math.random() * pool.length);
    if (next === safeIndex) next = (safeIndex + 1) % pool.length;
    setIndex(next);
  }

  const glow = featured ? getRarityGlow(featured.rarity) : 'var(--accent)';
  const baseRarityKey = featured?.rarity?.replace(/^Shiny\s+/i, '') || 'Omegas';
  const cutoutVariant = CUTOUT_BY_RARITY[baseRarityKey] || 'overlord';
  const imageUrl = featured ? wikiImages[featured.slug] || featured.imageUrl : null;
  const prevImageUrl = prevUnit ? wikiImages[prevUnit.slug] || prevUnit.imageUrl : null;
  const nextImageUrl = nextUnit ? wikiImages[nextUnit.slug] || nextUnit.imageUrl : null;

  return (
    <section
      className="unit-explorer"
      style={{ '--matrix-accent': glow }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={`Apex Matrix ${scope.toUpperCase()} RNG Explorer`}
    >
      {/* Top Matrix Command Header */}
      <div className="ue-header">
        <div className="ue-status">
          <span className="ue-dot" />
          <span className="ue-title">TESTING {scope.toUpperCase()} · {pool.length} UNITS</span>
          <span className="ue-matrix-tag">APEX MATRIX RNG</span>
        </div>

        <div className="ue-search-box">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Instant matrix filter (name, rarity, role)…"
            className="ue-search-input"
            aria-label="Filter units in the Apex Matrix"
          />
          {query && (
            <button
              type="button"
              className="ue-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear matrix search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="ue-header-controls">
          <button
            type="button"
            className="ue-auto-btn"
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Resume auto-roll' : 'Pause auto-roll'}
          >
            {paused ? '⏸ PAUSED' : '🔄 AUTO'}
          </button>
          <button
            type="button"
            className="ue-reroll-top"
            onClick={rerollRandom}
            title="Roll random unit"
          >
            🎲 Roll RNG
          </button>
        </div>
      </div>

      {/* Rarity Filters */}
      <div className="ue-filters" role="tablist" aria-label="Rarity filter">
        {RARITY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`ue-filter ${filter === f.id ? 'active' : ''}`}
            style={{ '--filter-color': f.color }}
            onClick={() => {
              setFilter(f.id);
              setIndex(0);
            }}
          >
            <span className="ue-filter-dot" style={{ background: f.color }} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Main Nike / Air Jordan–Style Showcase Stage */}
      <div className="ue-stage">
        <div className="ue-stage-ribbon" aria-hidden="true" />
        <ThemeCutout
          variant={cutoutVariant}
          tintColor={glow}
          floating
          className="ue-stage-cutout-bg"
        />

        {featured ? (
          <>
            {/* Left Preview Node (Previous Unit in Matrix) */}
            {prevUnit && (
              <button
                type="button"
                className="ue-side-preview prev"
                onClick={() => setIndex((safeIndex - 1 + pool.length) % pool.length)}
                title={`Previous: ${prevUnit.name}`}
              >
                <div className="ue-side-icon-wrap">
                  <UnitIcon
                    slug={prevUnit.slug}
                    name={prevUnit.name}
                    glowColor={getRarityGlow(prevUnit.rarity)}
                    shiny={isShinyRarity(prevUnit.rarity)}
                    size={46}
                    imageUrl={prevImageUrl}
                  />
                </div>
                <span className="ue-side-dot" style={{ background: getRarityGlow(prevUnit.rarity) }} />
                <span className="ue-side-stem" />
                <span className="ue-side-name">{prevUnit.name}</span>
              </button>
            )}

            {/* Centerpiece Animated Stage */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${featured.slug}-${safeIndex}`}
                className="ue-featured"
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.96 }}
                transition={{ duration: 0.34, ease: EASE_OUT }}
              >
                {/* Giant Background Editorial Watermark */}
                <div className="ue-giant-watermark" aria-hidden="true">
                  <span className="ue-watermark-main">{baseRarityKey.toUpperCase()}</span>
                  <span className="ue-watermark-sub">{featured.type || 'UNIT'}</span>
                </div>

                {/* Center Floating Unit Pedestal */}
                <div className="ue-center-pedestal">
                  <div className="ue-orbital-ring" aria-hidden="true" />
                  <div className="ue-featured-icon">
                    <UnitIcon
                      slug={featured.slug}
                      name={featured.name}
                      glowColor={glow}
                      shiny={isShinyRarity(featured.rarity)}
                      size={116}
                      imageUrl={imageUrl}
                    />
                  </div>
                </div>

                {/* Bottom Editorial Info Row (Left Info + Right Action Cluster) */}
                <div className="ue-editorial-bar">
                  <div className="ue-featured-info">
                    <span className="ue-featured-label" style={{ color: glow }}>
                      {featured.rarity} · {featured.type || 'Unit'}
                    </span>
                    <h3 className="ue-featured-name">{featured.name}</h3>
                    <div className="ue-featured-price-row">
                      {scope === 'values' ? (
                        <>
                          <span className="ue-featured-value">
                            {featured.hasValue
                              ? `💎 ${formatCompactNumber(featured.tradeValue)}`
                              : 'Unpriced'}
                          </span>
                          {featured.demand && (
                            <span className="ue-meta-pill">Demand: {featured.demand}</span>
                          )}
                          {featured.scarcity && (
                            <span className="ue-meta-pill">Scarcity: {featured.scarcity}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="ue-featured-value">
                            {featured.totalCost ? `${featured.totalCost}` : featured.category || 'Standard'}
                          </span>
                          {featured.placementLimit && (
                            <span className="ue-meta-pill">Limit: {featured.placementLimit}</span>
                          )}
                          {featured.category && (
                            <span className="ue-meta-pill">{featured.category}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="ue-featured-actions">
                    <span className="ue-index-counter">
                      — {String(safeIndex + 1).padStart(2, '0')} / {String(pool.length).padStart(2, '0')}
                    </span>
                    <div className="ue-action-buttons">
                      <button
                        type="button"
                        className="ue-reroll"
                        onClick={rerollRandom}
                        title="Reroll random unit"
                      >
                        🎲
                      </button>
                      <Link
                        to={`/${scope}/units/${encodeURIComponent(featured.rarity)}/${featured.slug}`}
                        className="ue-launch"
                      >
                        <span>View</span>
                        <span className="ue-launch-arrow" aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right Preview Node (Next Unit in Matrix) */}
            {nextUnit && (
              <button
                type="button"
                className="ue-side-preview next"
                onClick={() => setIndex((safeIndex + 1) % pool.length)}
                title={`Next: ${nextUnit.name}`}
              >
                <div className="ue-side-icon-wrap">
                  <UnitIcon
                    slug={nextUnit.slug}
                    name={nextUnit.name}
                    glowColor={getRarityGlow(nextUnit.rarity)}
                    shiny={isShinyRarity(nextUnit.rarity)}
                    size={46}
                    imageUrl={nextImageUrl}
                  />
                </div>
                <span className="ue-side-dot" style={{ background: getRarityGlow(nextUnit.rarity) }} />
                <span className="ue-side-stem" />
                <span className="ue-side-name">{nextUnit.name}</span>
              </button>
            )}
          </>
        ) : (
          <div className="ue-empty-matrix">
            No units matched &ldquo;{query}&rdquo; in this rarity tier.
          </div>
        )}
      </div>

      {/* Quick Portal Links */}
      <div className="ue-links">
        {scope === 'wiki' ? (
          <>
            <Link to="/wiki/units/search" className="ue-link">🔍 Full Search</Link>
            <Link to="/wiki/compare" className="ue-link">⚖️ Compare Units</Link>
            <Link to="/wiki/leaderboards" className="ue-link">🏆 Leaderboards</Link>
            <Link to="/wiki/maps" className="ue-link">🗺️ Maps</Link>
          </>
        ) : (
          <>
            <Link to="/values/units/search" className="ue-link">🔍 Full Search</Link>
            <Link to="/values/calculator" className="ue-link">🧮 Trade Calculator</Link>
            <Link to="/minigames" className="ue-link">🧠 Ball Knowledge</Link>
          </>
        )}
      </div>
    </section>
  );
}
