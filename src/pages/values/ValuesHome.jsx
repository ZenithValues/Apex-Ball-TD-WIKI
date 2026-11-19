import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitExplorer from '../../components/UnitExplorer';
import UnitIcon from '../../components/UnitIcon';
import ThemeCutout, { getCutoutForRarity } from '../../components/ThemeCutout';
import { getRarityGlow } from '../../data/taxonomy';
import { VALUES_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { buildRarityBrowse } from '../../utils/rarityBrowse';
import { formatCompactNumber } from '../../utils/formatNumber';
import '../wiki/WikiHome.css';

import DepthScene from '../../components/DepthScene';

export default function ValuesHome() {
  const { unitValues, wikiRows } = useData();

  // Live counts (see rarityBrowse.js): adding, deleting or re-rarifying a
  // unit in /admin updates these numbers on the next data refresh.
  const rarityCards = useMemo(() => buildRarityBrowse(unitValues), [unitValues]);

  const wikiImageMap = useMemo(() => {
    const map = {};
    (wikiRows || []).forEach((r) => {
      if (r?.slug && r.image_url) map[r.slug] = r.image_url;
    });
    return map;
  }, [wikiRows]);


  // Top valued unit per rarity tier for the tier cards
  const topByRarity = useMemo(() => {
    const map = {};
    (unitValues || []).forEach((u) => {
      if (!u.hasValue || !u.tradeValue) return;
      if (!map[u.rarity] || u.tradeValue > map[u.rarity].tradeValue) {
        map[u.rarity] = u;
      }
    });
    return map;
  }, [unitValues]);

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <PageIntro
        title="Values"
        cutoutVariant="poseidon"
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/values/calculator" className="hero-btn primary">
              Open Trade Calculator →
            </Link>
            <Link to="/values/units/search" className="hero-btn secondary">
              Search Unit Values
            </Link>
            <Link to="/values/afford" className="hero-btn secondary">
              What can I afford?
            </Link>
          </div>
        }
      >
        <p>
          Explore community-maintained trade estimates, demand, and scarcity. The team’s entered base value is the trade value; demand and scarcity are informational and do not multiply it.
        </p>
      </PageIntro>
      <DepthScene className="values-home-depth" />


      <UnitExplorer mode="values" />

      <section className="hub-tier-section" aria-label="Unit Value Tiers">
        <div className="hub-tier-head">
          <h2>Browse Values by Rarity</h2>
        </div>

        <div className="hub-tier-grid">
          {rarityCards.map(({ rarity, count, shinyRarity, shinyCount }) => {
            const glow = getRarityGlow(rarity);
            const topUnit = topByRarity[rarity];
            return (
              <div
                key={rarity}
                className="hub-tier-card"
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
                  {topUnit && (
                    <p className="hub-tier-top-unit">
                      Top: <strong>{topUnit.name}</strong> · 💎 {formatCompactNumber(topUnit.tradeValue)}
                    </p>
                  )}
                </div>
                <div className="hub-tier-links">
                  <Link
                    to={`/values/units/${encodeURIComponent(rarity)}`}
                    className="hub-tier-btn primary"
                  >
                    Base ({count}) →
                  </Link>
                  {shinyCount > 0 && (
                    <Link
                      to={`/values/units/${encodeURIComponent(shinyRarity)}`}
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
