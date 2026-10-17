import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ALL_UNITS } from '../data/units';
import { useData } from '../context/DataContext';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber } from '../utils/formatNumber';
import UnitIcon from '../components/UnitIcon';
import ThemeCutout from '../components/ThemeCutout';
import Holo3DScene from '../components/Holo3DScene';
import ShaderBackdrop, { useSplineTilt } from '../components/ShaderBackdrop';
import AdSlot from '../components/AdSlot';
import './Home.css';

const BASE_UNIT_COUNT = ALL_UNITS.filter((u) => !isShinyRarity(u.rarity)).length;

const SHOWCASE_SLIDES = [
  { id: 'overlord', cutout: 'overlord', ctaLabel: 'Explore Values', ctaTo: '/values' },
  { id: 'poseidon', cutout: 'poseidon', ctaLabel: 'Browse WIKI', ctaTo: '/wiki' },
  { id: 'king', cutout: 'king', ctaLabel: 'Trade Calculator', ctaTo: '/values/calculator' },
  { id: 'laserminigunner', cutout: 'laserminigunner', ctaLabel: 'Leaderboards', ctaTo: '/wiki/leaderboards' },
  { id: 'hacker', cutout: 'hacker', ctaLabel: 'Compare Units', ctaTo: '/wiki/compare' },
  { id: 'drone', cutout: 'drone', ctaLabel: 'Play Arcade', ctaTo: '/minigames' },
  { id: 'forest', cutout: 'forest', ctaLabel: 'Theme Studio', ctaTo: '/themes' },
  { id: 'elfcommander', cutout: 'elfcommander', ctaLabel: 'Unit Search', ctaTo: '/values/units/search' },
  { id: 'partyman', cutout: 'partyman', ctaLabel: 'Achievements', ctaTo: '/achievements' },
];

const MARKET_PREVIEW_TIERS = ['Omegas', 'Transcendents', 'Mythics', 'Legendaries'];

