import overclockedCutout from '../assets/cutouts/overclocked-overlord.png';
import poseidonCutout from '../assets/cutouts/poseidon.png';
import hackerCutout from '../assets/cutouts/hacker-ball.png';
import droneCutout from '../assets/cutouts/drone-ball.png';
import forestCutout from '../assets/cutouts/forest-ball.png';
import './ThemeCutout.css';

export const CUTOUT_ASSETS = {
  overlord: overclockedCutout,
  poseidon: poseidonCutout,
  hacker: hackerCutout,
  drone: droneCutout,
  forest: forestCutout,
};

export const CUTOUT_LIST = [
  { id: 'overlord', src: overclockedCutout, label: 'Overclocked Overlord' },
  { id: 'poseidon', src: poseidonCutout, label: 'Poseidon' },
  { id: 'hacker', src: hackerCutout, label: 'Hacker Ball' },
  { id: 'drone', src: droneCutout, label: 'Drone Ball' },
  { id: 'forest', src: forestCutout, label: 'Forest Ball' },
];

/**
 * Renders a cutout character in high-contrast monochrome (like the APEX logo)
 * that automatically adapts its tint to the active theme's `--accent` (or an
 * explicit `tintColor`) using alpha-channel CSS masking so transparent pixels
 * remain 100% transparent.
 */
export default function ThemeCutout({
  variant = 'overlord',
  src: customSrc,
  alt = '',
  className = '',
  tintColor,
  floating = true,
  style,
}) {
  const resolvedSrc = customSrc || CUTOUT_ASSETS[variant] || overclockedCutout;
  const maskUrl = `url("${resolvedSrc}")`;

  return (
    <div
      className={`theme-cutout ${floating ? 'is-floating' : ''} ${className}`.trim()}
      style={{
        '--cutout-mask': maskUrl,
        ...(tintColor ? { '--cutout-tint': tintColor } : {}),
        ...style,
      }}
      aria-hidden={alt ? undefined : 'true'}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        className="theme-cutout-img"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <span className="theme-cutout-color" aria-hidden="true" />
      <span className="theme-cutout-sheen" aria-hidden="true" />
    </div>
  );
}
