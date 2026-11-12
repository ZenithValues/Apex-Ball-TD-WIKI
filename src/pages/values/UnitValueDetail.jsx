import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import { motion } from 'framer-motion';
import { getUnitValueBySlug } from '../../data/values';
import { updatedByline } from '../../utils/publicName';
import { getUnitBySlug } from '../../data/units';
import { useData } from '../../context/DataContext';
import {
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
import ShinyToggle from '../../components/ShinyToggle';
import ThemeCutout, { getCutoutForRarity } from '../../components/ThemeCutout';
import OriginDivider from '../../components/OriginDivider';
import { originTag } from '../../utils/originTag';
import { formatCompactNumber, formatFullNumber, formatRelativeTime } from '../../utils/formatNumber';
import '../wiki/UnitDetail.css';
import './UnitValueDetail.css';
import { TermTip } from '../../components/StatMeta';
import ExistCountBadge from '../../components/ExistCountBadge';
import OverpayPills from '../../components/OverpayPills';

const statGridVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
};

const statBoxVariants = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] },
  },
};

const TREND_COPY = {
  rising: { label: 'Rising', color: 'var(--c-success)' },
  falling: { label: 'Dropping', color: 'var(--c-danger)' },
  fluctuating: { label: 'Fluctuating', color: 'var(--c-warning)' },
  stable: { label: 'Stable', color: '#ffffff' },
};

