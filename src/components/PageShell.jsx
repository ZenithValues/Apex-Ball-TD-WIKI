import Sidebar from './Sidebar';
import './PageShell.css';

export default function PageShell({ sidebarTitle, navTree, children }) {
  return (
    <div className="page-shell">
      <Sidebar title={sidebarTitle} tree={navTree} />
      <main className="page-content">{children}</main>
    </div>
  );
}
