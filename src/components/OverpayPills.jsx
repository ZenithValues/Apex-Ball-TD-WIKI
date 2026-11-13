import { OVERPAY_COLORS, UNDERPAY_COLORS } from '../utils/overpayOptions';
import { TermTip } from './StatMeta';
import './OverpayPills.css';

const STATUS_META = {
  rising: { label: 'Rising', color: '#34d399' },
  stable: { label: 'Stable', color: '#ffffff' },
  falling: { label: 'Dropping', color: '#f87171' },
  fluctuating: { label: 'Fluctuating', color: '#fbbf24' },
};

/** Status / trend metadata for one unit (shared by the pill and the ValuePillow). */
export function trendMeta(unit) {
  return STATUS_META[unit?.trend] || null;
}

export function TrendGlyph({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M1 12.5L5 8l3 2.5L15 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 4h4v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Same visual language for Status, Overpays and Underpays — one strip each. */
function Strip({ label, value, color, glyph = null, term = null }) {
  if (!value) return null;
  return (
    <div className="uv-status-strip apex-behaviour-pill" style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}>
      {glyph || <span className="apex-behaviour-dot" style={{ background: color }} aria-hidden="true" />}
      {term ? <TermTip term={term} className="uv-status-word">{label}</TermTip> : <span className="uv-status-word">{label}</span>}
      <strong style={{ color, marginLeft: 'auto' }}>{value}</strong>
    </div>
  );
}

/**
 * The Status / Gets Overpays / Gets Underpays strips. They share ONE container
 * with one gap, so all three sit exactly the same distance apart on the card
 * and on the unit detail page.
 */
export default function OverpayPills({ unit, showStatus = true }) {
  const over = unit?.getsOverpays;
  const under = unit?.getsUnderpays;
  const status = showStatus ? STATUS_META[unit?.trend] : null;
  if (!over && !under && !status) return null;
  return (
    <div className="apex-behaviour-pills">
      {status && (
        <Strip
          label="Status"
          value={status.label}
          color={status.color}
          term="status"
          glyph={<TrendGlyph color={status.color} />}
        />
      )}
      <Strip label="Gets Overpays" value={over} color={OVERPAY_COLORS[over] || '#ffffff'} term="overpays" />
      <Strip label="Gets Underpays" value={under} color={UNDERPAY_COLORS[under] || '#ffffff'} term="underpays" />
    </div>
  );
}
