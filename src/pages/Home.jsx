import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apexBanner from '../assets/apex-banner.png';
import { BASE_UNITS } from '../data/units';
import { useData } from '../context/DataContext';
import pillowWiki from '../assets/pillows/pillow-wiki.png';
import pillowValues from '../assets/pillows/pillow-values.png';
import pillowTradeCalc from '../assets/pillows/pillow-tradecalc.png';
import pillowCredits from '../assets/pillows/pillow-credits.png';
import pillowOfficial from '../assets/pillows/pillow-official.png';
import pillowBallTd from '../assets/pillows/pillow-balltd.png';
import pillowCgs from '../assets/pillows/pillow-cgs.png';
import pillowSocials from '../assets/pillows/pillow-socials.png';
import pillowBallKnow from '../assets/pillows/pillow-ballknow.png';
import AdSlot from '../components/AdSlot';
import './Home.css';

const MotionLink = motion(Link);
const MotionAnchor = motion.a;

const EASE_OUT = [0.23, 1, 0.32, 1];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE_OUT, delay },
  }),
};

const gridVariants = {
  animate: { transition: { staggerChildren: 0.055, delayChildren: 0.16 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
};

export default function Home() {
  const { unitValues } = useData();
  const liveBaseCount = unitValues?.filter((u) => u.kind !== 'item' && !u.shiny).length;
  const unitCount = liveBaseCount > 0 ? liveBaseCount : BASE_UNITS.length;

  return (
    <div className="home-layout-wrapper">
      <style>{`
        @media (max-width: 1100px) {
          .home-side-ad {
            display: none !important;
          }
        }
      `}</style>

      {/* Left Sidebar Ad */}
      <div className="home-side-ad left">
        <AdSlot slotId="2911497117" />
      </div>

      {/* Main Content */}
      <div className="home-main-content">
        <div className="home">
          <section className="hero">
            <div className="hero-split">
              <div className="hero-copy">
                <motion.div
                  className="hero-status-pill"
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  custom={0.04}
                >
                  <span className="hero-status-dot" aria-hidden="true" />
                  <span>LIVE DATABASE · {unitCount} UNITS INDEXED</span>
                </motion.div>

                <motion.h1
                  className="hero-title"
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  custom={0.1}
                >
                  The <span className="hero-title-accent">DEFINITIVE</span> WIKI &amp; Values Website for
                  Ball Tower Defense
                </motion.h1>

                <motion.p
                  className="hero-sub"
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  custom={0.16}
                >
                  {unitCount} Units, All Values &amp; Trade Calculator, Ball Knowledge, Stat sheets, Rankings and MUCH more!
                </motion.p>

                <motion.div
                  className="hero-actions"
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  custom={0.22}
                >
                  <Link to="/values" className="hero-btn filled">
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

              <motion.div
                className="hero-showcase"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.48, ease: EASE_OUT, delay: 0.08 }}
              >
                <div className="hero-banner-frame">
                  <img src={apexBanner} alt="Apex WIKI & Values" className="hero-banner" />
                </div>
                <div className="hero-telemetry">
                  <div className="hero-metric">
                    <span className="hero-metric-val tabular-nums">{unitCount}</span>
                    <span className="hero-metric-lbl">Base Units</span>
                  </div>
                  <div className="hero-metric">
                    <span className="hero-metric-val">Live KV</span>
                    <span className="hero-metric-lbl">Real-Time Sync</span>
                  </div>
                  <div className="hero-metric">
                    <span className="hero-metric-val">W/F/L</span>
                    <span className="hero-metric-lbl">Trade Engine</span>
                  </div>
                  <div className="hero-metric">
                    <span className="hero-metric-val tabular-nums">3</span>
                    <span className="hero-metric-lbl">Daily Arcade</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

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
              whileHover={{ y: -4, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
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
              whileHover={{ y: -4, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
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
              whileHover={{ y: -4, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
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

          <motion.section
            className="home-grid"
            variants={gridVariants}
            initial="initial"
            animate="animate"
            aria-label="Features and community"
          >
            <MotionLink
              to="/minigames"
              className="home-card home-card-compact"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
              <img src={pillowBallKnow} alt="Minigames" className="home-pillow" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Minigames</h3>
                  <span className="home-card-arrow" aria-hidden="true">→</span>
                </div>
                <p className="home-card-desc">Play games, earn achievements</p>
                <p className="home-card-note">Ball Knowledge, Ballonomics, Balling and more — unlock reward themes by completing achievement sets.</p>
              </div>
            </MotionLink>

            <MotionLink
              to="/credits"
              className="home-card home-card-compact"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
              <img src={pillowCredits} alt="Credits" className="home-pillow" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Credits</h3>
                  <span className="home-card-arrow" aria-hidden="true">→</span>
                </div>
                <p className="home-card-desc">Owner, tester lead, and testers</p>
                <p className="home-card-note">See the people who helped shape Testing.</p>
              </div>
            </MotionLink>

            <MotionAnchor
              href="https://www.roblox.com/games/18343561950/Ball-Tower-Defense"
              target="_blank"
              rel="noreferrer"
              className="home-card home-card-compact game-card"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
              <img src={pillowBallTd} alt="Ball Tower Defense Roblox game" className="game-card-img" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Play Ball TD</h3>
                  <span className="home-card-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="home-card-desc">Official Roblox experience</p>
                <p className="home-card-note">Open Ball Tower Defense on Roblox.</p>
              </div>
            </MotionAnchor>

            <MotionAnchor
              href="https://discord.gg/kWhpVncQwr"
              target="_blank"
              rel="noreferrer"
              className="home-card home-card-compact game-card"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
              <img src={pillowOfficial} alt="Official Ball TD Discord server" className="game-card-img" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Join Official Ball TD Discord</h3>
                  <span className="home-card-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="home-card-desc">Community server</p>
                <p className="home-card-note">Join the Ball Tower Defense Discord community.</p>
              </div>
            </MotionAnchor>

            <MotionAnchor
              href="https://www.roblox.com/communities/32380537/Cash-Grab-Studios#!/about"
              target="_blank"
              rel="noreferrer"
              className="home-card home-card-compact game-card"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
              <img src={pillowCgs} alt="Cash Grab Studios Roblox group" className="game-card-img" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>Cash Grab Studios</h3>
                  <span className="home-card-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="home-card-desc">Official Roblox community</p>
                <p className="home-card-note">Open the Cash Grab Studios group.</p>
              </div>
            </MotionAnchor>

            <MotionAnchor
              href="https://www.youtube.com/@CashGrabStudios"
              target="_blank"
              rel="noreferrer"
              className="home-card home-card-compact game-card"
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.1 } }}
            >
              <img src={pillowSocials} alt="Cash Grab Studios YouTube channel" className="game-card-img" />
              <div className="home-card-compact-body">
                <div className="home-card-compact-head">
                  <h3>YouTube</h3>
                  <span className="home-card-arrow" aria-hidden="true">↗</span>
                </div>
                <p className="home-card-desc">Cash Grab Studios channel</p>
                <p className="home-card-note">Watch Cash Grab Studios on YouTube.</p>
              </div>
            </MotionAnchor>
          </motion.section>

          <motion.div
            className="home-bug-report-wrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.35 }}
          >
            <MotionLink
              to="/bug-report"
              className="home-bug-report-button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="home-bug-report-icon" aria-hidden="true">!</span>
              Found a problem? Report a Bug
              <span aria-hidden="true">→</span>
            </MotionLink>
          </motion.div>
        </div>
      </div>

      {/* Right Sidebar Ad */}
      <div className="home-side-ad right">
        <AdSlot slotId="2911497117" />
      </div>
    </div>
  );
}
