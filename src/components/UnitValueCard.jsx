import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getRarityPalette,
  getRarityGlow,
  isShinyRarity,
  DEMAND_COLORS,
  DEMAND_PERCENT,
  SCARCITY_COLORS,
  SCARCITY_PERCENT,
} from '../data/taxonomy';
import UnitIcon from './UnitIcon';
import './UnitValueCard.css';

const MotionLink = motion(Link);

export const uvCardVariants = {
  initial: { opacity: 0, y: 18, scale: 0.94 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Detailed unit value card — updated layout with icon on left,
 * name and rarity on right in header, value info below.
 */
export default function UnitValueCard({ unit, linkBase, highlighted }) {
  const palette = getRarityPalette(unit.rarity);
  const glow = getRarityGlow(unit.rarity);
  const gradientBorder = `linear-gradient(180deg, ${palette.join(', ')})`;

  const demandColor = unit.demand ? DEMAND_COLORS[unit.demand] : null;
  const demandPercent = unit.demand ? DEMAND_PERCENT[unit.demand] : 0;
  const scarcityColor = unit.scarcity ? SCARCITY_COLORS[unit.scarcity] : null;
  const scarcityPercent = unit.scarcity ? SCARCITY_PERCENT[unit.scarcity] : 0;

  return (
    <MotionLink
      to={`${linkBase}/${unit.slug}`}
      data-slug={unit.slug}
      className={highlighted ? 'unit-card uv-card unit-card-highlight' : 'unit-card uv-card'}
      style={{ '--rarity-border': gradientBorder }}
      variants={uvCardVariants}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
    >
      <div className="unit-card-stripe" />
      <div className="unit-card-header">
        <div className="unit-card-icon-wrap">
          <UnitIcon slug={unit.slug} name={unit.name} glowColor={glow} shiny={isShinyRarity(unit.rarity)} size={72} imageUrl={unit.imageUrl} />
        </div>
        <div className="unit-card-header-text">
          <div className="unit-card-name">{unit.name}</div>
          <div className="unit-card-rarity" style={{ color: glow, textShadow: `0 0 12px ${glow}` }}>
            {unit.rarity}
          </div>
        </div>
      </div>

      <div className="unit-card-body">
        {unit.hasValue ? (
          <>
            <div className="uv-stat-rows">
              <div className="uv-stat-row">
                <span className="uv-stat-label uv-label-value">Value</span>
                <span className="uv-stat-amount">{unit.tradeValue.toLocaleString()}</span>
              </div>
              <div className="uv-stat-row">
                <span className="uv-stat-label uv-label-gems">Gems</span>
                <span className="uv-stat-amount">{unit.gems.toLocaleString()}</span>
              </div>
              <div className="uv-stat-row">
                <span className="uv-stat-label uv-label-coins">Coins</span>
                <span className="uv-stat-amount">{unit.coins.toLocaleString()}</span>
              </div>
            </div>

            <div className="uv-bars">
              <div className="uv-bar-block">
                <div className="uv-bar-head">
                  <span>Demand</span>
                  <span className="uv-bar-tier" style={{ color: demandColor }}>{unit.demand}</span>
                </div>
                <div className="uv-bar-track">
                  <motion.div
                    className="uv-bar-fill"
                    style={{ background: demandColor, boxShadow: `0 0 10px ${demandColor}aa` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${demandPercent}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  />
                </div>
              </div>

              <div className="uv-bar-block">
                <div className="uv-bar-head">
                  <span>Scarcity</span>
                  <span className="uv-bar-tier" style={{ color: scarcityColor }}>{unit.scarcity}</span>
                </div>
                <div className="uv-bar-track">
                  <motion.div
                    className="uv-bar-fill"
                    style={{ background: scarcityColor, boxShadow: `0 0 10px ${scarcityColor}aa` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${scarcityPercent}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="uv-no-data">No market data yet</div>
        )}
      </div>
    </MotionLink>
  );
}