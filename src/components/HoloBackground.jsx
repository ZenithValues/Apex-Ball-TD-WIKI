import './HoloBackground.css';

/**
 * Pure black backdrop with a 3D-perspective holographic grid: horizontal
 * "floor" lines recede toward a vanishing point (spaced closer together and
 * fainter as they go back), vertical lines converge slightly toward the
 * same point. Pure SVG + CSS, no external assets, renders identically in
 * the sandboxed preview iframe.
 */
export default function HoloBackground() {
  const width = 1400;
  const height = 900;
  const vanishX = width / 2;
  const vanishY = height * 0.32;

  // Vertical lines: start evenly spaced along the bottom edge, converge
  // toward the vanishing point near the top for a 3D floor-grid look.
  const vCount = 15;
  const verticals = Array.from({ length: vCount + 1 }).map((_, i) => {
    const t = i / vCount;
    const xBottom = t * width;
    return { xBottom, key: `v-${i}` };
  });

  // Horizontal lines: use an eased spacing (denser near the vanishing point,
  // sparser near the bottom) so they read as a floor receding into depth.
  const hCount = 10;
  const horizontals = Array.from({ length: hCount + 1 }).map((_, i) => {
    const t = i / hCount;
    const eased = Math.pow(t, 1.8);
    const y = vanishY + eased * (height - vanishY);
    return { y, opacity: 0.15 + t * 0.55, key: `h-${i}` };
  });

  return (
    <div className="holo-bg" aria-hidden="true">
      <svg
        className="holo-grid"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="holoFade" cx="50%" cy={`${(vanishY / height) * 100}%`} r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="holo-lines-v" opacity="0.9">
          {verticals.map(({ xBottom, key }) => (
            <line key={key} x1={xBottom} y1={height} x2={vanishX} y2={vanishY} stroke="url(#holoFade)" strokeWidth="0.6" />
          ))}
        </g>
        <g className="holo-lines-h">
          {horizontals.map(({ y, opacity, key }) => (
            <line key={key} x1="0" y1={y} x2={width} y2={y} stroke="#ffffff" strokeOpacity={opacity * 0.4} strokeWidth="0.6" />
          ))}
        </g>
      </svg>
      <div className="holo-vignette" />
      <div className="holo-scanline" />
    </div>
  );
}
