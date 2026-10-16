import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apexBanner from '../assets/apex-banner.png';
import pillowValues from '../assets/pillows/pillow-values.png';
import pillowWiki from '../assets/pillows/pillow-wiki.png';
import pillowTradeCalc from '../assets/pillows/pillow-tradecalc.png';
import pillowBallKnow from '../assets/pillows/pillow-ballknow.png';
import pillowCredits from '../assets/pillows/pillow-credits.png';
import pillowOfficial from '../assets/pillows/pillow-official.png';
import pillowSocials from '../assets/pillows/pillow-socials.png';
import pillowCgs from '../assets/pillows/pillow-cgs.png';
import pillowBallTd from '../assets/pillows/pillow-balltd.png';
import { ALL_UNITS } from '../data/units';
import { isShinyRarity } from '../data/taxonomy';
import { useData } from '../context/DataContext';
import AdSlot from '../components/AdSlot';
import ThemeCutout from '../components/ThemeCutout';
import './Home.css';

const EASE_OUT = [0.23, 1, 0.32, 1];

const SHOWCASE_SLIDES = [
  {
    id: 'overlord',
    variant: 'overlord',
    watermark: 'APEX',
    subWatermark: 'OVERLORD',
    series: 'SERIES 01 // APEX PROTOCOL',
    tag: 'LIVE MARKET & ENCYCLOPEDIA',
    ctaLabel: 'Explore Values',
    ctaTo: '/values',
  },
  {
    id: 'poseidon',
    variant: 'poseidon',
    watermark: 'POSEIDON',
    subWatermark: 'TRIDENT',
    series: 'SERIES 02 // SOVEREIGN ARCHIVE',
    tag: 'COMPLETE COMBAT TELEMETRY',
    ctaLabel: 'Browse WIKI',
    ctaTo: '/wiki',
  },
  {
    id: 'hacker',
    variant: 'hacker',
    watermark: 'MATRIX',
    subWatermark: 'TERMINAL',
    series: 'SERIES 03 // TRADE EVALUATOR',
    tag: 'INSTANT W / F / L VERDICTS',
    ctaLabel: 'Trade Calculator',
    ctaTo: '/values/calculator',
  },
  {
    id: 'drone',
    variant: 'drone',
    watermark: 'ORBITAL',
    subWatermark: 'COMMAND',
    series: 'SERIES 04 // DAILY ARCADE',
    tag: 'BALL KNOWLEDGE · BALLONOMICS · BALLING',
    ctaLabel: 'Play Minigames',
    ctaTo: '/minigames',
  },
  {
    id: 'forest',
    variant: 'forest',
    watermark: 'TITAN',
    subWatermark: 'RANKINGS',
    series: 'SERIES 05 // META LEADERBOARDS',
    tag: 'MAX DPS & EFFICIENCY INDEX',
    ctaLabel: 'View Leaderboards',
    ctaTo: '/wiki/leaderboards',
  },
];

const gridVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const cardVariants = {
  initial: { opacity: 0, y: 18, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: EASE_OUT },
  },
};

const MotionLink = motion.create(Link);

