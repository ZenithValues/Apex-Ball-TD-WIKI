import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './RotatingShortcutButton.css';

/**
 * Rotating "Random Page" shortcut.
 *
 * Cycles through a list of wiki/values destinations, picking a NEW one every
 * 2 seconds (never the same destination twice in a row). The thin progress bar
 * fills over those 2 seconds to show how long until the next shuffle; hovering
 * anywhere over the component pauses both the timer and the bar. A small "info"
 * button opens a popover with details that closes on outside click / Escape.
 */

const SHORTCUTS = [
  { label: 'Browse Mythics', to: '/wiki/units/Mythics' },
  { label: 'Browse Omegas', to: '/wiki/units/Omegas' },
  { label: 'Browse Secrets', to: '/wiki/units/Secrets' },
  { label: 'Browse Normies', to: '/wiki/units/Normie' },
  { label: 'Browse Rares', to: '/wiki/units/Rare' },
  { label: 'Browse Legendaries', to: '/wiki/units/Legendary' },
  { label: 'Browse Shiny Normies', to: '/wiki/units/Shiny%20Normie' },
  { label: 'Browse Shiny Mythics', to: '/wiki/units/Shiny%20Mythics' },
  { label: 'Browse Shiny Omegas', to: '/wiki/units/Shiny%20Omegas' },
  { label: 'Open Calculator', to: '/values/calculator' },
  { label: 'Compare Units', to: '/wiki/compare' },
  { label: 'Search Units', to: '/wiki/units/search' },
];

const CYCLE_INTERVAL = 2000; // ms — time between shuffles

// Pick a random index that is never the same as the previous one.
function pickNextIndex(prev) {
  let next = prev;
  do {
    next = Math.floor(Math.random() * SHORTCUTS.length);
  } while (next === prev && SHORTCUTS.length > 1);
  return next;
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

export default function RotatingShortcutButton() {
  const [current, setCurrent] = useState(() =>
    Math.floor(Math.random() * SHORTCUTS.length)
  );
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const timeoutRef = useRef(null);
  const startRef = useRef(Date.now());
  const remainingRef = useRef(CYCLE_INTERVAL);
  const pausedRef = useRef(false);
  const infoRef = useRef(null);

  // Self-rescheduling timer. Reads `pausedRef` so it never fires while the
  // user is hovering, and restarts a fresh full cycle after every shuffle.
  const runTimer = (delay) => {
    clearTimeout(timeoutRef.current);
    if (pausedRef.current) return;
    // Anchor the start time so the progress bar stays in sync with the timer.
    startRef.current = Date.now() - (CYCLE_INTERVAL - delay);
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => pickNextIndex(prev));
      runTimer(CYCLE_INTERVAL);
    }, delay);
  };

  useEffect(() => {
    runTimer(CYCLE_INTERVAL);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause / resume the cycle (and the progress animation) on hover. The
  // remaining time is captured so the shuffle resumes exactly where it left off.
  useEffect(() => {
    pausedRef.current = isHovered;
    if (isHovered) {
      const elapsed = Date.now() - startRef.current;
      remainingRef.current = Math.max(0, CYCLE_INTERVAL - elapsed);
      clearTimeout(timeoutRef.current);
    } else {
      runTimer(remainingRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  // Close the info popover on outside click or Escape. Global ? toggles the popover.
  useEffect(() => {
    function onPointerDown(e) {
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        setShowInfo(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === '?') {
        if (e.target.matches('input, textarea')) return;
        e.preventDefault();
        setShowInfo((v) => !v);
      } else if (e.key === 'Escape' && showInfo) {
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

  const shortcut = SHORTCUTS[current];

  return (
    <div
      className="rsb"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Progress bar — fills over the 2s cycle, pauses on hover */}
      <div
        className="rsb-progress"
        role="progressbar"
        aria-label="Time until next random shortcut"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isHovered ? undefined : 100}
      >
        <div
          key={current}
          className="rsb-progress-fill"
          style={{ animationPlayState: isHovered ? 'paused' : 'running' }}
        />
      </div>

      {/* 2. Main button — pill, gradient, glowing text, animated label */}
      <Link
        to={shortcut.to}
        className="rsb-main"
        aria-label={`Random shortcut: ${shortcut.label}`}
      >
        <motion.span
          key={shortcut.label}
          className="rsb-label"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {shortcut.label}
        </motion.span>
        <span className="rsb-arrow" aria-hidden="true">
          <ArrowIcon />
        </span>
      </Link>

      {/* 3. Info button + details popover */}
      <div className="rsb-info-wrap">
        <button
          type="button"
          className="rsb-info"
          aria-label="What is this?"
          aria-expanded={showInfo}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setShowInfo((v) => !v)}
        >
          ?
        </button>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              ref={infoRef}
              className="rsb-popup"
              role="dialog"
              aria-label="Random shortcut info"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h3>Random Shortcut</h3>
              <p>
                This button shuffles to a new APEX destination every 2 seconds.
                Hover it to pause the shuffle, or click through to jump there.
              </p>
              <div className="rsb-popup-current">
                <span className="lbl">{shortcut.label}</span>
                <span className="path">{shortcut.to}</span>
              </div>
              <p className="rsb-popup-foot">
                {SHORTCUTS.length} shortcuts in rotation — never repeats twice in
                a row.
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
