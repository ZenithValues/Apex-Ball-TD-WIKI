import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
      <nav className="sidebar-nav">
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
          return (
            <div key={section.label} className="sidebar-section">
              <button
                type="button"
                className="sidebar-section-toggle"
                onClick={() => toggle(section.label)}
              >
                <span>{section.label}</span>
                <span className={isOpen ? 'chev open' : 'chev'}>▾</span>
              </button>
              {isOpen && (
                <div className="sidebar-children">
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
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
