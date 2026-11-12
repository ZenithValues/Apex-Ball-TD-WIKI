import { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { ALL_TRAITS } from '../../data/traits';
import { mergeCollection } from '../../utils/collectionRows';
import { decodeRouteParam } from '../../utils/routeParams';

export default function TraitDetail() {
  const { slug } = useParams();
  const { itemRows } = useData();
  const traits = useMemo(() => mergeCollection(ALL_TRAITS, itemRows, 'Trait'), [itemRows]);
  const trait = traits.find((row) => row.slug === decodeRouteParam(slug));
  if (!trait) return <Navigate to="/wiki/traits" replace />;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <p className="crumb"><Link to="/wiki/traits">Traits</Link> / {trait.name}</p>
      <h1>{trait.name}</h1>
      {trait.description && <p className="unit-desc">{trait.description}</p>}
      {trait.effect && (
        <table className="kv-table">
          <tbody>
            <tr><th>Effect</th><td>{trait.effect}</td></tr>
            {trait.obtain && <tr><th>How to obtain</th><td>{trait.obtain}</td></tr>}
          </tbody>
        </table>
      )}
      {!trait.description && !trait.effect && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No data yet for {trait.name}. Send its effect / description and it will show up here.
        </div>
      )}
    </PageShell>
  );
}
