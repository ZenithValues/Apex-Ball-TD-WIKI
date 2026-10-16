import { useEffect, useRef } from 'react';
import './ShaderBackdrop.css';

function shouldSkipHeavyShader() {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  if (window.matchMedia?.('(pointer: coarse)').matches) return true;
  if (window.innerWidth <= 900) return true;
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  if ((typeof mem === 'number' && mem <= 4) || (typeof cores === 'number' && cores <= 4)) {
    return true;
  }
  return false;
}

export default function ShaderBackdrop({ accentColor, className = '', variant = 'default' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || shouldSkipHeavyShader()) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    let rafId = null;
    let visible = false;
    let t = Math.random() * 100;

    const W = 128;
    const H = 72;
    canvas.width = W;
    canvas.height = H;

    const renderFrame = () => {
      if (!visible) return;
      t += 0.012;
      ctx.clearRect(0, 0, W, H);

      const style = getComputedStyle(document.documentElement);
      const rawAccent = (accentColor || style.getPropertyValue('--accent') || '#ffffff').trim();

      const x1 = W * (0.64 + 0.16 * Math.cos(t * 0.8));
      const y1 = H * (0.45 + 0.22 * Math.sin(t * 0.65));
      const g1 = ctx.createRadialGradient(x1, y1, 2, x1, y1, W * 0.56);
      g1.addColorStop(0, rawAccent);
      g1.addColorStop(1, 'transparent');

      const x2 = W * (0.34 + 0.16 * Math.sin(t * 0.55));
      const y2 = H * (0.58 + 0.2 * Math.cos(t * 0.72));
      const g2 = ctx.createRadialGradient(x2, y2, 2, x2, y2, W * 0.46);
      g2.addColorStop(0, rawAccent);
      g2.addColorStop(1, 'transparent');

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      ctx.globalAlpha = 0.08;
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);

      rafId = requestAnimationFrame(renderFrame);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        visible = Boolean(entry?.isIntersecting);
        if (visible) {
          if (!rafId) rafId = requestAnimationFrame(renderFrame);
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [accentColor]);

  return (
    <div
      className={`shader-backdrop variant-${variant} ${className}`.trim()}
      style={accentColor ? { '--section-accent': accentColor } : undefined}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="shader-canvas" />
      <div className="shader-linear-wash" />
      <div className="shader-mesh-orb orb-a" />
      <div className="shader-mesh-orb orb-b" />
    </div>
  );
}

/**
 * Lightweight Spline-style 3D perspective tilt hook.
 * Automatically disabled on touch / mobile devices for zero scroll/touch jank.
 */
export function useSplineTilt(maxDeg = 4) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || shouldSkipHeavyShader()) return undefined;

    let frame = null;
    const handleMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
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

    const handleLeave = () => {
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    };

    el.addEventListener('pointermove', handleMove, { passive: true });
    el.addEventListener('pointerleave', handleLeave, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
    };
  }, [maxDeg]);

  return ref;
}
