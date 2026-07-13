import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Header.css';

export default function Header() {
  return (
    <header className="site-header">
      <div className="brand">
        <NavLink to="/" className="brand-link">
          <motion.span
            className="brand-mark"
            whileHover={{ rotate: 12, scale: 1.15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            ▲
          </motion.span>
          <span className="brand-text">
            APEX <span className="brand-text-dim">— VALUES &amp; WIKI</span>
          </span>
        </NavLink>
      </div>
      <nav className="main-nav">
        <NavLink to="/wiki" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          WIKI
        </NavLink>
        <NavLink
          to="/values"
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          VALUES
        </NavLink>
        <NavLink
          to="/values/calculator"
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          CALCULATOR
        </NavLink>
      </nav>
    </header>
  );
}