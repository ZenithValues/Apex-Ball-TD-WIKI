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
import { itemIconFor } from '../../config/itemIcons';
import { WIKI_ITEM_SECTIONS } from '../../config/wikiSections';
// Decorative site icons only; unit records keep their existing artwork.
import { WIKI_PORTAL_ART, sectionArtFor } from '../../config/sectionArt';
import './WikiHome.css';

const WIKI_PORTALS = [
  { to: '/wiki/compare', icon: WIKI_PORTAL_ART.compare, label: 'Compare Units', sub: 'Side-by-side level stats & cost' },
  { to: '/wiki/units/search', icon: WIKI_PORTAL_ART.search, label: 'Unit Search', sub: 'Filter by role, passives & DPS' },
  { to: '/wiki/units/Omegas', icon: WIKI_PORTAL_ART.omega, label: 'Omega Stat Sheets', sub: 'Endgame upgrade paths & scaling' },
  { to: '/wiki/units/Shiny%20Omegas', icon: WIKI_PORTAL_ART.shiny, label: 'Shiny Index', sub: 'Shiny variants & stat multipliers' },
];

const WIKI_SECTION_LINKS = [
  ...WIKI_ITEM_SECTIONS.map((section) => ({ to: `/wiki/${section.path}`, label: section.label, sub: 'Browse WIKI entries', art: sectionArtFor(section.path) })),
  { to: '/wiki/skins/Normie', label: 'Skins', sub: 'Unit skin catalogue', art: sectionArtFor('skins') },
  { to: '/wiki/maps', label: 'Maps', sub: 'Game maps and unlocks', art: sectionArtFor('maps') },
  { to: '/wiki/traits', label: 'Reforges', sub: 'Unit reforges and effects', art: sectionArtFor('traits') },
  // Merged WIKI tools (operator 2026-11-19): compare/search/omega/shiny live
  // inside "<KineticText text="Browse WIKI sections" />" now, as slightly bigger tiles.
  ...WIKI_PORTALS.map((p) => ({ to: p.to, label: p.label, sub: p.sub, art: p.icon })),
];

import DepthScene from '../../components/DepthScene';
import KineticText from '../../components/KineticText';
import AdSlot from '../../components/AdSlot';

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

      <DepthScene className="wiki-home-depth" />

      <section className="wiki-restored-sections" aria-label="WIKI sections" style={{ margin: '28px 0 8px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}><KineticText text="Browse WIKI sections" /></h2>
        <div className="wiki-browse-grid">
          {WIKI_SECTION_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="wiki-portal-tile wiki-browse-tile">
              {link.art
                ? <ThemeCutout as="span" src={link.art} className="wiki-section-art" />
                : <span className="wiki-section-icon" aria-hidden="true">{itemIconFor(link.label)}</span>}
              <div className="wiki-portal-text">
                <strong>{link.label}</strong>
                <span>{link.sub}</span>
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
      <AdSlot placement="native" />
    </PageShell>
  );
}
