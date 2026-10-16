import { useEffect, useRef } from 'react';
import './ShaderBackdrop.css';

/**
 * Lightweight, mobile-safe interactive 3D Spline-style tilt handler.
 * Only activates on fine-pointer desktop devices; zero listeners or main-thread
 * work on mobile/touch screens so old phones stay 100% lag-free.
 */
export function useSplineTilt(maxDeg = 6) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return undefined;
    const isFinePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!isFinePointer || prefersReduced) return undefined;

    let rafId = 0;
    const onMove = (e) => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--tilt-x', `${(-ny * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(nx * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--glare-x', `${((nx + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty('--glare-y', `${((ny + 0.5) * 100).toFixed(1)}%`);
      });
    };

    const onLeave = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--glare-x', '50%');
      el.style.setProperty('--glare-y', '50%');
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [maxDeg]);

  return ref;
}

/**
 * Circular Rotating Kinetic Typography Seal (inspired by VÉRAINE reference).
 * Uses pure GPU-composited CSS rotation on a lightweight SVG textPath.
 */
export function KineticSeal({
  text = 'APEX WIKI & VALUES · BALL TOWER DEFENSE · ',
  centerLabel = 'LIVE',
  className = '',
}) {
  const pathId = `kinetic-circle-${centerLabel.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`kinetic-seal ${className}`.trim()} aria-hidden="true">
      <svg className="kinetic-seal-svg" viewBox="0 0 120 120">
        <defs>
          <path
            id={pathId}
            d="M 60, 60 m -44, 0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
          />
        </defs>
        <text className="kinetic-seal-text">
          <textPath href={`#${pathId}`} startOffset="0%">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="kinetic-seal-center">{centerLabel}</span>
    </div>
  );
}

/**
 * Ultra-optimized Shader Backdrop:
 * - On desktop devices with >4 cores, renders a low-res (120x68) smooth plasma
 *   shader field upscaled via GPU bilinear filtering, paused automatically when
 *   scrolled out of view via IntersectionObserver.
 * - On mobile / old phones / low-power devices, uses pure GPU-composited CSS
 *   aurora mesh layers with 0ms JS execution cost.
 */
export default function ShaderBackdrop({ className = '', variant = 'default' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return undefined;

    const isDesktop = window.innerWidth > 900 && window.matchMedia?.('(pointer: fine)')?.matches;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const cores = navigator.hardwareConcurrency || 4;
    if (!isDesktop || prefersReduced || cores <= 4) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const W = 96;
    const H = 54;
    canvas.width = W;
    canvas.height = H;

    let running = true;
    let visible = true;
    let rafId = 0;
    let lastTime = 0;

    const parseAccent = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ffffff';
      if (raw.startsWith('#') && (raw.length === 7 || raw.length === 4)) {
        const hex = raw.length === 4
          ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
          : raw;
        return [
          parseInt(hex.slice(1, 3), 16) || 255,
          parseInt(hex.slice(3, 5), 16) || 255,
          parseInt(hex.slice(5, 7), 16) || 255,
        ];
      }
      return [255, 255, 255];
    };

    let accentRGB = parseAccent();
    let frameCount = 0;

    const render = (now) => {
      if (!running) return;
      rafId = window.requestAnimationFrame(render);
      if (!visible || now - lastTime < 42) return; // Cap at ~24fps for zero thermal/CPU load
      lastTime = now;
      frameCount++;
      if (frameCount % 30 === 0) accentRGB = parseAccent();

      const t = now * 0.00065;
      ctx.clearRect(0, 0, W, H);

      const x1 = W * (0.68 + 0.16 * Math.sin(t * 1.1));
      const y1 = H * (0.45 + 0.18 * Math.cos(t * 0.9));
      const g1 = ctx.createRadialGradient(x1, y1, 2, x1, y1, W * 0.52);
      g1.addColorStop(0, `rgba(${accentRGB[0]}, ${accentRGB[1]}, ${accentRGB[2]}, 0.24)`);
      g1.addColorStop(0.55, `rgba(${accentRGB[0]}, ${accentRGB[1]}, ${accentRGB[2]}, 0.07)`);
      g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      const x2 = W * (0.32 + 0.14 * Math.cos(t * 0.8));
      const y2 = H * (0.62 + 0.15 * Math.sin(t * 1.3));
      const g2 = ctx.createRadialGradient(x2, y2, 2, x2, y2, W * 0.44);
      g2.addColorStop(0, `rgba(${accentRGB[0]}, ${accentRGB[1]}, ${accentRGB[2]}, 0.14)`);
      g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    };

    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(
          ([entry]) => {
            visible = Boolean(entry?.isIntersecting);
          },
          { threshold: 0.05 }
        )
      : null;
    if (io) io.observe(canvas);

    rafId = window.requestAnimationFrame(render);
    return () => {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (io) io.disconnect();
    };
  }, []);

  return (
    <div className={`shader-backdrop variant-${variant} ${className}`.trim()} aria-hidden="true">
      <canvas ref={canvasRef} className="shader-canvas" />
      <div className="shader-mesh-orb orb-a" />
      <div className="shader-mesh-orb orb-b" />
      <div className="shader-split-pane" />
    </div>
  );
}
