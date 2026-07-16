import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TOP_NAV_LINKS } from '../config/navigation';
import { useAdminStatus } from '../hooks/useAdminStatus';
import './Header.css';

function navClass({ isActive }) {
  return isActive ? 'nav-item active' : 'nav-item';
}

export default function Header({ onOpenTheme }) {
  const { isAdmin } = useAdminStatus();
  const links = isAdmin ? [...TOP_NAV_LINKS, { to: '/admin', label: 'ADMIN' }] : TOP_NAV_LINKS;

  return (
    <header className="site-header">
      <div className="header-primary">
        <NavLink
          to="/wiki/bug-report"
          className={({ isActive }) => (isActive ? 'header-bug-link active' : 'header-bug-link')}
          aria-label="Report a bug"
        >
          <span className="header-bug-icon" aria-hidden="true">!</span>
          <span>Report Bug</span>
        </NavLink>

        <div className="brand">
          <NavLink to="/" className="brand-link">
            <motion.span className="brand-mark" whileHover={{ rotate: 12, scale: 1.15 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
              ▲
            </motion.span>
            <span className="brand-text">
              APEX <span className="brand-text-dim">— VALUES &amp; WIKI</span>
            </span>
          </NavLink>
        </div>
      </div>

      <nav className="main-nav">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={navClass}>
            {link.label}
          </NavLink>
        ))}
        <button type="button" className="nav-item nav-theme-btn button-link" onClick={onOpenTheme}>
          THEME
        </button>
      </nav>
    </header>
  );
}
