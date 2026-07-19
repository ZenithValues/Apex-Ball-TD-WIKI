import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRarityPalette, getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber, formatFullNumber } from '../utils/formatNumber';
import { getBaseStats } from '../utils/unitStats';
import UnitIcon from './UnitIcon';
import './CardOpeningModal.css';

/**
 * 3D Card Opening & Flip Transition Modal / Interactive Inspector
 * Listens to `window.dispatchEvent(new CustomEvent('apex-open-card-3d', { detail: { unit, targetUrl, inspectOnly } }))`.
 */
export default function CardOpeningModal() {
  const navigate = useNavigate();
  const [activeData, setActiveData] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [spinX, setSpinX] = useState(0);
  const [angleZ, setAngleZ] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    function handleOpen(event) {
      const detail = event.detail;
      if (!detail || !detail.unit) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      setActiveData({
        unit: detail.unit,
        targetUrl: detail.targetUrl || null,
        inspectOnly: Boolean(detail.inspectOnly),
      });
      setIsAnimating(true);
      setFlipped(false);
      setSpinX(0);
      setAngleZ(0);

      // If not strictly inspectOnly, automatically finish opening & navigate after 920ms
      if (!detail.inspectOnly && detail.targetUrl) {
        timerRef.current = setTimeout(() => {
          navigate(detail.targetUrl);
          setActiveData(null);
        }, 920);
      } else {
        // For inspectOnly mode, stop the entrance animation class after 920ms and unlock interactive controls
        timerRef.current = setTimeout(() => {
          setIsAnimating(false);
        }, 920);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && activeData) {
        skipOrClose();
      }
    }

    window.addEventListener('apex-open-card-3d', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('apex-open-card-3d', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeData, navigate]);

  if (!activeData) return null;

  const { unit, targetUrl, inspectOnly } = activeData;
  const glow = getRarityGlow(unit.rarity);
  const stats = getBaseStats(unit);
  const hasTradeValues = unit.tradeValue != null || unit.gems != null || unit.coins != null;

  function skipOrClose() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!inspectOnly && targetUrl) {
      navigate(targetUrl);
    }
    setActiveData(null);
  }

  // Calculate dynamic 3D transform for interactive inspector mode when animation is done
  const interactiveTransform = isAnimating
    ? undefined
    : `rotateY(${flipped ? 180 : 0}deg) rotateX(${spinX}deg) rotateZ(${angleZ}deg)`;

  return (
    <div className="coo-overlay" onClick={() => { if (!inspectOnly) skipOrClose(); }} role="dialog" aria-modal="true" aria-label="3D Card Opening">
      <div className="coo-header">
        <span className="coo-kicker">{inspectOnly ? 'Interactive 3D Inspector' : 'Holographic Card Opening'}</span>
        <h3 className="coo-title">{unit.name}</h3>
      </div>

      <div className={`coo-viewport-3d ${isAnimating ? 'coo-animating' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="coo-card-stage-3d">
          <div
            className="coo-card-flipper-3d"
            style={interactiveTransform ? { transform: interactiveTransform } : undefined}
          >
            {/* FRONT FACE OF CARD IN 3D SPACE */}
            <div className="coo-card-face coo-card-front" style={{ '--rarity-glow': glow, borderColor: `color-mix(in srgb, ${glow} 70%, rgba(255,255,255,0.2))` }}>
              <div className="coo-front-stripe" style={{ background: glow }} />
              {isAnimating && <div className="coo-holo-shine" />}
              
              <div className="coo-front-header">
                <UnitIcon slug={unit.slug} name={unit.name} glowColor={glow} shiny={isShinyRarity(unit.rarity)} size={72} imageUrl={unit.imageUrl} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="unit-card-name" style={{ fontSize: '1.2rem' }}>{unit.name}</span>
                  <span className="unit-card-rarity" style={{ color: glow }}>{unit.rarity}</span>
                </div>
              </div>

              <div className="coo-front-body">
                {hasTradeValues ? (
                  <div className="uv-inner-panel-card">
                    <div className="uv-stat-rows">
                      {unit.tradeValue != null && (
                        <div className="uv-stat-row">
                          <span className="uv-stat-label uv-label-value">Value</span>
                          <span className="uv-stat-amount" title={`${formatFullNumber(unit.tradeValue)} exact`}>{formatCompactNumber(unit.tradeValue)}</span>
                        </div>
                      )}
                      {unit.gems != null && (
                        <div className="uv-stat-row">
                          <span className="uv-stat-label uv-label-gems">Gems</span>
                          <span className="uv-stat-amount" title={`${formatFullNumber(unit.gems)} exact`}>{formatCompactNumber(unit.gems)}</span>
                        </div>
                      )}
                      {unit.coins != null && (
                        <div className="uv-stat-row">
                          <span className="uv-stat-label uv-label-coins">Coins</span>
                          <span className="uv-stat-amount" title={`${formatFullNumber(unit.coins)} exact`}>{formatCompactNumber(unit.coins)}</span>
                        </div>
                      )}
                    </div>
                    <div className="uv-bars" style={{ paddingTop: 6 }}>
                      {unit.demand && (
                        <div>
                          <div className="uv-bar-head">
                            <span className="uv-gauge-title">Demand</span>
                            <span className="uv-bar-tier" style={{ color: '#ffffff' }}>{unit.demand}</span>
                          </div>
                          <div className="uv-bar-track">
                            <div className="uv-bar-fill" style={{ width: '65%', background: '#4d9dff' }} />
                          </div>
                        </div>
                      )}
                      {unit.scarcity && (
                        <div style={{ marginTop: 10 }}>
                          <div className="uv-bar-head">
                            <span className="uv-gauge-title">Scarcity</span>
                            <span className="uv-bar-tier" style={{ color: '#ffffff' }}>{unit.scarcity}</span>
                          </div>
                          <div className="uv-bar-track">
                            <div className="uv-bar-fill" style={{ width: '75%', background: '#ffc94d' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : stats ? (
                  <div className="unit-card-stats">
                    {stats.damage != null && (
                      <div className="unit-card-stat">
                        <span className="unit-card-stat-label">Damage</span>
                        <span className="unit-card-stat-value">{stats.damage}</span>
                      </div>
                    )}
                    {stats.cooldown != null && (
                      <div className="unit-card-stat">
                        <span className="unit-card-stat-label">Cooldown</span>
                        <span className="unit-card-stat-value">{stats.cooldown}s</span>
                      </div>
                    )}
                    {stats.range != null && (
                      <div className="unit-card-stat">
                        <span className="unit-card-stat-label">Range</span>
                        <span className="unit-card-stat-value">{stats.range}</span>
                      </div>
                    )}
                    {stats.placementLimit != null && (
                      <div className="unit-card-stat">
                        <span className="unit-card-stat-label">Placement</span>
                        <span className="unit-card-stat-value">{stats.placementLimit}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: '#9a9aab', fontStyle: 'italic' }}>
                    {unit.type || 'Apex Unit Deck'}
                  </div>
                )}
              </div>
            </div>

            {/* BACK FACE OF CARD IN 3D SPACE */}
            <div className="coo-card-face coo-card-back" style={{ '--rarity-glow': glow }}>
              <span className="coo-back-ticker">[ APEX ARCHIVE SYSTEM · SLAB #2026 ]</span>
              
              <div className="coo-back-emblem-wrap">
                <div className="coo-back-circuit-line coo-circuit-l" />
                <div className="coo-back-circuit-line coo-circuit-r" />
                <div className="coo-back-circuit-line coo-circuit-t" />
                <div className="coo-back-circuit-line coo-circuit-b" />
                <div className="coo-back-emblem-inner">
                  <span className="coo-back-symbol">❖</span>
                  <span className="coo-back-title">Apex Deck</span>
                  <span className="coo-back-sub">{unit.rarity}</span>
                </div>
              </div>

              <span className="coo-back-ticker" style={{ fontSize: '0.64rem' }}>AUTHENTICATED DATA DECK · IDENTIFIER VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {!inspectOnly && targetUrl ? (
        <button type="button" className="coo-skip-hint" onClick={skipOrClose}>
          Skip Opening Animation ➔
        </button>
      ) : !isAnimating ? (
        <div className="coo-controls" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="coo-btn primary" onClick={() => setFlipped(!flipped)}>
            🔄 Flip Face ({flipped ? 'Showing Back' : 'Showing Front'})
          </button>
          <button type="button" className="coo-btn" onClick={() => setSpinX((prev) => prev + 360)}>
            🌪️ Vertical Spin (rotateX)
          </button>
          <button type="button" className="coo-btn" onClick={() => setAngleZ((prev) => (prev === 0 ? 12 : prev === 12 ? -12 : 0))}>
            🎯 Tilt Angle
          </button>
          <button type="button" className="coo-btn" onClick={skipOrClose} style={{ borderColor: '#ff4d4d', color: '#ff4d4d' }}>
            ✕ Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
