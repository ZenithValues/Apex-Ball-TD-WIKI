import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitExplorer from '../../components/UnitExplorer';
import { WIKI_NAV } from '../../config/navigation';
import { BASE_UNITS } from '../../data/units';
import { useData } from '../../context/DataContext';
import { motion } from 'framer-motion';
import AdSlot from '../../components/AdSlot';
import './WikiHome.css';

export default function WikiHome() {
  const { unitValues } = useData();
  const liveBase = unitValues?.filter((u) => u.kind !== 'item' && !u.shiny).length;
  const baseCount = liveBase > 0 ? liveBase : BASE_UNITS.filter((u) => !u.shiny).length;
  const stats = [
    {
      label: 'Units Documented',
      value: `${baseCount} / ${baseCount}`,
      note: 'Shiny variants are listed separately under their own index.',
    },
    {
      label: 'Combat Telemetry',
      value: 'Full Sheets',
      note: 'Damage, cooldowns, range, placement caps, passives & synergies.',
    },
    {
      label: 'Upgrade Economy',
      value: 'Level-by-Level',
      note: 'Complete upgrade costs, DPS progression, and cost-per-DPS.',
    },
  ];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <PageIntro
        eyebrow="Encyclopedia & Telemetry"
        title="WIKI"
        actions={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/wiki/units/search" className="hero-btn filled">
              Search Units →
            </Link>
            <Link to="/wiki/compare" className="hero-btn">
              Compare Units
            </Link>
            <Link to="/wiki/leaderboards" className="hero-btn">
              Leaderboards
            </Link>
          </div>
        )}
      >
        <p>
          Units database for Ball Tower Defense. Full stat sheets include cooldowns, range, damage,
          placement counts, passives, abilities, synergies, upgrade costs/DPS/cost-per-DPS, obtain
          methods, unit type, and category tagging.
        </p>
      </PageIntro>

      <div className="wiki-stats">
        {stats.map((s) => (
          <div key={s.label} className="wiki-stat card">
            <div className="wiki-stat-value tabular-nums">{s.value}</div>
            <div className="wiki-stat-label">{s.label}</div>
            {s.note && <div className="wiki-stat-note">{s.note}</div>}
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1], delay: 0.08 }}
        style={{ marginTop: 24 }}
      >
        <UnitExplorer section="wiki" />
      </motion.div>

      <AdSlot slotId="2911497117" />
    </PageShell>
  );
}
