import { NavLink, useLocation } from 'react-router-dom';
import apexLogo from '../assets/apex-values-wiki-logo.png';
import { TOP_NAV_LINKS } from '../config/navigation';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { prefetchRoute } from '../AppRoutes';
import './Header.css';

export default function Header() {
  const { isAdmin } = useAdminStatus();
  const location = useLocation();
  const links = TOP_NAV_LINKS;

  return (
    <header className={`site-header${location.pathname === '/' ? ' site-header-home' : ''}`}>
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

      <nav className="main-nav" aria-label="Main navigation">
        {links.map((link) => {
          const isCalcRoute = location.pathname.startsWith('/values/calculator');
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => {
                const effectiveActive = link.to === '/values' && isCalcRoute ? false : isActive;
                return effectiveActive ? 'nav-item active' : 'nav-item';
              }}
              onMouseEnter={() => prefetchRoute(link.to)}
              onFocus={() => prefetchRoute(link.to)}
            >
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="header-utilities">
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? 'header-chip header-chip-admin active' : 'header-chip header-chip-admin')}
          >
            Admin
          </NavLink>
        )}
      </div>
    </header>
  );
}
