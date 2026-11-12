import { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import WikiEntryDetail from '../../components/wiki/WikiEntryDetail';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { ALL_TRAITS } from '../../data/traits';
import { mergeCollection } from '../../utils/collectionRows';
import { decodeRouteParam } from '../../utils/routeParams';

export default function TraitDetail() {
  const { slug } = useParams();
  const { itemRows } = useData();
  const traits = useMemo(() => mergeCollection(ALL_TRAITS, itemRows, 'Trait'), [itemRows]);
  const trait = traits.find((row) => row.slug === decodeRouteParam(slug));
  if (!trait) return <Navigate to="/wiki/traits" replace />;

  const sections = [];
  if (trait.effect) sections.push({ title: 'Effect', type: 'text', text: trait.effect });
  if (trait.obtain) sections.push({ title: 'How to obtain', type: 'text', text: trait.obtain });

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <WikiEntryDetail
        crumb={<p className="crumb"><Link to="/wiki">WIKI</Link> / <Link to="/wiki/traits">Traits</Link> / {trait.name}</p>}
        kicker="Trait"
        title={trait.name}
        image={trait.imageUrl || trait.image_url || null}
        accent="#c084fc"
        badges={[{ label: 'Trait' }]}
        summary={trait.description || null}
        sections={sections}
        emptyNote={`No data yet for ${trait.name}. Add its effect and description from the admin Traits editor.`}
        footer={<><Link to="/wiki/traits">All traits</Link><span aria-hidden="true">·</span><Link to="/wiki">WIKI home</Link></>}
      />
    </PageShell>
  );
}
