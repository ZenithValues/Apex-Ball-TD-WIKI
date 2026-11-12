import './OriginDivider.css';

/**
 * Section divider used inside unit lists:
 *   ──────────────── // SEASONAL // ────────────────
 * Purely visual grouping — the cards stay in the same grid, so filters,
 * scrolling and "#slug" highlighting keep working exactly as before.
 */
export default function OriginDivider({ label, color = '#a7b0bd', count = null }) {
  return (
    <div className="origin-divider" style={{ '--origin-color': color }} role="separator" aria-label={`${label} section`}>
      <span className="origin-divider-line" aria-hidden="true" />
      <span className="origin-divider-label">
        <span className="origin-divider-slash" aria-hidden="true">//</span>
        {label}
        {count != null && <span className="origin-divider-count">{count}</span>}
        <span className="origin-divider-slash" aria-hidden="true">//</span>
      </span>
      <span className="origin-divider-line" aria-hidden="true" />
    </div>
  );
}
