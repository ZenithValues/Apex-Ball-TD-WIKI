import { Link } from 'react-router-dom';
import { getRarityPalette, getCardGlow, unitIsShiny } from '../data/taxonomy';
import { getBaseStats, getUnitDps } from '../utils/unitStats';
import { formatSiteNumber } from '../utils/formatNumber';
import { useScrollToHighlight } from '../utils/useScrollToHighlight';
import { TermTip } from './StatMeta';
import { groupByOrigin } from '../utils/originTag';
import OriginDivider from './OriginDivider';
import UnitIcon from './UnitIcon';
import ExistCountBadge from './ExistCountBadge';
import StatPillow from './StatPillow';
import './EntityGrid.css';
import './UnitValueCard.css';
import { resolveImageUrl } from '../utils/localAssets';

export default function EntityGrid({ entities, linkBase, renderMeta, emptyLabel, rarityAccent, originDividers = false, accent = null }) {
  const highlighted = useScrollToHighlight();

  if (!entities || entities.length === 0) {
    return <div className="empty-state">{emptyLabel || 'No entries yet.'}</div>;
  }

  if (rarityAccent) {
    const renderCard = (e) => {
      const palette = getRarityPalette(e.rarity);
      const shiny = unitIsShiny(e);
      const glow = getCardGlow(e);
      const stats = getBaseStats(e);
      const dpsInfo = getUnitDps(e);
      const isHighlighted = highlighted === e.slug;
      const targetUrl = `${linkBase}/${e.slug}`;

      // Same rows, same order, same hairline as the value card — the WIKI card
      // is a STAT pillow where the value card has a VALUE pillow (rev 7).
      const statRows = [
        stats?.damage != null && { term: 'damage', label: 'Damage', value: String(stats.damage) },
        stats?.cooldown != null && { term: 'cooldown', label: 'Cooldown', value: `${stats.cooldown}s` },
        stats?.range != null && { term: 'range', label: 'Range', value: String(stats.range) },
        stats?.placementLimit != null && { term: 'placement', label: 'Placement', value: String(stats.placementLimit) },
        dpsInfo?.dps != null && {
          term: 'dps',
          label: 'DPS',
          value: formatSiteNumber(dpsInfo.dps),
          title: 'Damage per second',
        },
        dpsInfo?.dps != null && {
          term: 'costPerDps',
          label: '$/DPS',
          value: dpsInfo.costPerDps != null ? formatSiteNumber(dpsInfo.costPerDps) : '—',
          title: 'Cost per point of DPS',
        },
      ].filter(Boolean);

      return (
        <Link
          key={e.slug}
          to={targetUrl}
          data-slug={e.slug}
          data-rarity={e.rarity}
          className={['unit-card', 'uv-card', 'uv-wiki-card', shiny ? 'unit-card-shiny' : '', isHighlighted ? 'unit-card-highlight' : ''].filter(Boolean).join(' ')}
          style={{
            '--rarity-border': `linear-gradient(90deg, ${palette.join(', ')})`,
            '--rarity-glow': glow,
          }}
          data-scroll-reveal={isHighlighted ? undefined : ''}
        >
          <div className="unit-card-stripe" />
          {shiny && <span className="card-shiny-fx" aria-hidden="true" />}

          {/* Centred head: artwork → name → rarity. No origin chip — the
              origin dividers already say it. */}
          <div className="unit-card-header uv-card-head">
            <div className="unit-card-icon-wrap">
              <UnitIcon slug={e.slug} name={e.name} glowColor={glow} shiny={shiny} size={72} imageUrl={e.imageUrl} />
            </div>
            <div className="uv-card-head-text">
              <div className="unit-card-name">{e.name}</div>
              <div className="uv-card-rarity" style={{ color: glow }}>{e.rarity}</div>
            </div>
          </div>

          <div className="unit-card-body uv-card-body">
            {statRows.length ? (
              <StatPillow rows={statRows} />
            ) : (
              <div className="uv-no-data">No stats recorded yet</div>
            )}

            {renderMeta && <div className="unit-card-meta" style={{ marginTop: 2 }}>{renderMeta(e)}</div>}

            <div className="uv-card-foot">
              <div className="uv-card-foot-rule" aria-hidden="true" />
              <div className="uv-card-foot-row">
                <ExistCountBadge slug={e.slug} compact />
                {!e.documented && <span className="badge dim">Pending</span>}
              </div>
            </div>
          </div>
        </Link>
      );
    };

    // Seasonal / Exclusive / Limited / Unobtainable groups get a divider bar
    // so a rarity page never mixes event units in with the standard ones.
    const groups = originDividers ? groupByOrigin(entities) : [];
    if (groups.length > 1) {
      return (
        <>
          {groups.map((group, index) => (
            <div key={group.tag} className="origin-section" data-origin={group.tag}>
              {!(index === 0 && group.tag === 'Normal') && (
                <OriginDivider label={group.tag} color={group.color} />
              )}
              <div className="unit-card-grid">{group.units.map(renderCard)}</div>
            </div>
          ))}
        </>
      );
    }

    return <div className="unit-card-grid">{entities.map(renderCard)}</div>;
  }

  return (
    <div className="entity-grid">
      {entities.map((e) => {
        const isMap = linkBase.includes('maps');
        const isCrate = linkBase.includes('crates') || linkBase.includes('Crates');
        // Only UNIT grids get an exist count — never maps, crates or materials.
        const showExist = !isMap && !isCrate && /unit/i.test(String(linkBase || ''));
        const imageUrl = e.image || e.imageUrl || e.image_url || null;
        const initials = String(e.name || '?').slice(0, 2).toUpperCase();

        return (
          <Link
            key={e.slug}
            to={`${linkBase}/${e.slug}`}
            className="entity-card card entity-card-accented"
            style={accent ? { '--card-accent': accent } : undefined}
            data-scroll-reveal
          >
            {accent && <span className="entity-card-stripe" aria-hidden="true" />}
            <div className="entity-card-image-wrap">
              {imageUrl ? (
                <img src={resolveImageUrl(imageUrl)} alt={e.name} className="entity-card-img" />
              ) : (
                <div className="entity-card-placeholder" aria-hidden="true">
                  <span className="entity-card-monogram">{initials}</span>
                </div>
              )}
            </div>

            <div className="entity-card-inner">
              <div className="entity-card-top">
                <span className="entity-name">{e.name}</span>
                {!e.documented && <span className="badge dim entity-pending">Pending</span>}
              </div>

              {showExist && <ExistCountBadge slug={e.slug} compact />}

              <div className="entity-card-meta">
                {isMap && e.difficulty && (
                  <span className="badge entity-difficulty-badge">
                    {e.difficulty}
                  </span>
                )}
                {isCrate && e.obtain && (
                  <span className="entity-obtain-note">
                    Obtain: <strong>{typeof e.obtain === 'object' ? (e.obtain.method || e.obtain.source || '') : e.obtain}</strong>
                  </span>
                )}
                {renderMeta && renderMeta(e)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
