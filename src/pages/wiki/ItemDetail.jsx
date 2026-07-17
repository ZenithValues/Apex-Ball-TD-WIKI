import { useParams, Link, Navigate } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../config/navigation';
import { getItemBySlug } from '../../data/items';
import { useData } from '../../context/DataContext';

export default function ItemDetail() {
  const params = useParams();
  const group = decodeRouteParam(params.group);
  const slug = decodeRouteParam(params.slug);
  const { crates } = useData();
  const item = group === 'Crates' ? (crates.find((entry) => entry.slug === slug) || getItemBySlug(slug)) : getItemBySlug(slug);
  if (!item) return <Navigate to={`/wiki/items/${group}`} replace />;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <p className="crumb">
        <Link to="/wiki/items/Consumables">Items</Link> / <Link to={`/wiki/items/${group}`}>{group}</Link> / {item.name}
      </p>
      <h1>{item.name}</h1>
      {!item.documented ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No data yet for {item.name}. Send me its description, how to obtain it, effect, and base
          value and I'll fill this page in.
        </div>
      ) : (
        <div className="unit-body">
          {item.description && <p className="unit-desc">{item.description}</p>}
          {item.effect && (
            <section className="unit-section">
              <h2>Effect</h2>
              <p>{item.effect}</p>
            </section>
          )}
          {item.obtain && (
            <section className="unit-section">
              <h2>How to Obtain</h2>
              <table className="kv-table">
                <tbody>
                  <tr><th>Method</th><td>{item.obtain.method}</td></tr>
                  <tr><th>Source</th><td>{item.obtain.source}</td></tr>
                  {item.obtain.dropRate && <tr><th>Drop Rate</th><td>{item.obtain.dropRate}</td></tr>}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
