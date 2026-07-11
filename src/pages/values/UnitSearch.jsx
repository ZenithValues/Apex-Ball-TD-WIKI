import PageShell from '../../components/PageShell';
import UnitSearchPanel from '../../components/UnitSearchPanel';
import { VALUES_NAV } from '../../data/navTree';

export default function ValuesUnitSearch() {
  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <h1>Search Units</h1>
      <p className="crumb">Values / Units / Search</p>
      <div style={{ marginTop: 28 }}>
        <UnitSearchPanel basePath="/values/units" />
      </div>
    </PageShell>
  );
}
