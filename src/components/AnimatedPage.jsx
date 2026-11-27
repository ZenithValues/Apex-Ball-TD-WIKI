import { motion } from 'framer-motion';

// Deliberate, unhurried page transition (~1.1s enter / ~0.46s exit)
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1.08,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.985,
    transition: { duration: 0.46, ease: [0.4, 0, 1, 1] },
  },
};

const detailVariants = {
  initial: { opacity: 0, y: 26, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1.18,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.11,
    },
  },
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.975,
    transition: { duration: 0.48, ease: [0.4, 0, 1, 1] },
  },
};

export default function AnimatedPage({ children, variant = 'default' }) {
  return (
    <motion.div
      className="apex-animated-page"
      variants={variant === 'detail' ? detailVariants : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ transformOrigin: 'center top', width: '100%' }}
    >
      <div className="apex-route-sweep" aria-hidden="true" />
      {children}
    </motion.div>
  );
}
