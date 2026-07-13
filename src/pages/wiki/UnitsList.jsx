import { useParams, Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import { WIKI_NAV } from '../../data/navTree';
import { UNITS_BY_RARITY } from '../../data/units';
import { UNIT_RARITIES } from '../../data/taxonomy';
import UnitTags from '../../components/UnitTags';

export default function UnitsList() {
  const { rarity } = useParams();
  if (!UNIT_RARITIES.includes(rarity)) return <Navigate to="/wiki/units/Normie" replace />;

  const units = UNITS_BY_RARITY[rarity] || [];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>{rarity}</h1>
      <p className="crumb">WIKI / Units / {rarity}</p>
      <EntityGrid
        entities={units}
        linkBase={`/wiki/units/${encodeURIComponent(rarity)}`}
        emptyLabel={`No ${rarity} units added yet. Give me the unit list for this rarity and I'll wire them in.`}
        rarityAccent
        renderMeta={(u) => (
          <>
            {u.type && <span className="badge">{u.type}</span>}
            {u.category && <span className="badge dim">{u.category}</span>}
            <UnitTags unit={u} limit={4} />
          </>
        )}
      />
    </PageShell>
  );
}
