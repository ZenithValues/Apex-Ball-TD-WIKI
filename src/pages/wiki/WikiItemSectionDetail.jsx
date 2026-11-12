import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../config/navigation';
import { ITEM_GROUPS } from '../../data/items';
import { useData } from '../../context/DataContext';
import { resolveImageUrl } from '../../utils/localAssets';
import { wikiSectionByPath } from '../../config/wikiSections';

function asLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value).split('\n').map((line) => line.trim()).filter(Boolean);
}

function chanceEntries(chances) {
  if (!chances) return [];
  if (Array.isArray(chances)) return chances;
  if (typeof chances === 'object') return Object.entries(chances);
  return asLines(chances).map((line) => {
    const [name, ...rest] = line.split(':');
    return [name.trim(), rest.join(':').trim()];
  });
}

/**
 * Item detail page for the restored sections. Reads the SAME live lanes the
 * admin editors write to (crates / materials / itemOverrides), so a saved
 * description, effect, pity or drop table appears here immediately.
 */
export default function WikiItemSectionDetail({ sectionPath = null }) {
  const params = useParams();
  const path = sectionPath || decodeRouteParam(params.section);
  const section = wikiSectionByPath(path);
  const slug = decodeRouteParam(params.slug);
  const { itemRows, crates = [], materialRowMap = {} } = useData();

  const item = useMemo(() => {
    if (!section || !slug) return null;
    const fromItems = (itemRows || []).find(
      (row) => row.slug === slug && section.adminGroups.includes(row.group)
    );
    if (fromItems) return fromItems;
    if (section.path === 'crates') {
      return (crates || []).find((row) => row.slug === slug) || null;
    }
    if (section.path === 'materials') {
      const row = (materialRowMap || {})[slug];
      if (row) return { ...row, name: row.name || row.slug, imageUrl: row.imageUrl || row.image_url || null };
    }
    const staticItems = section.staticGroups.flatMap((group) => ITEM_GROUPS[group] || []);
    return staticItems.find((row) => row.slug === slug) || null;
  }, [section, slug, itemRows, crates, materialRowMap]);

  if (!section) return <Navigate to="/wiki" replace />;
  if (!item) return <Navigate to={`/wiki/${section.path}`} replace />;

  const image = item.imageUrl || item.image_url || item.image || null;
  const base = `/wiki/${section.path}`;
  const drops = chanceEntries(item.chances);
  const pity = asLines(item.pity);
  const obtainLines = asLines(item.obtain);
  const hasObtain =
    (typeof item.obtain === 'string' && item.obtain.trim().length > 0)
    || (Array.isArray(item.obtain) && item.obtain.length > 0)
    || (item.obtain && !Array.isArray(item.obtain) && typeof item.obtain === 'object'
      && Object.values(item.obtain).some((value) => value != null && String(value).trim()));

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <p className="crumb"><Link to="/wiki">WIKI</Link> / <Link to={base}>{section.label}</Link> / {item.name}</p>
      <h1>{item.name}</h1>

      {image && (
        <div className="item-detail-image" style={{ width: 120, height: 120, borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '1px solid rgba(255,255,255,.12)', background: '#0c0c12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={resolveImageUrl(image)} alt={item.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
        </div>
      )}

      <div className="unit-badges" style={{ marginBottom: 16 }}>
        {item.rarity && <span className="badge filled">{item.rarity}</span>}
        {item.group && <span className="badge">{item.group}</span>}
      </div>

      {/* Description + effect/specials */}
      {item.description && <p className="unit-desc">{item.description}</p>}
      {(item.effect || item.specials || item.bonus) && (
        <section className="unit-section">
          <h2>{section.path === 'crates' ? 'Specials & bonuses' : 'Effect'}</h2>
          {item.effect && <p>{item.effect}</p>}
          {item.specials && <p>{item.specials}</p>}
          {item.bonus && <p>{item.bonus}</p>}
        </section>
      )}

      {/* Crate contents */}
      {drops.length > 0 && (
        <section className="unit-section">
          <h2>Contents</h2>
          <table className="kv-table">
            <tbody>
              {drops.map(([name, drop]) => (
                <tr key={name}><th>{name}</th><td>{drop}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {pity.length > 0 && (
        <section className="unit-section">
          <h2>Pity</h2>
          <table className="kv-table">
            <tbody>
              {pity.map((line) => {
                const [label, ...rest] = line.split(':');
                return <tr key={line}><th>{label.trim()}</th><td>{rest.join(':').trim() || '—'}</td></tr>;
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Obtain */}
      {hasObtain && (
        <section className="unit-section">
          <h2>How to Obtain</h2>
          {typeof item.obtain === 'string' && obtainLines.length > 1 ? (
            <ul>
              {obtainLines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          ) : typeof item.obtain === 'string' ? (
            <p>{item.obtain}</p>
          ) : (
            <table className="kv-table"><tbody>
              {item.obtain?.method && <tr><th>Method</th><td>{item.obtain.method}</td></tr>}
              {item.obtain?.source && <tr><th>Source</th><td>{item.obtain.source}</td></tr>}
              {item.obtain?.dropRate && <tr><th>Drop Rate</th><td>{item.obtain.dropRate}</td></tr>}
            </tbody></table>
          )}
        </section>
      )}

      {item.baseValue != null && item.baseValue !== '' && (
        <section className="unit-section"><h2>Value</h2><p>{item.baseValue}</p></section>
      )}

      {!item.description && !item.effect && !drops.length && !pity.length && !item.obtain && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No data yet for {item.name}. An editor can add its description, effect and drop table from the admin panel.
        </div>
      )}
    </PageShell>
  );
}
