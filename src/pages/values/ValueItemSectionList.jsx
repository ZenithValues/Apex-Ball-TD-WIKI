import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import ValuePillow from '../../components/ValuePillow';
import { VALUES_NAV } from '../../config/navigation';
import { WIKI_ITEM_SECTIONS, wikiSectionByPath } from '../../config/wikiSections';
import { ALL_ITEMS, CRATES } from '../../data/items';
import { itemIconFor } from '../../config/itemIcons';
import { useData } from '../../context/DataContext';
import { resolveImageUrl } from '../../utils/localAssets';
import './ValueItemSectionList.css';

/**
 * Values → <item type>.
 *
 * Operator (rev 8): "add the other pages" — the Values side only had Units and
 * Currencies, so an editor could set a value on an Artifact / Gamepass / Crate
 * (the rev-7 category tabs) and there was nowhere public to read it. Each WIKI
 * item section now has a Values page with the SAME value pillow as a unit card.
 */

const SECTION_ACCENTS = {
  artifacts: '#ffd24d',
  gamepasses: '#7cd4ff',
  materials: '#7dd3fc',
  currencies: '#facc15',
  crates: '#59d1ff',
  items: '#c084fc',
};

const SECTION_BLURBS = {
  artifacts: 'Artifacts and keys — everything that opens something else in the game.',
  gamepasses: 'Store gamepasses and what each one unlocks.',
  consumables: 'One-use items: keys, potions, boosts and storage.',
  materials: 'Crafting materials dropped by maps, bosses and events.',
  crates: 'Every crate in the game, with its live trade value.',
  items: 'Editor-created items and skins.',
};

/** Merge the three sources a section can live in (same rule as the WIKI page). */
function collectSectionItems(section, { itemRows, crates, materialRowMap }) {
  const staticItems = (section.staticGroups || []).flatMap((group) =>
    ALL_ITEMS.filter((item) => item.group === group)
  );
  const custom = (itemRows || []).filter((row) => section.adminGroups.includes(row.group));

  let lane = [];
  if (section.path === 'crates') {
    lane = (crates || []).length ? crates : CRATES;
  } else if (section.path === 'materials') {
    lane = Object.values(materialRowMap || {}).map((row) => ({
      ...row,
      group: 'Materials',
      name: row.name || row.slug,
      imageUrl: row.imageUrl || row.image_url || null,
    }));
  }

  const bySlug = new Map();
  [...staticItems, ...lane, ...custom].forEach((item) => {
    if (!item?.slug) return;
    bySlug.set(item.slug, { ...(bySlug.get(item.slug) || {}), ...item });
  });
  return [...bySlug.values()].sort((a, b) =>
    String(a.name || a.slug).localeCompare(String(b.name || b.slug), undefined, { numeric: true, sensitivity: 'base' })
  );
}

export default function ValueItemSectionList({ sectionPath = null, section: sectionProp = null }) {
  const section = sectionProp || wikiSectionByPath(sectionPath);
  const { itemRows = [], crates = [], materialRowMap = {}, getValueEntryBySlug } = useData();

  const items = useMemo(() => {
    if (!section) return [];
    return collectSectionItems(section, { itemRows, crates, materialRowMap }).map((item) => {
      const entry = getValueEntryBySlug?.(item.slug) || null;
      return { ...item, entry: entry && entry.hasValue ? entry : null };
    });
  }, [section, itemRows, crates, materialRowMap, getValueEntryBySlug]);

  if (!section) return <Navigate to="/values" replace />;

  const accent = SECTION_ACCENTS[section.path] || '#59d1ff';
  const priced = items.filter((item) => item.entry).length;

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <PageIntro
        eyebrow="Values"
        title={`${section.label} values`}
        cutoutVariant="poseidon"
        actions={
          <Link to={`/wiki/${section.path}`} className="hero-btn primary">
            {section.label} WIKI →
          </Link>
        }
      >
        <p>{SECTION_BLURBS[section.path] || 'Trade values for this section.'}</p>
      </PageIntro>

      <div className="value-item-head" style={{ '--section-accent': accent }}>
        <span className="value-item-icon" aria-hidden="true">{itemIconFor(section.label)}</span>
        <div>
          <h2>{section.label}</h2>
          <span className="value-item-count">
            {items.length} entries · {priced} with a live trade value
          </span>
        </div>
        <div className="value-item-tabs">
          {WIKI_ITEM_SECTIONS.filter((entry) => entry.path !== 'currencies').map((entry) => (
            <Link
              key={entry.path}
              to={`/values/${entry.path}`}
              className={entry.path === section.path ? 'value-item-tab active' : 'value-item-tab'}
            >
              <span aria-hidden="true">{itemIconFor(entry.label)}</span> {entry.label}
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">Nothing in this section yet — create one in the admin panel.</div>
      ) : (
        <div className="value-item-grid">
          {items.map((item) => (
            <article key={item.slug} className="value-item-card card" data-item-slug={item.slug}>
              <div className="value-item-card-head">
                <div className="value-item-art" aria-hidden="true">
                  {item.imageUrl || item.image ? (
                    <img src={resolveImageUrl(item.imageUrl || item.image)} alt="" loading="lazy" />
                  ) : (
                    <span className="value-item-glyph">{itemIconFor(item.group || section.label)}</span>
                  )}
                </div>
                <div className="value-item-card-text">
                  <strong>{item.name || item.slug}</strong>
                  <small style={{ color: accent }}>{item.group || section.label}</small>
                </div>
              </div>

              {item.entry ? (
                <ValuePillow unit={item.entry} />
              ) : (
                <div className="uv-no-data">No market data yet</div>
              )}
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
