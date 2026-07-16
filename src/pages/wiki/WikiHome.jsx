import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import RotatingShortcutButton from '../../components/RotatingShortcutButton';
import { WIKI_NAV } from '../../config/navigation';
import { BASE_UNITS } from '../../data/units';
import './WikiHome.css';

export default function WikiHome() {
  const documentedCount = BASE_UNITS.filter((u) => u.documented).length;
  const stats = [
    {
      label: 'Units Documented',
      value: `${documentedCount} / ${BASE_UNITS.length}`,
      note: 'Shiny variants are listed separately but do not increase the unit count.',
    },
  ];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <PageIntro eyebrow="APEX Database" title="WIKI" actions={<RotatingShortcutButton />}>
        <p>
          Units database for Ball Tower Defense. Full stat sheets include cooldowns, range, damage,
          placement counts, passives, abilities, synergies, upgrade costs/DPS/cost-per-DPS, obtain
          methods, unit type, and category tagging.
        </p>
      </PageIntro>

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
