import { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import WikiEntryDetail from '../../components/wiki/WikiEntryDetail';
import { WIKI_NAV } from '../../config/navigation';
import { getItemBySlug, ALL_ITEMS } from '../../data/items';
import { useData } from '../../context/DataContext';
import { ALL_UNITS } from '../../data/units';
import { useWikiImageOverrides } from '../../hooks/useWikiImageOverrides';
import { slugify } from '../../utils/slug';
import UnitIcon from '../../components/UnitIcon';
import { getRarityGlow } from '../../data/taxonomy';

const GROUP_ACCENT = {
  Crates: '#59d1ff',
  Materials: '#7dd3fc',
  Artifacts: '#ffd24d',
  Currencies: '#facc15',
};

/**
 * Legacy /wiki/items/:group/:slug page — same shared WikiEntryDetail layout as
 * every other WIKI entry. Crates show contents + pity and NEVER a description
 * or specials (those fields do not exist in the game).
 */
export default function ItemDetail() {
  const params = useParams();
  const group = decodeRouteParam(params.group);
  const slug = decodeRouteParam(params.slug);
  const { crates, createdUnits, itemRows } = useData();
  const custom = (itemRows || []).find((row) => row.slug === slug);
  const item = custom || (group === 'Crates' ? (crates.find((entry) => entry.slug === slug) || getItemBySlug(slug)) : getItemBySlug(slug));

  const dropEntries = Object.entries(item?.chances || {});
  const dropNames = dropEntries.map(([name]) => slugify(name));
  const unitNames = useMemo(() => new Set([...ALL_UNITS, ...(createdUnits || [])].map((u) => (u.name || '').toLowerCase())), [createdUnits]);
  const wikiImages = useWikiImageOverrides(dropNames);

  if (!item) return <Navigate to={`/wiki/items/${group}`} replace />;

  const isCrate = group === 'Crates';
  const accent = GROUP_ACCENT[group] || '#a7b0bd';
  const obtainLines = typeof item.obtain === 'string'
    ? item.obtain.split('\n').map((line) => line.trim()).filter(Boolean)
    : item.obtain
      ? [item.obtain.method, item.obtain.source, item.obtain.dropRate].filter(Boolean).map(String)
      : [];

  const sections = [];
  if (isCrate) {
    if (dropEntries.length) sections.push({ title: 'Contents', note: 'Drop chances', type: 'drops', rows: dropEntries });
    if (item.pity) {
      sections.push({
        title: 'Pity',
        type: 'kv',
        rows: String(item.pity).split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
          const [label, ...rest] = line.split(':');
          return [label.trim(), rest.join(':').trim() || '—'];
        }),
      });
    }
  } else {
    if (item.effect) sections.push({ title: 'Effect', type: 'text', text: item.effect });
    if (obtainLines.length) sections.push({ title: 'How to obtain', type: 'list', rows: obtainLines });
  }

  // Crate contents that ARE units get a small unit rail below the panels.
  const unitDrops = isCrate
    ? dropEntries.filter(([name]) => unitNames.has(String(name).toLowerCase()))
    : [];

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <WikiEntryDetail
        crumb={<p className="crumb"><Link to="/wiki">WIKI</Link> / <Link to="/wiki/items/Artifacts">Items</Link> / <Link to={`/wiki/items/${group}`}>{group}</Link> / {item.name}</p>}
        kicker={group}
        title={item.name}
        image={item.imageUrl || item.image_url || item.image || null}
        accent={accent}
        badges={[{ label: group }, isCrate ? { label: 'Crate', color: accent } : null]}
        summary={isCrate ? null : item.description || null}
        facts={!isCrate && item.baseValue != null && item.baseValue !== '' ? [{ label: 'Base value', value: item.baseValue }] : []}
        sections={sections}
        emptyNote={`No data yet for ${item.name}.`}
        footer={(
          <>
            <Link to={`/wiki/items/${group}`}>All {group.toLowerCase()}</Link>
            <span aria-hidden="true">·</span>
            <Link to="/wiki">WIKI home</Link>
          </>
        )}
      />

      {unitDrops.length > 0 && (
        <section className="wxd-panel wxd-wide" style={{ marginTop: 16 }}>
          <header className="wxd-panel-head">
            <span className="wxd-panel-title">Units in this crate</span>
            <span className="wxd-panel-note">Click a unit for its stat sheet</span>
          </header>
          <div className="crate-unit-rail">
            {unitDrops.map(([name, rate]) => {
              const unitSlug = slugify(name);
              const matched = ALL_UNITS.find((u) => u.slug === unitSlug || u.name.toLowerCase() === String(name).toLowerCase());
              if (!matched) return null;
              return (
                <Link key={name} to={`/wiki/units/${encodeURIComponent(matched.rarity)}/${encodeURIComponent(matched.slug)}`} className="crate-unit-chip">
                  <UnitIcon
                    slug={matched.slug}
                    name={matched.name}
                    size={38}
                    glowColor={getRarityGlow(matched.rarity)}
                    imageUrl={wikiImages[matched.slug] || matched.imageUrl}
                  />
                  <span className="crate-unit-chip-text">
                    <strong>{name}</strong>
                    <small style={{ color: getRarityGlow(matched.rarity) }}>{rate}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </PageShell>
  );
}
