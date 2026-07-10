import { useParams, Link, Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { VALUES_NAV } from '../../data/navTree';
import { getUnitValueBySlug } from '../../data/values';
import {
  getRarityPalette,
  getRarityGlow,
  DEMAND_COLORS,
  DEMAND_PERCENT,
  SCARCITY_COLORS,
  SCARCITY_PERCENT,
} from '../../data/taxonomy';
import './ValueUnitDetail.css';

export default function ValueUnitDetail() {
  const { rarity, slug } = useParams();
  const unit = getUnitValueBySlug(slug);
  if (!unit) return <Navigate to={`/values/units/${encodeURIComponent(rarity)}`} replace />;

  const palette = getRarityPalette(unit.rarity);
  const glow = getRarityGlow(unit.rarity);

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <p className="crumb">
        <Link to={`/values/units/${encodeURIComponent(rarity)}`}>{rarity}</Link> / {unit.name}
      </p>
      <div className="vud-accent" style={{ background: `linear-gradient(90deg, ${palette.join(', ')})` }} />
      <h1>{unit.name}</h1>
      <div className="vud-rarity" style={{ color: glow, textShadow: `0 0 14px ${glow}99` }}>
        {unit.rarity}
      </div>

      {!unit.hasValue ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No market data yet for {unit.name}. Give me a base value, demand rating, and scarcity
          rating (from real trades) and I'll compute its trade value.
        </div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginTop: 24 }}>
            <StatBox label="Value" value={unit.tradeValue.toLocaleString()} color="#4d9dff" />
            <StatBox label="Gems" value={unit.gems.toLocaleString()} color="#c04dff" />
            <StatBox label="Coins" value={unit.coins.toLocaleString()} color="#ffc94d" />
            {unit.trend && <StatBox label="Trend" value={unit.trend} />}
          </div>

          <div className="vud-bars">
            <BarRow label="Demand" tier={unit.demand} color={DEMAND_COLORS[unit.demand]} percent={DEMAND_PERCENT[unit.demand]} />
            <BarRow label="Scarcity" tier={unit.scarcity} color={SCARCITY_COLORS[unit.scarcity]} percent={SCARCITY_PERCENT[unit.scarcity]} />
          </div>
        </>
      )}
    </PageShell>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="stat-box">
      <div className="stat-value" style={color ? { color, textShadow: `0 0 10px ${color}80` } : undefined}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function BarRow({ label, tier, color, percent }) {
  return (
    <div className="vud-bar-block">
      <div className="vud-bar-head">
        <span>{label}</span>
        <span className="vud-bar-tier" style={{ color }}>{tier}</span>
      </div>
      <div className="vud-bar-track">
        <div
          className="vud-bar-fill"
          style={{ width: `${percent}%`, background: color, boxShadow: `0 0 10px ${color}aa` }}
        />
      </div>
    </div>
  );
}
