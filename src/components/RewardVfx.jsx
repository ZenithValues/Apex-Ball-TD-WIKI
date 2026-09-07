import { useEffect, useRef, useState } from 'react';
import { loadTheme } from '../config/theme';
import { getUnlockedRewards, isRewardAllowed } from '../utils/themeUnlocks';
import gemsIcon from '../assets/currency/gems.png';
import coinsIcon from '../assets/currency/coins.png';
import './RewardVfx.css';

// ============================================================================
// REWARD VFX — the visual half of the achievement-unlocked reward themes
// (see utils/themeUnlocks.js). Renders behind the page content:
//   knowledge  -> glowing particle rain on a canvas
//   ballonomics -> gems/coins texture over the background grid
//   retro      -> blocky UI + optional retro font (pure CSS, no layer here)
//   premium    -> animated aurora backdrop + gilded cards
//   admin      -> the APEX Team exclusive: gold rain + aura
// The active mode only applies while unlocked; admins bypass every lock.
// ============================================================================

function currentRewardState(themeFromEvent) {
  // The theme-updated event carries the freshly applied theme in its detail —
  // use it directly, because the event fires before the new theme reaches
  // storage (ThemeStudio applies first, saves second).
  const theme = themeFromEvent || loadTheme();
  const unlocks = getUnlockedRewards();
  const mode = isRewardAllowed(theme.rewards.mode, unlocks) ? theme.rewards.mode : 'none';
  return { theme, unlocks, mode };
}

function motionEnabled() {
  try {
    const ux = JSON.parse(localStorage.getItem('apex-ux-settings-v1') || '{}');
    if (Number(ux.animSpeed) <= 0 || ux.reducedMotion) return false;
  } catch { /* ignore */ }
  return true;
}

export default function RewardVfx() {
  const [state, setState] = useState(() => currentRewardState());
  const [, forceTick] = useState(0);

  useEffect(() => {
    const refresh = (event) => {
      const detail = event && event.detail;
      setState(currentRewardState(detail && detail.rewards ? detail : null));
      forceTick((t) => t + 1);
    };
    window.addEventListener('apex-theme-updated', refresh);
    window.addEventListener('apex-achievement-unlocked', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('apex-theme-updated', refresh);
      window.removeEventListener('apex-achievement-unlocked', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const { theme, mode } = state;
  const rewards = theme.rewards;

  // Drive the CSS hooks (retro UI blockiness, premium gilding) from the root.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.reward = mode;
    root.dataset.retroFont = mode === 'retro' && rewards.pixelFont ? 'on' : 'off';
    root.style.setProperty('--reward-color', rewards.color);
    // Precompute the glow rgba — color-mix() is rejected inside text-shadow.
    const m = /^#?([0-9a-f]{6})$/i.test(rewards.color) && /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(rewards.color);
    const [r, g, b] = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 215, 106];
    root.style.setProperty('--reward-glow', `rgba(${r}, ${g}, ${b}, 0.45)`);
    root.style.setProperty('--reward-density', String(rewards.density));
    root.style.setProperty('--reward-intensity', String(rewards.intensity));
    // Money Grid textures (imported assets become bundled data URLs).
    root.style.setProperty('--reward-money-a', `url(${gemsIcon})`);
    root.style.setProperty('--reward-money-b', `url(${coinsIcon})`);
    return () => {
      delete root.dataset.reward;
      delete root.dataset.retroFont;
    };
  }, [mode, rewards.color, rewards.density, rewards.intensity, rewards.pixelFont]);

  const rainColor = mode === 'admin' ? '#ffd76a' : rewards.color;
  const rainGlyphs = mode === 'admin';

  return (
    <>
      {(mode === 'knowledge' || mode === 'admin') && (
        <ParticleRain
          key={`rain-${mode}-${rainColor}-${rewards.density}-${rewards.intensity}`}
          color={rainColor}
          density={rewards.density}
          intensity={rewards.intensity}
          glyphs={rainGlyphs}
        />
      )}
      {mode === 'ballonomics' && (
        <div className="reward-money-layer" aria-hidden="true" />
      )}
      {(mode === 'premium' || mode === 'admin') && (
        <div className={mode === 'admin' ? 'reward-aurora admin' : 'reward-aurora'} aria-hidden="true" />
      )}
    </>
  );
}

function ParticleRain({ color, density, intensity, glyphs }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const animate = motionEnabled();
    let raf = 0;
    let alive = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const count = Math.round(18 + density * 90);
    const alphaBase = 0.25 + intensity * 0.6;
    const particles = Array.from({ length: count }, () => spawn());

    function spawn() {
      return {
        x: Math.random(),
        y: Math.random(),
        r: 1.2 + Math.random() * 2.6,
        speed: 0.02 + Math.random() * 0.05,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.4 + Math.random() * 1.2,
        glyph: glyphs && Math.random() < 0.16,
      };
    }

    let last = performance.now();
    function frame(now) {
      if (!alive) return;
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (animate) {
          p.y += (p.speed * dt * (0.6 + intensity)) / 1.2;
          p.sway += p.swaySpeed * dt;
          if (p.y > 1.05) {
            Object.assign(p, spawn(), { y: -0.05 });
          }
        }
        const px = (p.x + Math.sin(p.sway) * 0.012) * width;
        const py = p.y * height;
        const alpha = alphaBase * (0.55 + Math.random() * 0.45);
        if (p.glyph) {
          ctx.font = `${Math.round(p.r * 9 + 8) * dpr}px serif`;
          ctx.textAlign = 'center';
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillText('👑', px, py);
          ctx.globalAlpha = 1;
        } else {
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8 * dpr * (0.5 + intensity);
          ctx.arc(px, py, p.r * dpr, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
      if (animate && !document.hidden) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onVisible() {
      if (!document.hidden && animate && alive && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [color, density, intensity, glyphs]);

  return <canvas ref={canvasRef} className="reward-rain-canvas" aria-hidden="true" />;
}
