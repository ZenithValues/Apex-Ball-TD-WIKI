import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { ALL_MAPS } from '../../data/maps';

export default function MapsList() {
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>Maps</h1>
      <p className="crumb">WIKI / Maps</p>
      <EntityGrid entities={ALL_MAPS} linkBase="/wiki/maps" />
    </PageShell>
  );
}
