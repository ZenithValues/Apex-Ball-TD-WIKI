import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ALL_UNITS } from '../data/units';
import { useData } from '../context/DataContext';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber } from '../utils/formatNumber';
import UnitIcon from '../components/UnitIcon';
import ThemeCutout from '../components/ThemeCutout';
import Holo3DScene from '../components/Holo3DScene';
import AdSlot from '../components/AdSlot';
import './Home.css';

const BASE_UNIT_COUNT = ALL_UNITS.filter((u) => !isShinyRarity(u.rarity)).length;

const LANDING_SECTIONS = [
  { id: 'section-overview', code: '01', label: 'Overview' },
  { id: 'section-values', code: '02', label: 'Values' },
  { id: 'section-wiki', code: '03', label: 'WIKI' },
  { id: 'section-calculator', code: '04', label: 'Calculator' },
  { id: 'section-community', code: '05', label: 'Community' },
  { id: 'section-apex-finale', code: '06', label: 'APEX' },
];

export default function Home() {
  const { unitValues, wikiRows } = useData();
  const pageRef = useRef(null);
  const railFillRef = useRef(null);

  const [sampleTradeIdx, setSampleTradeIdx] = useState(0);
  const [activeStage, setActiveStage] = useState(0);

  const liveBaseCount = useMemo(
    () =>
      unitValues?.filter(
        (u) => u.kind !== 'item' && !u.shiny && !isShinyRarity(u.rarity)
      ).length || 0,
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
      .filter((u) => u.hasValue && !u.shiny && !isShinyRarity(u.rarity) && u.tradeValue > 0)
      .sort((a, b) => (b.tradeValue || 0) - (a.tradeValue || 0));
    return priced.slice(0, 4);
  }, [unitValues]);

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

  useEffect(() => {
    let rafId = 0;
    let currentP = 0;
    let targetP = 0;

    function updateTarget() {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      targetP = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    }

    function tick() {
      currentP += (targetP - currentP) * 0.08;
      if (railFillRef.current) {
        railFillRef.current.style.transform = `scaleY(${currentP.toFixed(4)})`;
      }
      const idx = Math.min(
        LANDING_SECTIONS.length - 1,
        Math.floor(currentP * LANDING_SECTIONS.length + 0.12)
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
      { threshold: 0.12 }
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

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (window.__apexLenis) {
      window.__apexLenis.scrollTo(el, { offset: -64, duration: 1.85 });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={pageRef} className="home-layout-wrapper arch-landing-page">
      {/* Single Stationary, Click-Rotatable, Scroll-Morphing 3D Liquid-Metal Sculpture */}
      <div className="arch-fixed-3d-bg">
        <Holo3DScene scrollContainerRef={pageRef} interactive />
        <div className="arch-bg-vignette" aria-hidden="true" />
        <div className="arch-3d-rotate-badge" aria-hidden="true">
          <span className="arch-hint-dot" />
          <span>Click &amp; drag metallic sculpture to rotate · Scroll to morph</span>
        </div>
      </div>

      {/* Right Outer-Edge Scroll Navigation Rail */}
      <aside className="arch-depth-rail" aria-label="Landing page sections">
        <div className="arch-rail-track">
          <div ref={railFillRef} className="arch-rail-fill" />
        </div>
        <div className="arch-rail-nodes">
          {LANDING_SECTIONS.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              className={`arch-rail-node ${idx <= activeStage ? 'active' : ''} ${idx === activeStage ? 'current' : ''}`}
              onClick={() => scrollToSection(st.id)}
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
            SECTION 01: OVERVIEW HERO
            Clean, flush-left layout — no Stage header, no Rarity|Unit pillow,
            no rarity filter buttons.
            ============================================================ */}
        <section id="section-overview" className="arch-stage">
          <div className="arch-stage-inner arch-reveal-layer is-revealed">
            <div className="arch-stage-card">
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
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 02: MARKET VALUES
            ============================================================ */}
        <section id="section-values" className="arch-stage">
          <div className="arch-stage-inner arch-reveal-layer">
            <div className="arch-stage-card">
              <h2 className="arch-section-title">Values</h2>
              <p className="arch-lead">
                All {unitCount} Units, Consumables, Currencies, and Gamepasses. Values sourced from real trades &amp; market data using{' '}
                <code>TradeValue = BaseValue × Demand × Scarcity</code>.
              </p>

              <div className="arch-embedded-panel">
                <div className="showcase-preview-head">
                  <span className="arch-panel-kicker">HIGHEST VALUED MARKET LEADERS</span>
                  <Link to="/values" className="arch-panel-link">
                    All Values →
                  </Link>
                </div>

                <div className="showcase-unit-rows">
                  {featuredValueUnits.map((u) => {
                    const glow = getRarityGlow(u.rarity);
                    const pct = Math.max(
                      12,
                      Math.round(((u.tradeValue || 0) / maxTierPrice) * 100)
                    );
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
                            Demand: {u.demand || 'Average'} · Scarcity: {u.scarcity || 'Average'}
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
          </div>
        </section>

        {/* ============================================================
            SECTION 03: UNIT WIKI & STAT SHEETS
            (Maps, Crates, Skins, and Traits hidden from view)
            ============================================================ */}
        <section id="section-wiki" className="arch-stage">
          <div className="arch-stage-inner arch-reveal-layer">
            <div className="arch-stage-card">
              <h2 className="arch-section-title">WIKI</h2>
              <p className="arch-lead">
                Level-by-level upgrade costs, DPS breakdowns, range, cooldowns, placement limits, passives, abilities, and unit synergies.
              </p>

              <div className="showcase-wiki-modules">
                <Link to="/wiki/compare" className="showcase-module-card">
                  <span className="module-icon">⚖️</span>
                  <div>
                    <strong>Compare Units</strong>
                    <small>Side-by-side level stats, DPS &amp; total cost</small>
                  </div>
                </Link>
                <Link to="/wiki/units/search" className="showcase-module-card">
                  <span className="module-icon">🔍</span>
                  <div>
                    <strong>Unit Search</strong>
                    <small>Filter all {unitCount} units by role, passives &amp; cost</small>
                  </div>
                </Link>
                <Link to="/wiki/units/Omegas" className="showcase-module-card">
                  <span className="module-icon">👑</span>
                  <div>
                    <strong>Omega Stat Sheets</strong>
                    <small>Endgame upgrade paths, DPS &amp; placement caps</small>
                  </div>
                </Link>
                <Link to="/wiki/units/Shiny%20Omegas" className="showcase-module-card">
                  <span className="module-icon">✨</span>
                  <div>
                    <strong>Shiny Unit Index</strong>
                    <small>Shiny stat multipliers &amp; upgrade breakdowns</small>
                  </div>
                </Link>
              </div>

              <div className="arch-actions">
                <Link to="/wiki" className="hero-btn primary">
                  Open WIKI <span aria-hidden="true">→</span>
                </Link>
                <Link to="/wiki/compare" className="hero-btn secondary">
                  Compare Units
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 04: TRADE CALCULATOR & W/F/L EQUILIBRIUM
            ============================================================ */}
        <section id="section-calculator" className="arch-stage">
          <div className="arch-stage-inner arch-reveal-layer">
            <div className="arch-stage-card">
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
          </div>
        </section>

        {/* ============================================================
            SECTION 05: MINIGAMES, CREDITS & COMMUNITY LINKS
            ============================================================ */}
        <section id="section-community" className="arch-stage">
          <div className="arch-stage-inner arch-reveal-layer">
            <div className="arch-stage-card">
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
          </div>
        </section>

        {/* ============================================================
            SECTION 06: 3D METALLIC "APEX" FINALE STAGE
            At the end of the scroll path (scrollProgress -> 1.0), the
            liquid-chrome sculpture completes its morph into "APEX".
            ============================================================ */}
        <section id="section-apex-finale" className="arch-stage arch-finale-stage">
          <div className="arch-finale-caption">
            <span className="arch-finale-sub">CLICK &amp; DRAG ABOVE TO ROTATE THE 3D METALLIC SCULPTURE</span>
          </div>
        </section>
      </main>

      <div className="home-side-ad right">
        <AdSlot slotId="2911497117" />
      </div>
    </div>
  );
}
