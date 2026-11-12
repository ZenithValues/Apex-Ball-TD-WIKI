import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import WikiEntryDetail from '../../components/wiki/WikiEntryDetail';
import { WIKI_NAV } from '../../config/navigation';
import { ITEM_GROUPS } from '../../data/items';
import { useData } from '../../context/DataContext';
import { wikiSectionByPath } from '../../config/wikiSections';

const SECTION_ACCENTS = {
  artifacts: '#ffd24d',
  gamepasses: '#7cd4ff',
  consumables: '#4ade80',
  materials: '#7dd3fc',
  currencies: '#facc15',
  crates: '#59d1ff',
  items: '#c084fc',
};

function asLines(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value).split('\n').map((line) => line.trim()).filter(Boolean);
}

function chanceEntries(chances) {
  if (!chances) return [];
  if (Array.isArray(chances)) return chances;
  if (typeof chances === 'object') return Object.entries(chances);
  return asLines(chances).map((line) => {
    const [name, ...rest] = line.split(':');
    return [name.trim(), rest.join(':').trim()];
  });
}

function obtainFacts(obtain) {
  if (!obtain) return [];
  if (Array.isArray(obtain)) return obtain.filter(Boolean).map(String);
  if (typeof obtain === 'string') return asLines(obtain);
  const lines = [];
  if (obtain.method) lines.push(`${obtain.method}`);
  if (obtain.source) lines.push(String(obtain.source));
  if (obtain.dropRate) lines.push(String(obtain.dropRate));
  if (obtain.notes) lines.push(String(obtain.notes));
  return lines;
}

/**
 * Item detail page for the restored sections. Reads the SAME live lanes the
 * admin editors write to (crates / materials / itemOverrides), and renders them
 * through the shared WikiEntryDetail layout.
 *
 * Per the operator (2026-11-12) a crate has NO description and NO specials /
 * bonuses — those fields do not exist in the game — so this page shows only the
 * crate's name, artwork, where it comes from, its contents and its pity.
 */
export default function WikiItemSectionDetail({ sectionPath = null }) {
  const params = useParams();
  const path = sectionPath || decodeRouteParam(params.section);
  const section = wikiSectionByPath(path);
  const slug = decodeRouteParam(params.slug);
  const { itemRows, crates = [], materialRowMap = {} } = useData();

  const item = useMemo(() => {
    if (!section || !slug) return null;
    const fromItems = (itemRows || []).find(
      (row) => row.slug === slug && section.adminGroups.includes(row.group)
    );
    if (fromItems) return fromItems;
    if (section.path === 'crates') {
      return (crates || []).find((row) => row.slug === slug) || null;
    }
    if (section.path === 'materials') {
      const row = (materialRowMap || {})[slug];
      if (row) return { ...row, name: row.name || row.slug, imageUrl: row.imageUrl || row.image_url || null };
    }
    const staticItems = section.staticGroups.flatMap((group) => ITEM_GROUPS[group] || []);
    return staticItems.find((row) => row.slug === slug) || null;
  }, [section, slug, itemRows, crates, materialRowMap]);

  if (!section) return <Navigate to="/wiki" replace />;
  if (!item) return <Navigate to={`/wiki/${section.path}`} replace />;

  const isCrate = section.path === 'crates';
  const accent = SECTION_ACCENTS[section.path] || '#a7b0bd';
  const base = `/wiki/${section.path}`;
  const image = item.imageUrl || item.image_url || item.image || null;
  const drops = isCrate ? chanceEntries(item.chances) : [];
  const pity = isCrate ? asLines(item.pity) : [];
  const obtainLines = obtainFacts(item.obtain);

  const facts = [];
  if (isCrate && obtainLines.length) facts.push({ label: 'Where it comes from', value: obtainLines.join(' · ') });
  if (!isCrate && item.baseValue != null && item.baseValue !== '') facts.push({ label: 'Base value', value: item.baseValue });

  const sections = [];
  if (isCrate) {
    if (drops.length) sections.push({ title: 'Contents', note: 'Drop chances', type: 'drops', rows: drops });
    if (pity.length) {
      sections.push({
        title: 'Pity',
        type: 'kv',
        rows: pity.map((line) => {
          const [label, ...rest] = line.split(':');
          return [label.trim(), rest.join(':').trim() || '—'];
        }),
      });
    }
  } else {
    if (item.effect) sections.push({ title: 'Effect', type: 'text', text: item.effect });
    if (item.specials) sections.push({ title: 'Specials', type: 'text', text: item.specials });
    if (item.bonus) sections.push({ title: 'Bonus', type: 'text', text: item.bonus });
    if (obtainLines.length) sections.push({ title: 'How to obtain', type: 'list', rows: obtainLines });
  }

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <WikiEntryDetail
        crumb={<p className="crumb"><Link to="/wiki">WIKI</Link> / <Link to={base}>{section.label}</Link> / {item.name}</p>}
        kicker={section.label}
        title={item.name}
        image={image}
        accent={accent}
        badges={[
          item.rarity ? { label: item.rarity, color: accent } : null,
          { label: isCrate ? 'Crate' : (item.group || section.label) },
        ]}
        summary={isCrate ? null : item.description || null}
        facts={facts}
        sections={sections}
        emptyNote={`No data yet for ${item.name}. An editor can add it from the admin panel.`}
        footer={(
          <>
            <Link to={base}>All {section.label.toLowerCase()}</Link>
            <span aria-hidden="true">·</span>
            <Link to="/wiki">WIKI home</Link>
          </>
        )}
      />
    </PageShell>
  );
}
