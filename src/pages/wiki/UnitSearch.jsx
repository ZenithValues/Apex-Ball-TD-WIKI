import PageShell from '../../components/PageShell';
import UnitSearchPanel from '../../components/UnitSearchPanel';
import { WIKI_NAV } from '../../data/navTree';

export default function WikiUnitSearch() {
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>Search Units</h1>
      <p className="crumb">WIKI / Units / Search</p>
      <div style={{ marginTop: 28 }}>
        <UnitSearchPanel basePath="/wiki/units" />
      </div>
    </PageShell>
  );
}
