import { DEMAND_COLORS, DEMAND_PERCENT, SCARCITY_COLORS, SCARCITY_PERCENT } from '../data/taxonomy';
import { OVERPAY_COLORS, UNDERPAY_COLORS } from '../utils/overpayOptions';
import { TermTip, TERM_ACCENTS } from './StatMeta';
import { TrendGlyph, trendMeta } from './OverpayPills';
import { formatCompactNumber, formatFullNumber } from '../utils/formatNumber';
import './ValuePillow.css';

/**
 * ValuePillow — the ONE panel that shows every trade number.
 *
 * Operator (2026-11-13): "make the divider between demand and scarcity and the
 * rest is just like the others. Make the demand text the same green it says on
 * the tooltip and scarcity the same golden orange as the tooltip. Also make
 * status appear in the same pillow as the demand, scarcity, value, gems…"
 *
 * So: Value / Gems / Coins, then Demand, then Scarcity, then Status — all in a
 * single bordered pillow, every pair separated by the SAME hairline.
 *
 * Operator (2026-11-13, later the same day): "make the Demand/Scarcity text
 * follow the original colors they used to be." The demand / scarcity WORD and
 * its bar therefore go back to the original per-tier palette
 * (`DEMAND_COLORS` / `SCARCITY_COLORS` — Abysmal dark red, Godly purple,
 * Flooded red, Rare purple, …), which is the colour that carries the meaning:
 * an "ABYSMAL" printed in green read as good news. The DEMAND / SCARCITY
 * LABELS keep the tooltip accents (green / golden orange) the operator asked
 * for earlier, so the row still matches its tooltip.
 *
 * The same component renders the card and the unit value page, so the two can
 * never drift apart again.
 */

// Tooltip accents — used by the row LABELS and as the fallback when a tier has
// no entry in the original palette (e.g. an editor typed a custom demand word).
const DEMAND_ACCENT = TERM_ACCENTS.demand;   // #4ade80 — the tooltip's green
const SCARCITY_ACCENT = TERM_ACCENTS.scarcity; // #fb923c — the tooltip's golden orange

const demandTone = (tier) => DEMAND_COLORS[tier] || DEMAND_ACCENT;
const scarcityTone = (tier) => SCARCITY_COLORS[tier] || SCARCITY_ACCENT;

function Figure({ term, label, value, exact, tone }) {
  return (
    <div className="uv-stat-row uv-figure-row" data-value-row={term}>
      <TermTip term={term} className={`uv-stat-label uv-label-${term}`}>{label}</TermTip>
      <span className="uv-stat-amount" style={tone ? { color: tone } : undefined} title={exact}>
        {value}
      </span>
    </div>
  );
}

function SignalRow({ term, label, tier, percent, accent }) {
  const fill = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="uv-stat-row uv-signal-row" data-value-row={term}>
      <TermTip term={term} className={`uv-stat-label uv-label-${term}`}>{label}</TermTip>
      <span className="uv-signal-value">
        <span className="uv-signal-bar" aria-hidden="true">
          <span className="uv-signal-fill" style={{ background: accent, transform: `scaleX(${fill / 100})` }} />
        </span>
        <strong style={{ color: accent }}>{tier || '—'}</strong>
      </span>
    </div>
  );
}

/**
 * Overpay / Underpay rows. Operator (2026-11-13): they belong INSIDE the same
 * pillow as Value/Gems/Coins — one panel, one hairline between every pair.
 */
function TradeRow({ term, label, value, color }) {
  if (!value) return null;
  return (
    <div className="uv-stat-row uv-trade-row" data-value-row={term}>
      <TermTip term={term} className={`uv-stat-label uv-label-${term}`}>{label}</TermTip>
      <strong className="uv-trade-value" style={{ color }}>{value}</strong>
    </div>
  );
}

export default function ValuePillow({ unit, className = '' }) {
  if (!unit) return null;
  // Status is ALWAYS a row: the site treats a missing trend as "stable"
  // everywhere else, so hiding the row here would make two cards disagree.
  const status = trendMeta(unit) || trendMeta({ trend: 'stable' });
  const over = unit.getsOverpays || null;
  const under = unit.getsUnderpays || null;
  const valueText = unit.specialValue
    || (unit.tradeValueMax
      ? `${formatCompactNumber(unit.tradeValue)}-${formatCompactNumber(unit.tradeValueMax)}`
      : formatCompactNumber(unit.tradeValue ?? 0));
  const gemsText = unit.specialGems
    || (unit.gemsMax
      ? `${formatCompactNumber(unit.gems)}-${formatCompactNumber(unit.gemsMax)}`
      : formatCompactNumber(unit.gems ?? 0));
  const coinsText = unit.specialCoins
    || (unit.coinsMax
      ? `${formatCompactNumber(unit.coins)}-${formatCompactNumber(unit.coinsMax)}`
      : formatCompactNumber(unit.coins ?? 0));

  const exact = (min, max) => {
    if (max) return `${formatFullNumber(min)} - ${formatFullNumber(max)} exact`;
    return `${formatFullNumber(min)} exact`;
  };

  return (
    <div className={`uv-stat-rows uv-pillow ${className}`.trim()} data-value-pillow="">
      <Figure
        term="value"
        label="Value"
        value={valueText}
        exact={unit.specialValue ? 'Set by the APEX team — no numeric value applies' : exact(unit.tradeValue, unit.tradeValueMax)}
      />
      <div className="uv-row-divider" aria-hidden="true" />
      <Figure
        term="gems"
        label="Gems"
        value={gemsText}
        exact={unit.specialGems ? 'Set by the APEX team' : exact(unit.gems, unit.gemsMax)}
      />
      <div className="uv-row-divider" aria-hidden="true" />
      <Figure
        term="coins"
        label="Coins"
        value={coinsText}
        exact={unit.specialCoins ? 'Set by the APEX team' : exact(unit.coins, unit.coinsMax)}
      />
      <div className="uv-row-divider" aria-hidden="true" />

      <SignalRow
        term="demand"
        label="Demand"
        tier={unit.demand}
        percent={DEMAND_PERCENT[unit.demand] || 0}
        accent={demandTone(unit.demand)}
      />
      <div className="uv-row-divider" aria-hidden="true" />
      <SignalRow
        term="scarcity"
        label="Scarcity"
        tier={unit.scarcity}
        percent={SCARCITY_PERCENT[unit.scarcity] || 0}
        accent={scarcityTone(unit.scarcity)}
      />

      {status ? (
        <>
          <div className="uv-row-divider" aria-hidden="true" />
          <div className="uv-stat-row uv-status-row" data-value-row="status">
            <TermTip term="status" className="uv-stat-label uv-label-status">Status</TermTip>
            <span className="uv-signal-value uv-status-value">
              <TrendGlyph color={status.color} size={13} />
              <strong style={{ color: status.color }}>{status.label}</strong>
            </span>
          </div>
        </>
      ) : null}

      {/* Trade behaviour is a trade number too, so it lives in the pillow. */}
      {over ? <div className="uv-row-divider" aria-hidden="true" /> : null}
      <TradeRow
        term="overpays"
        label="Gets Overpays"
        value={over}
        color={OVERPAY_COLORS[over] || TERM_ACCENTS.overpays}
      />
      {under ? <div className="uv-row-divider" aria-hidden="true" /> : null}
      <TradeRow
        term="underpays"
        label="Gets Underpays"
        value={under}
        color={UNDERPAY_COLORS[under] || TERM_ACCENTS.underpays}
      />
    </div>
  );
}
