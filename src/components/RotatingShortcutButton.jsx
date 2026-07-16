import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ALL_UNITS } from '../data/units';
import { getUnitIcon } from '../data/unitIcons';
import { UNIT_RARITIES, getRarityGlow, isShinyRarity } from '../data/taxonomy';
import UnitIcon from './UnitIcon';
import './RotatingShortcutButton.css';

const CYCLE_INTERVAL = 2000;

const SECTION_CONFIG = {
  wiki: {
    title: 'WIKI Explorer',
    base: '/wiki/units',
    extras: [
      { label: 'Search WIKI Units', to: '/wiki/units/search' },
      { label: 'Compare Units', to: '/wiki/compare' },
      { label: 'View Leaderboards', to: '/wiki/leaderboards' },
    ],
  },
  values: {
    title: 'Values Explorer',
    base: '/values/units',
    extras: [
      { label: 'Search Unit Values', to: '/values/units/search' },
      { label: 'Open Trade Calculator', to: '/values/calculator' },
    ],
  },
};

function buildShortcuts(section) {
  const config = SECTION_CONFIG[section];
  const rarityShortcuts = UNIT_RARITIES.map((rarity) => ({
    label: section === 'values' ? `${rarity} Values` : `Explore ${rarity}`,
    to: `${config.base}/${encodeURIComponent(rarity)}`,
    rarity,
  }));
  return [...rarityShortcuts, ...config.extras];
}

function pickNextIndex(previous, count) {
  if (count <= 1) return 0;
  let next = previous;
  while (next === previous) next = Math.floor(Math.random() * count);
  return next;
}

function dedupeUnits(units) {
  const seen = new Set();
  return units.filter((unit) => {
    if (!unit?.slug || seen.has(unit.slug)) return false;
    seen.add(unit.slug);
    return true;
  });
}

const ArrowIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="4" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

/**
 * A section-aware rotating shortcut for the WIKI and Values landing pages.
 * Rarity destinations feature a random unit from that exact rarity, while
 * utility destinations (search, compare, calculator) feature any unit from
 * their own section. The progress indicator and shuffle share one animation
 * clock so they cannot drift apart.
 */
