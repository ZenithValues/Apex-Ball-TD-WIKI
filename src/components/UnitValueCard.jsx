import { Link } from 'react-router-dom';
import { getCardGlow, getRarityPalette, unitIsShiny } from '../data/taxonomy';
import UnitIcon from './UnitIcon';
import ExistCountBadge from './ExistCountBadge';
import { fetchUnitHistory } from '../utils/apexClient';
import { formatRelativeTime } from '../utils/formatNumber';
import { updatedByline } from '../utils/publicName';
import './EntityGrid.css';
import ValuePillow from './ValuePillow';
import './UnitValueCard.css';

/**
 * The unit value card.
 *
 * Operator layout (2026-11-13), top to bottom, everything centred:
 *   image → name → rarity → ─── → value rows ─── → updated line
 *
 * The Normal / Seasonal / Exclusive / Unobtainable pill is GONE: those units are
 * already separated by the origin dividers in every list, so the badge was
 * saying the same thing twice.
 */
export default function UnitValueCard({ unit, linkBase, highlighted }) {
  const shiny = unitIsShiny(unit);
  const glow = getCardGlow(unit);
  const palette = `linear-gradient(90deg, ${getRarityPalette(unit.rarity).join(', ')})`;
  const targetUrl = `${linkBase}/${unit.slug}`;

  return (
    <Link
      to={targetUrl}
      data-slug={unit.slug}
      data-rarity={unit.rarity}
      className={[
        'unit-card uv-card',
        shiny ? 'uv-card-shiny' : '',
        highlighted ? 'unit-card-highlight' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => warmUnitHistory(unit.slug)}
      style={{
        '--rarity-border': palette,
        '--rarity-glow': glow,
      }}
      data-scroll-reveal={highlighted ? undefined : ''}
    >
      <div className="unit-card-stripe" />
      {shiny && <span className="card-shiny-fx" aria-hidden="true" />}

      <div className="unit-card-header uv-card-head">
        <div className="unit-card-icon-wrap">
          <UnitIcon slug={unit.slug} name={unit.name} glowColor={glow} shiny={shiny} size={72} imageUrl={unit.imageUrl} />
        </div>
        <div className="uv-card-head-text">
          <div className="unit-card-name">{unit.name}</div>
          <div className="uv-card-rarity" style={{ color: glow }}>{unit.rarity}</div>
        </div>
      </div>

      <div className="unit-card-body uv-card-body">
        {unit.hasValue ? (
          <div className="uv-inner-panel-card">
            <ValuePillow unit={unit} />
          </div>
        ) : (
          <div className="uv-no-data">No market data yet</div>
        )}

        <div className="uv-card-foot">
          <div className="uv-card-foot-rule" aria-hidden="true" />
          <div className="uv-card-foot-row">
            <ExistCountBadge slug={unit.slug} compact />
            {unit.updatedAt && (
              <span className="uv-updated" title={new Date(unit.updatedAt).toLocaleString()}>
                {updatedByline(unit, unit.updatedAt, formatRelativeTime(unit.updatedAt))}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const warmedSlugs = new Set();
function warmUnitHistory(slug) {
  if (!slug || warmedSlugs.has(slug)) return;
  warmedSlugs.add(slug);
  fetchUnitHistory('value', slug).catch(() => {});
}
