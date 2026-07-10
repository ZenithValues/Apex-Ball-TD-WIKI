import './HoloBackground.css';

/**
 * Pure black backdrop with a holographic grid of straight vertical and
 * horizontal lines (not a perspective/converging floor). Pure SVG + CSS,
 * no external assets, no animation loop dependency, renders identically in
 * the sandboxed preview iframe.
 */
export default function HoloBackground() {
  const cols = 14;
  const rows = 9;

  return (
    <div className="holo-bg" aria-hidden="true">
      <svg className="holo-grid" viewBox="0 0 1400 900" preserveAspectRatio="none">
        <defs>
          {/* userSpaceOnUse (not the default objectBoundingBox) is required
              here — objectBoundingBox gradients don't render correctly on
              zero-width shapes like a perfectly vertical line. */}
          <linearGradient id="holoV" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="900">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="12%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="88%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="holoH" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1400" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="12%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="88%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="holo-lines-v">
          {Array.from({ length: cols + 1 }).map((_, i) => {
            const x = (i / cols) * 1400;
            return <line key={`v-${i}`} x1={x} y1="0" x2={x} y2="900" stroke="url(#holoV)" strokeWidth="1.5" />;
          })}
        </g>
        <g className="holo-lines-h">
          {Array.from({ length: rows + 1 }).map((_, i) => {
            const y = (i / rows) * 900;
            return <line key={`h-${i}`} x1="0" y1={y} x2="1400" y2={y} stroke="url(#holoH)" strokeWidth="1.5" />;
          })}
        </g>
      </svg>
      <div className="holo-scanline" />
    </div>
  );
}
