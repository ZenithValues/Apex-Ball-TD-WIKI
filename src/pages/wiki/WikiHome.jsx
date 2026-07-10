import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../data/navTree';
import { ALL_UNITS } from '../../data/units';
import { ALL_ITEMS } from '../../data/items';
import { ALL_MAPS } from '../../data/maps';
import { ALL_TRAITS } from '../../data/traits';
import { ALL_SKINS, ALL_SHINY_SKINS } from '../../data/skins';
import './WikiHome.css';

export default function WikiHome() {
  const stats = [
    {
      label: 'Units Documented',
      value: `${ALL_UNITS.filter((u) => u.documented).length} / ${ALL_UNITS.length}`,
      note: '151 total · 4 unobtainable units cannot be fully documented',
    },
    { label: 'Items', value: ALL_ITEMS.length },
    { label: 'Maps', value: ALL_MAPS.length },
    { label: 'Traits', value: ALL_TRAITS.length },
    { label: 'Skins', value: ALL_SKINS.length },
    { label: 'Shiny Skins', value: ALL_SHINY_SKINS.length },
  ];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>WIKI</h1>
      <p className="wiki-intro">
        Complete units database, item catalog, maps, traits, and skins for Ball Tower Defense.
        Full stat sheets include cooldowns, range, damage, placement counts, passives, abilities,
        synergies, upgrade costs/DPS/cost-per-DPS, obtain methods, unit type, and category tagging.
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