export default function Home() {
  const { unitValues, wikiRows } = useData();
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [marketTier, setMarketTier] = useState('Omegas');
  const [sampleTradeIdx, setSampleTradeIdx] = useState(0);

  const heroTiltRef = useSplineTilt(4);
  const valuesTiltRef = useSplineTilt(3);
  const wikiTiltRef = useSplineTilt(3);
  const calcTiltRef = useSplineTilt(3);

  const liveBaseCount = useMemo(
    () => unitValues?.filter((u) => u.kind !== 'item' && !u.shiny && !isShinyRarity(u.rarity)).length || 0,
    [unitValues]
  );
  const unitCount = liveBaseCount > 0 ? liveBaseCount : BASE_UNIT_COUNT;

  const wikiImageMap = useMemo(() => {
    const map = {};
    (wikiRows || []).forEach((r) => {
      if (r?.slug && r.image_url) map[r.slug] = r.image_url;
    });
    return map;
  }, [wikiRows]);

  const featuredValueUnits = useMemo(() => {
    const priced = (unitValues || [])
      .filter((u) => u.hasValue && u.rarity === marketTier && u.tradeValue > 0)
      .sort((a, b) => (b.tradeValue || 0) - (a.tradeValue || 0));
    return priced.slice(0, 4);
  }, [unitValues, marketTier]);

  const maxTierPrice = useMemo(
    () => Math.max(...featuredValueUnits.map((u) => u.tradeValue || 0), 1),
    [featuredValueUnits]
  );

  // Build 3 live sample trade scenarios from real unitValues for the interactive W/F/L motion widget
  const sampleTrades = useMemo(() => {
    const omegas = (unitValues || [])
      .filter((u) => u.hasValue && u.rarity === 'Omegas' && u.tradeValue > 0)
      .sort((a, b) => (b.tradeValue || 0) - (a.tradeValue || 0));
    const trans = (unitValues || [])
      .filter((u) => u.hasValue && u.rarity === 'Transcendents' && u.tradeValue > 0)
      .sort((a, b) => (b.tradeValue || 0) - (a.tradeValue || 0));

    const u1 = omegas[0] || { name: 'CorruptMalware', tradeValue: 20000000, rarity: 'Omegas' };
    const u2 = omegas[1] || { name: 'TempleBall', tradeValue: 19700000, rarity: 'Omegas' };
    const u3 = omegas[2] || { name: 'NightmareBall', tradeValue: 14000000, rarity: 'Omegas' };
    const u4 = trans[0] || { name: 'Poseidon', tradeValue: 8000000, rarity: 'Transcendents' };

    return [
      {
        label: 'Fair Trade',
        verdict: 'FAIR',
        needlePct: 50,
        yourItem: u2.name,
        yourVal: u2.tradeValue,
        theirItem: u1.name,
        theirVal: u1.tradeValue,
        diffText: 'Within 2% market value',
      },
      {
        label: 'Big Win',
        verdict: 'WIN',
        needlePct: 82,
        yourItem: u3.name,
        yourVal: u3.tradeValue,
        theirItem: u1.name,
        theirVal: u1.tradeValue,
        diffText: `+${formatCompactNumber(Math.max(0, u1.tradeValue - u3.tradeValue))} value gain`,
      },
      {
        label: 'Loss Check',
        verdict: 'LOSS',
        needlePct: 18,
        yourItem: u3.name,
        yourVal: u3.tradeValue,
        theirItem: u4.name,
        theirVal: u4.tradeValue,
        diffText: `-${formatCompactNumber(Math.max(0, u3.tradeValue - u4.tradeValue))} overpay`,
      },
    ];
  }, [unitValues]);

  const activeSampleTrade = sampleTrades[sampleTradeIdx] || sampleTrades[0];

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [paused]);

  const activeSlide = SHOWCASE_SLIDES[slideIndex];
  const prevSlide = SHOWCASE_SLIDES[(slideIndex - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length];
  const nextSlide = SHOWCASE_SLIDES[(slideIndex + 1) % SHOWCASE_SLIDES.length];

  return (
    <div className="home-layout-wrapper">
      <div className="home-side-ad left">
        <AdSlot slotId="2911497117" />
      </div>

      <main className="home">
        {/* ============================================================
            SECTION 1: HERO SHOWCASE STAGE (Orbital Motion Graphics)
            ============================================================ */}
        <section
          ref={heroTiltRef}
          className="home-hero-stage spline-tilt-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-label="Featured Apex Showcase"
        >
          <ShaderBackdrop variant="default" />

          <div className="hero-ribbon-bg" aria-hidden="true">
            <div className="hero-ribbon-wave wave-1" />
            <div className="hero-ribbon-wave wave-2" />
            <svg className="hero-trajectory-svg" viewBox="0 0 1200 600" preserveAspectRatio="none">
              <line
                x1="140"
                y1="580"
                x2="1080"
                y2="30"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1.5"
                strokeDasharray="6 8"
              />
              <circle
                cx="860"
                cy="290"
                r="195"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray="4 10"
                className="hero-orbit-ring ring-outer"
              />
              <circle
                cx="860"
                cy="290"
                r="138"
                fill="none"
                stroke="rgba(255,255,255,0.09)"
                strokeWidth="1"
                className="hero-orbit-ring ring-inner"
              />
            </svg>
          </div>

          <div className="hero-stage-grid">
            <div className="hero-editorial-left">
              <h1 className="hero-title">
                THE <span className="hero-highlight">DEFINITIVE</span> WIKI &amp; VALUES WEBSITE FOR BALL TOWER DEFENSE
              </h1>
              <p className="hero-subtitle">
                {unitCount} Units, All Values &amp; Trade Calculator, Ball Knowledge, Stat sheets, Rankings and MUCH more!
              </p>
              <div className="hero-actions">
                <Link to="/values" className="hero-btn primary">
                  Explore Values <span aria-hidden="true">→</span>
                </Link>
                <Link to="/wiki" className="hero-btn secondary">
                  Browse WIKI
                </Link>
                <Link to="/values/calculator" className="hero-btn secondary">
                  Trade Calculator
                </Link>
              </div>
            </div>

            <div className="hero-editorial-right spline-depth-layer">
              <Holo3DScene variant="icosa" className="hero-3d-mesh" />
              <button
                type="button"
                className="hero-side-preview prev"
                onClick={() => setSlideIndex((slideIndex - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length)}
                aria-label="Previous showcase unit"
              >
                <ThemeCutout variant={prevSlide.cutout} className="hero-side-cutout" />
                <span className="hero-side-dot" />
                <span className="hero-side-stem" />
              </button>

              <div key={activeSlide.id} className="hero-centerpiece">
                <div className="hero-sculpture-wrap">
                  <ThemeCutout
                    variant={activeSlide.cutout}
                    floating
                    className="hero-main-cutout"
                  />
                </div>
              </div>

              <button
                type="button"
                className="hero-side-preview next"
                onClick={() => setSlideIndex((slideIndex + 1) % SHOWCASE_SLIDES.length)}
                aria-label="Next showcase unit"
              >
                <ThemeCutout variant={nextSlide.cutout} className="hero-side-cutout" />
                <span className="hero-side-dot" />
                <span className="hero-side-stem" />
              </button>
            </div>
          </div>

          <div className="hero-stage-footer">
            <div className="hero-slide-dots" role="tablist" aria-label="Showcase slides">
              {SHOWCASE_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === slideIndex}
                  aria-label={`Slide ${idx + 1}`}
                  className={`hero-dot ${idx === slideIndex ? 'active' : ''}`}
                  onClick={() => setSlideIndex(idx)}
                />
              ))}
            </div>

            <div className="hero-stage-controls">
              <button
                type="button"
                className="hero-nav-link"
                onClick={() => setSlideIndex((slideIndex - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length)}
              >
                Prev
              </button>
              <button
                type="button"
                className="hero-nav-link"
                onClick={() => setSlideIndex((slideIndex + 1) % SHOWCASE_SLIDES.length)}
              >
                Next
              </button>
              <Link to={activeSlide.ctaTo} className="hero-corner-cta">
                <span>{activeSlide.ctaLabel}</span>
                <span className="hero-corner-arrow" aria-hidden="true">›</span>
              </Link>
            </div>
          </div>
        </section>

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
                All {unitCount} Units, Consumables, Currencies, and Gamepasses. Values sourced from real trades &amp; market.
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
              <Holo3DScene variant="crystal" className="showcase-3d-mesh" />
              <div className="sculpture-pulse-halo" aria-hidden="true" />
              <ThemeCutout
                variant="poseidon"
                floating
                className="showcase-breakout-cutout"
              />
            </div>

            <div className="showcase-preview-col">
              <div className="showcase-preview-head">
                <div className="showcase-tier-tabs" role="tablist" aria-label="Preview Rarity Tier">
                  {MARKET_PREVIEW_TIERS.map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      role="tab"
                      aria-selected={marketTier === tier}
                      className={`showcase-tier-tab ${marketTier === tier ? 'active' : ''}`}
                      onClick={() => setMarketTier(tier)}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
                <Link to={`/values/units/${encodeURIComponent(marketTier)}`}>View All →</Link>
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
              <Link to="/values/units/Omegas" className="glass-dock-pill">Omegas</Link>
              <Link to="/values/units/Transcendents" className="glass-dock-pill">Transcendents</Link>
              <Link to="/values/units/Mythics" className="glass-dock-pill">Mythics</Link>
              <Link to="/values/units/Legendaries" className="glass-dock-pill">Legendaries</Link>
              <Link to="/values/crates" className="glass-dock-pill">Crates &amp; Passes</Link>
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
                All {unitCount} Units, Items, Maps, Traits, and Skins. Complete unit stat sheets, obtain methods, and level-by-level upgrades.
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
              <Holo3DScene variant="gyro" className="showcase-3d-mesh" />
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
                <Link to="/wiki/leaderboards" className="showcase-module-card">
                  <span className="showcase-module-icon">🏆</span>
                  <div>
                    <strong>Leaderboards</strong>
                    <p>Units ranked by DPS and cost efficiency</p>
                  </div>
                </Link>
                <Link to="/wiki/maps" className="showcase-module-card">
                  <span className="showcase-module-icon">🗺️</span>
                  <div>
                    <strong>Maps &amp; Crates</strong>
                    <p>Map rewards, crate drop rates, and items</p>
                  </div>
                </Link>
                <Link to="/wiki/traits" className="showcase-module-card">
                  <span className="showcase-module-icon">⚡</span>
                  <div>
                    <strong>Traits &amp; Skins</strong>
                    <p>Rollable traits, reforges, and unit skins</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="showcase-glass-dock">
            <div className="glass-dock-pills">
              <Link to="/wiki/units/Omegas" className="glass-dock-pill">All Units ({unitCount})</Link>
              <Link to="/wiki/compare" className="glass-dock-pill">Compare Units</Link>
              <Link to="/wiki/leaderboards" className="glass-dock-pill">Leaderboards</Link>
              <Link to="/wiki/maps" className="glass-dock-pill">Maps</Link>
              <Link to="/wiki/traits" className="glass-dock-pill">Traits</Link>
              <Link to="/wiki/skins" className="glass-dock-pill">Skins</Link>
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
              <Holo3DScene variant="icosa" className="showcase-3d-mesh" />
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

              <div className="showcase-wfl-demo">
                <div className="wfl-demo-sides">
                  <div className="wfl-demo-box">
                    <span className="wfl-demo-label">YOUR SIDE</span>
                    <strong>{activeSampleTrade.yourItem}</strong>
                    <small>💎 {formatCompactNumber(activeSampleTrade.yourVal)}</small>
                  </div>
                  <div className="wfl-demo-vs">⇄</div>
                  <div className="wfl-demo-box">
                    <span className="wfl-demo-label">THEIR SIDE</span>
                    <strong>{activeSampleTrade.theirItem}</strong>
                    <small>💎 {formatCompactNumber(activeSampleTrade.theirVal)}</small>
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
              </div>
            </div>
          </div>

          <div className="showcase-glass-dock">
            <div className="glass-dock-pills">
              <Link to="/values/calculator" className="glass-dock-pill">Trade Calculator</Link>
              <Link to="/values/units/Shiny%20Omegas" className="glass-dock-pill">Shiny Values</Link>
              <Link to="/values/units/search" className="glass-dock-pill">Quick Value Lookup</Link>
              <Link to="/construction" className="glass-dock-pill">3D Architecture Overview</Link>
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
