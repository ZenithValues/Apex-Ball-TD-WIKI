import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitExplorer from '../../components/UnitExplorer';
import ThemeCutout, { getCutoutForRarity } from '../../components/ThemeCutout';
import { getRarityGlow } from '../../data/taxonomy';
import { UNITS_BY_RARITY } from '../../data/units';
import { WIKI_NAV } from '../../config/navigation';
import './WikiHome.css';

const TIER_CARDS = [
  'Omegas',
  'Transcendents',
  'Mythics',
  'Legendaries',
  'Awesome',
  'Rares',
  'Odds',
  'Normie',
  '???',
];

const WIKI_PORTALS = [
  { to: '/wiki/compare', icon: 'compare', label: 'Compare Units', sub: 'Side-by-side level stats & cost' },
  { to: '/wiki/units/search', icon: 'search', label: 'Unit Search', sub: 'Filter by role, passives & DPS' },
  { to: '/wiki/units/Omegas', icon: 'crown', label: 'Omega Stat Sheets', sub: 'Endgame upgrade paths & scaling' },
  { to: '/wiki/units/Shiny%20Omegas', icon: 'star', label: 'Shiny Index', sub: 'Shiny variants & stat multipliers' },
];
const PORTAL_ICONS = {
  compare: <><path d="M12 3v17M4 8h16M7 8 3 15h8zM17 8l-4 7h8zM8 21h8" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
  crown: <path d="m3 7 4 3 5-6 5 6 4-3-2 11H5zM5 21h14" />,
  star: <path d="M12 3c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8zM19 3v4M17 5h4" />,
};

export default function WikiHome() {
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <PageIntro
        title="WIKI"
        cutoutVariant="overlord"
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/wiki/units/search" className="hero-btn primary">
              Search Units →
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

      {/* Distinct WIKI-Only World & Tool Portals Strip */}
      <section className="wiki-portals-strip" aria-label="WIKI Categories">
        {WIKI_PORTALS.map((p) => (
          <Link key={p.to} to={p.to} className="wiki-portal-tile">
            <span className="wiki-portal-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{PORTAL_ICONS[p.icon]}</svg></span>
            <div className="wiki-portal-text">
              <strong>{p.label}</strong>
              <span>{p.sub}</span>
            </div>
          </Link>
        ))}
      </section>

      <UnitExplorer mode="wiki" />

      <section className="hub-tier-section" aria-label="WIKI Unit Rarity Tiers">
        <div className="hub-tier-head">
          <h2>Browse WIKI by Rarity</h2>
        </div>

        <div className="hub-tier-grid">
          {TIER_CARDS.map((rarity) => {
            const glow = getRarityGlow(rarity);
            const count = (UNITS_BY_RARITY[rarity] || []).length;
            const shinyRarity = `Shiny ${rarity}`;
            const shinyCount = (UNITS_BY_RARITY[shinyRarity] || []).length;
            return (
              <div
                key={rarity}
                className="hub-tier-card wiki-blueprint-card"
                style={{ '--tier-glow': glow }}
              >
                <ThemeCutout
                  variant={getCutoutForRarity(rarity)}
                  tintColor={glow}
                  className="hub-tier-cutout"
                />
                <div className="hub-tier-body">
                  <div className="hub-tier-title-row">
                    <span className="hub-tier-dot" style={{ background: glow }} />
                    <h3>{rarity}</h3>
                    <span className="hub-tier-count">{count}</span>
                  </div>
                </div>
                <div className="hub-tier-links">
                  <Link
                    to={`/wiki/units/${encodeURIComponent(rarity)}`}
                    className="hub-tier-btn primary"
                  >
                    Base ({count}) →
                  </Link>
                  {shinyCount > 0 && (
                    <Link
                      to={`/wiki/units/${encodeURIComponent(shinyRarity)}`}
                      className="hub-tier-btn shiny"
                    >
                      ✨ Shiny ({shinyCount})
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
