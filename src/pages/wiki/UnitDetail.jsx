import { useMemo, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../config/navigation';
import { getUnitBySlug } from '../../data/units';
import { getRarityGlow, isShinyRarity } from '../../data/taxonomy';
import UnitIcon from '../../components/UnitIcon';
import UnitTags from '../../components/UnitTags';
import { mergeWikiOverride, useWikiUnitOverride } from '../../hooks/useWikiUnitOverride';
import { useWikiCustomUnits } from '../../hooks/useWikiCustomUnits';
import { decodeRouteParam } from '../../utils/routeParams';
import './UnitDetail.css';

const listVariants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

function hasEntries(obj) {
  return obj && Object.keys(obj).length > 0;
}

function CollapsibleUpgrades({ upgrades }) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_VISIBLE = 3;
  const hasMore = upgrades.length > INITIAL_VISIBLE;
  const visibleUpgrades = expanded ? upgrades : upgrades.slice(0, INITIAL_VISIBLE);

  return (
    <section className="unit-section">
      <h2>Upgrades &amp; Costs</h2>
      {hasMore && (
        <button
          type="button"
          className="collapsible-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          style={{
            marginBottom: 16,
            padding: '8px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '0.88rem',
          }}
        >
          {expanded ? '▲ Hide upgrades' : `▼ Show all ${upgrades.length} upgrades`}
        </button>
      )}
      <motion.div className="upgrade-list" variants={listVariants} initial="initial" whileInView="animate" viewport={{ once: true, margin: '-40px' }}>
        {visibleUpgrades.map((u) => (
          <motion.div key={`${u.level}-${u.label}`} className="upgrade-card" variants={itemVariants}>
            <div className="upgrade-card-head">
              <span className="upgrade-label">{u.label}</span>
              {u.costRaw && <span className="badge filled">{u.costRaw}</span>}
            </div>
            {u.description && <p className="upgrade-desc">{u.description}</p>}
            {(hasEntries(u.dps) || u.costPerDps) && (
              <div className="upgrade-stats-row upgrade-dps-row">
                {hasEntries(u.dps) && Object.entries(u.dps).map(([k, v]) => <span key={k} className="mini-stat">{k}: {v}</span>)}
                {u.costPerDps && <span className="mini-stat">Cost/DPS: {u.costPerDps}</span>}
              </div>
            )}
            {hasEntries(u.stats) && <div className="attack-blocks"><UpgradeStatBlock name="Stats" stats={u.stats} cooldown={u.cooldown} range={u.range} /></div>}
            {hasEntries(u.attacks) && (
              <div className="attack-blocks">
                {Object.entries(u.attacks).map(([atkName, atkStats]) => <UpgradeStatBlock key={atkName} name={atkName} stats={atkStats} cooldown={u.cooldown} range={u.range} />)}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default function UnitDetail() {
  const params = useParams();
  const rarity = decodeRouteParam(params.rarity);
  const slug = decodeRouteParam(params.slug);
  const { customUnits, loading: customUnitsLoading } = useWikiCustomUnits();
  const customUnit = useMemo(() => customUnits.find((entry) => entry.slug === slug), [customUnits, slug]);
  const baseUnit = getUnitBySlug(slug) || customUnit;
  const { override, error: wikiOverrideError } = useWikiUnitOverride(baseUnit?.slug);
  const unit = mergeWikiOverride(baseUnit, override);

  if (!unit && customUnitsLoading) {
    return (
      <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
        <div className="empty-state">Loading unit…</div>
      </PageShell>
    );
  }

  if (!unit) return <Navigate to={`/wiki/units/${encodeURIComponent(rarity)}`} replace />;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <p className="crumb">
        <Link to="/wiki/units">Units</Link> / <Link to={`/wiki/units/${encodeURIComponent(rarity)}`}>{rarity}</Link> / {unit.name}
      </p>
      <motion.div
        className="unit-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="unit-title-row">
          <UnitIcon
            slug={unit.slug}
            name={unit.name}
            glowColor={getRarityGlow(unit.rarity)}
            shiny={isShinyRarity(unit.rarity)}
            size={108}
            imageUrl={unit.imageUrl}
          />
          <div className="unit-title-copy">
            <h1>{unit.name}</h1>
            <motion.div className="unit-badges" variants={listVariants} initial="initial" animate="animate">
              <motion.span className="badge filled" variants={itemVariants}>{unit.rarity}</motion.span>
              {unit.customUnit && <motion.span className="badge filled" variants={itemVariants}>Custom</motion.span>}
              {unit.type && <motion.span className="badge" variants={itemVariants}>{unit.type}</motion.span>}
              {unit.category && <motion.span className="badge dim" variants={itemVariants}>{unit.category}</motion.span>}
              {unit.rawType && <motion.span className="badge dim" variants={itemVariants}>{unit.rawType}</motion.span>}
              {unit.unavailableData && <motion.span className="badge dim" variants={itemVariants}>No Upgrade Data</motion.span>}
            </motion.div>
            <div style={{ marginTop: 12 }}>
              <UnitTags unit={unit} />
            </div>
            {unit.liveWikiOverride && <p className="pending-flag" style={{ marginTop: 10 }}>Live WIKI override applied.</p>}
            {wikiOverrideError && <p className="pending-flag" style={{ marginTop: 10 }}>Live WIKI override could not load.</p>}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              to={`/values/units/${encodeURIComponent(unit.rarity)}/${unit.slug}`}
              className="badge filled"
              style={{ textDecoration: 'none', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              View Value Page →
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="unit-body">
        {unit.description && <p className="unit-desc">{unit.description}</p>}

        <section className="unit-section">
          <h2>Overview</h2>
          <div className="stat-grid">
            <Stat label="Placement Limit" value={unit.placementLimit} />
            <Stat label="Total Cost" value={unit.totalCost} />
            <Stat label="Type" value={unit.type} />
            <Stat label="Category" value={unit.category} />
          </div>
        </section>

        {unit.minMaxStats && Object.keys(unit.minMaxStats).length > 0 && (
          <section className="unit-section">
            <h2>Minimum → Maximum Stats</h2>
            <table className="kv-table">
              <tbody>
                {Object.entries(unit.minMaxStats).map(([k, v]) => (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {unit.obtain?.length > 0 && (
          <section className="unit-section">
            <h2>How to Obtain</h2>
            <ul className="obtain-list">
              {unit.obtain.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </section>
        )}

        {unit.unavailableData ? (
          <section className="unit-section">
            <div className="empty-state">⚠️ Upgrade/cost data for this unit is unavailable.</div>
          </section>
        ) : (
          unit.upgrades?.length > 0 && (
            <CollapsibleUpgrades upgrades={unit.upgrades} />
          )
        )}

        {unit.passive && <section className="unit-section"><h2>Passive</h2><p>{unit.passive}</p></section>}
        {unit.ability && <section className="unit-section"><h2>Ability</h2><p>{unit.ability}</p></section>}
        {unit.synergy && <section className="unit-section"><h2>Synergy</h2><p>{unit.synergy}</p></section>}
      </div>
    </PageShell>
  );
}

function UpgradeStatBlock({ name, stats, cooldown, range }) {
  const rows = [
    ...(cooldown ? [['Cooldown', cooldown]] : []),
    ...Object.entries(stats),
    ...(range ? [['Range', range]] : []),
  ];

  return (
    <div className="attack-block">
      <div className="attack-block-name">{name}</div>
      {rows.map(([k, v], index) => (
        <div key={`${k}-${index}`} className="attack-stat-line">
          <span className="attack-stat-key">{k}</span>
          <span className="attack-stat-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, suffix = '' }) {
  return (
    <div className="stat-box">
      <div className="stat-value">{value !== undefined && value !== null ? `${value}${suffix}` : '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
