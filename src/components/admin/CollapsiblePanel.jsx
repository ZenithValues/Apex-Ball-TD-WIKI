import { useId, useState } from 'react';
import CoolIcon from '../CoolIcon';
import './CollapsiblePanel.css';

/**
 * Dropdown section used across the admin panel (Team & access, editors, …).
 * Open by default so nothing a beginner needs is hidden on first visit.
 */
export default function CollapsiblePanel({
  title,
  icon = '▾',
  subtitle = null,
  badge = null,
  defaultOpen = true,
  className = '',
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId().replaceAll(':', '');
  return (
    <section className={`admin-collapse ${open ? 'open' : ''} ${className}`.trim()}>
      <button
        type="button"
        className="admin-collapse-btn"
        aria-expanded={open}
        aria-controls={`admin-collapse-${id}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="admin-collapse-icon" aria-hidden="true">{icon}</span>
        <span className="admin-collapse-text">
          <strong>{title}</strong>
          {subtitle && <small>{subtitle}</small>}
        </span>
        {badge != null && <span className="admin-collapse-badge">{badge}</span>}
        <CoolIcon name="chevron-down" size={18} className={`admin-collapse-caret${open ? ' flipped' : ''}`} />
      </button>
      <div id={`admin-collapse-${id}`} className="admin-collapse-body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}
