import { motion } from 'framer-motion';
import justABacon from '../assets/credits/justabacon.png';
import dancyBalls from '../assets/credits/dancyballs.png';
import nub from '../assets/credits/nub.png';
import nose from '../assets/credits/nose.png';
import nooberto from '../assets/credits/nooberto.png';
import deadHunter from '../assets/credits/dead-hunter.png';
import nemuiito from '../assets/credits/nemuiito.png';
import './Credits.css';

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  animate: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const gridVariants = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.16 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.94 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

const credits = [
  {
    name: 'JustABacon',
    role: 'Owner',
    image: justABacon,
    icon: '👑',
    tier: 'owner',
  },
  {
    name: 'DancyBalls',
    role: 'Tester LEAD',
    image: dancyBalls,
    icon: '🔨',
    tier: 'lead',
  },
  {
    name: 'Nub',
    role: 'Tester',
    image: nub,
    icon: '🧪',
    tier: 'tester',
  },
  {
    name: 'Nose',
    role: 'Tester',
    image: nose,
    icon: '🧪',
    tier: 'tester',
  },
  {
    name: 'Nooberto',
    role: 'Tester',
    image: nooberto,
    icon: '🧪',
    tier: 'tester',
  },
  {
    name: 'Dead Hunter',
    role: 'Tester',
    image: deadHunter,
    icon: '🧪',
    tier: 'tester',
  },
  {
    name: 'Nemuiito',
    role: 'Tester',
    image: nemuiito,
    icon: '🧪',
    tier: 'tester',
  },
];

export default function Credits() {
  return (
    <main className="credits-page">
      <motion.section className="credits-hero" variants={fadeUp} initial="initial" animate="animate">
        <p className="credits-kicker">APEX Values &amp; Wiki</p>
        <h1>Credits</h1>
        <p>
          The people behind the testing, feedback, and chaos that helped build the APEX experience.
        </p>
      </motion.section>

      <motion.section className="credits-grid" variants={gridVariants} initial="initial" animate="animate">
        {credits.map((person) => (
          <motion.article key={person.name} className={`credit-card card ${person.tier}`} variants={cardVariants}>
            <div className="credit-avatar-wrap">
              <div className="credit-icon" aria-hidden="true">{person.icon}</div>
              <img src={person.image} alt={person.name} className="credit-avatar" />
            </div>
            <h2>{person.name}</h2>
            <div className="credit-role">{person.role}</div>
          </motion.article>
        ))}
      </motion.section>
    </main>
  );
}
