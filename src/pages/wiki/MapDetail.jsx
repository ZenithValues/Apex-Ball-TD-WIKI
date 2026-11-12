import { useParams, Link, Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import WikiEntryDetail from '../../components/wiki/WikiEntryDetail';
import { WIKI_NAV } from '../../config/navigation';
import { getMapBySlug } from '../../data/maps';
import { useData } from '../../context/DataContext';

/**
 * Map page. A map has a name, artwork, a difficulty tier and a description —
 * the old "Unlock Requirement" field was not a real in-game property and is no
 * longer shown (operator, 2026-11-12).
 */
export default function MapDetail() {
  const { slug } = useParams();
  const { maps } = useData();
  const map = maps.find((entry) => entry.slug === slug) || getMapBySlug(slug);
  if (!map) return <Navigate to="/wiki/maps" replace />;

  const image = map.image || map.image_url || map.imageUrl || null;
  const difficulty = map.difficulty || null;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <WikiEntryDetail
        crumb={<p className="crumb"><Link to="/wiki">WIKI</Link> / <Link to="/wiki/maps">Maps</Link> / {map.name}</p>}
        kicker="Map"
        title={map.name}
        image={image}
        accent="#4ade80"
        badges={[{ label: 'Map' }, difficulty ? { label: difficulty, color: '#4ade80' } : null]}
        summary={map.description || null}
        facts={difficulty ? [{ label: 'Difficulty', value: difficulty, color: '#4ade80' }] : []}
        emptyNote={`No data yet for ${map.name}. A difficulty tier and a short description are enough to fill this page.`}
        footer={(
          <>
            <Link to="/wiki/maps">All maps</Link>
            <span aria-hidden="true">·</span>
            <Link to="/wiki">WIKI home</Link>
          </>
        )}
      />
    </PageShell>
  );
}