/** Full overhaul of the per-unit value page (2026-11-12). */
export default function UnitValueDetail() {
  const params = useParams();
  const rarity = decodeRouteParam(params.rarity);
  const slug = decodeRouteParam(params.slug);
  const { getUnitValueBySlug: getLiveUnit, error } = useData();

  const staticUnit = useMemo(() => getUnitValueBySlug(slug), [slug]);
  const liveUnit = useMemo(() => (slug ? getLiveUnit(slug) : null), [getLiveUnit, slug]);
  const unit = liveUnit || staticUnit;

  const isShiny = Boolean(unit && (unit.shiny || isShinyRarity(unit.rarity)));
  const counterpartLink = useMemo(() => {
    if (!unit) return null;
    if (isShiny) {
      const baseSlug = unit.slug.replace(/^shiny-/, '');
      const bu = getUnitBySlug(baseSlug);
      if (bu) return `/values/units/${encodeURIComponent(bu.rarity)}/${bu.slug}`;
    } else {
      const shinySlug = `shiny-${unit.slug}`;
      const su = getUnitBySlug(shinySlug);
      if (su) return `/values/units/${encodeURIComponent(su.rarity)}/${su.slug}`;
    }
    return null;
  }, [unit, isShiny]);

  if (!unit) {
    return (
      <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
        <PageIntro eyebrow={rarity || 'Unit'} title="Not Found">
          <p>We couldn&apos;t find value data for &ldquo;{slug}&rdquo;.</p>
        </PageIntro>
      </PageShell>
    );
  }

  const glow = getRarityGlow(unit.rarity);
  const origin = originTag(unit);
  const hasOrigin = origin.label !== 'Normal';
  const trend = TREND_COPY[unit.trend] || null;

  const valueText = unit.specialValue || (unit.tradeValueMax
    ? `${formatCompactNumber(unit.tradeValue)}-${formatCompactNumber(unit.tradeValueMax)}`
    : formatCompactNumber(unit.tradeValue));
  const valueExact = unit.specialValue || (unit.tradeValueMax
    ? `${formatFullNumber(unit.tradeValue)} - ${formatFullNumber(unit.tradeValueMax)}`
    : formatFullNumber(unit.tradeValue));
  const gemsText = unit.specialGems || (unit.gemsMax
    ? `${formatCompactNumber(unit.gems)}-${formatCompactNumber(unit.gemsMax)}`
    : formatCompactNumber(unit.gems));
  const gemsExact = unit.specialGems || (unit.gemsMax
    ? `${formatFullNumber(unit.gems)} - ${formatFullNumber(unit.gemsMax)}`
    : formatFullNumber(unit.gems));
  const coinsText = unit.specialCoins || (unit.coinsMax
    ? `${formatCompactNumber(unit.coins)}-${formatCompactNumber(unit.coinsMax)}`
    : formatCompactNumber(unit.coins));
  const coinsExact = unit.specialCoins || (unit.coinsMax
    ? `${formatFullNumber(unit.coins)} - ${formatFullNumber(unit.coinsMax)}`
    : formatFullNumber(unit.coins));

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <p className="crumb">
        <Link to="/values/units">Units</Link> / <Link to={`/values/units/${encodeURIComponent(unit.rarity)}`}>{unit.rarity}</Link> / {unit.name}
      </p>

      <motion.div
        className="unit-header vud-hero"
        style={{ '--rarity-accent': glow }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
      >
        <ThemeCutout
          variant={getCutoutForRarity(unit.rarity)}
          floating
          className="unit-header-cutout"
        />
        <div className="unit-title-row">
          <UnitIcon
            slug={unit.slug}
            name={unit.name}
            glowColor={glow}
            shiny={isShinyRarity(unit.rarity)}
            size={108}
            imageUrl={unit.imageUrl}
          />
          <div className="unit-title-copy">
            <h1>{unit.name}</h1>
            <div className="unit-badges">
              <span className="badge filled">{unit.rarity}</span>
              {unit.type && <span className="badge">{unit.type}</span>}
              {hasOrigin && <span className="badge origin-badge" style={{ color: origin.color, borderColor: `color-mix(in srgb, ${origin.color} 42%, transparent)` }}>{origin.label}</span>}
              <ExistCountBadge slug={unit.slug} />
            </div>
          </div>
          <div className="unit-header-actions">
            <ShinyToggle isShiny={isShiny} counterpartLink={counterpartLink} />
            <div className="unit-header-btn-group">
              <Link to="/values/calculator" className="unit-secondary-btn">
                🧮 Calculator
              </Link>
              <Link
                to={`/wiki/units/${encodeURIComponent(unit.rarity)}/${unit.slug}`}
                className="unit-crosslink-btn"
              >
                View WIKI Page →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Seasonal / Exclusive / Limited / Unobtainable callout — the same
          divider used in the unit lists, so the label means the same here. */}
      {hasOrigin && (
        <OriginDivider label={origin.label} color={origin.color} />
      )}

      {error && <p className="pending-flag">Live values could not load; showing bundled fallback values.</p>}

      {!unit.hasValue ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No market data yet for {unit.name}. Give me a base value, demand rating, and scarcity
          rating (from real trades) and I&apos;ll compute its trade value.
        </div>
      ) : (
        <div className="vud-board">
          <section className="vud-panel" aria-label="Market value">
            <header className="vud-panel-head">
              <span className="vud-panel-kicker">Market value</span>
              <span className="vud-panel-note">Team-set trade worth, gems and coins</span>
            </header>
            <motion.div
              className="stat-grid"
              variants={statGridVariants}
              initial="initial"
              animate="animate"
            >
              <StatBox term="value" label="Value" value={valueText} fullValue={valueExact} color="var(--c-info)" />
              <StatBox term="gems" label="Gems" value={gemsText} fullValue={gemsExact} color="var(--c-purple)" />
              <StatBox term="coins" label="Coins" value={coinsText} fullValue={coinsExact} color="var(--c-warning)" />
              {trend && (
                <StatBox
                  term="status"
                  label="Status"
                  value={trend.label}
                  fullValue={`Trend: ${unit.trend}`}
                  color={trend.color}
                />
              )}
            </motion.div>
          </section>

          <section className="vud-panel" aria-label="Trade behaviour">
            <header className="vud-panel-head">
              <span className="vud-panel-kicker">Trade behaviour</span>
              <span className="vud-panel-note">Equal spacing across all three strips</span>
            </header>
            <OverpayPills unit={unit} />
          </section>

          <section className="vud-panel" aria-label="Market signals">
            <header className="vud-panel-head">
              <span className="vud-panel-kicker">Market signals</span>
              <span className="vud-panel-note">How wanted it is, and how rare</span>
            </header>
            <div className="vud-bars">
              <BarRow term="demand" label="Demand" tier={unit.demand} color={DEMAND_COLORS[unit.demand]} percent={DEMAND_PERCENT[unit.demand]} delay={0.1} />
              <BarRow term="scarcity" label="Scarcity" tier={unit.scarcity} color={SCARCITY_COLORS[unit.scarcity]} percent={SCARCITY_PERCENT[unit.scarcity]} delay={0.18} />
            </div>
          </section>

          <footer className="vud-foot">
            <div className="vud-foot-links">
              <Link to={`/wiki/units/${encodeURIComponent(unit.rarity)}/${unit.slug}`}>WIKI page</Link>
              <span aria-hidden="true">·</span>
              <Link to={`/values/units/${encodeURIComponent(unit.rarity)}`}>More {unit.rarity} units</Link>
              <span aria-hidden="true">·</span>
              <Link to="/values/calculator">Trade calculator</Link>
            </div>
            {unit.updatedAt && (
              <p className="vud-updated" title={new Date(unit.updatedAt).toLocaleString()}>
                {updatedByline(unit, unit.updatedAt, formatRelativeTime(unit.updatedAt), { prefix: '🕒 ' })}
              </p>
            )}
          </footer>
        </div>
      )}
    </PageShell>
  );
}

function StatBox({ label, value, fullValue, color, term }) {
  return (
    <motion.div className="stat-box vud-stat" variants={statBoxVariants}>
      <div className="stat-value" title={fullValue ? `${fullValue} exact` : undefined} style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="stat-label">
        {term ? <TermTip term={term}>{label}</TermTip> : label}
      </div>
      {fullValue && String(fullValue) !== String(value) && (
        <div className="vud-stat-exact" title="Exact figure">{fullValue}</div>
      )}
    </motion.div>
  );
}

function BarRow({ label, tier, color, percent, delay = 0, term }) {
  return (
    <div className="vud-bar-row">
      <div className="vud-bar-header">
        <span className="vud-bar-label">{term ? <TermTip term={term}>{label}</TermTip> : label}</span>
        <span className="vud-bar-tier" style={{ color }}>{tier}</span>
      </div>
      <div className="vud-bar-track">
        <motion.div
          className="vud-bar-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay }}
        />
      </div>
    </div>
  );
}
