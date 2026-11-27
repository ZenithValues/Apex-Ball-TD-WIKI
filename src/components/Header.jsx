import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import apexLogo from '../assets/apex-values-wiki-logo.png';
import { TOP_NAV_LINKS } from '../config/navigation';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { prefetchRoute } from '../AppRoutes';
import './Header.css';

export default function Header() {
  const { isAdmin } = useAdminStatus();
  const location = useLocation();
  const links = TOP_NAV_LINKS;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const isCalcRoute = location.pathname.startsWith('/values/calculator');

  return (
    <header className={`site-header${isHome ? ' site-header-home' : ''}`}>
      <div className="brand">
        <NavLink to="/" className="brand-link">
          <span className="brand-mark">
            <img src={apexLogo} alt="" className="brand-logo" width={2000} height={2000} />
          </span>
          <span className="brand-lockup">
            <span className="brand-text">APEX</span>
            <span className="brand-text-dim">WIKI &amp; VALUES</span>
          </span>
        </NavLink>
      </div>

      <LayoutGroup id="header-nav-group">
        <nav className="main-nav" aria-label="Main navigation">
          {links.map((link) => {
            const matches =
              link.to === '/'
                ? location.pathname === '/'
                : link.to === '/values'
                  ? location.pathname.startsWith('/values') && !isCalcRoute
                  : location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={matches ? 'nav-item active' : 'nav-item'}
                onMouseEnter={() => prefetchRoute(link.to)}
                onFocus={() => prefetchRoute(link.to)}
              >
                {matches && (
                  <motion.span
                    layoutId="header-nav-pill"
                    className="nav-active-pill"
                    aria-hidden="true"
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <span className="nav-item-label">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </LayoutGroup>

      <div className="header-utilities">
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? 'header-chip header-chip-admin active' : 'header-chip header-chip-admin')}
          >
            Admin
          </NavLink>
        )}
        <button
          type="button"
          className={`header-menu-btn${mobileOpen ? ' is-open' : ''}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span aria-hidden="true">{mobileOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className="header-mobile-drawer"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => {
                  const eff = link.to === '/values' && isCalcRoute ? false : isActive;
                  return eff ? 'header-mobile-link active' : 'header-mobile-link';
                }}
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/theme-editor" className={({ isActive }) => (isActive ? 'header-mobile-link active' : 'header-mobile-link')}>
              Theme Studio
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'header-mobile-link active' : 'header-mobile-link')}>
                Admin Panel
              </NavLink>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
