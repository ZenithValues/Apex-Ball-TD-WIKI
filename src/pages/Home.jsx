import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ALL_UNITS } from '../data/units';
import { useData } from '../context/DataContext';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber } from '../utils/formatNumber';
import UnitIcon from '../components/UnitIcon';
import ThemeCutout, { getCutoutForRarity } from '../components/ThemeCutout';
import Holo3DScene from '../components/Holo3DScene';
import AdSlot from '../components/AdSlot';
import './Home.css';

const BASE_UNIT_COUNT = ALL_UNITS.filter((u) => !isShinyRarity(u.rarity)).length;

const SHOWCASE_SLIDES = [
  { id: 'overlord', cutout: 'overlord', division: 'Omegas', label: 'Overclocked Overlord', to: '/values/units/Omegas' },
  { id: 'poseidon', cutout: 'poseidon', division: 'Transcendents', label: 'Poseidon', to: '/values/units/Transcendents' },
  { id: 'laserminigunner', cutout: 'laserminigunner', division: 'Mythics', label: 'Laser Minigunner', to: '/values/units/Mythics' },
  { id: 'king', cutout: 'king', division: 'Legendaries', label: 'King Ball', to: '/values/units/Legendaries' },
  { id: 'forest', cutout: 'forest', division: 'Awesome', label: 'Forest Ball', to: '/values/units/Awesome' },
  { id: 'drone', cutout: 'drone', division: 'Rares', label: 'Drone Ball', to: '/values/units/Rares' },
  { id: 'elfcommander', cutout: 'elfcommander', division: 'Odds', label: 'Elf Commander', to: '/values/units/Odds' },
  { id: 'partyman', cutout: 'partyman', division: 'Normie', label: 'Party Man', to: '/values/units/Normie' },
  { id: 'hacker', cutout: 'hacker', division: '???', label: 'Hacker Ball', to: '/values/units/%3F%3F%3F' },
];

const LANDING_STAGES = [
  { id: 'stage-overview', code: '01', label: 'Overview & Index' },
  { id: 'stage-values', code: '02', label: 'Market Values' },
  { id: 'stage-wiki', code: '03', label: 'Unit WIKI' },
  { id: 'stage-calculator', code: '04', label: 'Trade Calculator' },
  { id: 'stage-community', code: '05', label: 'Arcade & Community' },
];

const MARKET_PREVIEW_TIERS = ['Omegas', 'Transcendents', 'Mythics', 'Legendaries'];

