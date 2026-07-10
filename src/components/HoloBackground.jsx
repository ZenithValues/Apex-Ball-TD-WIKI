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
  // Kept sparse so each grid cell reads large or the effect looks cluttered.
  const vCount = 8;
  const verticals = Array.from({ length: vCount + 1 }).map((_, i) => {
    const t = i / vCount;
    const xBottom = t * width;
    return { xBottom, key: `v-${i}` };
  });

  // Horizontal lines: use an eased spacing (denser near the vanishing point,
  // sparser near the bottom) so they read as a floor receding into depth.
  const hCount = 6;
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
          <radialGradient id="holoFade" cx="50%" cy={`${(vanishY / height) * 100}%`} r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id="holoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="holo-lines-v" opacity="0.95" filter="url(#holoGlow)">
          {verticals.map(({ xBottom, key }) => (
            <line key={key} x1={xBottom} y1={height} x2={vanishX} y2={vanishY} stroke="url(#holoFade)" strokeWidth="0.9" />
          ))}
        </g>
        <g className="holo-lines-h" filter="url(#holoGlow)">
          {horizontals.map(({ y, opacity, key }) => (
            <line key={key} x1="0" y1={y} x2={width} y2={y} stroke="#ffffff" strokeOpacity={opacity * 0.7} strokeWidth="0.9" />
          ))}
        </g>
      </svg>
      <div className="holo-vignette" />
      <div className="holo-scanline" />
    </div>
  );
}
