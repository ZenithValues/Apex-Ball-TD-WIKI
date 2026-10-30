import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ALL_UNITS } from '../data/units';
import { useData } from '../context/DataContext';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber } from '../utils/formatNumber';
import { evaluateTrade } from '../utils/calculator';
import UnitIcon from '../components/UnitIcon';
import ThemeCutout from '../components/ThemeCutout';
import HeroShowcase from '../components/HeroShowcase';
import ShaderBackdrop, { useSplineTilt } from '../components/ShaderBackdrop';
import AdSlot from '../components/AdSlot';
import './Home.css';

const BASE_UNIT_COUNT = ALL_UNITS.filter((u) => !isShinyRarity(u.rarity)).length;

export default function Home() {
  const { unitValues, wikiRows } = useData();
  const [sampleTradeIdx, setSampleTradeIdx] = useState(0);

  const valuesTiltRef = useSplineTilt(3);
  const wikiTiltRef = useSplineTilt(3);
  const calcTiltRef = useSplineTilt(3);

  const liveBaseCount = useMemo(
    () => unitValues?.filter((u) => u.kind !== 'item' && !u.shiny && !isShinyRarity(u.rarity)).length || 0,
    [unitValues]
  );
  const unitCount = liveBaseCount > 0 ? liveBaseCount : BASE_UNIT_COUNT;
  const variantCount = unitValues?.filter((u) => u.kind !== 'item').length || ALL_UNITS.length;

  const wikiImageMap = useMemo(() => {
    const map = {};
    (wikiRows || []).forEach((r) => {
      if (r?.slug && r.image_url) map[r.slug] = r.image_url;
    });
    return map;
  }, [wikiRows]);

  const featuredValueUnits = useMemo(() => {
    const priced = (unitValues || [])
      .filter((u) => u.hasValue && !u.shiny && !isShinyRarity(u.rarity) && u.tradeValue > 0)
      .sort((a, b) => (b.tradeValue || 0) - (a.tradeValue || 0));
    return priced.slice(0, 4);
  }, [unitValues]);

  const maxTierPrice = useMemo(
    () => Math.max(...featuredValueUnits.map((u) => u.tradeValue || 0), 1),
    [featuredValueUnits]
  );

  // Scenarios use current values and the same verdict function as the real
  // calculator. Never invent prices or label a changing trade as a fixed win.
  const sampleTrades = useMemo(() => {
    const priced = (unitValues || [])
      .filter((u) => u.kind !== 'item' && u.hasValue && !u.shiny && !isShinyRarity(u.rarity) && Number.isFinite(u.tradeValue) && u.tradeValue > 0)
      .sort((a, b) => b.tradeValue - a.tradeValue);
    if (!priced.length) return [];
    const high = priced[0];
    const low = priced.find((u) => u.tradeValue < high.tradeValue * 0.95) || high;
    const makeScenario = (label, yours, theirs) => {
      const result = evaluateTrade([{ tradeValue: yours.tradeValue }], [{ tradeValue: theirs.tradeValue }]);
      const verdict = result.outcome.toUpperCase();
      const sign = result.diff > 0 ? '+' : '';
      return {
        label, verdict,
        needlePct: verdict === 'WIN' ? 82 : verdict === 'LOSS' ? 18 : 50,
        yourItem: yours.name, yourVal: yours.tradeValue,
        theirItem: theirs.name, theirVal: theirs.tradeValue,
        diffText: `${result.verdict} · ${sign}${formatCompactNumber(result.diff)} value`,
      };
    };
    return [makeScenario('Example 1', high, high), makeScenario('Example 2', low, high), makeScenario('Example 3', high, low)];
  }, [unitValues]);

  const activeSampleTrade = sampleTrades[sampleTradeIdx] || sampleTrades[0];

  return (
    <div className="home-layout-wrapper">
      <div className="home-side-ad left">
        <AdSlot slotId="2911497117" />
      </div>

      <main className="home">
        <HeroShowcase unitCount={unitCount} variantCount={variantCount} />

        {/* ============================================================
            SECTION 2: VALUES (Interactive Rarity Switcher + Market Bars)
            ============================================================ */}
        <section
          ref={valuesTiltRef}
          className="home-showcase-section section-values spline-tilt-stage"
          aria-label="Values Section"
        >
          <ShaderBackdrop variant="default" />

          <div className="showcase-split-grid">
            <div className="showcase-copy-col">
              <h2 className="showcase-kinetic-title">Values</h2>
              <p className="showcase-lead">
                Explore live estimates for {unitCount} units. Compare values, demand, and scarcity before your next trade.
              </p>

              <div className="showcase-cta-row">
                <Link to="/values" className="hero-btn primary">
                  Open Values <span aria-hidden="true">→</span>
                </Link>
                <Link to="/values/units/search" className="hero-btn secondary">
                  Search Unit Values
                </Link>
              </div>
            </div>

            <div className="showcase-sculpture-col spline-depth-layer">
              <div className="sculpture-pulse-halo" aria-hidden="true" />
              <ThemeCutout
                variant="poseidon"
                floating
                className="showcase-breakout-cutout"
              />
            </div>

            <div className="showcase-preview-col">
              <div className="showcase-preview-head">
                <span>Highest-valued units</span>
                <Link to="/values/units/search">View all →</Link>
              </div>

              <div className="showcase-unit-feed">
                {featuredValueUnits.map((u) => {
                  const glow = getRarityGlow(u.rarity);
                  const barPct = Math.max(12, Math.round(((u.tradeValue || 0) / maxTierPrice) * 100));
                  return (
                    <Link
                      key={u.slug}
                      to={`/values/units/${encodeURIComponent(u.rarity)}/${u.slug}`}
                      className="showcase-unit-row"
                    >
                      <UnitIcon
                        slug={u.slug}
                        name={u.name}
                        glowColor={glow}
                        shiny={isShinyRarity(u.rarity)}
                        size={42}
                        imageUrl={wikiImageMap[u.slug] || u.imageUrl}
                      />
                      <div className="showcase-unit-meta">
                        <div className="showcase-unit-top">
                          <strong>{u.name}</strong>
                          <span className="showcase-unit-price">
                            💎 {formatCompactNumber(u.tradeValue)}
                          </span>
                        </div>
                        <div className="showcase-value-bar-track">
                          <span
                            className="showcase-value-bar-fill"
                            style={{ width: `${barPct}%`, background: glow }}
                          />
                        </div>
                        <span style={{ color: glow }}>{u.rarity} · Demand: {u.demand || 'Stable'}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="showcase-glass-dock">
            <div className="glass-dock-pills">
              <Link to="/values/calculator" className="glass-dock-pill">Trade Calculator</Link>
              <Link to="/wiki/compare" className="glass-dock-pill">Compare Units</Link>
              <Link to="/values/units/search" className="glass-dock-pill">Search All</Link>
            </div>
            <Link to="/values" className="glass-dock-cta">
              Explore Values →
            </Link>
          </div>
        </section>

        {/* ============================================================
            SECTION 3: WIKI (Tactical Blueprint Grid + Overlord Stage)
            ============================================================ */}
        <section
          ref={wikiTiltRef}
          className="home-showcase-section section-wiki spline-tilt-stage"
          aria-label="WIKI Section"
        >
          <ShaderBackdrop variant="alt" />
          <div className="wiki-blueprint-grid-bg" aria-hidden="true" />

          <div className="showcase-split-grid">
            <div className="showcase-copy-col">
              <h2 className="showcase-kinetic-title">WIKI</h2>
              <p className="showcase-lead">
                Get to know {unitCount} units with stat sheets, obtain methods, and level-by-level upgrades.
              </p>

              <div className="showcase-cta-row">
                <Link to="/wiki" className="hero-btn primary">
                  Open WIKI <span aria-hidden="true">→</span>
                </Link>
                <Link to="/wiki/compare" className="hero-btn secondary">
                  Compare Units
                </Link>
              </div>
            </div>

            <div className="showcase-sculpture-col spline-depth-layer">
              <div className="sculpture-radar-ring" aria-hidden="true" />
              <ThemeCutout
                variant="overlord"
                floating
                className="showcase-breakout-cutout"
              />
            </div>

            <div className="showcase-preview-col">
              <div className="showcase-preview-head">
                <span>WIKI Pages</span>
                <Link to="/wiki/units/search">Search WIKI →</Link>
              </div>
              <div className="showcase-module-grid">
                <Link to="/wiki/compare" className="showcase-module-card">
                  <span className="showcase-module-icon">⚖️</span>
                  <div>
                    <strong>Compare Units</strong>
                    <p>Compare two units side-by-side</p>
                  </div>
                </Link>
                <Link to="/wiki/units/search" className="showcase-module-card">
                  <span className="showcase-module-icon">⌕</span>
                  <div><strong>Unit search</strong><p>Find units and stat sheets</p></div>
                </Link>
                <Link to="/wiki/units/Omegas" className="showcase-module-card">
                  <span className="showcase-module-icon">◇</span>
                  <div><strong>Omega units</strong><p>Explore endgame units</p></div>
                </Link>
                <Link to="/wiki/units/Shiny%20Omegas" className="showcase-module-card">
                  <span className="showcase-module-icon">✦</span>
                  <div><strong>Shiny index</strong><p>Explore shiny variants</p></div>
                </Link>
              </div>
            </div>
          </div>

          <div className="showcase-glass-dock">
            <div className="glass-dock-pills">
              <Link to="/wiki/units/Omegas" className="glass-dock-pill">All Units ({unitCount})</Link>
              <Link to="/wiki/compare" className="glass-dock-pill">Compare Units</Link>
              <Link to="/wiki/units/search" className="glass-dock-pill">Search units</Link>
            </div>
            <Link to="/wiki" className="glass-dock-cta">
              Explore WIKI →
            </Link>
          </div>
        </section>

        {/* ============================================================
            SECTION 4: TRADE CALCULATOR (Interactive W/F/L Motion Gauge)
            ============================================================ */}
        <section
          ref={calcTiltRef}
          className="home-showcase-section section-calc spline-tilt-stage"
          aria-label="Trade Calculator Section"
        >
          <ShaderBackdrop variant="default" />

          <div className="showcase-split-grid">
            <div className="showcase-copy-col">
              <h2 className="showcase-kinetic-title">Trade Calculator</h2>
              <p className="showcase-lead">
                Values collected from our Database, sourced from real trades &amp; market.
              </p>

              <div className="showcase-cta-row">
                <Link to="/values/calculator" className="hero-btn primary">
                  Open Calculator <span aria-hidden="true">→</span>
                </Link>
                <Link to="/values/units/Shiny%20Omegas" className="hero-btn secondary">
                  Shiny Values
                </Link>
              </div>
            </div>

            <div className="showcase-sculpture-col spline-depth-layer">
              <div className="sculpture-pulse-halo" aria-hidden="true" />
              <ThemeCutout
                variant="king"
                floating
                className="showcase-breakout-cutout"
              />
            </div>

            <div className="showcase-preview-col">
              <div className="showcase-preview-head">
                <div className="showcase-tier-tabs" role="tablist" aria-label="Sample Trade Scenarios">
                  {sampleTrades.map((st, idx) => (
                    <button
                      key={st.label}
                      type="button"
                      role="tab"
                      aria-selected={sampleTradeIdx === idx}
                      className={`showcase-tier-tab ${sampleTradeIdx === idx ? 'active' : ''}`}
                      onClick={() => setSampleTradeIdx(idx)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                <Link to="/values/calculator">Open →</Link>
              </div>

              {activeSampleTrade ? <div className="showcase-wfl-demo">
                <div className="wfl-demo-sides">
                  <div className="wfl-demo-box">
                    <span className="wfl-demo-label">YOUR SIDE</span>
                    <strong>{activeSampleTrade.yourItem}</strong>
                    <small>{formatCompactNumber(activeSampleTrade.yourVal)} value</small>
                  </div>
                  <div className="wfl-demo-vs">⇄</div>
                  <div className="wfl-demo-box">
                    <span className="wfl-demo-label">THEIR SIDE</span>
                    <strong>{activeSampleTrade.theirItem}</strong>
                    <small>{formatCompactNumber(activeSampleTrade.theirVal)} value</small>
                  </div>
                </div>

                {/* Animated Motion Graphic Equilibrium Gauge */}
                <div className="wfl-motion-gauge">
                  <div className="wfl-gauge-labels">
                    <span className={activeSampleTrade.verdict === 'LOSS' ? 'active loss' : ''}>LOSS</span>
                    <span className={activeSampleTrade.verdict === 'FAIR' ? 'active fair' : ''}>FAIR</span>
                    <span className={activeSampleTrade.verdict === 'WIN' ? 'active win' : ''}>WIN</span>
                  </div>
                  <div className="wfl-gauge-track">
                    <span
                      className="wfl-gauge-marker"
                      style={{ left: `${activeSampleTrade.needlePct}%` }}
                    />
                  </div>
                  <div className="wfl-gauge-note">{activeSampleTrade.diffText}</div>
                </div>

                <Link to="/values/calculator" className="wfl-demo-cta">
                  Open Trade Calculator →
                </Link>
              </div> : <p>Sample values are unavailable. Open the calculator to explore.</p>}
            </div>
          </div>

          <div className="showcase-glass-dock">
            <div className="glass-dock-pills">
              <Link to="/values/calculator" className="glass-dock-pill">Trade Calculator</Link>
              <Link to="/values/units/Shiny%20Omegas" className="glass-dock-pill">Shiny Values</Link>
              <Link to="/values/units/search" className="glass-dock-pill">Quick Value Lookup</Link>
              <Link to="/minigames" className="glass-dock-pill">Minigames</Link>
            </div>
            <Link to="/values/calculator" className="glass-dock-cta">
              Calculator →
            </Link>
          </div>
        </section>

        {/* ============================================================
            SECTION 5: MINIGAMES, CREDITS & COMMUNITY LINKS
            ============================================================ */}
        <div className="bento-grid">
          <div>
            <Link to="/minigames" className="bento-card bento-small">
              <ThemeCutout variant="laserminigunner" className="bento-cutout-mini" />
              <div className="bento-small-text">
                <h3>Minigames</h3>
                <p>Play games, earn achievements</p>
                <span className="bento-small-meta">Ball Knowledge, Ballonomics &amp; Balling</span>
              </div>
              <span className="bento-arrow">→</span>
            </Link>
          </div>

          <div>
            <Link to="/credits" className="bento-card bento-small">
              <ThemeCutout variant="elfcommander" className="bento-cutout-mini" />
              <div className="bento-small-text">
                <h3>Credits</h3>
                <p>Owner, tester lead, and testers</p>
                <span className="bento-small-meta">The people behind Apex WIKI &amp; Values</span>
              </div>
              <span className="bento-arrow">→</span>
            </Link>
          </div>

          <div>
            <a
              href="https://www.roblox.com/games/18343561950/Ball-Tower-Defense"
              target="_blank"
              rel="noopener noreferrer"
              className="bento-card bento-small"
            >
              <ThemeCutout variant="partyman" className="bento-cutout-mini" />
              <div className="bento-small-text">
                <h3>Play Ball TD</h3>
                <p>Official Roblox experience</p>
                <span className="bento-small-meta">Open Ball Tower Defense on Roblox</span>
              </div>
              <span className="bento-arrow">↗</span>
            </a>
          </div>

          <div>
            <a
              href="https://discord.gg/kWhpVncQwr"
              target="_blank"
              rel="noopener noreferrer"
              className="bento-card bento-small"
            >
              <ThemeCutout variant="hacker" className="bento-cutout-mini" />
              <div className="bento-small-text">
                <h3>Join Official Ball TD Discord</h3>
                <p>Community server</p>
                <span className="bento-small-meta">Join the Ball Tower Defense Discord community</span>
              </div>
              <span className="bento-arrow">↗</span>
            </a>
          </div>

          <div>
            <a
              href="https://www.roblox.com/communities/32380537/Cash-Grab-Studios#!/about"
              target="_blank"
              rel="noopener noreferrer"
              className="bento-card bento-small"
            >
              <ThemeCutout variant="drone" className="bento-cutout-mini" />
              <div className="bento-small-text">
                <h3>Cash Grab Studios</h3>
                <p>Official Roblox community</p>
                <span className="bento-small-meta">Open the Cash Grab Studios group</span>
              </div>
              <span className="bento-arrow">↗</span>
            </a>
          </div>

          <div>
            <a
              href="https://www.youtube.com/@CashGrabStudios"
              target="_blank"
              rel="noopener noreferrer"
              className="bento-card bento-small"
            >
              <ThemeCutout variant="forest" className="bento-cutout-mini" />
              <div className="bento-small-text">
                <h3>YouTube</h3>
                <p>Cash Grab Studios channel</p>
                <span className="bento-small-meta">Official developer trailers &amp; showcases</span>
              </div>
              <span className="bento-arrow">↗</span>
            </a>
          </div>
        </div>
      </main>

      <div className="home-side-ad right">
        <AdSlot slotId="2911497117" />
      </div>
    </div>
  );
}
