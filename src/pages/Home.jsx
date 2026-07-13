import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apexBanner from '../assets/apex-banner.png';
import { BASE_UNITS } from '../data/units';
import './Home.css';

const MotionLink = motion(Link);

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  animate: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const gridVariants = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  const unitCount = BASE_UNITS.length;

  return (
    <div className="home">
      <section className="hero">
        <motion.img
          src={apexBanner}
          alt="Apex Values &amp; Wiki"
          className="hero-banner"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.h1
          className="hero-title"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          custom={0.15}
        >
          The <span className="hero-title-accent">DEFINITIVE</span> WIKI &amp; Values Website for
          Ball Tower Defense
        </motion.h1>

        <motion.div className="hero-divider" variants={fadeUp} initial="initial" animate="animate" custom={0.28}>
          <span className="hero-divider-line" />
          <span className="hero-divider-x">×</span>
          <span className="hero-divider-line" />
        </motion.div>

        <motion.p className="hero-sub" variants={fadeUp} initial="initial" animate="animate" custom={0.36}>
          {unitCount} Units, All Values &amp; Trade Calculator, Ball Knowledge, Stat sheets, Rankings and MUCH more!
        </motion.p>
      </section>

      <motion.section className="home-grid" variants={gridVariants} initial="initial" animate="animate">
        <MotionLink
          to="/wiki"
          className="home-card"
          variants={cardVariants}
          whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
          whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
        >
          <h3>WIKI</h3>
          <p className="home-card-desc">{unitCount} Units, Items, Maps, and Skins</p>
          <div className="home-card-divider">
            <span className="home-card-divider-line" />
            <span className="home-card-divider-x">×</span>
            <span className="home-card-divider-line" />
          </div>
          <p className="home-card-note">Full stat sheets, obtain methods, and upgrades</p>
        </MotionLink>

        <MotionLink
          to="/values"
          className="home-card"
          variants={cardVariants}
          whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
          whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
        >
          <h3>Values</h3>
          <p className="home-card-desc">{unitCount} Units, Consumables, Currencies, and Gamepasses</p>
          <div className="home-card-divider">
            <span className="home-card-divider-line" />
            <span className="home-card-divider-x">×</span>
            <span className="home-card-divider-line" />
          </div>
          <p className="home-card-note">Values sourced from real trades &amp; market.</p>
        </MotionLink>

        <MotionLink
          to="/values/calculator"
          className="home-card"
          variants={cardVariants}
          whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
          whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
        >
          <h3>Trade Calculator</h3>
          <p className="home-card-desc">Quick calculator</p>
          <div className="home-card-divider">
            <span className="home-card-divider-line" />
            <span className="home-card-divider-x">×</span>
            <span className="home-card-divider-line" />
          </div>
          <p className="home-card-note">Values collected from our Database, sourced from real trades &amp; market.</p>
        </MotionLink>

        <MotionLink
          to="/ball-knowledge"
          className="home-card"
          variants={cardVariants}
          whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
          whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
        >
          <h3>Ball Knowledge</h3>
          <p className="home-card-desc">Daily unit guessing game</p>
          <div className="home-card-divider">
            <span className="home-card-divider-line" />
            <span className="home-card-divider-x">×</span>
            <span className="home-card-divider-line" />
          </div>
          <p className="home-card-note">Test your Ball TD unit knowledge from upgrade stat clues.</p>
        </MotionLink>
      </motion.section>
    </div>
  );
}
