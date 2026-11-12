import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../config/navigation';
import { useData } from '../../context/DataContext';
import { SKINS_BY_CATEGORY } from '../../data/skins';

export default function SkinsList() {
  const params = useParams();
  const category = decodeRouteParam(params.category);
  const { createdSkins } = useData();
  const source = SKINS_BY_CATEGORY;
  if (!source[category]) return <Navigate to="/wiki/skins/Normie" replace />;

  const created = (createdSkins || []).filter((skin) => (skin.category || 'Normie') === category);
  const createdSlugs = new Set(created.map((skin) => skin.slug));
  const skins = [...created, ...source[category].filter((skin) => !createdSlugs.has(skin.slug))];
  const base = '/wiki/skins';
  const title = category;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>{title}</h1>
      <p className="crumb">WIKI / Skins / {category}</p>
      <EntityGrid entities={skins} linkBase={`${base}/${category}`} />
    </PageShell>
  );
}
