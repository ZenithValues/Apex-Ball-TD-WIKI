import { useMemo } from 'react';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitSearchPanel from '../../components/UnitSearchPanel';
import { WIKI_NAV } from '../../data/navTree';
import { ALL_UNITS } from '../../data/units';
import { useWikiCustomUnits } from '../../hooks/useWikiCustomUnits';

export default function WikiUnitSearch() {
  const { customUnits } = useWikiCustomUnits();
  const units = useMemo(() => [...ALL_UNITS, ...customUnits], [customUnits]);

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <PageIntro eyebrow="WIKI / Units" title="Search Units">
        <p>Jump to any unit rarity page and highlight the matching card.</p>
      </PageIntro>
      <div style={{ marginTop: 28 }}>
        <UnitSearchPanel basePath="/wiki/units" units={units} />
      </div>
    </PageShell>
  );
}
