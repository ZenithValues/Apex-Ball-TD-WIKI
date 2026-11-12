import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { REFORGES } from '../../data/reforges';
import { mergeCollection } from '../../utils/collectionRows';
import { decodeRouteParam } from '../../utils/routeParams';

export default function ReforgeDetail() {
  const { slug } = useParams();
  const { itemRows } = useData();
  const reforges = useMemo(() => mergeCollection(REFORGES, itemRows, 'Reforge'), [itemRows]);
  const reforge = reforges.find((row) => row.slug === decodeRouteParam(slug));
  if (!reforge) return <Navigate to="/wiki/reforges" replace />;

  const bonuses = Array.isArray(reforge.statBonuses)
    ? reforge.statBonuses
    : typeof reforge.statBonuses === 'string' && reforge.statBonuses.trim()
      ? reforge.statBonuses.split('\n').map((line) => line.trim()).filter(Boolean)
      : [];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <p className="crumb"><Link to="/wiki/reforges">Reforges</Link> / {reforge.name}</p>
      <h1>{reforge.name}</h1>
      {reforge.description && <p className="unit-desc">{reforge.description}</p>}
      {bonuses.length > 0 && (
        <>
          <h2>Stat bonuses</h2>
          <table className="kv-table">
            <tbody>
              {bonuses.map((line) => {
                const [label, ...rest] = String(line).split(':');
                return (
                  <tr key={line}>
                    <th>{label.trim()}</th>
                    <td>{rest.join(':').trim() || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      {reforge.obtain && (
        <>
          <h2>How to obtain</h2>
          <p className="unit-desc">{reforge.obtain}</p>
        </>
      )}
    </PageShell>
  );
}
