import { Link, Navigate, useParams } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../config/navigation';
import { getReforgeBySlug } from '../../data/reforges';

export default function ReforgeDetail() {
  const { slug } = useParams();
  const reforge = getReforgeBySlug(slug);
  if (!reforge) return <Navigate to="/wiki/reforges" replace />;
  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <p className="crumb"><Link to="/wiki/reforges">Reforges</Link> / {reforge.name}</p>
      <h1>{reforge.name}</h1>
      <p className="unit-desc">{reforge.description}</p>
    </PageShell>
  );
}
