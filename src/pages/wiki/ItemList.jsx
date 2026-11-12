import { useParams, Navigate } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { ITEM_GROUPS } from '../../data/items';
import { useData } from '../../context/DataContext';

export default function ItemsList() {
  const params = useParams();
  const group = decodeRouteParam(params.group);
  const { itemRows } = useData();
  const custom = (itemRows || []).filter((row) => row.group === group);
  const base = ITEM_GROUPS[group] || [];
  if (!base.length && !custom.length) return <Navigate to="/wiki/items/Consumables" replace />;
  const items = [...base, ...custom];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>{group}</h1>
      <p className="crumb">WIKI / Items / {group}</p>
      <EntityGrid entities={items} linkBase={`/wiki/items/${group}`} />
    </PageShell>
  );
}
