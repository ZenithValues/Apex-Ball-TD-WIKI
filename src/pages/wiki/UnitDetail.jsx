import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../data/navTree';
import { getUnitBySlug } from '../../data/units';
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

export default function UnitDetail() {
  const { rarity, slug } = useParams();
  const unit = getUnitBySlug(slug);

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
        <h1>{unit.name}</h1>
        <motion.div className="unit-badges" variants={listVariants} initial="initial" animate="animate">
          <motion.span className="badge filled" variants={itemVariants}>{unit.rarity}</motion.span>
          {unit.type && <motion.span className="badge" variants={itemVariants}>{unit.type}</motion.span>}
          {unit.category && <motion.span className="badge dim" variants={itemVariants}>{unit.category}</motion.span>}
          {unit.rawType && <motion.span className="badge dim" variants={itemVariants}>{unit.rawType}</motion.span>}
          {unit.unavailableData && <motion.span className="badge dim" variants={itemVariants}>No Upgrade Data</motion.span>}
        </motion.div>
      </motion.div>

      <div className="unit-body">
        {unit.description && <p className="unit-desc">{unit.description}</p>}

        <section className="unit-section">
          <h2>Overview</h2>
          <div className="stat-grid">
            <Stat label="Placement Limit" value={unit.placementLimit} />
            <Stat label="Total Cost" value={unit.totalCost} />
            <Stat label="Value" value={unit.valueRaw} />
            <Stat label="Coins" value={unit.coinsRaw} />
            <Stat label="Gems" value={unit.gemsRaw} />
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
            <div className="empty-state">
              ⚠️ Upgrade/cost data for this unit was unavailable in the source stat sheet.
              Send it over and I&apos;ll add it in.
            </div>
          </section>
        ) : (
          unit.upgrades?.length > 0 && (
            <section className="unit-section">
              <h2>Upgrades &amp; Costs</h2>
              <motion.div
                className="upgrade-list"
                variants={listVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-40px' }}
              >
                {unit.upgrades.map((u) => (
                  <motion.div key={`${u.level}-${u.label}`} className="upgrade-card" variants={itemVariants}>
                    <div className="upgrade-card-head">
                      <span className="upgrade-label">{u.label}</span>
                      {u.costRaw && <span className="badge filled">{u.costRaw}</span>}
                    </div>

                    {u.description && <p className="upgrade-desc">{u.description}</p>}

                    {(hasEntries(u.dps) || u.costPerDps) && (
                      <div className="upgrade-stats-row upgrade-dps-row">
                        {hasEntries(u.dps) && Object.entries(u.dps).map(([k, v]) => (
                          <span key={k} className="mini-stat">{k}: {v}</span>
                        ))}
                        {u.costPerDps && <span className="mini-stat">Cost/DPS: {u.costPerDps}</span>}
                      </div>
                    )}

                    {hasEntries(u.stats) && (
                      <div className="attack-blocks">
                        <UpgradeStatBlock name="Stats" stats={u.stats} cooldown={u.cooldown} range={u.range} />
                      </div>
                    )}

                    {hasEntries(u.attacks) && (
                      <div className="attack-blocks">
                        {Object.entries(u.attacks).map(([atkName, atkStats]) => (
                          <UpgradeStatBlock
                            key={atkName}
                            name={atkName}
                            stats={atkStats}
                            cooldown={u.cooldown}
                            range={u.range}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )
        )}

        {unit.passive && (
          <section className="unit-section">
            <h2>Passive</h2>
            <p>{unit.passive}</p>
          </section>
        )}

        {unit.ability && (
          <section className="unit-section">
            <h2>Ability</h2>
            <p>{unit.ability}</p>
          </section>
        )}

        {unit.synergy && (
          <section className="unit-section">
            <h2>Synergy</h2>
            <p>{unit.synergy}</p>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function UpgradeStatBlock({ name, stats, cooldown, range }) {
  return (
    <div className="attack-block">
      <div className="attack-block-head">
        <div className="attack-block-name">{name}</div>
        {(cooldown || range) && (
          <div className="attack-block-meta">
            {cooldown && <span className="attack-meta-pill">Cooldown: {cooldown}</span>}
            {range && <span className="attack-meta-pill">Range: {range}</span>}
          </div>
        )}
      </div>
      {Object.entries(stats).map(([k, v]) => (
        <div key={k} className="attack-stat-line">
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
