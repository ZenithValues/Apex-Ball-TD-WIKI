import { OVERPAY_COLORS, UNDERPAY_COLORS } from '../utils/overpayOptions';
import './OverpayPills.css';

/** Same visual language as the existing Status strip (`.uv-status-strip`). */
function Pill({ label, value, color }) {
  if (!value) return null;
  return (
    <div className="uv-status-strip apex-behaviour-pill" style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}>
      <span className="apex-behaviour-dot" style={{ background: color }} aria-hidden="true" />
      <span className="uv-status-word">{label}</span>
      <strong style={{ color, marginLeft: 'auto' }}>{value}</strong>
    </div>
  );
}

export default function OverpayPills({ unit }) {
  const over = unit?.getsOverpays;
  const under = unit?.getsUnderpays;
  if (!over && !under) return null;
  return (
    <div className="apex-behaviour-pills">
      <Pill label="Gets Overpays" value={over} color={OVERPAY_COLORS[over] || '#ffffff'} />
      <Pill label="Gets Underpays" value={under} color={UNDERPAY_COLORS[under] || '#ffffff'} />
    </div>
  );
}
