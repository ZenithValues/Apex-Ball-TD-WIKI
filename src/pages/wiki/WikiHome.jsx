import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../data/navTree';
import { ALL_UNITS } from '../../data/units';
import './WikiHome.css';

export default function WikiHome() {
  const stats = [
    {
      label: 'Normie Units Documented',
      value: `${ALL_UNITS.filter((u) => u.documented).length} / ${ALL_UNITS.length}`,
      note: 'More rarities, items, maps, traits, and skins coming soon',
    },
  ];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>WIKI</h1>
      <p className="wiki-intro">
        Units database for Ball Tower Defense. Full stat sheets include cooldowns, range, damage,
        placement counts, passives, abilities, synergies, upgrade costs/DPS/cost-per-DPS, obtain
        methods, unit type, and category tagging.
      </p>
      <div className="wiki-stats">
        {stats.map((s) => (
          <div key={s.label} className="wiki-stat card">
            <div className="wiki-stat-value">{s.value}</div>
            <div className="wiki-stat-label">{s.label}</div>
            {s.note && <div className="wiki-stat-note">{s.note}</div>}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
