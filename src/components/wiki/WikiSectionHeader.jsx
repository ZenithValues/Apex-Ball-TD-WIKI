import { Link } from 'react-router-dom';
import './WikiSectionHeader.css';

/**
 * Shared header for every WIKI section list page (Maps, Crates, Materials,
 * Artifacts, Skins, Traits, Items, …) so a list page never looks like a bare
 * <h1> again (operator, 2026-11-12).
 */
export default function WikiSectionHeader({
  title,
  subtitle = null,
  count = null,
  accent = '#a7b0bd',
  crumbTo = null,
  actions = null,
}) {
  return (
    <header className="wsh" style={{ '--wsh-accent': accent }}>
      <div className="wsh-text">
        <p className="wsh-crumb">
          <Link to="/wiki">WIKI</Link>
          {crumbTo && <><span aria-hidden="true"> / </span><Link to={crumbTo}>{title}</Link></>}
        </p>
        <div className="wsh-title-row">
          <span className="wsh-dot" aria-hidden="true" />
          <h1>{title}</h1>
          {count != null && <span className="wsh-count">{count}</span>}
        </div>
        {subtitle && <p className="wsh-sub">{subtitle}</p>}
      </div>
      {actions && <div className="wsh-actions">{actions}</div>}
    </header>
  );
}
