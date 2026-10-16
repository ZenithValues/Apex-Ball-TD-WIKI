import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ALL_UNITS } from '../data/units';
import { useData } from '../context/DataContext';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber } from '../utils/formatNumber';
import logoImg from '../assets/apex-values-wiki-logo.png';
import UnitIcon from '../components/UnitIcon';
import ThemeCutout from '../components/ThemeCutout';
import ShaderBackdrop, { KineticSeal, useSplineTilt } from '../components/ShaderBackdrop';
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

export default function Home() {
  const { unitValues, wikiRows } = useData();
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const heroTiltRef = useSplineTilt(4.5);
  const valuesTiltRef = useSplineTilt(3.5);
  const wikiTiltRef = useSplineTilt(3.5);
  const calcTiltRef = useSplineTilt(3.5);

  const liveBaseCount = useMemo(
    () => unitValues?.filter((u) => u.kind !== 'item' && !u.shiny && !isShinyRarity(u.rarity)).length || 0,
    [unitValues]
  );
  const unitCount = liveBaseCount > 0 ? liveBaseCount : BASE_UNIT_COUNT;

  const marqueeItems = useMemo(
    () => [
      'LIVE MARKET VALUES',
      `${unitCount} BASE UNITS`,
      'W / F / L TRADE CALCULATOR',
      'LEVEL-BY-LEVEL STAT SHEETS',
      '1.5× SHINY STAT & VALUE SYNC',
      'DAILY BALL KNOWLEDGE ARCADE',
      'COMPARE & LEADERBOARDS',
    ],
    [unitCount]
  );

  const wikiImageMap = useMemo(() => {
    const map = {};
    (wikiRows || []).forEach((r) => {
      if (r?.slug && r.image_url) map[r.slug] = r.image_url;
    });
    return map;
  }, [wikiRows]);

  // Top 4 priced flagship units (Omegas / Transcendents / Mythics) for the live Values showcase preview
  const featuredValueUnits = useMemo(() => {
    const flagshipRarities = new Set(['Omegas', 'Transcendents', 'Mythics']);
    const priced = (unitValues || [])
      .filter((u) => u.hasValue && flagshipRarities.has(u.rarity) && u.tradeValue > 0)
      .sort((a, b) => (b.tradeValue || 0) - (a.tradeValue || 0));
    return priced.slice(0, 4);
  }, [unitValues]);

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
      {/* Left Sidebar Ad (Production only via AdSlot guard) */}
      <div className="home-side-ad left">
        <AdSlot slotId="2911497117" />
      </div>

      <main className="home">
        {/* ============================================================
            SECTION 1: HERO EDITORIAL SHOWCASE STAGE
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
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                strokeDasharray="6 8"
              />
            </svg>
          </div>

          <div className="hero-stage-grid">
            {/* Left Kinetic Editorial Copy */}
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

            {/* Right 3D Spline-Style Cutout Stage */}
            <div className="hero-editorial-right spline-depth-layer">
              <KineticSeal
                text="APEX WIKI & VALUES · BALL TD · "
                centerLabel="APEX"
                className="hero-kinetic-seal"
              />

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

          {/* Bottom Stage Bar */}
          <div className="hero-stage-footer">
            <div className="hero-slide-counter">
              <span className="hero-counter-dash">—</span>
              <span className="hero-counter-active">{String(slideIndex + 1).padStart(2, '0')}</span>
              <span className="hero-counter-sep">/</span>
              <span className="hero-counter-total">{String(SHOWCASE_SLIDES.length).padStart(2, '0')}</span>
            </div>

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
            KINETIC TYPOGRAPHY TICKER MARQUEE
            ============================================================ */}
        <div className="home-kinetic-marquee" aria-hidden="true">
          <div className="home-kinetic-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="home-kinetic-item">
                {item} <b className="home-kinetic-star">✦</b>
              </span>
            ))}
          </div>
        </div>

        {/* ============================================================
            SECTION 2: EXPANDED VALUES SHOWCASE (Split Stage + Glass Dock)
            ============================================================ */}
        <section
          ref={valuesTiltRef}
          className="home-showcase-section spline-tilt-stage"
          aria-label="Values Live Market Section"
        >
          <ShaderBackdrop variant="default" />

          <div className="showcase-split-grid">
            {/* Left Editorial Column */}
            <div className="showcase-copy-col">
              <div className="showcase-brand-head">
                <div className="bento-icon-wrap">
                  <span className="logo-tint-wrap bento-logo-wrap">
                    <img src={logoImg} alt="" className="bento-logo" />
                  </span>
                </div>
              </div>

              <h2 className="showcase-kinetic-title">
                Values. <span className="showcase-italic-accent">Real trades, live market.</span>
              </h2>

              <p className="showcase-lead">
                {unitCount} Units, Consumables, Currencies, and Gamepasses with live demand &amp; scarcity ratings.
                Every valuation is calculated from verified community trades using{' '}
                <code>Base × Demand × Scarcity</code> with full 1.5× Shiny market tracking.
              </p>

              {/* Nyroca-Inspired 3-Column Telemetry Strip */}
              <div className="showcase-stat-trio">
                <div className="showcase-stat-item">
                  <strong>{unitCount}+</strong>
                  <span>Base Units</span>
                </div>
                <div className="showcase-stat-item">
                  <strong>9 Tiers</strong>
                  <span>Normie to Omega</span>
                </div>
                <div className="showcase-stat-item">
                  <strong>1.5×</strong>
                  <span>Shiny Scaling</span>
                </div>
              </div>

              <div className="showcase-cta-row">
                <Link to="/values" className="hero-btn primary">
                  Open Values <span aria-hidden="true">→</span>
                </Link>
                <Link to="/values/units/search" className="hero-btn secondary">
                  Search Unit Values
                </Link>
              </div>
            </div>

            {/* Center 3D Break-Out Sculpture + Floating Glass Card */}
            <div className="showcase-sculpture-col spline-depth-layer">
              <ThemeCutout
                variant="poseidon"
                floating
                className="showcase-breakout-cutout"
              />
              <div className="showcase-floating-glass">
                <strong>Base × Demand × Scarcity</strong>
                <p>Values sourced from real trades &amp; market data across all rarity tiers.</p>
              </div>
            </div>

            {/* Right Live Market Feed Column */}
            <div className="showcase-preview-col">
              <div className="showcase-preview-head">
                <span>Top Market Valuations</span>
                <Link to="/values/units/Omegas">View All →</Link>
              </div>
              <div className="showcase-unit-feed">
                {featuredValueUnits.map((u) => {
                  const glow = getRarityGlow(u.rarity);
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
                        <strong>{u.name}</strong>
                        <span style={{ color: glow }}>{u.rarity} · Demand: {u.demand || 'Stable'}</span>
                      </div>
                      <span className="showcase-unit-price">
                        💎 {formatCompactNumber(u.tradeValue)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* VÉRAINE-Inspired Frosted Glassmorphic Bottom Pill Dock */}
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
            SECTION 3: EXPANDED WIKI SHOWCASE (Split Stage + Glass Dock)
            ============================================================ */}
        <section
          ref={wikiTiltRef}
          className="home-showcase-section spline-tilt-stage"
          aria-label="WIKI Complete Database Section"
        >
          <ShaderBackdrop variant="alt" />

          <div className="showcase-split-grid">
            {/* Left Editorial Column */}
            <div className="showcase-copy-col">
              <div className="showcase-brand-head">
                <div className="bento-icon-wrap">
                  <span className="logo-tint-wrap bento-logo-wrap">
                    <img src={logoImg} alt="" className="bento-logo" />
                  </span>
                </div>
              </div>

              <h2 className="showcase-kinetic-title">
                WIKI. <span className="showcase-italic-accent">Every stat, without noise.</span>
              </h2>

              <p className="showcase-lead">
                {unitCount} Units, full level-by-level stat sheets, DPS breakdowns, cost-per-DPS efficiency,
                placement limits, passives, abilities, obtain methods, Maps, Crates, Traits, and Skins.
              </p>

              <div className="showcase-stat-trio">
                <div className="showcase-stat-item">
                  <strong>{unitCount}</strong>
                  <span>Documented Units</span>
                </div>
                <div className="showcase-stat-item">
                  <strong>Lv 1→Max</strong>
                  <span>Upgrade Tables</span>
                </div>
                <div className="showcase-stat-item">
                  <strong>Maps &amp; Skins</strong>
                  <span>Complete Index</span>
                </div>
              </div>

              <div className="showcase-cta-row">
                <Link to="/wiki" className="hero-btn primary">
                  Open WIKI <span aria-hidden="true">→</span>
                </Link>
                <Link to="/wiki/compare" className="hero-btn secondary">
                  Compare Units
                </Link>
              </div>
            </div>

            {/* Center 3D Break-Out Sculpture + Rotating Seal */}
            <div className="showcase-sculpture-col spline-depth-layer">
              <KineticSeal
                text="STAT SHEETS · UPGRADES & DPS · "
                centerLabel="WIKI"
                className="showcase-corner-seal"
              />
              <ThemeCutout
                variant="overlord"
                floating
                className="showcase-breakout-cutout"
              />
              <div className="showcase-floating-glass">
                <strong>Lv 1 → Max Stat Sheets</strong>
                <p>Complete unit stat sheets, obtain methods, and level-by-level upgrades.</p>
              </div>
            </div>

            {/* Right Interactive WIKI Modules Column */}
            <div className="showcase-preview-col">
              <div className="showcase-preview-head">
                <span>Interactive WIKI Tools</span>
                <Link to="/wiki/units/search">Search WIKI →</Link>
              </div>
              <div className="showcase-module-grid">
                <Link to="/wiki/compare" className="showcase-module-card">
                  <span className="showcase-module-icon">⚖️</span>
                  <div>
                    <strong>Compare Units</strong>
                    <p>Side-by-side DPS, range, cooldown &amp; total cost analysis</p>
                  </div>
                </Link>
                <Link to="/wiki/leaderboards" className="showcase-module-card">
                  <span className="showcase-module-icon">🏆</span>
                  <div>
                    <strong>Leaderboards</strong>
                    <p>Top 50 units ranked by max DPS, efficiency &amp; meta tier</p>
                  </div>
                </Link>
                <Link to="/wiki/maps" className="showcase-module-card">
                  <span className="showcase-module-icon">🗺️</span>
                  <div>
                    <strong>Maps &amp; Crates</strong>
                    <p>Map difficulties, wave rewards, crate drops &amp; materials</p>
                  </div>
                </Link>
                <Link to="/wiki/traits" className="showcase-module-card">
                  <span className="showcase-module-icon">⚡</span>
                  <div>
                    <strong>Traits &amp; Skins</strong>
                    <p>All rollable unit traits, reforges, and cosmetic skins</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Frosted Glassmorphic Bottom Pill Dock */}
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
            SECTION 4: EXPANDED TRADE CALCULATOR SHOWCASE
            ============================================================ */}
        <section
          ref={calcTiltRef}
          className="home-showcase-section spline-tilt-stage"
          aria-label="Trade Calculator Section"
        >
          <ShaderBackdrop variant="default" />

          <div className="showcase-split-grid">
            {/* Left Editorial Column */}
            <div className="showcase-copy-col">
              <div className="showcase-brand-head">
                <div className="bento-icon-wrap">
                  <span className="logo-tint-wrap bento-logo-wrap">
                    <img src={logoImg} alt="" className="bento-logo" />
                  </span>
                </div>
              </div>

              <h2 className="showcase-kinetic-title">
                Trade Calculator. <span className="showcase-italic-accent">Fair deals, instant verdicts.</span>
              </h2>

              <p className="showcase-lead">
                Compare multi-unit offers side-by-side with instant Win / Fair / Loss verdicts,
                Gems &amp; Coins market ratio conversion, Shiny 1.5× support, and 1-click shareable trade report cards.
              </p>

              <div className="showcase-stat-trio">
                <div className="showcase-stat-item">
                  <strong>W / F / L</strong>
                  <span>Instant Verdict</span>
                </div>
                <div className="showcase-stat-item">
                  <strong>Gems &amp; Coins</strong>
                  <span>Tier Ratio Curve</span>
                </div>
                <div className="showcase-stat-item">
                  <strong>PNG + Link</strong>
                  <span>1-Click Export</span>
                </div>
              </div>

              <div className="showcase-cta-row">
                <Link to="/values/calculator" className="hero-btn primary">
                  Open Calculator <span aria-hidden="true">→</span>
                </Link>
                <Link to="/values/units/Shiny%20Omegas" className="hero-btn secondary">
                  Shiny Values
                </Link>
              </div>
            </div>

            {/* Center 3D Break-Out Sculpture */}
            <div className="showcase-sculpture-col spline-depth-layer">
              <ThemeCutout
                variant="king"
                floating
                className="showcase-breakout-cutout"
              />
              <div className="showcase-floating-glass">
                <strong>Win / Fair / Loss Verdict</strong>
                <p>Values collected from our Database, sourced from real trades &amp; market.</p>
              </div>
            </div>

            {/* Right Interactive W/F/L Preview Panel */}
            <div className="showcase-preview-col">
              <div className="showcase-preview-head">
                <span>Live W / F / L Engine</span>
                <Link to="/values/calculator">Launch →</Link>
              </div>
              <div className="showcase-wfl-demo">
                <div className="wfl-demo-sides">
                  <div className="wfl-demo-box">
                    <span className="wfl-demo-label">YOU OFFER</span>
                    <strong>Units + Gems</strong>
                    <small>Multi-slot &amp; quantity support</small>
                  </div>
                  <div className="wfl-demo-vs">⇄</div>
                  <div className="wfl-demo-box">
                    <span className="wfl-demo-label">THEY OFFER</span>
                    <strong>Units + Coins</strong>
                    <small>Auto-balances difference</small>
                  </div>
                </div>
                <div className="wfl-demo-bar">
                  <span className="wfl-tag loss">LOSS</span>
                  <span className="wfl-tag fair active">FAIR VERDICT</span>
                  <span className="wfl-tag win">WIN</span>
                </div>
                <Link to="/values/calculator" className="wfl-demo-cta">
                  Build Your Trade Offer →
                </Link>
              </div>
            </div>
          </div>

          {/* Frosted Glassmorphic Bottom Pill Dock */}
          <div className="showcase-glass-dock">
            <div className="glass-dock-pills">
              <Link to="/values/calculator" className="glass-dock-pill">W / F / L Evaluator</Link>
              <Link to="/values/units/Shiny%20Omegas" className="glass-dock-pill">Shiny Values</Link>
              <Link to="/values/units/search" className="glass-dock-pill">Quick Value Lookup</Link>
            </div>
            <Link to="/values/calculator" className="glass-dock-cta">
              Calculator →
            </Link>
          </div>
        </section>

        {/* ============================================================
            SECTION 5: DAILY ARCADE, CREDITS & OFFICIAL COMMUNITY LINKS
            ============================================================ */}
        <div className="bento-grid">
          <div>
            <Link to="/minigames" className="bento-card bento-small">
              <ThemeCutout variant="laserminigunner" className="bento-cutout-mini" />
              <div className="bento-small-icon">
                <span className="logo-tint-wrap bento-logo-wrap">
                  <img src={logoImg} alt="" className="bento-logo" />
                </span>
              </div>
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
              <div className="bento-small-icon">
                <span className="logo-tint-wrap bento-logo-wrap">
                  <img src={logoImg} alt="" className="bento-logo" />
                </span>
              </div>
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
              <div className="bento-small-icon">
                <span className="logo-tint-wrap bento-logo-wrap">
                  <img src={logoImg} alt="" className="bento-logo" />
                </span>
              </div>
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
              <div className="bento-small-icon">
                <span className="logo-tint-wrap bento-logo-wrap">
                  <img src={logoImg} alt="" className="bento-logo" />
                </span>
              </div>
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
              <div className="bento-small-icon">
                <span className="logo-tint-wrap bento-logo-wrap">
                  <img src={logoImg} alt="" className="bento-logo" />
                </span>
              </div>
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
              <div className="bento-small-icon">
                <span className="logo-tint-wrap bento-logo-wrap">
                  <img src={logoImg} alt="" className="bento-logo" />
                </span>
              </div>
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

      {/* Right Sidebar Ad (Production only via AdSlot guard) */}
      <div className="home-side-ad right">
        <AdSlot slotId="2911497117" />
      </div>
    </div>
  );
}
