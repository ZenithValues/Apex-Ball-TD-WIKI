import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber, formatFullNumber } from '../utils/formatNumber';
import { getBaseStats } from '../utils/unitStats';
import UnitIcon from './UnitIcon';
import './CardOpeningModal.css';

/**
 * 3D Card Opening & Flip Transition Modal / Interactive Inspector
 * Listens to `window.dispatchEvent(new CustomEvent('apex-open-card-3d', { detail: { unit, targetUrl, inspectOnly } }))`.
 * Driven by explicit React phase progression (`useEffect` on `activeData` -> `phase: 1 -> 2 -> 3 -> 4`) so 3D rotation works with 100% certainty across every browser without timer cancellations or GPU Z-clipping.
 */
export default function CardOpeningModal() {
  const navigate = useNavigate();
  const [activeData, setActiveData] = useState(null);
  const [phase, setPhase] = useState(1); // 1 = spawn, 2 = rotate to back in 3D, 3 = rotate vertically + flip to front, 4 = idle interactive
  const [flipped, setFlipped] = useState(false);
  const [spinX, setSpinX] = useState(0);
  const [angleZ, setAngleZ] = useState(0);

  // 1. Global event listener hook (stable, never clears active progression timers)
  useEffect(() => {
    function handleOpen(event) {
      const detail = event.detail;
      if (!detail || !detail.unit) return;
      setActiveData({
        unit: detail.unit,
        targetUrl: detail.targetUrl || null,
        inspectOnly: Boolean(detail.inspectOnly),
      });
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setActiveData(null);
      }
    }

    window.addEventListener('apex-open-card-3d', handleOpen);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('apex-open-card-3d', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 2. Phase progression hook triggered strictly when activeData mounts
  useEffect(() => {
    if (!activeData) return undefined;

    setPhase(1); // Start at initial 0deg spawn
    setFlipped(false);
    setSpinX(0);
    setAngleZ(0);

    // Phase 2 (40ms): Rotate in 3D space to the back side (rotateY(180deg))
    const t1 = setTimeout(() => {
      setPhase(2);
    }, 40);

    // Phase 3 (460ms): Rotate vertically (rotateX(360deg)) and flip to front (rotateY(360deg))
    const t2 = setTimeout(() => {
      setPhase(3);
    }, 460);

    // Phase 4 (1020ms): Complete opening & navigate or stay idle for inspector
    const t3 = setTimeout(() => {
      if (!activeData.inspectOnly && activeData.targetUrl) {
        navigate(activeData.targetUrl);
        setActiveData(null);
      } else {
        setPhase(4);
      }
    }, 1020);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeData, navigate]);

  if (!activeData) return null;

  const { unit, targetUrl, inspectOnly } = activeData;
  const glow = getRarityGlow(unit.rarity);
  const stats = getBaseStats(unit);
  const hasTradeValues = unit.tradeValue != null || unit.gems != null || unit.coins != null;

  function skipOrClose() {
    if (!inspectOnly && targetUrl) {
      navigate(targetUrl);
    }
    setActiveData(null);
  }

  // Calculate explicit 3D transform for stage and flipper based on exact phase (NEVER use opacity on preserve-3d to avoid GPU flattening)
  let stageTransform = 'rotateX(0deg) rotateZ(0deg) scale(1)';
  let flipperTransform = 'rotateY(0deg) rotateX(0deg) rotateZ(0deg)';
  let flipperTransition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';

  if (phase === 1) {
    stageTransform = 'rotateX(-10deg) rotateZ(5deg) scale(0.88)';
    flipperTransform = 'rotateY(0deg)';
    flipperTransition = 'none';
  } else if (phase === 2) {
    stageTransform = 'rotateX(-12deg) rotateZ(5deg) scale(0.95)';
    flipperTransform = 'rotateY(180deg)';
    flipperTransition = 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)';
  } else if (phase === 3) {
    stageTransform = 'rotateX(360deg) rotateZ(0deg) scale(1.05)';
    flipperTransform = 'rotateY(360deg)';
    flipperTransition = 'transform 0.54s cubic-bezier(0.22, 1, 0.36, 1)';
  } else if (phase === 4) {
    stageTransform = 'rotateX(0deg) rotateZ(0deg) scale(1)';
    flipperTransform = `rotateY(${flipped ? 180 : 0}deg) rotateX(${spinX}deg) rotateZ(${angleZ}deg)`;
    flipperTransition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
  }

  return (
    <div className="coo-overlay" onClick={() => { if (!inspectOnly) skipOrClose(); }} role="dialog" aria-modal="true" aria-label="3D Card Opening">
      <div className="coo-header">
        <span className="coo-kicker">{inspectOnly ? 'Interactive 3D Inspector' : 'Holographic Card Opening'}</span>
        <h3 className="coo-title">{unit.name}</h3>
      </div>

      <div className="coo-viewport-3d" onClick={(e) => e.stopPropagation()}>
        <div
          className="coo-card-stage-3d"
          style={{
            transform: stageTransform,
            transition: phase === 1 ? 'none' : 'transform 0.54s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div
            className="coo-card-flipper-3d"
            style={{
              transform: flipperTransform,
              transition: flipperTransition,
            }}
          >
            {/* FRONT FACE OF CARD IN 3D SPACE */}
            <div className="coo-card-face coo-card-front" style={{ '--rarity-glow': glow }}>
              <div className="coo-face-inner coo-front-inner" style={{ borderColor: `color-mix(in srgb, ${glow} 70%, rgba(255,255,255,0.2))` }}>
                <div className="coo-front-stripe" style={{ background: glow }} />
                {phase === 3 && <div className="coo-holo-shine" />}
                
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
                      <div className="uv-bars" style={{ paddingTop: 8 }}>
                        {unit.demand && (
                          <div style={{ marginBottom: 10 }}>
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
                          <div>
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
            </div>

            {/* BACK FACE OF CARD IN 3D SPACE */}
            <div className="coo-card-face coo-card-back" style={{ '--rarity-glow': glow }}>
              <div className="coo-face-inner coo-back-inner" style={{ borderColor: `color-mix(in srgb, ${glow} 45%, rgba(255,255,255,0.18))` }}>
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
      </div>

      {!inspectOnly && targetUrl ? (
        <button type="button" className="coo-skip-hint" onClick={skipOrClose}>
          Skip Opening Animation ➔
        </button>
      ) : phase === 4 ? (
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