export default function RotatingShortcutButton({ section = 'wiki' }) {
  const scope = section === 'values' ? 'values' : 'wiki';
  const shortcuts = useMemo(() => buildShortcuts(scope), [scope]);
  const { customUnits, unitValues, wikiRows } = useData();

  const [current, setCurrent] = useState(() => Math.floor(Math.random() * shortcuts.length));
  const [unitRoll, setUnitRoll] = useState(() => Math.random());
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const progressRef = useRef(null);
  const progressFillRef = useRef(null);
  const pausedRef = useRef(false);
  const infoRef = useRef(null);

  const shortcut = shortcuts[current % shortcuts.length];
  const contentUnits = useMemo(
    () => dedupeUnits(scope === 'values' ? unitValues : [...ALL_UNITS, ...customUnits]),
    [scope, unitValues, customUnits]
  );
  const wikiImageBySlug = useMemo(
    () => Object.fromEntries(wikiRows.filter((row) => row.slug && row.image_url).map((row) => [row.slug, row.image_url])),
    [wikiRows]
  );

  const featuredUnit = useMemo(() => {
    const matchingUnits = shortcut.rarity
      ? contentUnits.filter((unit) => unit.rarity === shortcut.rarity)
      : contentUnits;
    if (matchingUnits.length === 0) return null;

    // Prefer units with actual artwork. If a rarity has no uploaded/bundled
    // artwork yet, UnitIcon's styled initial remains a safe fallback.
    const unitsWithImages = matchingUnits.filter((unit) => {
      const shiny = isShinyRarity(unit.rarity);
      return unit.imageUrl || wikiImageBySlug[unit.slug] || getUnitIcon(unit.slug, shiny);
    });
    const imagePool = unitsWithImages.length > 0 ? unitsWithImages : matchingUnits;
    return imagePool[Math.floor(unitRoll * imagePool.length) % imagePool.length];
  }, [contentUnits, shortcut.rarity, unitRoll, wikiImageBySlug]);

  const isPaused = isHovered || hasFocus || showInfo;
  useEffect(() => {
    pausedRef.current = isPaused;
    if (progressRef.current) {
      const percentage = progressRef.current.getAttribute('aria-valuenow') || '0';
      progressRef.current.setAttribute('aria-valuetext', isPaused ? `Paused at ${percentage}%` : `${percentage}%`);
    }
  }, [isPaused]);

  // A single requestAnimationFrame loop drives both the visible bar and the
  // destination change. This replaces the old independent CSS animation and
  // timeout, which could become desynchronised after hover or a busy frame.
  useEffect(() => {
    let animationFrame = 0;
    let elapsed = 0;
    let previousTime = performance.now();

    function renderProgress(value) {
      const percentage = Math.round(value * 100);
      if (progressFillRef.current) {
        progressFillRef.current.style.transform = `scaleX(${value})`;
      }
      if (progressRef.current) {
        progressRef.current.setAttribute('aria-valuenow', String(percentage));
        progressRef.current.setAttribute('aria-valuetext', pausedRef.current ? `Paused at ${percentage}%` : `${percentage}%`);
      }
    }

    renderProgress(0);

    function tick(now) {
      // Clamp long gaps so background tabs and temporarily busy frames do not
      // skip multiple destinations when they become active again.
      const delta = Math.min(Math.max(now - previousTime, 0), 100);
      previousTime = now;

      if (!pausedRef.current && !document.hidden) {
        elapsed += delta;
        if (elapsed >= CYCLE_INTERVAL) {
          elapsed %= CYCLE_INTERVAL;
          setCurrent((previous) => pickNextIndex(previous % shortcuts.length, shortcuts.length));
          setUnitRoll(Math.random());
        }
        renderProgress(elapsed / CYCLE_INTERVAL);
      }

      animationFrame = requestAnimationFrame(tick);
    }

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [scope, shortcuts.length]);

  // Close the info popover on outside click or Escape. Global ? toggles it.
  useEffect(() => {
    function onPointerDown(event) {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === '?') {
        if (event.target.matches('input, textarea, select')) return;
        event.preventDefault();
        setShowInfo((visible) => !visible);
      } else if (event.key === 'Escape' && showInfo) {
        setShowInfo(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showInfo]);

  const featuredImageUrl = featuredUnit
    ? wikiImageBySlug[featuredUnit.slug] || featuredUnit.imageUrl || null
    : null;
  const explorerTitle = SECTION_CONFIG[scope].title;

  return (
    <div
      className="rsb"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
      }}
    >
      <div className="rsb-main-wrap">
        <div
          ref={progressRef}
          className="rsb-progress"
          role="progressbar"
          aria-label="Time until next explorer shortcut"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <div ref={progressFillRef} className="rsb-progress-fill" />
        </div>

        <Link
          to={shortcut.to}
          className="rsb-main"
          aria-label={`${shortcut.label}${featuredUnit ? `, featuring ${featuredUnit.name}` : ''}`}
        >
          {featuredUnit && (
            <motion.span
              key={`${shortcut.to}-${featuredUnit.slug}`}
              className="rsb-featured-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              aria-hidden="true"
            >
              <UnitIcon
                slug={featuredUnit.slug}
                name={featuredUnit.name}
                glowColor={getRarityGlow(featuredUnit.rarity)}
                shiny={isShinyRarity(featuredUnit.rarity)}
                size={40}
                imageUrl={featuredImageUrl}
              />
            </motion.span>
          )}

          <span className="rsb-copy">
            <motion.span
              key={shortcut.label}
              className="rsb-label"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {shortcut.label}
            </motion.span>
            {featuredUnit && <span className="rsb-unit-name">{featuredUnit.name}</span>}
          </span>

          <span className="rsb-arrow" aria-hidden="true">
            <ArrowIcon />
          </span>
        </Link>
      </div>

      <div className="rsb-info-wrap">
        <button
          type="button"
          className="rsb-info"
          aria-label={`About the ${explorerTitle}`}
          aria-expanded={showInfo}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => setShowInfo((visible) => !visible)}
        >
          ?
        </button>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              ref={infoRef}
              className="rsb-popup"
              role="dialog"
              aria-label={`${explorerTitle} information`}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <h3>{explorerTitle}</h3>
              <p>
                This button shows only {scope === 'wiki' ? 'WIKI' : 'Values'} destinations and
                shuffles every 2 seconds. Rarity links feature a random unit from that rarity.
              </p>
              <div className="rsb-popup-current">
                <span className="lbl">{shortcut.label}</span>
                {featuredUnit && <span className="unit">Featured: {featuredUnit.name}</span>}
                <span className="path">{shortcut.to}</span>
              </div>
              <p className="rsb-popup-foot">
                {shortcuts.length} {scope === 'wiki' ? 'WIKI' : 'Values'} shortcuts in rotation — never repeats twice in a row.
              </p>
              <div className="rsb-popup-hint">
                Press <kbd>?</kbd> to toggle
              </div>
              <button
                type="button"
                className="rsb-popup-close filled"
                onClick={() => setShowInfo(false)}
              >
                Got it
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
