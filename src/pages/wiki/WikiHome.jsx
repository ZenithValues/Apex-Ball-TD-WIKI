import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitExplorer from '../../components/UnitExplorer';
import { WIKI_NAV } from '../../config/navigation';
import './WikiHome.css';

export default function WikiHome() {
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <PageIntro
        eyebrow="Encyclopedia & Telemetry"
        title="WIKI"
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/wiki/units/search" className="hero-btn primary">
              Search Units →
            </Link>
            <Link to="/wiki/compare" className="hero-btn">
              Compare Units
            </Link>
            <Link to="/wiki/leaderboards" className="hero-btn">
              Leaderboards
            </Link>
          </div>
        }
      >
        <p>
          Units database for Ball Tower Defense. Full stat sheets include cooldowns, range,
          damage, placement counts, passives, abilities, synergies, upgrade costs/DPS/cost-per-DPS,
          obtain methods, unit type, and category tagging.
        </p>
      </PageIntro>

      <UnitExplorer mode="wiki" />
    </PageShell>
  );
}
