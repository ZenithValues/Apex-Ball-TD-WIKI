import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { ALL_TRAITS } from '../../data/traits';
import { mergeCollection } from '../../utils/collectionRows';
import { useMemo } from 'react';

export default function TraitsList() {
  const { itemRows } = useData();
  const traits = useMemo(() => mergeCollection(ALL_TRAITS, itemRows, 'Trait'), [itemRows]);
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>Traits</h1>
      <p className="crumb">WIKI / Traits</p>
      <p className="unit-desc">Unit traits and the effect each one applies. {traits.length} documented.</p>
      <EntityGrid entities={traits} linkBase="/wiki/traits" emptyLabel="No traits published yet." />
    </PageShell>
  );
}
