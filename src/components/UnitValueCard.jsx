import { Link } from 'react-router-dom';
import {
  getRarityPalette,
  getCardGlow,
  unitIsShiny,
  DEMAND_COLORS,
  DEMAND_PERCENT,
  SCARCITY_COLORS,
  SCARCITY_PERCENT,
} from '../data/taxonomy';
import UnitIcon from './UnitIcon';
import ExistCountBadge from './ExistCountBadge';
import { fetchUnitHistory } from '../utils/apexClient';
import { formatRelativeTime, formatCompactNumber, formatFullNumber } from '../utils/formatNumber';
import { updatedByline } from '../utils/publicName';
import './EntityGrid.css';
import { TermTip } from './StatMeta';
import { originTag } from '../utils/originTag';
import OverpayPills from './OverpayPills';
import './UnitValueCard.css';

export default function UnitValueCard({ unit, linkBase, highlighted }) {
  const palette = getRarityPalette(unit.rarity);
  const shiny = unitIsShiny(unit);
  const glow = getCardGlow(unit);
  const gradientBorder = `linear-gradient(90deg, ${palette.join(', ')})`;

  const demandColor = (unit.demand && DEMAND_COLORS[unit.demand]) || '#9aa3b2';
  const demandPercent = unit.demand ? DEMAND_PERCENT[unit.demand] : 0;
  const scarcityColor = (unit.scarcity && SCARCITY_COLORS[unit.scarcity]) || '#9aa3b2';
  const scarcityPercent = unit.scarcity ? SCARCITY_PERCENT[unit.scarcity] : 0;

  const targetUrl = `${linkBase}/${unit.slug}`;
  const tag = originTag(unit);

  return (
    <Link
      to={targetUrl}
      data-slug={unit.slug}
      className={[
        'unit-card uv-card',
        shiny ? 'uv-card-shiny' : '',
        highlighted ? 'unit-card-highlight' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => warmUnitHistory(unit.slug)}
      style={{
        '--rarity-border': gradientBorder,
        '--rarity-glow': glow,
      }}
      data-scroll-reveal={highlighted ? undefined : ''}
    >
      <div className="unit-card-stripe" />
      {shiny && <span className="card-shiny-fx" aria-hidden="true" />}
      <div className="unit-card-header">
        <div className="unit-card-icon-wrap">
          <UnitIcon slug={unit.slug} name={unit.name} glowColor={glow} shiny={shiny} size={72} imageUrl={unit.imageUrl} />
        </div>
        <div className="unit-card-header-text">
          <div className="unit-card-name">{unit.name}</div>
          <div className="unit-card-badges-inline">
            <div className="unit-card-rarity" style={{ color: glow }}>
              {unit.rarity}
            </div>
            <span
              className="origin-tag"
              style={{
                color: tag.color,
                borderColor: `color-mix(in srgb, ${tag.color} 38%, transparent)`,
                background: `color-mix(in srgb, ${tag.color} 10%, transparent)`,
              }}
              title={`${tag.label} unit`}
            >
              {tag.label}
            </span>
          </div>
        </div>
      </div>

      <div className="unit-card-body">
        <ExistCountBadge slug={unit.slug} compact />
        {unit.hasValue ? (
          <div className="uv-inner-panel-card">
            {/* Value / Gems / Coins, then a clean hairline, then Demand and
                Scarcity — all inside ONE bordered pillow (operator,
                2026-11-12: they used to be two separate boxes split by a
                choppy dashed rule). */}
            <div className="uv-stat-rows">
              <div className="uv-figures">
              {unit.specialValue ? (
                <div className="uv-stat-row">
                  <TermTip term="value" className="uv-stat-label uv-label-value">Value</TermTip>
                  <span className="uv-stat-amount uv-special-value" title="Set by the APEX team — no numeric value applies">{unit.specialValue}</span>
                </div>
              ) : (
                <div className="uv-stat-row">
                  <TermTip term="value" className="uv-stat-label uv-label-value">Value</TermTip>
                  <span className="uv-stat-amount" title={unit.tradeValueMax ? `${formatFullNumber(unit.tradeValue)} - ${formatFullNumber(unit.tradeValueMax)} exact` : `${formatFullNumber(unit.tradeValue)} exact`}>
                    {unit.tradeValueMax ? `${formatCompactNumber(unit.tradeValue)}-${formatCompactNumber(unit.tradeValueMax)}` : formatCompactNumber(unit.tradeValue)}
                  </span>
                </div>
              )}

              <div className="uv-stat-row">
                <TermTip term="gems" className="uv-stat-label uv-label-gems">Gems</TermTip>
                <span className="uv-stat-amount" title={unit.specialGems ? 'Set by the APEX team' : (unit.gemsMax ? `${formatFullNumber(unit.gems)} - ${formatFullNumber(unit.gemsMax)} exact` : `${formatFullNumber(unit.gems)} exact`)}>
                  {unit.specialGems || (unit.gemsMax ? `${formatCompactNumber(unit.gems)}-${formatCompactNumber(unit.gemsMax)}` : formatCompactNumber(unit.gems))}
                </span>
              </div>
              <div className="uv-stat-row">
                <TermTip term="coins" className="uv-stat-label uv-label-coins">Coins</TermTip>
                <span className="uv-stat-amount" title={unit.specialCoins ? 'Set by the APEX team' : (unit.coinsMax ? `${formatFullNumber(unit.coins)} - ${formatFullNumber(unit.coinsMax)} exact` : `${formatFullNumber(unit.coins)} exact`)}>
                  {unit.specialCoins || (unit.coinsMax ? `${formatCompactNumber(unit.coins)}-${formatCompactNumber(unit.coinsMax)}` : formatCompactNumber(unit.coins))}
                </span>
              </div>
              </div>

              <div className="uv-row-divider" aria-hidden="true" />

              <div className="uv-stat-row uv-signal-row">
                <TermTip term="demand" className="uv-stat-label">Demand</TermTip>
                <span className="uv-signal-value">
                  <span className="uv-signal-bar" aria-hidden="true">
                    <span className="uv-signal-fill" style={{ background: demandColor, transform: `scaleX(${demandPercent / 100})` }} />
                  </span>
                  <strong style={{ color: demandColor }}>{unit.demand || '—'}</strong>
                </span>
              </div>
              <div className="uv-stat-row uv-signal-row">
                <TermTip term="scarcity" className="uv-stat-label">Scarcity</TermTip>
                <span className="uv-signal-value">
                  <span className="uv-signal-bar" aria-hidden="true">
                    <span className="uv-signal-fill" style={{ background: scarcityColor, transform: `scaleX(${scarcityPercent / 100})` }} />
                  </span>
                  <strong style={{ color: scarcityColor }}>{unit.scarcity || '—'}</strong>
                </span>
              </div>
            </div>

            {/* Status, Gets Overpays and Gets Underpays share one container so
                all three strips are spaced identically. */}
            <OverpayPills unit={unit} />

            {unit.updatedAt && (
              <div className="uv-updated" title={new Date(unit.updatedAt).toLocaleString()}>
                {updatedByline(unit, unit.updatedAt, formatRelativeTime(unit.updatedAt))}
              </div>
            )}
          </div>
        ) : (
          <div className="uv-no-data">No market data yet</div>
        )}
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
