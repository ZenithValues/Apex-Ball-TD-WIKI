import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { ITEM_GROUPS, MATERIALS, CRATES } from '../../data/items';
import { useData } from '../../context/DataContext';
import { wikiSectionByPath } from '../../config/wikiSections';

/**
 * One page per WIKI item type (artifacts, gamepasses, crates, materials, …).
 * Everything an editor saves must show up here, so each section merges THREE
 * sources: the built-in database, the dedicated KV lane for that type
 * (`crates` / `materials` / `maps`) and the generic itemOverrides lane.
 */
export default function WikiItemSectionList({ sectionPath = null }) {
  const params = useParams();
  const path = sectionPath || decodeRouteParam(params.section);
  const section = wikiSectionByPath(path);
  const { itemRows, crates = [], materialRowMap = {} } = useData();

  const items = useMemo(() => {
    if (!section) return [];
    const staticItems = section.staticGroups.flatMap((group) => ITEM_GROUPS[group] || []);
    const custom = (itemRows || []).filter((row) => section.adminGroups.includes(row.group));

    // Dedicated lanes: the crate editor and the material editor write here.
    let lane = [];
    if (section.path === 'crates') {
      lane = [...(crates || []), ...staticItems.filter((row) => row.group === 'Crates')];
    } else if (section.path === 'materials') {
      const rows = Object.values(materialRowMap || {}).map((row) => ({
        ...row,
        group: 'Materials',
        name: row.name || row.slug,
        // the public page reads `imageUrl`; the admin writes `image_url`
        imageUrl: row.imageUrl || row.image_url || null,
        documented: true,
      }));
      lane = [...rows, ...staticItems.filter((row) => row.group === 'Materials' && !(materialRowMap || {})[row.slug])];
    } else {
      lane = staticItems;
    }

    // De-duplicate by slug, lane (live) first.
    const seen = new Set();
    return [...custom, ...lane].filter((row) => {
      if (!row || !row.slug || seen.has(row.slug)) return false;
      seen.add(row.slug);
      return true;
    });
  }, [section, itemRows, crates, materialRowMap]);

  if (!section) return <Navigate to="/wiki" replace />;
  const base = `/wiki/${section.path}`;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>{section.label}</h1>
      <p className="crumb">WIKI / {section.label}</p>
      <EntityGrid entities={items} linkBase={base} emptyLabel={`No ${section.label.toLowerCase()} published yet.`} />
    </PageShell>
  );
}
