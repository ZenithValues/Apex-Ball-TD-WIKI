import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Holo3DScene from '../components/Holo3DScene';
import ThemeCutout from '../components/ThemeCutout';
import { ALL_UNITS } from '../data/units';
import { isShinyRarity } from '../data/taxonomy';
import './ConstructionScrollPage.css';

const BASE_UNIT_COUNT = ALL_UNITS.filter((u) => !isShinyRarity(u.rarity)).length;

const DEPTH_STAGES = [
  { id: 'surface', code: '01', label: 'Surface Blueprint' },
  { id: 'geometry', code: '02', label: '3D Unit Architecture' },
  { id: 'telemetry', code: '03', label: 'Cloudflare KV & Formula' },
  { id: 'systems', code: '04', label: 'Combat & Trade Engines' },
  { id: 'core', code: '05', label: 'Core Assembly & Access' },
];

export default function ConstructionScrollPage({
  isMaintenance = false,
  maintenanceMessage = '',
  renderTeamSignIn = null,
}) {
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const pctTextRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    let rafId = 0;
    let currentP = 0;
    let targetP = 0;

    function updateTarget() {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetP = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    }

    function tick() {
      currentP += (targetP - currentP) * 0.1;
      const pct = Math.round(currentP * 100);

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleY(${currentP.toFixed(4)})`;
      }
      if (pctTextRef.current) {
        pctTextRef.current.textContent = `${String(pct).padStart(2, '0')}%`;
      }
      if (containerRef.current) {
        containerRef.current.style.setProperty('--construct-scroll', currentP.toFixed(4));
      }

      const stageIdx = Math.min(
        DEPTH_STAGES.length - 1,
        Math.floor(currentP * DEPTH_STAGES.length)
      );
      setActiveStage((prev) => (prev !== stageIdx ? stageIdx : prev));

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

    // Observe reveal cards for smooth 3D entry
    const cards = document.querySelectorAll('.construct-reveal-layer');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.16 }
    );
    cards.forEach((c) => io.observe(c));

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

  return (
    <div ref={containerRef} className="construct-scroll-page">
      {/* Fixed 3D Wireframe & Gyroscope Assembly Stage */}
      <div className="construct-fixed-3d-bg" aria-hidden="true">
        <Holo3DScene variant="construction" scrollContainerRef={containerRef} />
        <div className="construct-vignette" />
      </div>

      {/* Top Sticky Telemetry Header (shown during standalone Maintenance Mode) */}
      {isMaintenance && (
        <header className="construct-top-bar">
          <div className="construct-brand">
            <span className="construct-status-dot" />
            <strong>APEX</strong>
            <span className="construct-brand-sub">MAINTENANCE &amp; BUILD MODE</span>
          </div>

          <div className="construct-top-actions">
            <div className="construct-depth-readout">
              <span>DEPTH</span>
              <strong ref={pctTextRef}>00%</strong>
            </div>
            {renderTeamSignIn && (
              <button
                type="button"
                className="construct-top-btn"
                onClick={() => setShowSignInModal((v) => !v)}
              >
                {showSignInModal ? 'Close Sign-In' : 'Team Sign-In'}
              </button>
            )}
          </div>
        </header>
      )}

      {/* Quick Team Sign-In Drawer (if clicked from top bar during maintenance) */}
      {isMaintenance && showSignInModal && renderTeamSignIn && (
        <div className="construct-signin-modal-backdrop" onClick={() => setShowSignInModal(false)}>
          <div className="construct-signin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Team Sign-In</h3>
            <p>Sign in with your authorized team account to open the Admin Panel and manage maintenance mode.</p>
            {renderTeamSignIn()}
          </div>
        </div>
      )}

      {/* Right Scroll-Depth Progress Rail */}
      <aside className="construct-depth-rail" aria-label="Scroll construction stages">
        <div className="construct-rail-track">
          <div ref={progressBarRef} className="construct-rail-fill" />
        </div>
        <div className="construct-rail-nodes">
          {DEPTH_STAGES.map((st, idx) => (
            <div
              key={st.id}
              className={`construct-rail-node ${idx <= activeStage ? 'active' : ''}`}
            >
              <span className="rail-code">{st.code}</span>
              <span className="rail-label">{st.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ============================================================
          STAGE 01 (0% - 20%): SURFACE BLUEPRINT
          ============================================================ */}
      <section className="construct-stage stage-surface">
        <div className="construct-stage-inner construct-reveal-layer is-revealed">
          <div className="construct-stage-copy">
            <span className="construct-layer-tag">DEPTH 01 // SURFACE BLUEPRINT</span>
            <h1>
              {isMaintenance
                ? 'BUILDING THE NEXT APEX UPDATE'
                : 'SCROLL TO DECONSTRUCT THE APEX ENGINE'}
            </h1>
            <p className="construct-lead">
              {isMaintenance
                ? 'APEX WIKI & Values is currently applying live updates. Scroll down to watch the 3D core assemble and inspect every layer of the build in real time.'
                : 'The deeper you scroll, the more details unlock — from 3D unit sculptures and rarity tiers down to the live Cloudflare KV pricing engine and combat tables.'}
            </p>
            {maintenanceMessage && (
              <div className="construct-admin-note">
                <strong>Live Status Note:</strong> &ldquo;{maintenanceMessage}&rdquo;
              </div>
            )}
            <div className="construct-scroll-cue">
              <span className="scroll-cue-mouse">
                <i />
              </span>
              <span>Scroll deeper to reveal architecture layers ↓</span>
            </div>
          </div>

          <div className="construct-stage-visual">
            <div className="construct-3d-card-frame">
              <Holo3DScene variant="icosa" className="construct-stage-3d-mesh" />
              <ThemeCutout variant="overlord" floating className="construct-hero-cutout" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          STAGE 02 (20% - 45%): 3D UNIT ARCHITECTURE & 9 RARITIES
          ============================================================ */}
      <section className="construct-stage stage-geometry">
        <div className="construct-stage-inner construct-reveal-layer">
          <div className="construct-stage-visual">
            <div className="construct-3d-card-frame">
              <Holo3DScene variant="crystal" className="construct-stage-3d-mesh" />
              <ThemeCutout variant="poseidon" floating className="construct-hero-cutout" />
            </div>
          </div>

          <div className="construct-stage-copy">
            <span className="construct-layer-tag">DEPTH 02 // 3D UNIT ARCHITECTURE</span>
            <h2>{BASE_UNIT_COUNT} Base Units + Shiny Counterparts Across 9 Tiers</h2>
            <p className="construct-lead">
              Every unit in Ball Tower Defense is indexed across 9 rarity tiers — from Normie and Odds up to Mythics, Transcendents, and Omegas — paired with theme-adaptive monochrome 3D cutouts.
            </p>
            <div className="construct-spec-grid">
              <div className="construct-spec-card">
                <strong>{BASE_UNIT_COUNT}</strong>
                <span>Documented Base Units</span>
              </div>
              <div className="construct-spec-card">
                <strong>9 Tiers</strong>
                <span>Rarity Classification</span>
              </div>
              <div className="construct-spec-card">
                <strong>9 Sculptures</strong>
                <span>Theme-Adaptive 3D Cutouts</span>
              </div>
              <div className="construct-spec-card">
                <strong>60 FPS</strong>
                <span>Mobile GPU Pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          STAGE 03 (45% - 70%): CLOUDFLARE KV & MARKET FORMULA
          ============================================================ */}
      <section className="construct-stage stage-telemetry">
        <div className="construct-stage-inner construct-reveal-layer">
          <div className="construct-stage-copy">
            <span className="construct-layer-tag">DEPTH 03 // LIVE MARKET &amp; KV TELEMETRY</span>
            <h2>Real-Time Cloudflare KV Sync &amp; Transparent Trade Formula</h2>
            <p className="construct-lead">
              Values are never static guesses. Every unit value is synced from our live Cloudflare Workers KV database and calculated transparently from Base Value, Demand, and Scarcity multipliers.
            </p>

            <div className="construct-formula-box">
              <code>TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier</code>
            </div>

            <div className="construct-bars">
              <div className="construct-bar-row">
                <div className="construct-bar-head">
                  <span>Value Overrides Synced</span>
                  <strong>353 / 353 (100%)</strong>
                </div>
                <div className="construct-bar-track">
                  <i style={{ width: '100%' }} />
                </div>
              </div>
              <div className="construct-bar-row">
                <div className="construct-bar-head">
                  <span>WIKI Unit Dossiers Indexed</span>
                  <strong>345 / 345 (100%)</strong>
                </div>
                <div className="construct-bar-track">
                  <i style={{ width: '100%' }} />
                </div>
              </div>
              <div className="construct-bar-row">
                <div className="construct-bar-head">
                  <span>Maps, Crates, Traits &amp; Skins</span>
                  <strong>Active &amp; Verified</strong>
                </div>
                <div className="construct-bar-track">
                  <i style={{ width: '96%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="construct-stage-visual">
            <div className="construct-3d-card-frame">
              <Holo3DScene variant="gyro" className="construct-stage-3d-mesh" />
              <ThemeCutout variant="king" floating className="construct-hero-cutout" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          STAGE 04 (70% - 90%): COMBAT SCHEMATICS & TRADE ENGINES
          ============================================================ */}
      <section className="construct-stage stage-systems">
        <div className="construct-stage-inner construct-reveal-layer">
          <div className="construct-stage-visual">
            <div className="construct-3d-card-frame">
              <Holo3DScene variant="crystal" className="construct-stage-3d-mesh" />
              <ThemeCutout variant="laserminigunner" floating className="construct-hero-cutout" />
            </div>
          </div>

          <div className="construct-stage-copy">
            <span className="construct-layer-tag">DEPTH 04 // COMBAT &amp; TRADE ENGINES</span>
            <h2>Level-by-Level Upgrades, DPS Leaderboards &amp; W/F/L Verdicts</h2>
            <p className="construct-lead">
              Compare any two units side-by-side, inspect peak DPS and Cost-per-DPS rankings across the top 50 towers, or test multi-unit trades with the animated W/F/L Equilibrium Gauge.
            </p>
            <div className="construct-spec-grid">
              <div className="construct-spec-card">
                <strong>W / F / L</strong>
                <span>Equilibrium Trade Calculator</span>
              </div>
              <div className="construct-spec-card">
                <strong>Top 50</strong>
                <span>DPS &amp; Cost Efficiency Boards</span>
              </div>
              <div className="construct-spec-card">
                <strong>1v1 Compare</strong>
                <span>Side-by-Side Stat Charts</span>
              </div>
              <div className="construct-spec-card">
                <strong>3 Minigames</strong>
                <span>Ball Knowledge, Ballonomics, Balling</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          STAGE 05 (90% - 100%): CORE ASSEMBLED & ACCESS PORTAL
          ============================================================ */}
      <section className="construct-stage stage-core">
        <div className="construct-stage-inner construct-reveal-layer">
          <div className="construct-core-complete-card">
            <span className="construct-layer-tag">DEPTH 05 // 100% CORE ASSEMBLED</span>
            <h2>
              {isMaintenance
                ? 'Maintenance In Progress — Team Portal Ready'
                : 'All Systems Operational — Choose a Destination'}
            </h2>
            <p>
              {isMaintenance
                ? 'The 3D core is locked and updates are finalizing. Team members can sign in below to access the Admin Dashboard or toggle maintenance mode off.'
                : 'You have reached the bottom of the 3D architecture stack. Jump straight into any section of APEX WIKI & Values below.'}
            </p>

            {!isMaintenance && (
              <div className="construct-portal-Actions">
                <Link to="/" className="hero-btn primary">Enter Main Page →</Link>
                <Link to="/values" className="hero-btn secondary">Explore Values</Link>
                <Link to="/wiki" className="hero-btn secondary">Browse WIKI</Link>
                <Link to="/values/calculator" className="hero-btn secondary">Trade Calculator</Link>
              </div>
            )}

            {isMaintenance && renderTeamSignIn && (
              <div className="construct-team-box">
                <h3>Team Access Console</h3>
                <p>Sign in with your team credentials to enter the Admin Panel.</p>
                {renderTeamSignIn()}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
