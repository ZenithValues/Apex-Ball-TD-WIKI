import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import UnitTags from '../../components/UnitTags';
import { WIKI_NAV } from '../../config/navigation';
import { UNITS_BY_RARITY } from '../../data/units';
import { UNIT_RARITIES } from '../../data/taxonomy';
import { useWikiCustomUnits } from '../../hooks/useWikiCustomUnits';
import { useWikiImageOverrides } from '../../hooks/useWikiImageOverrides';
import { decodeRouteParam } from '../../utils/routeParams';

export default function UnitsList() {
  const params = useParams();
  const rarity = decodeRouteParam(params.rarity);
  const isValidRarity = UNIT_RARITIES.includes(rarity);
  const { customUnits } = useWikiCustomUnits();

  const units = useMemo(() => {
    if (!isValidRarity) return [];
    const generated = UNITS_BY_RARITY[rarity] || [];
    const custom = customUnits.filter((unit) => unit.rarity === rarity);
    return [...generated, ...custom];
  }, [customUnits, rarity, isValidRarity]);

  const slugs = useMemo(() => units.map((unit) => unit.slug), [units]);
  const { imageMap } = useWikiImageOverrides(slugs);
  const unitsWithImages = useMemo(
    () => units.map((unit) => ({ ...unit, imageUrl: imageMap[unit.slug] || unit.imageUrl })),
    [units, imageMap]
  );

  if (!isValidRarity) return <Navigate to="/wiki/units/Normie" replace />;

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>{rarity}</h1>
      <p className="crumb">WIKI / Units / {rarity}</p>
      <EntityGrid
        key={`wiki-${rarity}`}
        entities={unitsWithImages}
        linkBase={`/wiki/units/${encodeURIComponent(rarity)}`}
        emptyLabel={`No ${rarity} units added yet.`}
        rarityAccent
        renderMeta={(u) => (
          <>
            {u.customUnit && <span className="badge filled">Custom</span>}
            {u.type && <span className="badge">{u.type}</span>}
            {u.category && <span className="badge dim">{u.category}</span>}
            <UnitTags unit={u} limit={4} />
          </>
        )}
      />
    </PageShell>
  );
}
