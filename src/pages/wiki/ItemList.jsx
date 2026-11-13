import { useParams, Navigate } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import WikiSectionHeader from '../../components/wiki/WikiSectionHeader';
import { WIKI_NAV } from '../../config/navigation';
import { ITEM_GROUPS } from '../../data/items';
import { useData } from '../../context/DataContext';

export default function ItemsList() {
  const params = useParams();
  const group = decodeRouteParam(params.group);
  const { itemRows } = useData();
  const custom = (itemRows || []).filter((row) => row.group === group);
  const base = ITEM_GROUPS[group] || [];
  if (!base.length && !custom.length) return <Navigate to="/wiki/items/Artifacts" replace />;
  const items = [...base, ...custom];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <WikiSectionHeader title={group} count={items.length} accent="#ffd24d" subtitle="Artifacts, gear and everything else that is not a unit." />
      <EntityGrid entities={items} linkBase={`/wiki/items/${group}`} accent="#ffd24d" />
    </PageShell>
  );
}
