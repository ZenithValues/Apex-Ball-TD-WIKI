import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import WikiSectionHeader from '../../components/wiki/WikiSectionHeader';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';

export default function MapsList() {
  const { maps } = useData();
  const documented = maps.filter((map) => map.documentation || map.description || map.difficulty).length;
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <WikiSectionHeader
        title="Maps"
        subtitle="Every playable stage, its difficulty tier and what it drops."
        count={maps.length}
        accent="#4ade80"
      />
      <EntityGrid
        entities={maps}
        linkBase="/wiki/maps"
        accent="#4ade80"
        emptyLabel="No maps published yet."
        renderMeta={(map) => (map.difficulty ? <span className="badge">{map.difficulty}</span> : null)}
      />
      {documented === 0 && maps.length > 0 && (
        <p className="unit-desc" style={{ marginTop: 14 }}>
          Difficulty tiers and descriptions can be filled in from the admin Maps editor.
        </p>
      )}
    </PageShell>
  );
}
