import { useMemo } from 'react';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { REFORGES } from '../../data/reforges';
import { mergeCollection } from '../../utils/collectionRows';

export default function ReforgesList() {
  const { itemRows } = useData();
  const reforges = useMemo(() => mergeCollection(REFORGES, itemRows, 'Reforge'), [itemRows]);
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>Reforges</h1>
      <p className="crumb">WIKI / Reforges</p>
      <p className="unit-desc">Reforges and the stat bonuses they roll.</p>
      <EntityGrid entities={reforges} linkBase="/wiki/reforges" emptyLabel="No reforges published yet." />
    </PageShell>
  );
}
