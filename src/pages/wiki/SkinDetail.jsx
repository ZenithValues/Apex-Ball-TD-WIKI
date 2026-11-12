import { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import WikiEntryDetail from '../../components/wiki/WikiEntryDetail';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { getSkinBySlug } from '../../data/skins';

export default function SkinDetail() {
  const params = useParams();
  const category = decodeRouteParam(params.category);
  const slug = decodeRouteParam(params.slug);
  const { createdSkins } = useData();
  const skin = useMemo(
    () => (createdSkins || []).find((row) => row.slug === slug) || getSkinBySlug(slug),
    [createdSkins, slug]
  );
  const base = '/wiki/skins';
  if (!skin) return <Navigate to={`${base}/${category}`} replace />;

  // Rarity and Category were the same list twice; the page shows ONE rarity.
  const rarity = skin.rarity || skin.category || category || null;
  const facts = [];
  if (rarity) facts.push({ label: 'Rarity', value: rarity, color: '#c084fc' });
  if (skin.crate) facts.push({ label: 'Crate', value: skin.crate });
  if (skin.obtain?.method || skin.obtain?.source) {
    facts.push({ label: 'How to obtain', value: [skin.obtain?.method, skin.obtain?.source].filter(Boolean).join(' · ') });
  }

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <WikiEntryDetail
        crumb={<p className="crumb"><Link to="/wiki">WIKI</Link> / <Link to={base}>Skins</Link> / <Link to={`${base}/${encodeURIComponent(rarity || category)}`}>{rarity || category}</Link> / {skin.name}</p>}
        kicker="Skin"
        title={skin.name}
        image={skin.imageUrl || skin.image_url || null}
        accent="#c084fc"
        badges={[{ label: 'Skin' }, rarity ? { label: rarity, color: '#c084fc' } : null]}
        summary={skin.description || null}
        facts={facts}
        emptyNote={`No data yet for ${skin.name}. Add its description from the Skins editor.`}
        footer={<><Link to={`${base}/${encodeURIComponent(rarity || category)}`}>More {rarity || category} skins</Link><span aria-hidden="true">·</span><Link to="/wiki">WIKI home</Link></>}
      />
    </PageShell>
  );
}
