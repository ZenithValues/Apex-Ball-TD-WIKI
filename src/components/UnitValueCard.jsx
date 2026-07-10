import { Link } from 'react-router-dom';
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

/**
 * Detailed unit value card — same visual shell as the WIKI unit card
 * (centered layout, big icon, rarity stripe/glow) but with Value/Gems/Coins
 * rows and Demand/Scarcity bars instead of the gameplay stat readout.
 */
export default function UnitValueCard({ unit, linkBase }) {
  const palette = getRarityPalette(unit.rarity);
  const glow = getRarityGlow(unit.rarity);
  const gradientBorder = `linear-gradient(180deg, ${palette.join(', ')})`;

  const demandColor = unit.demand ? DEMAND_COLORS[unit.demand] : null;
  const demandPercent = unit.demand ? DEMAND_PERCENT[unit.demand] : 0;
  const scarcityColor = unit.scarcity ? SCARCITY_COLORS[unit.scarcity] : null;
  const scarcityPercent = unit.scarcity ? SCARCITY_PERCENT[unit.scarcity] : 0;

  return (
    <Link
      to={`${linkBase}/${unit.slug}`}
      className="unit-card uv-card"
      style={{ '--rarity-border': gradientBorder }}
    >
      <div className="unit-card-stripe" />
      <div className="unit-card-icon-wrap">
        <UnitIcon slug={unit.slug} name={unit.name} glowColor={glow} shiny={isShinyRarity(unit.rarity)} size={96} />
      </div>
      <div className="unit-card-name">{unit.name}</div>
      <div className="unit-card-rarity" style={{ color: glow, textShadow: `0 0 16px ${glow}, 0 0 4px ${glow}` }}>
        {unit.rarity}
      </div>

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
                <div
                  className="uv-bar-fill"
                  style={{ width: `${demandPercent}%`, background: demandColor, boxShadow: `0 0 10px ${demandColor}aa` }}
                />
              </div>
            </div>

            <div className="uv-bar-block">
              <div className="uv-bar-head">
                <span>Scarcity</span>
                <span className="uv-bar-tier" style={{ color: scarcityColor }}>{unit.scarcity}</span>
              </div>
              <div className="uv-bar-track">
                <div
                  className="uv-bar-fill"
                  style={{ width: `${scarcityPercent}%`, background: scarcityColor, boxShadow: `0 0 10px ${scarcityColor}aa` }}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="uv-no-data">No market data yet</div>
      )}
    </Link>
  );
}
