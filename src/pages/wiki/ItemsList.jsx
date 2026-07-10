import { useParams, Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../data/navTree';
import { ITEM_GROUPS } from '../../data/items';

export default function ItemsList() {
  const { group } = useParams();
  if (!ITEM_GROUPS[group]) return <Navigate to="/wiki/items/Consumables" replace />;

  const items = ITEM_GROUPS[group];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>{group}</h1>
      <p className="crumb">WIKI / Items / {group}</p>
      <EntityGrid entities={items} linkBase={`/wiki/items/${group}`} />
    </PageShell>
  );
}