export default function Home() {
  const { createdUnits, isUnitDeleted } = useData();
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const staticBaseCount = ALL_UNITS.filter(
    (u) => !u.shiny && !isShinyRarity(u.rarity) && !isUnitDeleted(u.slug)
  ).length;
  const createdBaseCount = (createdUnits || []).filter(
    (u) => !u.shiny && !isShinyRarity(u.rarity) && !isUnitDeleted(u.slug)
  ).length;
  const unitCount = staticBaseCount + createdBaseCount;

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 5600);
    return () => clearInterval(id);
  }, [paused]);

  const currentSlide = SHOWCASE_SLIDES[activeSlide];
  const prevSlideIndex = (activeSlide - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length;
  const nextSlideIndex = (activeSlide + 1) % SHOWCASE_SLIDES.length;
  const prevSlide = SHOWCASE_SLIDES[prevSlideIndex];
  const nextSlide = SHOWCASE_SLIDES[nextSlideIndex];

  const slideIndexLabel = useMemo(
    () => `${String(activeSlide + 1).padStart(2, '0')} / ${String(SHOWCASE_SLIDES.length).padStart(2, '0')}`,
    [activeSlide]
  );

  return (
    <div className="home-with-ads">
      <aside className="home-ad-rail" aria-label="Advertisement">
        <AdSlot slotId="5607978483" format="vertical" />
      </aside>

      <main className="home">
        <div className="home-content">
          {/* ============================================================
              EDITORIAL SHOWCASE STAGE (Inspired by Air Jordan / Nike 270)
             ============================================================ */}
          <section
            className="hero"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Dynamic Ribbon Wave + Trajectory Arc SVG */}
            <div className="hero-stage-decor" aria-hidden="true">
              <div className="hero-ribbon-wave" />
              <div className="hero-ribbon-wave secondary" />
              <svg className="hero-trajectory-svg" viewBox="0 0 1200 600" fill="none" preserveAspectRatio="none">
                <path
                  d="M 520 590 C 690 420, 880 390, 1160 60"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="6 8"
                />
                <circle cx="835" cy="348" r="4" fill="currentColor" />
                <circle cx="1040" cy="182" r="3" fill="currentColor" />
              </svg>
            </div>

            {/* Top Stage Bar */}
            <div className="hero-stage-topbar">
              <div className="hero-brand-lockup">
                <img src={apexBanner} alt="Apex WIKI & Values" className="hero-mini-banner" />
                <span className="hero-series-code">{currentSlide.series}</span>
              </div>
              <div className="hero-stage-tag">{currentSlide.tag}</div>
            </div>

            {/* Main Editorial Split + Center Floating Cutout Stage */}
            <div className="hero-editorial-grid">
              {/* Left Editorial Copy Column */}
              <div className="hero-copy-col">
                <motion.h1
                  className="hero-title"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE_OUT }}
                >
                  The <span className="underline">DEFINITIVE</span> WIKI &amp; Values Website for Ball Tower Defense
                </motion.h1>

                <motion.p
                  className="hero-sub"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, ease: EASE_OUT, delay: 0.06 }}
                >
                  {unitCount} Units, All Values &amp; Trade Calculator, Ball Knowledge, Stat sheets, Rankings and MUCH more!
                </motion.p>

                <motion.div
                  className="hero-cta-row"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, ease: EASE_OUT, delay: 0.12 }}
                >
                  <Link to="/values" className="hero-btn primary">
                    Explore Values <span aria-hidden="true">→</span>
                  </Link>
                  <Link to="/wiki" className="hero-btn">
                    Browse WIKI
                  </Link>
                  <Link to="/values/calculator" className="hero-btn">
                    Trade Calculator
                  </Link>
                </motion.div>
              </div>

              {/* Right / Center 3D Cutout Showcase with Giant Layered Typography */}
              <div className="hero-visual-stage">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide.id}
                    className="hero-slide-layer"
                    initial={{ opacity: 0, scale: 0.9, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -16 }}
                    transition={{ duration: 0.46, ease: EASE_OUT }}
                  >
                    <div className="hero-giant-typography" aria-hidden="true">
                      <span className="hero-giant-main">{currentSlide.watermark}</span>
                      <span className="hero-giant-sub">{currentSlide.subWatermark}</span>
                    </div>

                    <div className="hero-cutout-pedestal">
                      <div className="hero-cutout-aura" aria-hidden="true" />
                      <ThemeCutout
                        variant={currentSlide.variant}
                        className="hero-main-cutout"
                        floating
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Side Preview Nodes (Like Nike Air Max 270 Reference) */}
                <button
                  type="button"
                  className="hero-side-node prev"
                  onClick={() => setActiveSlide(prevSlideIndex)}
                  aria-label="Previous showcase visual"
                >
                  <ThemeCutout variant={prevSlide.variant} floating={false} className="hero-node-cutout" />
                  <span className="hero-node-dot" />
                  <span className="hero-node-stem" />
                </button>

                <button
                  type="button"
                  className="hero-side-node next"
                  onClick={() => setActiveSlide(nextSlideIndex)}
                  aria-label="Next showcase visual"
                >
                  <ThemeCutout variant={nextSlide.variant} floating={false} className="hero-node-cutout" />
                  <span className="hero-node-dot active" />
                  <span className="hero-node-stem" />
                </button>
              </div>
            </div>

            {/* Bottom Stage Bar (Vertical Index + Dots + Corner Action Block like Air Jordan Reference) */}
            <div className="hero-stage-bottombar">
              <div className="hero-index-counter" aria-label={`Slide ${activeSlide + 1} of ${SHOWCASE_SLIDES.length}`}>
                <span className="hero-index-dash">—</span>
                <span className="hero-index-num">{slideIndexLabel}</span>
              </div>

              <div className="hero-stage-dots" role="tablist" aria-label="Showcase slides">
                {SHOWCASE_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === activeSlide}
                    aria-label={`Show ${s.watermark}`}
                    className={`hero-stage-dot ${idx === activeSlide ? 'active' : ''}`}
                    onClick={() => setActiveSlide(idx)}
                  />
                ))}
              </div>

              <div className="hero-stage-corner-group">
                <div className="hero-prev-next-text">
                  <button
                    type="button"
                    className="hero-nav-Step"
                    onClick={() => setActiveSlide(prevSlideIndex)}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="hero-nav-Step"
                    onClick={() => setActiveSlide(nextSlideIndex)}
                  >
                    Next
                  </button>
                </div>
                <Link to={currentSlide.ctaTo} className="hero-corner-cta" title={currentSlide.ctaLabel}>
                  <span className="hero-corner-cta-label">{currentSlide.ctaLabel}</span>
                  <span className="hero-corner-cta-arrow" aria-hidden="true">›</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ============================================================
              PRIMARY BENTO CARDS (With Theme-Adaptive Cutout Art)
             ============================================================ */}
          <motion.section
            className="home-bento-primary"
            variants={gridVariants}
            initial="initial"
            animate="animate"
            aria-label="Core tools"
          >
            <MotionLink
              to="/values"
              className="home-card home-card-featured"
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.2, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <ThemeCutout variant="poseidon" floating={false} className="home-card-cutout" />
              <div className="home-card-top">
                <img src={pillowValues} alt="Values" className="home-pillow" />
                <span className="home-card-tag">Market Index</span>
              </div>
              <div className="home-card-main">
                <h3>Values</h3>
                <p className="home-card-desc">{unitCount} Units, Consumables, Currencies, and Gamepasses</p>
              </div>
              <div className="home-card-foot">
                <p className="home-card-note">Values sourced from real trades &amp; market.</p>
                <span className="home-card-arrow" aria-hidden="true">→</span>
              </div>
            </MotionLink>

            <MotionLink
              to="/wiki"
              className="home-card home-card-featured"
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.2, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <ThemeCutout variant="forest" floating={false} className="home-card-cutout" />
              <div className="home-card-top">
                <img src={pillowWiki} alt="WIKI" className="home-pillow" />
                <span className="home-card-tag">Database</span>
              </div>
              <div className="home-card-main">
                <h3>WIKI</h3>
                <p className="home-card-desc">{unitCount} Units, Items, Maps, and Skins</p>
              </div>
              <div className="home-card-foot">
                <p className="home-card-note">Full stat sheets, obtain methods, and upgrades</p>
                <span className="home-card-arrow" aria-hidden="true">→</span>
              </div>
            </MotionLink>

            <MotionLink
              to="/values/calculator"
              className="home-card home-card-featured"
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.2, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <ThemeCutout variant="hacker" floating={false} className="home-card-cutout" />
              <div className="home-card-top">
                <img src={pillowTradeCalc} alt="Trade Calculator" className="home-pillow" />
                <span className="home-card-tag">Evaluator</span>
              </div>
              <div className="home-card-main">
                <h3>Trade Calculator</h3>
                <p className="home-card-desc">Quick calculator</p>
              </div>
              <div className="home-card-foot">
                <p className="home-card-note">Values collected from our Database, sourced from real trades &amp; market.</p>
                <span className="home-card-arrow" aria-hidden="true">→</span>
              </div>
            </MotionLink>
          </motion.section>

          {/* ============================================================
              SECONDARY BENTO ROW
             ============================================================ */}
          <motion.section
            className="home-bento-secondary"
            variants={gridVariants}
            initial="initial"
            animate="animate"
            aria-label="Community and arcade"
          >
            <MotionLink
              to="/minigames"
              className="home-card home-card-compact"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <ThemeCutout variant="drone" floating={false} className="home-card-cutout-mini" />
              <img src={pillowBallKnow} alt="Minigames" className="home-pillow-compact" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Minigames</h3>
                  <span className="home-card-arrow" aria-hidden="true">→</span>
                </div>
                <p className="home-card-desc">Play games, earn achievements</p>
                <p className="home-card-note">Daily challenges &amp; endless modes</p>
              </div>
            </MotionLink>

            <MotionLink
              to="/credits"
              className="home-card home-card-compact"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <ThemeCutout variant="overlord" floating={false} className="home-card-cutout-mini" />
              <img src={pillowCredits} alt="Credits" className="home-pillow-compact" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Credits</h3>
                  <span className="home-card-arrow" aria-hidden="true">→</span>
                </div>
                <p className="home-card-desc">Owner, tester lead, and testers</p>
                <p className="home-card-note">The people behind Apex WIKI &amp; Values</p>
              </div>
            </MotionLink>

            <motion.a
              href="https://www.roblox.com/games/18436999220/Ball-Tower-Defense"
              target="_blank"
              rel="noopener noreferrer"
              className="home-card home-card-compact"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <img src={pillowBallTd} alt="Play Ball TD" className="home-pillow-compact" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Play Ball TD</h3>
                  <span className="home-card-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="home-card-desc">Official Roblox experience</p>
                <p className="home-card-note">Open Ball Tower Defense on Roblox</p>
              </div>
            </motion.a>

            <motion.a
              href="https://discord.gg/balltd"
              target="_blank"
              rel="noopener noreferrer"
              className="home-card home-card-compact"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <img src={pillowOfficial} alt="Community Discord" className="home-pillow-compact" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Community Discord</h3>
                  <span className="home-card-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="home-card-desc">Apex WIKI &amp; Values Server</p>
                <p className="home-card-note">Discuss values, trades, and updates</p>
              </div>
            </motion.a>

            <motion.a
              href="https://discord.gg/cashgrabstudios"
              target="_blank"
              rel="noopener noreferrer"
              className="home-card home-card-compact"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <img src={pillowCgs} alt="CGS Discord" className="home-pillow-compact" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>CGS Discord</h3>
                  <span className="home-card-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="home-card-desc">Cash Grab Studios</p>
                <p className="home-card-note">Official game developers server</p>
              </div>
            </motion.a>

            <motion.a
              href="https://www.youtube.com/@ApexValuesBTD"
              target="_blank"
              rel="noopener noreferrer"
              className="home-card home-card-compact"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
            >
              <img src={pillowSocials} alt="YouTube" className="home-pillow-compact" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>YouTube</h3>
                  <span className="home-card-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="home-card-desc">@ApexValuesBTD</p>
                <p className="home-card-note">Guides, showcases, and tier lists</p>
              </div>
            </motion.a>
          </motion.section>
        </div>
      </main>

      <aside className="home-ad-rail" aria-label="Advertisement">
        <AdSlot slotId="5607978483" format="vertical" />
      </aside>
    </div>
  );
}
