import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// StatMeta — shared icons + compact hover/focus tooltips for the stat labels
// used across the wiki (unit cards, values list, value detail). No glossary
// page, no click-to-pin popovers: just a short, redesigned tooltip (see
// .term-tip in index.css).
// ============================================================================

export const TERM_TIPS = {
  value: 'Estimated trade worth, set by the APEX team.',
  gems: 'Price in gems — the main trading currency.',
  coins: 'Price in coins.',
  demand: 'How wanted the unit is right now.',
  scarcity: 'How rare it is in circulation.',
  status: 'Current market trend.',
  overpays: 'Whether this unit can be traded for more than its listed value.',
  underpays: 'Whether this unit usually trades for less than its listed value.',
  damage: 'Damage dealt per attack.',
  cooldown: 'Seconds between attacks.',
  range: 'Attack reach.',
  placement: 'How many you can place.',
  dps: 'Damage per second — overall attacking power.',
  costPerDps: 'Cash paid per point of DPS. Lower is better value.',
  upgradeCost: 'In-game cash to reach this upgrade level.',
  tradeValue: 'Estimated trade worth in gems.',
  rarity: 'The unit tier, from Normie through Omegas.',
  shiny: 'A special 1.5× damage variant.',
  budget: 'Maximum spend. Try 20M, 300M or 1B.',
};

// Short heading shown inside the redesigned tooltip card.
const TERM_TITLES = {
  value: 'Trade value',
  gems: 'Gem price',
  coins: 'Coin price',
  demand: 'Demand',
  scarcity: 'Scarcity',
  status: 'Market status',
  overpays: 'Gets overpays',
  underpays: 'Gets underpays',
  damage: 'Damage',
  cooldown: 'Cooldown',
  range: 'Range',
  placement: 'Placement limit',
  dps: 'DPS',
  costPerDps: 'Cost per DPS',
  upgradeCost: 'Upgrade cost',
  tradeValue: 'Trade value',
  rarity: 'Rarity',
  shiny: 'Shiny',
  budget: 'Budget',
};

// One accent per stat, so the tooltip card matches the number it explains.
const TERM_ACCENTS = {
  value: '#59d1ff',
  gems: '#c084fc',
  coins: '#facc15',
  demand: '#4ade80',
  scarcity: '#fb923c',
  status: '#e5e7eb',
  overpays: '#34d399',
  underpays: '#fb7185',
  dps: '#f87171',
  damage: '#f87171',
  cooldown: '#60a5fa',
  range: '#34d399',
  placement: '#a78bfa',
  costPerDps: '#fbbf24',
  upgradeCost: '#fbbf24',
  tradeValue: '#59d1ff',
  rarity: '#c084fc',
  shiny: '#facc15',
  budget: '#4ade80',
};
// Minimal stroke icons (16x16, currentColor) — one per stat term.
const ICONS = {
  value: (
    <>
      <path d="M2.5 8.5 L8 3 h5.5 v5.5 L8 14 z" />
      <circle cx="11" cy="5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  gems: (
    <>
      <path d="M8 2 L13 6 L8 14 L3 6 Z" />
      <path d="M3 6 h10 M8 2 L6 6 L8 14 L10 6 Z" />
    </>
  ),
  coins: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2.6" />
    </>
  ),
  demand: (
    <>
      <path d="M2 12 L6 7 l3 2.5 L14 4" />
      <path d="M10 4 h4 v4" />
    </>
  ),
  scarcity: (
    <>
      <path d="M8 1.5 L9.6 6 L14 7.5 L9.6 9 L8 13.5 L6.4 9 L2 7.5 L6.4 6 Z" />
    </>
  ),
  status: (
    <>
      <path d="M1.5 8 h3 l2-4.5 3 9 2-4.5 h3" />
    </>
  ),
  overpays: (
    <>
      <path d="M8 13 V4" />
      <path d="M4.5 7.5 L8 4 l3.5 3.5" />
      <path d="M3 14 h10" />
    </>
  ),
  underpays: (
    <>
      <path d="M8 3 v9" />
      <path d="M4.5 8.5 L8 12 l3.5-3.5" />
      <path d="M3 14 h10" />
    </>
  ),
  damage: (
    <>
      <path d="M13.5 2.5 L6 10 M13.5 2.5 l-1 3 M13.5 2.5 l-3 1 M4 9 l3 3 M2.5 13.5 L5 11" />
    </>
  ),
  cooldown: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.5 V8 l2.5 1.5" />
    </>
  ),
  range: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="1.8" />
      <path d="M8 1 v2.2 M8 12.8 V15 M1 8 h2.2 M12.8 8 H15" />
    </>
  ),
  placement: (
    <>
      <rect x="2.5" y="2.5" width="4.4" height="4.4" rx="0.6" />
      <rect x="9.1" y="2.5" width="4.4" height="4.4" rx="0.6" />
      <rect x="2.5" y="9.1" width="4.4" height="4.4" rx="0.6" />
      <rect x="9.1" y="9.1" width="4.4" height="4.4" rx="0.6" />
    </>
  ),
};

