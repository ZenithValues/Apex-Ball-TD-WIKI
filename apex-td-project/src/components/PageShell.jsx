import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import './PageShell.css';

export default function PageShell({ sidebarTitle, navTree, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMobileNav = useCallback(() => setMobileOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="page-shell">
      <button
        type="button"
        className="mobile-nav-toggle"
        onClick={openMobileNav}
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
      >
        ☰ {sidebarTitle}
      </button>

      <div className="sidebar-desktop">
        <Sidebar title={sidebarTitle} tree={navTree} />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-nav-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={closeMobileNav}
            />
            <motion.div
              className="mobile-nav-drawer"
              data-lenis-prevent
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              onClick={closeMobileNav}
            >
              <Sidebar title={sidebarTitle} tree={navTree} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="page-content">{children}</main>
    </div>
  );
}