export default function Home() {
  const { unitValues, wikiRows } = useData();
  const pageRef = useRef(null);
  const railFillRef = useRef(null);

  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [marketTier, setMarketTier] = useState('Omegas');
  const [sampleTradeIdx, setSampleTradeIdx] = useState(0);
  const [activeStage, setActiveStage] = useState(0);

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

  const sampleTrades = useMemo(() => {
    const omegas = (unitValues || [])
      .filter((u) => u.hasValue && u.rarity === 'Omegas' && u.tradeValue > 0)
      .sort((a, b) => (b.tradeValue || 0) - (a.tradeValue || 0));
    const trans = (unitValues || [])
      .filter((u) => u.hasValue && u.rarity === 'Transcendents' && u.tradeValue > 0)
      .sort((a, b) => (b.tradeValue || 0) - (a.tradeValue || 0));

    const u1 = omegas[0] || { name: 'CorruptMalware', tradeValue: 20000000, rarity: 'Omegas' };
    const u2 = omegas[1] || { name: 'TempleBall', tradeValue: 19750000, rarity: 'Omegas' };
    const u3 = omegas[2] || { name: 'NightmareBall', tradeValue: 14000000, rarity: 'Omegas' };
    const u4 = trans[0] || { name: 'Poseidon', tradeValue: 8250000, rarity: 'Transcendents' };

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

  // Slower, deliberate 9.5s cycle for the live division ticker (Item 2)
  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 9500);
    return () => clearInterval(timer);
  }, [paused]);

  // Scroll-linked stage reveal & progress rail (based on the 3D Architecture Overview layout)
  useEffect(() => {
    let rafId = 0;
    let currentP = 0;
    let targetP = 0;

    function updateTarget() {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetP = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    }

    function tick() {
      currentP += (targetP - currentP) * 0.08;
      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleY(${currentP.toFixed(4)})`;
      }
      const idx = Math.min(
        LANDING_STAGES.length - 1,
        Math.floor(currentP * LANDING_STAGES.length + 0.15)
      );
      setActiveStage((prev) => (prev !== idx ? idx : prev));

      if (Math.abs(targetP - currentP) > 0.0005) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    }

    function onScroll() {
      updateTarget();
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    const revealEls = document.querySelectorAll('.arch-reveal-layer');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.14 }
    );
    revealEls.forEach((el) => io.observe(el));

    updateTarget();
    rafId = requestAnimationFrame(tick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const activeSlide = SHOWCASE_SLIDES[slideIndex];

  const scrollToStage = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (window.__apexLenis) {
      window.__apexLenis.scrollTo(el, { offset: -72, duration: 1.35 });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={pageRef} className="home-layout-wrapper arch-landing-page">
      {/* Full-Viewport Fixed Interactive 3D Architecture Backdrop */}
      <div className="arch-fixed-3d-bg" aria-hidden="true">
        <Holo3DScene
          variant="architect"
          scrollContainerRef={pageRef}
          interactive={false}
          showPedestal={false}
        />
        <div className="arch-bg-vignette" />
      </div>

      {/* Right Scroll-Depth Progress Rail */}
      <aside className="arch-depth-rail" aria-label="Landing page sections">
        <div className="arch-rail-track">
          <div ref={railFillRef} className="arch-rail-fill" />
        </div>
        <div className="arch-rail-nodes">
          {LANDING_STAGES.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              className={`arch-rail-node ${idx <= activeStage ? 'active' : ''} ${idx === activeStage ? 'current' : ''}`}
              onClick={() => scrollToStage(st.id)}
            >
              <span className="rail-code">{st.code}</span>
              <span className="rail-label">{st.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="home-side-ad left">
        <AdSlot slotId="2911497117" />
      </div>

      <main className="home arch-main-flow">
        {/* ============================================================
            STAGE 01: HERO & LIVE DIVISION SPOTLIGHT
            Text shifted left; unit cutout scaled down as a minor contextual
            accent; interactive Geodesic 3D Icosahedron on the right.
            ============================================================ */}
        <section
          id="stage-overview"
          className="arch-stage stage-01"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="arch-stage-inner arch-reveal-layer is-revealed">
            <div className="arch-stage-card">
              <div className="arch-card-top-bar">
                <div className="arch-tag-group">
                  <span className="arch-pulse-dot" />
                  <span className="arch-layer-tag">STAGE 01 // APEX WIKI &amp; VALUES</span>
                </div>
                <Link
                  to={activeSlide.to}
                  className="arch-minor-accent-chip"
                  title={`Featured Division: ${activeSlide.division}`}
                >
                  <ThemeCutout
                    key={activeSlide.id}
                    variant={activeSlide.cutout}
                    tintColor={getRarityGlow(activeSlide.division)}
                    floating
                    className="arch-mini-cutout"
                  />
                  <div className="arch-accent-chip-text">
                    <small>{activeSlide.division}</small>
                    <strong>{activeSlide.label}</strong>
                  </div>
                </Link>
              </div>

              <h1 className="arch-hero-title">
                THE <span className="hero-title-highlight">DEFINITIVE</span> WIKI &amp;
                <br />
                VALUES WEBSITE FOR
                <br />
                BALL TOWER DEFENSE
              </h1>

              <p className="arch-lead">
                {unitCount} Units, All Values &amp; Trade Calculator, Ball Knowledge, Stat sheets and MUCH more!
              </p>

              <div className="arch-actions">
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

              {/* Slow-Cycling Division Spotlight Ticker with Micro-Progress Bar */}
              <div className="arch-spotlight-strip" aria-label="Rarity Divisions">
                <div className="arch-spotlight-dots">
                  {SHOWCASE_SLIDES.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`arch-spotlight-pill ${idx === slideIndex ? 'active' : ''}`}
                      onClick={() => setSlideIndex(idx)}
                      style={{ '--pill-color': getRarityGlow(s.division) }}
                    >
                      <span>{s.division}</span>
                      {idx === slideIndex && <i className="arch-pill-progress" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="arch-stage-3d-col">
              <div className="arch-3d-interactive-frame">
                <Holo3DScene variant="icosa" interactive className="arch-stage-3d-canvas" />
                <div className="arch-3d-drag-hint">
                  <span className="arch-hint-dot" />
                  <span>Click &amp; drag 3D core to move &amp; inspect</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            STAGE 02: MARKET VALUES & LIVE KV TELEMETRY
            Left-shifted card with live 2-decimal-place pricing + minor
            contextual rarity cutout; interactive 3D Hexagonal Diamond Crystal on right.
            ============================================================ */}
        <section id="stage-values" className="arch-stage stage-02">
          <div className="arch-stage-inner arch-reveal-layer">
            <div className="arch-stage-card">
              <div className="arch-card-top-bar">
                <div className="arch-tag-group">
                  <span className="arch-pulse-dot" />
                  <span className="arch-layer-tag">STAGE 02 // LIVE MARKET &amp; KV VALUES</span>
                </div>
                <div className="arch-minor-accent-chip">
                  <ThemeCutout
                    key={marketTier}
                    variant={getCutoutForRarity(marketTier)}
                    tintColor={getRarityGlow(marketTier)}
                    floating
                    className="arch-mini-cutout"
                  />
                  <div className="arch-accent-chip-text">
                    <small>Active Tier</small>
                    <strong>{marketTier}</strong>
                  </div>
                </div>
              </div>

              <h2 className="arch-section-title">Values</h2>
              <p className="arch-lead">
                All {unitCount} Units, Consumables, Currencies, and Gamepasses. Values sourced from real trades &amp; market data using{' '}
                <code>TradeValue = BaseValue × Demand × Scarcity</code>.
              </p>

              {/* Interactive Rarity Tier Switcher + Live 2-Decimal Price Bars */}
              <div className="arch-embedded-panel">
                <div className="showcase-preview-head">
                  <div className="showcase-tier-tabs" role="tablist" aria-label="Market Tier Preview">
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
                  <Link to={`/values/units/${encodeURIComponent(marketTier)}`} className="arch-panel-link">
                    All {marketTier} →
                  </Link>
                </div>

                <div className="showcase-unit-rows">
                  {featuredValueUnits.map((u) => {
                    const glow = getRarityGlow(u.rarity);
                    const pct = Math.max(12, Math.round(((u.tradeValue || 0) / maxTierPrice) * 100));
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
                          size={42}
                          imageUrl={wikiImageMap[u.slug] || u.imageUrl}
                        />
                        <div className="showcase-unit-meta">
                          <div className="showcase-unit-topline">
                            <strong>{u.name}</strong>
                            <span className="showcase-unit-price">
                              💎 {formatCompactNumber(u.tradeValue)}
                            </span>
                          </div>
                          <div className="showcase-value-bar-track">
                            <i
                              className="showcase-value-bar-fill"
                              style={{ width: `${pct}%`, background: glow }}
                            />
                          </div>
                          <span className="showcase-unit-sub">
                            {u.rarity} · Demand: {u.demand || 'Average'} · Scarcity: {u.scarcity || 'Average'}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="arch-actions">
                <Link to="/values" className="hero-btn primary">
                  Open Values <span aria-hidden="true">→</span>
                </Link>
                <Link to="/values/units/search" className="hero-btn secondary">
                  Search Unit Values
                </Link>
              </div>
            </div>

            <div className="arch-stage-3d-col">
              <div className="arch-3d-interactive-frame">
                <Holo3DScene
                  variant="crystal"
                  tintColor={getRarityGlow(marketTier)}
                  interactive
                  className="arch-stage-3d-canvas"
                />
                <div className="arch-3d-drag-hint">
                  <span className="arch-hint-dot" />
                  <span>3D Bipyramid Crystal · Drag to rotate &amp; move</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            STAGE 03: UNIT WIKI & STAT SHEETS
            Left-shifted card with 4 WIKI portals (no Leaderboards) + minor
            Poseidon/King accent; interactive 3D Gyroscope Cube Reactor on right.
            ============================================================ */}
        <section id="stage-wiki" className="arch-stage stage-03">
          <div className="arch-stage-inner arch-reveal-layer">
            <div className="arch-stage-card">
              <div className="arch-card-top-bar">
                <div className="arch-tag-group">
                  <span className="arch-pulse-dot" />
                  <span className="arch-layer-tag">STAGE 03 // COMBAT STAT SHEETS &amp; WIKI</span>
                </div>
                <div className="arch-minor-accent-chip">
                  <ThemeCutout
                    variant="king"
                    floating
                    className="arch-mini-cutout"
                  />
                  <div className="arch-accent-chip-text">
                    <small>Database</small>
                    <strong>{unitCount} Units Indexed</strong>
                  </div>
                </div>
              </div>

              <h2 className="arch-section-title">WIKI</h2>
              <p className="arch-lead">
                Level-by-level upgrade costs, DPS breakdowns, range, cooldowns, placement limits, passives, abilities, synergies, maps, crates, traits, and skins.
              </p>

              <div className="showcase-wiki-modules">
                <Link to="/wiki/compare" className="showcase-module-card">
                  <span className="module-icon">⚖️</span>
                  <div>
                    <strong>Compare Units</strong>
                    <small>Side-by-side level stats, DPS &amp; total cost</small>
                  </div>
                </Link>
                <Link to="/wiki/maps" className="showcase-module-card">
                  <span className="module-icon">🗺️</span>
                  <div>
                    <strong>Maps &amp; Waves</strong>
                    <small>Map drops, wave counts &amp; enemy modifiers</small>
                  </div>
                </Link>
                <Link to="/wiki/crates" className="showcase-module-card">
                  <span className="module-icon">📦</span>
                  <div>
                    <strong>Crates &amp; Items</strong>
                    <small>Drop chances, consumables &amp; crafting materials</small>
                  </div>
                </Link>
                <Link to="/wiki/traits" className="showcase-module-card">
                  <span className="module-icon">⚡</span>
                  <div>
                    <strong>Traits &amp; Skins</strong>
                    <small>Trait multipliers, reforges &amp; unit cosmetics</small>
                  </div>
                </Link>
              </div>

              <div className="arch-actions">
                <Link to="/wiki" className="hero-btn primary">
                  Open WIKI <span aria-hidden="true">→</span>
                </Link>
                <Link to="/wiki/units/search" className="hero-btn secondary">
                  Search WIKI Units
                </Link>
              </div>
            </div>

            <div className="arch-stage-3d-col">
              <div className="arch-3d-interactive-frame">
                <Holo3DScene variant="gyro" interactive className="arch-stage-3d-canvas" />
                <div className="arch-3d-drag-hint">
                  <span className="arch-hint-dot" />
                  <span>3D Gimbal Cube Reactor · Drag to rotate &amp; move</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            STAGE 04: TRADE CALCULATOR & W/F/L EQUILIBRIUM
            Left-shifted card with interactive W/F/L gauge & zero duplicate
            buttons; interactive 3D Stellated Merkaba Star on right.
            ============================================================ */}
        <section id="stage-calculator" className="arch-stage stage-04">
          <div className="arch-stage-inner arch-reveal-layer">
            <div className="arch-stage-card">
              <div className="arch-card-top-bar">
                <div className="arch-tag-group">
                  <span className="arch-pulse-dot" />
                  <span className="arch-layer-tag">STAGE 04 // MULTI-UNIT TRADE ENGINE</span>
                </div>
                <div className="arch-minor-accent-chip">
                  <ThemeCutout
                    variant="laserminigunner"
                    floating
                    className="arch-mini-cutout"
                  />
                  <div className="arch-accent-chip-text">
                    <small>Verdict Engine</small>
                    <strong>W / F / L Balance</strong>
                  </div>
                </div>
              </div>

              <h2 className="arch-section-title">Trade Calculator</h2>
              <p className="arch-lead">
                Build multi-unit offers on both sides, include Gems or Coins, and see instant Win / Fair / Loss verdicts with two-decimal precision.
              </p>

              <div className="arch-embedded-panel">
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
                </div>
              </div>

              <div className="arch-actions">
                <Link to="/values/calculator" className="hero-btn primary">
                  Open Trade Calculator <span aria-hidden="true">→</span>
                </Link>
                <Link to="/values/units/Shiny%20Omegas" className="hero-btn secondary">
                  Shiny Values
                </Link>
              </div>
            </div>

            <div className="arch-stage-3d-col">
              <div className="arch-3d-interactive-frame">
                <Holo3DScene variant="stellated" interactive className="arch-stage-3d-canvas" />
                <div className="arch-3d-drag-hint">
                  <span className="arch-hint-dot" />
                  <span>3D Stellated Merkaba · Drag to rotate &amp; move</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            STAGE 05: MINIGAMES, CREDITS & COMMUNITY LINKS
            ============================================================ */}
        <section id="stage-community" className="arch-stage stage-05">
          <div className="arch-stage-inner arch-reveal-layer">
            <div className="arch-stage-card">
              <div className="arch-card-top-bar">
                <div className="arch-tag-group">
                  <span className="arch-pulse-dot" />
                  <span className="arch-layer-tag">STAGE 05 // ARCADE, TEAM &amp; OFFICIAL LINKS</span>
                </div>
                <div className="arch-minor-accent-chip">
                  <ThemeCutout
                    variant="hacker"
                    floating
                    className="arch-mini-cutout"
                  />
                  <div className="arch-accent-chip-text">
                    <small>Community</small>
                    <strong>Arcade &amp; Hub</strong>
                  </div>
                </div>
              </div>

              <h2 className="arch-section-title">Minigames &amp; Community</h2>
              <p className="arch-lead">
                Test your Ball TD knowledge in daily minigames, unlock custom themes, meet the team, and join the official community.
              </p>

              <div className="bento-grid">
                <Link to="/minigames" className="bento-card bento-small">
                  <ThemeCutout variant="laserminigunner" className="bento-cutout-mini" />
                  <div className="bento-small-text">
                    <h3>Minigames</h3>
                    <p>Play games, earn achievements</p>
                    <span className="bento-small-meta">Ball Knowledge, Ballonomics &amp; Balling</span>
                  </div>
                  <span className="bento-arrow">→</span>
                </Link>

                <Link to="/credits" className="bento-card bento-small">
                  <ThemeCutout variant="elfcommander" className="bento-cutout-mini" />
                  <div className="bento-small-text">
                    <h3>Credits</h3>
                    <p>Owners, Admin &amp; Editors</p>
                    <span className="bento-small-meta">The team behind Apex WIKI &amp; Values</span>
                  </div>
                  <span className="bento-arrow">→</span>
                </Link>

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

            <div className="arch-stage-3d-col">
              <div className="arch-3d-interactive-frame">
                <Holo3DScene variant="monolith" interactive className="arch-stage-3d-canvas" />
                <div className="arch-3d-drag-hint">
                  <span className="arch-hint-dot" />
                  <span>3D Obelisk Monolith · Drag to rotate &amp; move</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="home-side-ad right">
        <AdSlot slotId="2911497117" />
      </div>
    </div>
  );
}
