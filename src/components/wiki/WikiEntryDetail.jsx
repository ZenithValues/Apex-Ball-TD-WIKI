import { resolveImageUrl } from '../../utils/localAssets';
import './WikiEntryDetail.css';

/**
 * ONE shared detail layout for every non-unit WIKI entry — crates, maps,
 * materials, artifacts, gamepasses, consumables, currencies, items, skins and
 * traits. Before this, each page was a heading plus a raw <table>, which is why
 * the item pages looked unfinished next to the unit pages (operator,
 * 2026-11-12).
 *
 * Everything is data-driven so each page only describes ITS OWN fields:
 *
 *   <WikiEntryDetail
 *     kicker="Crate"
 *     title="Frozen Crate"
 *     image={url}
 *     accent="#59d1ff"
 *     badges={[{ label: 'Crate' }]}
 *     summary="…"
 *     facts={[{ label: 'Where it comes from', value: 'Tundra' }]}
 *     sections={[{ title: 'Contents', type: 'drops', rows: [['Ice Ball', '75%']] }]}
 *     footer={<…>}
 *   />
 */
export default function WikiEntryDetail({
  kicker = 'WIKI',
  title,
  image = null,
  accent = '#a7b0bd',
  badges = [],
  summary = null,
  facts = [],
  sections = [],
  footer = null,
  crumb = null,
  emptyNote = null,
}) {
  const visibleFacts = facts.filter((fact) => fact && fact.value !== null && fact.value !== undefined && String(fact.value).trim() !== '');
  const visibleSections = sections.filter((section) => section && hasContent(section));
  const nothing = !summary && !visibleFacts.length && !visibleSections.length;

  return (
    <div className="wxd" style={{ '--wxd-accent': accent }}>
      {crumb}

      <header className="wxd-hero">
        <span className="wxd-hero-glow" aria-hidden="true" />
        <div className="wxd-art">
          {image
            ? <img src={resolveImageUrl(image)} alt={title} className="wxd-art-img" loading="lazy" decoding="async" />
            : <span className="wxd-art-mono" aria-hidden="true">{initials(title)}</span>}
        </div>
        <div className="wxd-hero-copy">
          <span className="wxd-kicker">{kicker}</span>
          <h1 className="wxd-title">{title}</h1>
          {badges.length > 0 && (
            <div className="wxd-badges">
              {badges.filter(Boolean).map((badge, index) => (
                <span
                  key={`${badge.label}-${index}`}
                  className="wxd-badge"
                  style={badge.color ? {
                    color: badge.color,
                    borderColor: `color-mix(in srgb, ${badge.color} 42%, transparent)`,
                    background: `color-mix(in srgb, ${badge.color} 10%, transparent)`,
                  } : undefined}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
          {summary && <p className="wxd-summary">{summary}</p>}
        </div>
      </header>

      {nothing && emptyNote && (
        <div className="wxd-empty">{emptyNote}</div>
      )}

      {(visibleFacts.length > 0 || visibleSections.length > 0) && (
        <div className="wxd-grid">
          {visibleFacts.length > 0 && (
            <section className="wxd-panel wxd-panel-facts">
              <header className="wxd-panel-head">
                <span className="wxd-panel-title">Details</span>
              </header>
              <dl className="wxd-facts">
                {visibleFacts.map((fact) => (
                  <div key={fact.label} className="wxd-fact">
                    <dt>{fact.label}</dt>
                    <dd style={fact.color ? { color: fact.color } : undefined}>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {visibleSections.map((section) => (
            <section key={section.title} className={`wxd-panel wxd-panel-${section.type || 'kv'}${section.wide ? ' wxd-wide' : ''}`}>
              <header className="wxd-panel-head">
                <span className="wxd-panel-title">{section.title}</span>
                {section.note && <span className="wxd-panel-note">{section.note}</span>}
              </header>

              {section.type === 'drops' ? (
                <ul className="wxd-drops">
                  {section.rows.map(([name, amount]) => (
                    <li key={name} className="wxd-drop">
                      <span className="wxd-drop-name">{name}</span>
                      <span className="wxd-drop-bar" aria-hidden="true">
                        <span className="wxd-drop-fill" style={{ width: `${percentOf(amount)}%` }} />
                      </span>
                      <span className="wxd-drop-value">{amount}</span>
                    </li>
                  ))}
                </ul>
              ) : section.type === 'list' ? (
                <ul className="wxd-list">
                  {section.rows.map((line) => <li key={line}>{line}</li>)}
                </ul>
              ) : section.type === 'text' ? (
                <p className="wxd-text">{section.text}</p>
              ) : (
                <dl className="wxd-facts">
                  {section.rows.map(([label, value]) => (
                    <div key={`${label}-${value}`} className="wxd-fact">
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}
        </div>
      )}

      {footer && <footer className="wxd-foot">{footer}</footer>}
    </div>
  );
}

function hasContent(section) {
  if (section.type === 'text') return Boolean(section.text && String(section.text).trim());
  return Array.isArray(section.rows) && section.rows.length > 0;
}

function percentOf(value) {
  const match = String(value || '').match(/([\d.]+)\s*%/);
  if (!match) return 0;
  return Math.min(100, Math.max(0, Number(match[1])));
}

function initials(name) {
  return String(name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?';
}
