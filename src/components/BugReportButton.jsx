import { NavLink, useLocation } from 'react-router-dom';
import './BugReportButton.css';

export default function BugReportButton() {
  const isHome = useLocation().pathname === '/';

  return (
    <NavLink
      to="/bug-report"
      className={({ isActive }) => `global-bug-report${isActive ? ' active' : ''}${isHome ? ' global-bug-report--home' : ''}`}
      aria-label="Report a bug"
      title="Report a bug"
    >
      <span className="global-bug-report-icon" aria-hidden="true">!</span>
      <span>Report Bug</span>
    </NavLink>
  );
}
