import { motion } from 'framer-motion';
import { getUnitIcon } from '../data/unitIcons';
import './UnitIcon.css';

/**
 * Renders a unit's squircle icon if we have art for it, otherwise a simple
 * squircle placeholder with the unit's first initial. A soft rarity-colored
 * glow sits behind the shape, and a subtle scanline texture overlays the
 * image itself for the cybernetic look.
 */
export default function UnitIcon({ slug, name, glowColor, shiny = false, size = 64 }) {
  const icon = getUnitIcon(slug, shiny);

  return (
    <motion.div
      className="unit-icon"
      style={{
        width: size,
        height: size,
        '--icon-glow': glowColor || 'rgba(255,255,255,0.35)',
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="unit-icon-glow" />
      <div className="unit-icon-squircle">
        {icon ? (
          <img src={icon} alt={name} className="unit-icon-img" />
        ) : (
          <div className="unit-icon-fallback">{name?.[0] ?? '?'}</div>
        )}
      </div>
    </motion.div>
  );
}
