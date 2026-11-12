import { useMemo } from 'react';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import WikiSectionHeader from '../../components/wiki/WikiSectionHeader';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { ALL_TRAITS } from '../../data/traits';
import { mergeCollection } from '../../utils/collectionRows';

export default function TraitsList() {
  const { itemRows } = useData();
  const traits = useMemo(() => mergeCollection(ALL_TRAITS, itemRows, 'Trait'), [itemRows]);
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <WikiSectionHeader
        title="Traits"
        subtitle="Unit traits and the effect each one applies."
        count={traits.length}
        accent="#c084fc"
      />
      <EntityGrid entities={traits} linkBase="/wiki/traits" accent="#c084fc" emptyLabel="No traits published yet." />
    </PageShell>
  );
}
