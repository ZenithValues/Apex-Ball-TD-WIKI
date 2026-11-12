import './OriginDivider.css';

/**
 * Section divider used inside unit lists:
 *   ──────────────── // SEASONAL // ────────────────
 * Purely visual grouping — the cards stay in the same grid, so filters,
 * scrolling and "#slug" highlighting keep working exactly as before.
 */
// `count` is accepted for backwards compatibility but never rendered — the
// tag stays clean ("Seasonal", not "Seasonal (3)"), operator 2026-11-12.
export default function OriginDivider({ label, color = '#a7b0bd' }) {
  return (
    <div className="origin-divider" style={{ '--origin-color': color }} role="separator" aria-label={`${label} section`}>
      <span className="origin-divider-line" aria-hidden="true" />
      <span className="origin-divider-label">
        <span className="origin-divider-slash" aria-hidden="true">//</span>
        {label}
        <span className="origin-divider-slash" aria-hidden="true">//</span>
      </span>
      <span className="origin-divider-line" aria-hidden="true" />
    </div>
  );
}
