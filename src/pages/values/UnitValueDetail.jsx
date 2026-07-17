import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitIcon from '../../components/UnitIcon';
import { VALUES_NAV } from '../../config/navigation';
import { useLiveValues } from '../../hooks/useLiveValues';
import { mergeWikiOverride, useWikiUnitOverride } from '../../hooks/useWikiUnitOverride';
import { decodeRouteParam } from '../../utils/routeParams';
import { formatCompactNumber, formatFullNumber } from '../../utils/formatNumber';
import {
  getRarityPalette,
  getRarityGlow,
  isShinyRarity,
  DEMAND_COLORS,
  DEMAND_PERCENT,
  SCARCITY_COLORS,
  SCARCITY_PERCENT,
} from '../../data/taxonomy';
import './ValueUnitDetail.css';

const statGridVariants = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const statBoxVariants = {
  initial: { opacity: 0, y: 14, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export default function ValueUnitDetail() {
  const params = useParams();
  const rarity = decodeRouteParam(params.rarity);
  const slug = decodeRouteParam(params.slug);
  const { getUnitValueBySlug, loading, error } = useLiveValues();
  const baseUnit = getUnitValueBySlug(slug);
  const { override } = useWikiUnitOverride(baseUnit?.slug);
  const unit = mergeWikiOverride(baseUnit, override);

  if (!loading && !unit) return <Navigate to={`/values/units/${encodeURIComponent(rarity)}`} replace />;
  if (!unit) {
    return (
      <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
        <div className="empty-state">Loading values…</div>
      </PageShell>
    );
  }

  const palette = getRarityPalette(unit.rarity);
  const glow = getRarityGlow(unit.rarity);
  const tagText = unit.liveTag || (unit.isLocalOverride ? 'prvw' : 'live');

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <p className="crumb">
        <Link to={`/values/units/${encodeURIComponent(rarity)}`}>{rarity}</Link> / {unit.name}
      </p>
      <motion.div
        className="vud-accent"
        style={{ background: `linear-gradient(90deg, ${palette.join(', ')})` }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />

      <PageIntro
        eyebrow={unit.rarity}
        title={unit.name}
        actions={(
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
            <UnitIcon
              slug={unit.slug}
              name={unit.name}
              glowColor={glow}
              shiny={isShinyRarity(unit.rarity)}
              size={92}
              imageUrl={unit.imageUrl}
            />
            <Link
              to={`/wiki/units/${encodeURIComponent(unit.rarity)}/${unit.slug}`}
              className="badge filled"
              style={{ textDecoration: 'none', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              View WIKI Page →
            </Link>
          </div>
        )}
      >
        <p style={{ color: glow, textShadow: `0 0 14px ${glow}66` }}>
          {unit.type || 'Unit'} · {unit.category || 'Standard'}{' '}
          <span className={`uv-card-badge ${tagText === 'prvw' ? 'badge-prvw' : 'badge-live'}`} style={{ position: 'relative', top: -1, marginLeft: 8 }}>
            {tagText.toUpperCase()}
          </span>
        </p>
      </PageIntro>

      {error && <p className="pending-flag">Live values could not load; showing bundled fallback values.</p>}

      {!unit.hasValue ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No market data yet for {unit.name}.
        </div>
      ) : (
        <>
          <motion.div
            className="stat-grid"
            style={{ marginTop: 24 }}
            variants={statGridVariants}
            initial="initial"
            animate="animate"
          >
            <StatBox label="Value" value={formatCompactNumber(unit.tradeValue)} full={formatFullNumber(unit.tradeValue)} color="#4d9dff" />
            <StatBox label="Gems" value={formatCompactNumber(unit.gems)} full={formatFullNumber(unit.gems)} color="#c04dff" />
            <StatBox label="Coins" value={formatCompactNumber(unit.coins)} full={formatFullNumber(unit.coins)} color="#ffc94d" />
            {unit.trend && <StatBox label="Trend" value={unit.trend} />}
          </motion.div>

          {unit.liveValue && unit.updatedAt && (
            <p className="pending-flag" style={{ marginTop: 12 }}>
              Live value updated {new Date(unit.updatedAt).toLocaleString()}.
            </p>
          )}

          <div className="vud-bars">
            <BarRow label="Demand" tier={unit.demand} color={DEMAND_COLORS[unit.demand]} percent={DEMAND_PERCENT[unit.demand]} delay={0.2} />
            <BarRow label="Scarcity" tier={unit.scarcity} color={SCARCITY_COLORS[unit.scarcity]} percent={SCARCITY_PERCENT[unit.scarcity]} delay={0.3} />
          </div>
        </>
      )}
    </PageShell>
  );
}

function StatBox({ label, value, full, color }) {
  return (
    <motion.div className="stat-box" variants={statBoxVariants} title={full ? `${full} exact` : undefined}>
      <div className="stat-value" style={color ? { color, textShadow: `0 0 10px ${color}80` } : undefined}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

function BarRow({ label, tier, color, percent, delay = 0 }) {
  return (
    <div className="vud-bar-block">
      <div className="vud-bar-head">
        <span>{label}</span>
        <span className="vud-bar-tier" style={{ color }}>{tier}</span>
      </div>
      <div className="vud-bar-track">
        <motion.div
          className="vud-bar-fill"
          style={{ background: color, boxShadow: `0 0 10px ${color}aa` }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
    </div>
  );
}
