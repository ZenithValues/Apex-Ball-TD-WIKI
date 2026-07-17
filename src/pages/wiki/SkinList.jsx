import { useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import EntityGrid from '../../components/EntityGrid';
import Dropdown from '../../components/Dropdown';
import { WIKI_NAV } from '../../config/navigation';
import { SKINS_BY_CATEGORY, SHINY_SKINS_BY_CATEGORY, ALL_SKINS, ALL_SHINY_SKINS } from '../../data/skins';
import { SKIN_CATEGORIES, getRarityGlow } from '../../data/taxonomy';

export default function SkinsList({ shiny = false }) {
  const params = useParams();
  const rawCategory = params.category ? decodeRouteParam(params.category) : 'all';
  const [rarityFilter, setRarityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sourceMap = shiny ? SHINY_SKINS_BY_CATEGORY : SKINS_BY_CATEGORY;
  const allList = shiny ? ALL_SHINY_SKINS : ALL_SKINS;

  const categorySkins = useMemo(() => {
    if (rawCategory === 'all' || !rawCategory) return allList;
    return sourceMap[rawCategory] || [];
  }, [rawCategory, sourceMap, allList]);

  const filteredSkins = useMemo(() => {
    return categorySkins.filter((skin) => {
      const matchesSearch = !searchQuery || skin.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = rarityFilter === 'all' || skin.category === rarityFilter || skin.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    });
  }, [categorySkins, searchQuery, rarityFilter]);

  const title = shiny ? (rawCategory === 'all' ? 'All Shiny Skins' : `Shiny ${rawCategory} Skins`) : (rawCategory === 'all' ? 'All Skins' : `${rawCategory} Skins`);
  const base = shiny ? '/wiki/shiny-skins' : '/wiki/skins';

  const rarityOptions = [
    { value: 'all', label: 'All Rarities' },
    ...SKIN_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
  ];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <div className="wiki-list-head">
        <div>
          <h1>{title}</h1>
          <p className="crumb">WIKI / {shiny ? 'Shiny Skins' : 'Skins'} / {rawCategory}</p>
        </div>

        <div className="wiki-list-controls" style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="wiki-search-input"
            placeholder="Instant search skins…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <Dropdown
            value={rarityFilter}
            onChange={setRarityFilter}
            options={rarityOptions}
            ariaLabel="Filter skins by rarity"
          />
        </div>
      </div>

      <EntityGrid entities={filteredSkins} linkBase={base} />
    </PageShell>
  );
}
