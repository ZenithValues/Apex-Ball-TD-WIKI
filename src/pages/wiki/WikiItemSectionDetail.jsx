import { Link, Navigate, useParams } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../config/navigation';
import { ITEM_GROUPS } from '../../data/items';
import { useData } from '../../context/DataContext';
import { resolveImageUrl } from '../../utils/localAssets';
import { wikiSectionByPath } from '../../config/wikiSections';

export default function WikiItemSectionDetail({ sectionPath = null }) {
  const params = useParams();
  const path = sectionPath || decodeRouteParam(params.section);
  const section = wikiSectionByPath(path);
  const slug = decodeRouteParam(params.slug);
  const { itemRows } = useData();
  if (!section) return <Navigate to="/wiki" replace />;
  const staticItems = section.staticGroups.flatMap((group) => ITEM_GROUPS[group] || []);
  const item = (itemRows || []).find((row) => row.slug === slug && section.adminGroups.includes(row.group))
    || staticItems.find((row) => row.slug === slug);
  if (!item) return <Navigate to={`/wiki/${section.path}`} replace />;
  const image = item.imageUrl || item.image_url || item.image || null;
  const base = `/wiki/${section.path}`;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <p className="crumb"><Link to="/wiki">WIKI</Link> / <Link to={base}>{section.label}</Link> / {item.name}</p>
      <h1>{item.name}</h1>
      {image && (
        <div className="item-detail-image" style={{ width: 120, height: 120, borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '1px solid rgba(255,255,255,.12)', background: '#0c0c12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={resolveImageUrl(image)} alt={item.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
        </div>
      )}
      {item.rarity && <p className="unit-desc"><strong>Rarity:</strong> {item.rarity}</p>}
      {item.description && <p className="unit-desc">{item.description}</p>}
      {item.effect && <section className="unit-section"><h2>Effect</h2><p>{item.effect}</p></section>}
      {item.obtain && (
        <section className="unit-section">
          <h2>How to Obtain</h2>
          {typeof item.obtain === 'string' ? <p>{item.obtain}</p> : (
            <table className="kv-table"><tbody>
              <tr><th>Method</th><td>{item.obtain.method}</td></tr>
              <tr><th>Source</th><td>{item.obtain.source}</td></tr>
              {item.obtain.dropRate && <tr><th>Drop Rate</th><td>{item.obtain.dropRate}</td></tr>}
            </tbody></table>
          )}
        </section>
      )}
      {item.baseValue != null && <section className="unit-section"><h2>Value</h2><p>{item.baseValue}</p></section>}
      {!item.description && !item.effect && !item.obtain && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No data yet for {item.name}. An editor can add its description from the admin panel.
        </div>
      )}
    </PageShell>
  );
}
