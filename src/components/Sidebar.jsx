import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Sidebar.css';

export default function Sidebar({ title, tree }) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState(() => {
    // auto-expand the section that matches current path
    const initial = {};
    tree.forEach((section) => {
      if (location.pathname.startsWith(section.base)) initial[section.label] = true;
    });
    return initial;
  });

  const toggle = (label) => setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside className="sidebar">
      <div className="sidebar-title">{title}</div>
      <motion.nav
        className="sidebar-nav"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {tree.map((section) => {
          if (!section.children) {
            return (
              <NavLink
                key={section.label}
                to={section.path}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link top active' : 'sidebar-link top'
                }
              >
                {section.label}
              </NavLink>
            );
          }
          const isOpen = !!openSections[section.label];
          const hasSearchPage = !!section.searchPath;
          return (
            <div key={section.label} className="sidebar-section">
              <div className="sidebar-section-row">
                {hasSearchPage ? (
                  <NavLink
                    to={section.searchPath}
                    className={({ isActive }) =>
                      isActive ? 'sidebar-section-label active' : 'sidebar-section-label'
                    }
                    title={`Search ${section.label.toLowerCase()}`}
                  >
                    {section.label}
                  </NavLink>
                ) : (
                  <span className="sidebar-section-label">{section.label}</span>
                )}
                <button
                  type="button"
                  className="sidebar-section-chev-btn"
                  onClick={() => toggle(section.label)}
                  aria-label={isOpen ? `Collapse ${section.label}` : `Expand ${section.label}`}
                >
                  <motion.span
                    className="chev"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    ▾
                  </motion.span>
                </button>
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="sidebar-children"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    {section.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          isActive ? 'sidebar-link child active' : 'sidebar-link child'
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.nav>
    </aside>
  );
}