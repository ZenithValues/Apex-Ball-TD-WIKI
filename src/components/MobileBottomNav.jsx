import { NavLink } from 'react-router-dom';
import './MobileBottomNav.css';

export default function MobileBottomNav({ onOpenTheme }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
      <NavLink to="/wiki" className={({ isActive }) => (isActive ? 'mbn-item active' : 'mbn-item')}>
        <span>Wiki</span>
      </NavLink>
      <NavLink to="/values" className={({ isActive }) => (isActive ? 'mbn-item active' : 'mbn-item')}>
        <span>Values</span>
      </NavLink>
      <NavLink to="/values/calculator" className={({ isActive }) => (isActive ? 'mbn-item active' : 'mbn-item')}>
        <span>Calc</span>
      </NavLink>
      <NavLink to="/ball-knowledge" className={({ isActive }) => (isActive ? 'mbn-item active' : 'mbn-item')}>
        <span>Know</span>
      </NavLink>
      <button type="button" className="mbn-item" onClick={onOpenTheme}>
        <span>Theme</span>
      </button>
    </nav>
  );
}
