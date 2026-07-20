import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUnitValueBySlug } from '../../data/values';
import { useData } from '../../context/DataContext';
import {
  getRarityPalette,
  getRarityGlow,
  isShinyRarity,
  DEMAND_COLORS,
  DEMAND_PERCENT,
  SCARCITY_COLORS,
  SCARCITY_PERCENT,
} from '../../data/taxonomy';
import PageShell from '../../components/PageShell';
import { VALUES_NAV } from '../../config/navigation';
import PageIntro from '../../components/PageIntro';
import UnitIcon from '../../components/UnitIcon';
import { formatCompactNumber, formatFullNumber } from '../../utils/formatNumber';
import './UnitValueDetail.css';

const statGridVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08 } },
};

const statBoxVariants = {
  initial: { opacity: 0, y: 14, scale: 0.94 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function UnitValueDetail() {
  const { rarity, slug } = useParams();
  const { getUnitValueBySlug: getLiveUnit, error } = useData();

  const staticUnit = useMemo(() => getUnitValueBySlug(slug), [slug]);
  const liveUnit = useMemo(() => (slug ? getLiveUnit(slug) : null), [getLiveUnit, slug]);
  const unit = liveUnit || staticUnit;

  if (!unit) {
    return (
      <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
        <PageIntro eyebrow={rarity || 'Unit'} title="Not Found">
          <p>We couldn&apos;t find value data for &ldquo;{slug}&rdquo;.</p>
        </PageIntro>
      </PageShell>
    );
  }

  const palette = getRarityPalette(unit.rarity);
  const glow = getRarityGlow(unit.rarity);
  const isPrvw = Boolean(unit.isPrvw || unit.prvw || unit.livePrvwOverride);

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <motion.div
        className="rarity-top-bar"
        style={{ background: `linear-gradient(90deg, ${palette.join(', ')})`, height: 3, borderRadius: 2 }}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />

      <PageIntro
        eyebrow={unit.rarity}
        title={isPrvw ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {unit.name}
            <span className="badge prvw-badge" style={{ background: '#b679ff', color: '#fff', fontSize: '0.72rem', padding: '2px 8px', fontWeight: 800, borderRadius: '999px' }}>prvw</span>
          </span>
        ) : unit.name}
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
          {unit.type || 'Unit'} · {unit.category || 'Standard'}
        </p>
      </PageIntro>

      {error && <p className="pending-flag">Live values could not load; showing bundled fallback values.</p>}

      {!unit.hasValue ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No market data yet for {unit.name}. Give me a base value, demand rating, and scarcity
          rating (from real trades) and I&apos;ll compute its trade value.
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
            <StatBox label="Value" value={formatCompactNumber(unit.tradeValue)} fullValue={formatFullNumber(unit.tradeValue)} color="#4d9dff" />
            <StatBox label="Gems" value={formatCompactNumber(unit.gems)} fullValue={formatFullNumber(unit.gems)} color="#c04dff" />
            <StatBox label="Coins" value={formatCompactNumber(unit.coins)} fullValue={formatFullNumber(unit.coins)} color="#ffc94d" />
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

function StatBox({ label, value, fullValue, color }) {
  return (
    <motion.div className="stat-box" variants={statBoxVariants}>
      <div className="stat-value" title={fullValue ? `${fullValue} exact` : undefined} style={color ? { color, textShadow: `0 0 10px ${color}80` } : undefined}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

function BarRow({ label, tier, color, percent, delay = 0 }) {
  return (
    <div className="vud-bar-row">
      <div className="vud-bar-header">
        <span className="vud-bar-label">{label}</span>
        <span className="vud-bar-tier" style={{ color }}>{tier}</span>
      </div>
      <div className="vud-bar-track">
        <motion.div
          className="vud-bar-fill"
          style={{ background: color, boxShadow: `0 0 12px ${color}88` }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
    </div>
  );
}
