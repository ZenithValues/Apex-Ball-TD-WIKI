import { Navigate, useParams } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { ITEM_GROUPS } from '../../data/items';
import { useData } from '../../context/DataContext';
import { wikiSectionByPath } from '../../config/wikiSections';

/** One restored WIKI page per item type, including admin-created rows. */
export default function WikiItemSectionList({ sectionPath = null }) {
  const params = useParams();
  const path = sectionPath || decodeRouteParam(params.section);
  const section = wikiSectionByPath(path);
  const { itemRows } = useData();
  if (!section) return <Navigate to="/wiki" replace />;
  const staticItems = section.staticGroups.flatMap((group) => ITEM_GROUPS[group] || []);
  const custom = (itemRows || []).filter((row) => section.adminGroups.includes(row.group));
  const items = [...staticItems, ...custom];
  const base = `/wiki/${section.path}`;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>{section.label}</h1>
      <p className="crumb">WIKI / {section.label}</p>
      <EntityGrid entities={items} linkBase={base} emptyLabel={`No ${section.label.toLowerCase()} published yet.`} />
    </PageShell>
  );
}
