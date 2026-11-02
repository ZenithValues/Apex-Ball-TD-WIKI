import { useState } from 'react';

// ============================================================================
// StatMeta — shared icons + inline glossary popovers for the stat terms used
// across the wiki (unit cards, values list, value detail). Labels render with
// a "?" help cursor and a small CSS tooltip (see .term-tip in index.css).
// ============================================================================

export const TERM_TIPS = {
  value: 'What the unit is worth in a trade — the base value the APEX team assigns from real trades and market data.',
  gems: 'The price of the unit paid in gems — the main trading currency.',
  coins: 'The price of the unit paid in coins.',
  demand: 'How wanted the unit is right now. High demand = easy to trade away; low demand = harder to find buyers.',
  scarcity: 'How rare the unit is in circulation. Scarcer units are harder to obtain.',
  status: "The unit's market trend — rising, stable, dropping or fluctuating.",
  damage: 'How much damage the unit deals per attack.',
  cooldown: 'Seconds between the unit\'s attacks.',
  range: 'How far the unit can reach with its attacks.',
  placement: 'How many of this unit you can place.',
  dps: 'Damage per second. How much damage the unit deals every second at this upgrade level — the single best measure of its attacking power.',
  costPerDps: 'How much in-game cash you pay for each point of DPS. Lower is better value: a cheap unit with high DPS has a low cost per DPS.',
  upgradeCost: 'The in-game cash needed to place or upgrade the unit to this level. Not the same as its trade value.',
  tradeValue: 'The estimated trade worth of a unit in gems, based on real trades and market data collected by the APEX team.',
  rarity: 'The unit tier (Normie through Omegas). Higher tiers are generally stronger and harder to obtain.',
  shiny: 'A special variant with boosted stats, usually 1.5x the damage of the base unit.',
  budget: 'The maximum value you want to spend. Use K, M, B or T shortcuts, for example 20M.',
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
 * A stat label with its icon, help cursor and hover explanation.
 *   <TermTip term="gems">Gems</TermTip>
 */
export function TermTip({ term, children, className = '' }) {
  const tip = TERM_TIPS[term];
  const [open, setOpen] = useState(false);
  if (!tip) return <span className={className}>{children}</span>;
  return (
    <span
      className={`term-tip ${className}`.trim()}
      data-tip={tip}
      data-open={open ? 'true' : undefined}
      tabIndex={0}
      role="button"
      aria-expanded={open}
      aria-label={`${children}: what does this mean?`}
      onClick={(event) => {
        // Do not follow the card's link when tapping a glossary term.
        event.preventDefault();
        event.stopPropagation();
        setOpen((value) => !value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen((value) => !value);
        } else if (event.key === 'Escape') setOpen(false);
      }}
      onBlur={() => setOpen(false)}
    >
      <StatIcon name={term} />
      {children}
    </span>
  );
}
