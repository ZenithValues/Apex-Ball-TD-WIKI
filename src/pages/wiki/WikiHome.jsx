import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitExplorer from '../../components/UnitExplorer';
import ThemeCutout, { getCutoutForRarity } from '../../components/ThemeCutout';
import { getRarityGlow } from '../../data/taxonomy';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { buildRarityBrowse } from '../../utils/rarityBrowse';
import { WIKI_ITEM_SECTIONS } from '../../config/wikiSections';
// Decorative site icons only; unit records keep their existing artwork.
import compareIcon from '../../assets/units/provided/golemball.png';
import searchIcon from '../../assets/units/provided/mummyball.png';
import omegaIcon from '../../assets/units/provided/omegaknight-omk.png';
import shinyIcon from '../../assets/units/provided/wukongball.png';
import './WikiHome.css';

const WIKI_SECTION_LINKS = [
  ...WIKI_ITEM_SECTIONS.map((section) => ({ to: `/wiki/${section.path}`, label: section.label, sub: 'Browse WIKI entries' })),
  { to: '/wiki/skins/Normie', label: 'Skins', sub: 'Unit skin catalogue' },
  { to: '/wiki/shiny-skins/Normie', label: 'Shiny Skins', sub: 'Shiny skin variants' },
  { to: '/wiki/maps', label: 'Maps', sub: 'Game maps and unlocks' },
  { to: '/wiki/traits', label: 'Traits', sub: 'Unit traits and effects' },
  { to: '/wiki/reforges', label: 'Reforges', sub: 'Reforge effects' },
];

const WIKI_PORTALS = [
  { to: '/wiki/compare', icon: compareIcon, label: 'Compare Units', sub: 'Side-by-side level stats & cost' },
  { to: '/wiki/units/search', icon: searchIcon, label: 'Unit Search', sub: 'Filter by role, passives & DPS' },
  { to: '/wiki/units/Omegas', icon: omegaIcon, label: 'Omega Stat Sheets', sub: 'Endgame upgrade paths & scaling' },
  { to: '/wiki/units/Shiny%20Omegas', icon: shinyIcon, label: 'Shiny Index', sub: 'Shiny variants & stat multipliers' },
];
export default function WikiHome() {
  // Counts come from the LIVE roster, so editor-added / deleted units and
  // rarity edits are reflected immediately on the Browse by Rarity cards.
  const { unitValues } = useData();
  const rarityCards = useMemo(() => buildRarityBrowse(unitValues), [unitValues]);
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
            <span className="wiki-portal-icon" aria-hidden="true"><ThemeCutout as="span" src={p.icon} className="wiki-portal-art" /></span>
            <div className="wiki-portal-text">
              <strong>{p.label}</strong>
              <span>{p.sub}</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="wiki-restored-sections" aria-label="WIKI sections" style={{ margin: '28px 0 8px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>Browse WIKI sections</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {WIKI_SECTION_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="wiki-portal-tile" style={{ padding: '10px 12px', minHeight: 0 }}>
              <div className="wiki-portal-text">
                <strong style={{ fontSize: '0.82rem' }}>{link.label}</strong>
                <span style={{ fontSize: '0.68rem' }}>{link.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <UnitExplorer mode="wiki" />

      <section className="hub-tier-section" aria-label="WIKI Unit Rarity Tiers">
        <div className="hub-tier-head">
          <h2>Browse WIKI by Rarity</h2>
        </div>

        <div className="hub-tier-grid">
          {rarityCards.map(({ rarity, count, shinyRarity, shinyCount }) => {
            const glow = getRarityGlow(rarity);
            return (
              <div
                key={rarity}
                className="hub-tier-card wiki-blueprint-card"
                style={{ '--tier-glow': glow }}
              >
                <ThemeCutout
                  variant={getCutoutForRarity(rarity)}
                  className="hub-tier-cutout"
                  tintColor={glow}
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
