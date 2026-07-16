import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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

const CYCLE_INTERVAL = 2000; // 2 seconds

export default function RotatingShortcutButton() {
  const [current, setCurrent] = useState(() => Math.floor(Math.random() * SHORTCUTS.length));
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);
  const previousRef = useRef(current);

  useEffect(() => {
    function scheduleNext() {
      if (isHovered) return;

      intervalRef.current = setTimeout(() => {
        setCurrent((prev) => {
          let next;
          do {
            next = Math.floor(Math.random() * SHORTCUTS.length);
          } while (next === prev && SHORTCUTS.length > 1);
          previousRef.current = prev;
          return next;
        });
        scheduleNext();
      }, CYCLE_INTERVAL);
    }

    scheduleNext();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isHovered]);

  const shortcut = SHORTCUTS[current];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ display: 'inline-block' }}
    >
      <Link
        to={shortcut.to}
        aria-label={`Random shortcut: ${shortcut.label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          textDecoration: 'none',
          fontSize: '0.88rem',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? '0 0 20px rgba(77, 157, 255, 0.3)' : 'none',
        }}
      >
        <span style={{ fontSize: '1rem' }}>🎲</span>
        <motion.span
          key={shortcut.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {shortcut.label}
        </motion.span>
      </Link>
    </motion.div>
  );
}
