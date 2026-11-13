import { useEffect, useState } from 'react';
import CoolIcon from '../CoolIcon';
import './AdminNav.css';

/**
 * Admin sidebar with real dropdown menus (2026-11-12). Every group is a
 * collapsible menu; the group that owns the active view starts open. Nothing
 * is hidden — a closed group still shows its label, count and chevron.
 */
export const ADMIN_NAV_GROUPS = [
  {
    id: 'start',
    icon: '🏠',
    label: 'Start here',
    items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'logs', icon: '📈', label: 'Logs & Info' },
    ],
  },
  {
    id: 'editors',
    icon: '✍️',
    label: 'Editors',
    items: [
      { id: 'values', icon: '💰', label: 'Values Editor' },
      { id: 'wiki', icon: '📖', label: 'WIKI Editor' },
      { id: 'maps', icon: '🗺️', label: 'Maps' },
      { id: 'crates', icon: '📦', label: 'Crates' },
      { id: 'materials', icon: '🧪', label: 'Materials' },
      // rev 8: the item families that had no editor at all. Before this they
      // could only be reached through the flat "Create anything" form.
      { id: 'artifacts', icon: '🗝️', label: 'Artifacts' },
      { id: 'gamepasses', icon: '🎟️', label: 'Gamepasses' },
      { id: 'consumables', icon: '🧪', label: 'Consumables' },
      { id: 'currencies', icon: '💎', label: 'Currencies' },
      { id: 'items', icon: '🎒', label: 'Items' },
      { id: 'skins', icon: '🎨', label: 'Skins' },
      { id: 'traits', icon: '🧬', label: 'Traits' },
    ],
  },
  {
    id: 'create',
    icon: '✨',
    label: 'Create',
    items: [{ id: 'create', icon: '✨', label: 'Create anything' }],
  },
  {
    id: 'community',
    icon: '💬',
    label: 'Community',
    items: [
      { id: 'bugs', icon: '🐛', label: 'Bug Reports', roles: ['owner', 'admin'] },
      { id: 'announcements', icon: '📢', label: 'Announcements', roles: ['owner', 'admin'] },
    ],
  },
];

export function adminGroupFor(view) {
  const group = ADMIN_NAV_GROUPS.find((g) => g.items.some((item) => item.id === view));
  return group?.id || 'start';
}

export default function AdminNav({ activeView, setActiveView, setActiveTool, role, wikiAllowed }) {
  const [openGroups, setOpenGroups] = useState(() => [adminGroupFor(activeView)]);

  // Opening a view from the top bar / dashboard should reveal its menu.
  useEffect(() => {
    const group = adminGroupFor(activeView);
    setOpenGroups((prev) => (prev.includes(group) ? prev : [...prev, group]));
  }, [activeView]);

  const toggle = (id) => setOpenGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  return (
    <nav className="admin-sidebar admin-nav" aria-label="Admin sections">
      {ADMIN_NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => {
          if (item.roles && !item.roles.includes(role)) return false;
          if (item.id === 'create' && !wikiAllowed) return false;
          return true;
        });
        if (!items.length) return null;
        const open = openGroups.includes(group.id);
        const hasActive = items.some((item) => item.id === activeView);
        return (
          <div key={group.id} className={`admin-nav-group${open ? ' open' : ''}${hasActive ? ' has-active' : ''}`}>
            <button
              type="button"
              className="admin-nav-group-btn"
              aria-expanded={open}
              aria-controls={`admin-nav-${group.id}`}
              onClick={() => toggle(group.id)}
            >
              <span className="admin-nav-group-icon" aria-hidden="true">{group.icon}</span>
              <span className="admin-nav-group-label">{group.label}</span>
              <span className="admin-nav-group-count">{items.length}</span>
              <CoolIcon name="chevron-down" size={16} className={`admin-nav-caret${open ? ' flipped' : ''}`} />
            </button>
            <div id={`admin-nav-${group.id}`} className="admin-nav-items" hidden={!open}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-sidebar-item${activeView === item.id ? ' active' : ''}`}
                  aria-current={activeView === item.id ? 'page' : undefined}
                  onClick={() => {
                    setActiveView(item.id);
                    if (['values', 'wiki', 'maps', 'crates'].includes(item.id)) setActiveTool(item.id);
                  }}
                >
                  <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
