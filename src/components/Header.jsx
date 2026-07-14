import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabase';
import './Header.css';

export default function Header({ onOpenTheme }) {
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin(session) {
      if (!session?.user?.email) {
        if (mounted) setShowAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', session.user.email.toLowerCase())
        .maybeSingle();

      if (mounted) setShowAdmin(Boolean(data && !error));
    }

    supabase.auth.getSession().then(({ data }) => checkAdmin(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => checkAdmin(session));

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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
        <NavLink to="/values" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          VALUES
        </NavLink>
        <NavLink to="/values/calculator" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          CALCULATOR
        </NavLink>
        <NavLink to="/ball-knowledge" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          KNOWLEDGE
        </NavLink>
        {showAdmin && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            ADMIN
          </NavLink>
        )}
        <button type="button" className="nav-item nav-theme-btn" onClick={onOpenTheme}>
          THEME
        </button>
      </nav>
    </header>
  );
}
