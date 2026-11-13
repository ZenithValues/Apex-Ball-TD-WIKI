import { Fragment } from 'react';
import { TermTip } from './StatMeta';
import './ValuePillow.css';
import './StatPillow.css';

/**
 * StatPillow — the WIKI side of the one-pillow design.
 *
 * Operator (2026-11-13, rev 7): "I also want a similar card design for the WIKI
 * cards too!" So the WIKI card uses the exact same panel as the value card:
 * one bordered pillow, one hairline between every pair, coloured label on the
 * left, number on the right — the stats just happen to be damage / cooldown /
 * range instead of value / gems / coins.
 *
 * It deliberately renders through the SAME classes as ValuePillow
 * (`.uv-pillow`, `.uv-stat-row`, `.uv-row-divider`), so the two card families
 * can never drift apart in spacing, divider weight or centring.
 */
export default function StatPillow({ rows = [], className = '' }) {
  const shown = (rows || []).filter((row) => row && row.value != null && row.value !== '');
  if (!shown.length) return null;

  return (
    <div className={`uv-stat-rows uv-pillow stat-pillow ${className}`.trim()} data-stat-pillow="">
      {shown.map((row, index) => (
        <Fragment key={`${row.term}:${index}`}>
          {index > 0 && <div className="uv-row-divider" aria-hidden="true" />}
          <div className="uv-stat-row" data-value-row={row.term}>
            <TermTip term={row.term} className={`uv-stat-label uv-label-${row.term}`}>{row.label}</TermTip>
            <strong
              className="uv-stat-amount"
              style={row.color ? { color: row.color } : undefined}
              title={row.title || undefined}
            >
              {row.value}
            </strong>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
