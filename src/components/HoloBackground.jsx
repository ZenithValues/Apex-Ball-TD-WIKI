import './HoloBackground.css';

/**
 * Subtle holographic/3D-grid backdrop used site-wide behind the dark theme.
 * Pure SVG + CSS (no external assets, no JS animation loop) so it stays
 * lightweight and renders identically in the sandboxed preview iframe.
 */
export default function HoloBackground() {
  return (
    <div className="holo-bg" aria-hidden="true">
      <div className="holo-glow holo-glow-a" />
      <div className="holo-glow holo-glow-b" />
      <svg className="holo-grid" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="holoLineFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="holoLineFadeV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* perspective "3D floor" lines converging toward a horizon */}
        <g className="holo-perspective">
          {Array.from({ length: 13 }).map((_, i) => {
            const t = i / 12;
            const x = 200 + t * 1200;
            return (
              <line
                key={`p-${i}`}
                x1={x}
                y1="900"
                x2={800}
                y2="340"
                stroke="url(#holoLineFade)"
                strokeWidth="1"
              />
            );
          })}
          {Array.from({ length: 7 }).map((_, i) => {
            const t = i / 6;
            const y = 340 + t * 560;
            const spread = 60 + t * 700;
            return (
              <line
                key={`h-${i}`}
                x1={800 - spread}
                y1={y}
                x2={800 + spread}
                y2={y}
                stroke="url(#holoLineFade)"
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* floating diagonal accent lines, top corners */}
        <g className="holo-diagonals">
          <line x1="-50" y1="80" x2="500" y2="-50" stroke="url(#holoLineFadeV)" strokeWidth="1" />
          <line x1="1650" y1="120" x2="1150" y2="-50" stroke="url(#holoLineFadeV)" strokeWidth="1" />
          <line x1="-50" y1="700" x2="450" y2="950" stroke="url(#holoLineFadeV)" strokeWidth="1" />
          <line x1="1650" y1="650" x2="1180" y2="950" stroke="url(#holoLineFadeV)" strokeWidth="1" />
        </g>
      </svg>
      <div className="holo-noise" />
    </div>
  );
}