/**
 * Small stroke icon for a stat term.
 *   <StatIcon name="gems" />
 */
export function StatIcon({ name, size = 12, className = 'stat-icon' }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {path}
    </svg>
  );
}

/**
 * A stat label with its icon and a tooltip card.
 *
 * The card is rendered through a PORTAL on document.body and positioned with
 * `position: fixed`, so it can never be cropped by a card's `overflow: hidden`
 * (unit cards clip their content) or by a table/list container. It opens on
 * hover AND on keyboard focus, prefers the space above the label and flips
 * below when there is not enough room, then clamps itself inside the viewport.
 */
export function TermTip({ term, children, className = '', icon = true }) {
  const tip = TERM_TIPS[term];
  const triggerRef = useRef(null);
  const popRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const pop = popRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const popRect = pop ? pop.getBoundingClientRect() : { width: 244, height: 84 };
    const gap = 12;
    const viewportW = window.innerWidth || 1024;
    const viewportH = window.innerHeight || 768;
    const above = rect.top - popRect.height - gap;
    const below = rect.bottom + gap;
    const flipBelow = above < 8 && below + popRect.height < viewportH - 8;
    const top = flipBelow ? below : Math.max(8, above);
    const wanted = rect.left + rect.width / 2 - popRect.width / 2;
    const left = Math.min(Math.max(8, wanted), Math.max(8, viewportW - popRect.width - 8));
    setCoords({
      top,
      left,
      placement: flipBelow ? 'below' : 'above',
      arrowX: Math.min(Math.max(14, rect.left + rect.width / 2 - left), popRect.width - 14),
      maxWidth: Math.min(288, viewportW - 24),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    // Second pass once the real box size is known (text length varies).
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(place) : null;
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (popRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('pointerdown', close, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  if (!tip) return <span className={className}>{children}</span>;
  const title = TERM_TITLES[term] || children;

  const pop = open && typeof document !== 'undefined'
    ? createPortal(
      <span
        ref={popRef}
        className={`term-tip-pop term-tip-pop-fixed is-${coords?.placement || 'above'}`}
        role="tooltip"
        style={{
          top: coords?.top ?? -9999,
          left: coords?.left ?? -9999,
          '--arrow-x': `${coords?.arrowX ?? 20}px`,
          '--tip-accent': TERM_ACCENTS[term] || '#8b7cff',
          maxWidth: coords?.maxWidth ? `${coords.maxWidth}px` : undefined,
        }}
      >
        <span className="term-tip-pop-head">
          <StatIcon name={term} size={13} />
          <strong>{title}</strong>
        </span>
        <span className="term-tip-pop-body">{tip}</span>
        <span className="term-tip-pop-arrow" aria-hidden="true" />
      </span>,
      document.body
    )
    : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={`term-tip ${className}`.trim()}
        tabIndex={0}
        aria-label={`${children} — ${tip}`}
        aria-describedby={undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={TERM_ACCENTS[term] ? { '--tip-accent': TERM_ACCENTS[term] } : undefined}
      >
        {icon && <StatIcon name={term} />}
        <span className="term-tip-text">{children}</span>
      </span>
      {pop}
    </>
  );
}
