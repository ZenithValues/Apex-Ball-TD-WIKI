import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import { motion } from 'framer-motion';
import { getUnitValueBySlug } from '../../data/values';
import { updatedByline } from '../../utils/publicName';
import { getUnitBySlug } from '../../data/units';
import { useData } from '../../context/DataContext';
import { getCardGlow, isShinyRarity } from '../../data/taxonomy';
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
import ValuePillow from '../../components/ValuePillow';

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

  // Shiny units use their own shiny accent (their rarity colour, or the
  // reserved magenta for shiny Omegas) so the hero matches the card.
  const glow = getCardGlow(unit);
  const origin = originTag(unit);
  const hasOrigin = origin.label !== 'Normal';
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
          {/* Operator (2026-11-13): "remove the text on the detailed value page
              — just put everything like the Value Pillows, and remove the
              subtext on the right side." One pillow, no panel headings, no
              right-hand notes: exactly what the card shows. */}
          <section className="vud-panel vud-pillow-panel" aria-label="Market value">
            <ValuePillow unit={unit} className="uv-pillow-detail" />
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
