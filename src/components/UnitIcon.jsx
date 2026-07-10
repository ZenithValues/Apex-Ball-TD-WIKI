import { getUnitIcon } from '../data/unitIcons';
import './UnitIcon.css';

/**
 * Renders a unit's circular icon if we have art for it, otherwise a simple
 * placeholder circle with the unit's first initial. Kept intentionally
 * simple — a soft rarity-colored glow ring behind the icon, that's it.
 * We can layer on fancier VFX later once the basics look right.
 */
export default function UnitIcon({ slug, name, glowColor, shiny = false, size = 64 }) {
  const icon = getUnitIcon(slug, shiny);

  return (
    <div
      className="unit-icon"
      style={{
        width: size,
        height: size,
        '--icon-glow': glowColor || 'rgba(255,255,255,0.35)',
      }}
    >
      <div className="unit-icon-glow" />
      {icon ? (
        <img src={icon} alt={name} className="unit-icon-img" />
      ) : (
        <div className="unit-icon-fallback">{name?.[0] ?? '?'}</div>
      )}
    </div>
  );
}
