import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber } from '../utils/formatNumber';
import UnitIcon from './UnitIcon';
import './UnitExplorer.css';

const EASE_OUT = [0.16, 1, 0.3, 1];

export default function UnitExplorer({ section = 'wiki', mode }) {
  const scope = (mode || section) === 'values' ? 'values' : 'wiki';
  const { unitValues, wikiRows } = useData();
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
    const q = query.trim().toLowerCase();
    if (q) {
      units = units.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.rarity?.toLowerCase().includes(q) ||
          u.type?.toLowerCase().includes(q)
      );
    } else {
      const rich = units.filter(
        (u) =>
          (scope === 'values' ? u.hasValue && u.tradeValue > 0 : (u.totalCost || 0) > 0 || u.hasValue) &&
          (wikiImages[u.slug] || u.imageUrl)
      );
      if (rich.length > 12) units = rich;
    }
    return units;
  }, [unitValues, query, scope, wikiImages]);

  const safeIndex = pool.length > 0 ? ((index % pool.length) + pool.length) % pool.length : 0;
  const featured = pool.length > 0 ? pool[safeIndex] : null;
  const prevUnit = pool.length > 1 ? pool[(safeIndex - 1 + pool.length) % pool.length] : null;
  const nextUnit = pool.length > 1 ? pool[(safeIndex + 1) % pool.length] : null;

  useEffect(() => {
    if (paused || query.trim() || pool.length <= 1) return undefined;
    const interval = setInterval(() => {
      setIndex((prev) => Math.floor(Math.random() * pool.length) || (prev + 1) % pool.length);
    }, 6800);
    return () => clearInterval(interval);
  }, [paused, query, pool.length]);

  function rerollRandom() {
    if (pool.length <= 1) return;
    let next = Math.floor(Math.random() * pool.length);
    if (next === safeIndex) next = (safeIndex + 1) % pool.length;
    setIndex(next);
  }

  const glow = featured ? getRarityGlow(featured.rarity) : 'var(--accent)';
  const imageUrl = featured ? wikiImages[featured.slug] || featured.imageUrl : null;
  const prevImageUrl = prevUnit ? wikiImages[prevUnit.slug] || prevUnit.imageUrl : null;
  const nextImageUrl = nextUnit ? wikiImages[nextUnit.slug] || nextUnit.imageUrl : null;

  return (
    <section
      className="unit-explorer"
      style={{ '--matrix-accent': glow }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={`${scope.toUpperCase()} Unit Discovery Deck`}
    >
      {/* Top Brushed-Chrome Command Bar */}
      <div className="ue-header">
        <div className="ue-status">
          <span className="ue-dot" />
          <div className="ue-status-text">
            <span className="ue-kicker">RNG DISCOVERY VAULT</span>
            <span className="ue-title">
              {scope.toUpperCase()} INDEX · {pool.length} UNITS
            </span>
          </div>
        </div>

        <div className="ue-search-box">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
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
            placeholder="Instant filter by unit name, rarity, or role…"
            className="ue-search-input"
            aria-label="Filter units"
          />
          {query && (
            <button
              type="button"
              className="ue-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="ue-header-controls">
          <button
            type="button"
            className={`ue-auto-btn ${!paused ? 'is-active' : ''}`}
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Resume auto-cycle' : 'Pause auto-cycle'}
          >
            <span className="ue-auto-indicator" />
            {paused ? 'PAUSED' : 'AUTO CYCLE'}
          </button>
          <button
            type="button"
            className="ue-reroll-top"
            onClick={rerollRandom}
            title="Roll random unit"
          >
            <span>🎲</span>
            <span>Roll RNG</span>
          </button>
        </div>
      </div>

      {/* 3-Card Architectural Discovery Stage */}
      <div className="ue-stage">
        {featured ? (
          <div className="ue-deck-grid">
            {/* Left Wing Card (Previous Unit) */}
            {prevUnit ? (
              <button
                type="button"
                className="ue-wing-card prev"
                onClick={() => setIndex((safeIndex - 1 + pool.length) % pool.length)}
                title={`Previous: ${prevUnit.name}`}
              >
                <span className="ue-wing-dir">← PREV</span>
                <div className="ue-wing-body">
                  <UnitIcon
                    slug={prevUnit.slug}
                    name={prevUnit.name}
                    glowColor={getRarityGlow(prevUnit.rarity)}
                    shiny={isShinyRarity(prevUnit.rarity)}
                    size={54}
                    imageUrl={prevImageUrl}
                  />
                  <div className="ue-wing-meta">
                    <small style={{ color: getRarityGlow(prevUnit.rarity) }}>
                      {prevUnit.rarity}
                    </small>
                    <strong>{prevUnit.name}</strong>
                    <span>
                      {scope === 'values'
                        ? prevUnit.hasValue
                          ? `💎 ${formatCompactNumber(prevUnit.tradeValue)}`
                          : 'Unpriced'
                        : prevUnit.type || 'Tower'}
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              <div className="ue-wing-spacer" />
            )}

            {/* Center Spotlight Vault Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${featured.slug}-${safeIndex}`}
                className="ue-center-vault"
                initial={{ opacity: 0, y: 12, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.985 }}
                transition={{ duration: 0.48, ease: EASE_OUT }}
              >
                <div className="ue-vault-pedestal">
                  <div className="ue-vault-ring outer" aria-hidden="true" />
                  <div className="ue-vault-ring inner" aria-hidden="true" />
                  <div className="ue-featured-icon">
                    <UnitIcon
                      slug={featured.slug}
                      name={featured.name}
                      glowColor={glow}
                      shiny={isShinyRarity(featured.rarity)}
                      size={112}
                      imageUrl={imageUrl}
                    />
                  </div>
                </div>

                <div className="ue-vault-content">
                  <div className="ue-vault-top-row">
                    <span className="ue-rarity-pill" style={{ '--pill-glow': glow }}>
                      <i className="ue-rarity-dot" style={{ background: glow }} />
                      {featured.rarity}
                    </span>
                    <span className="ue-role-pill">{featured.type || 'Combat Unit'}</span>
                  </div>

                  <h3 className="ue-featured-name">{featured.name}</h3>

                  <div className="ue-telemetry-strip">
                    {scope === 'values' ? (
                      <>
                        <div className="ue-telemetry-cell primary">
                          <small>TRADE VALUE</small>
                          <strong>
                            {featured.hasValue
                              ? `💎 ${formatCompactNumber(featured.tradeValue)}`
                              : 'Unpriced'}
                          </strong>
                        </div>
                        <div className="ue-telemetry-cell">
                          <small>DEMAND</small>
                          <strong>{featured.demand || 'Average'}</strong>
                        </div>
                        <div className="ue-telemetry-cell">
                          <small>SCARCITY</small>
                          <strong>{featured.scarcity || 'Standard'}</strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="ue-telemetry-cell primary">
                          <small>TOTAL COST</small>
                          <strong>
                            {featured.totalCost
                              ? `$${formatCompactNumber(featured.totalCost)}`
                              : 'Variable'}
                          </strong>
                        </div>
                        <div className="ue-telemetry-cell">
                          <small>ROLE</small>
                          <strong>{featured.type || 'DPS / Support'}</strong>
                        </div>
                        <div className="ue-telemetry-cell">
                          <small>OBTAIN</small>
                          <strong>{featured.category || 'Standard'}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="ue-vault-actions">
                    <Link
                      to={`/${scope}/units/${encodeURIComponent(featured.rarity)}/${featured.slug}`}
                      className="ue-launch-btn"
                    >
                      <span>Inspect {scope === 'values' ? 'Value' : 'Stat'} Sheet</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    <button
                      type="button"
                      className="ue-dice-btn"
                      onClick={rerollRandom}
                      title="Roll another random unit"
                    >
                      🎲 Reroll
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right Wing Card (Next Unit) */}
            {nextUnit ? (
              <button
                type="button"
                className="ue-wing-card next"
                onClick={() => setIndex((safeIndex + 1) % pool.length)}
                title={`Next: ${nextUnit.name}`}
              >
                <span className="ue-wing-dir">NEXT →</span>
                <div className="ue-wing-body">
                  <UnitIcon
                    slug={nextUnit.slug}
                    name={nextUnit.name}
                    glowColor={getRarityGlow(nextUnit.rarity)}
                    shiny={isShinyRarity(nextUnit.rarity)}
                    size={54}
                    imageUrl={nextImageUrl}
                  />
                  <div className="ue-wing-meta">
                    <small style={{ color: getRarityGlow(nextUnit.rarity) }}>
                      {nextUnit.rarity}
                    </small>
                    <strong>{nextUnit.name}</strong>
                    <span>
                      {scope === 'values'
                        ? nextUnit.hasValue
                          ? `💎 ${formatCompactNumber(nextUnit.tradeValue)}`
                          : 'Unpriced'
                        : nextUnit.type || 'Tower'}
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              <div className="ue-wing-spacer" />
            )}
          </div>
        ) : (
          <div className="ue-empty-matrix">
            No units matched &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>
    </section>
  );
}
