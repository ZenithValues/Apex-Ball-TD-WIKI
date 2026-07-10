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
 * Detailed unit value card: rarity-glowing name header, colored accent
 * gradient border (from the rarity's 6-stop palette), Value/Gems/Coins rows
 * in their own gradient colors, and filled Demand/Scarcity bars colored per
 * tier (dark red -> purple).
 */
export default function UnitValueCard({ unit, linkBase }) {
  const palette = getRarityPalette(unit.rarity);
  const glow = getRarityGlow(unit.rarity);
  const gradientBorder = `linear-gradient(90deg, ${palette.join(', ')})`;

  const demandColor = unit.demand ? DEMAND_COLORS[unit.demand] : null;
  const demandPercent = unit.demand ? DEMAND_PERCENT[unit.demand] : 0;
  const scarcityColor = unit.scarcity ? SCARCITY_COLORS[unit.scarcity] : null;
  const scarcityPercent = unit.scarcity ? SCARCITY_PERCENT[unit.scarcity] : 0;

  return (
    <Link
      to={`${linkBase}/${unit.slug}`}
      className="uv-card"
      style={{ '--rarity-border': gradientBorder }}
    >
      <div className="uv-card-accent" />
      <div className="uv-card-body">
        <div className="uv-card-head">
          <UnitIcon slug={unit.slug} name={unit.name} glowColor={glow} shiny={isShinyRarity(unit.rarity)} size={52} />
          <div>
            <div className="uv-card-name">{unit.name}</div>
            <div className="uv-card-rarity" style={{ color: glow, textShadow: `0 0 12px ${glow}99` }}>
              {unit.rarity}
            </div>
          </div>
        </div>

        <div className="uv-divider">
          <span className="uv-divider-line" />
          <span className="uv-divider-x">×</span>
          <span className="uv-divider-line" />
        </div>

        {unit.hasValue ? (
          <>
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

            <div className="uv-divider">
              <span className="uv-divider-line" />
              <span className="uv-divider-x">×</span>
              <span className="uv-divider-line" />
            </div>

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
          </>
        ) : (
          <div className="uv-no-data">No market data yet</div>
        )}
      </div>
    </Link>
  );
}
