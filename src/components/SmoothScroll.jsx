import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { loadUXSettings } from '../utils/uxSettings';

// Lenis covers all desktop routes, including admin. Touch, reduced-motion and
// explicitly disabled settings keep native scrolling and native scroll panes.
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const glowRef = useRef(null);
  const location = useLocation();
  const [ux, setUx] = useState(() => loadUXSettings());
  const [motionAllowed, setMotionAllowed] = useState(() => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [finePointer, setFinePointer] = useState(() => typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const updateMedia = () => { setMotionAllowed(!reduced.matches); setFinePointer(!coarse.matches); };
    const updateUx = (event) => setUx(event.detail || loadUXSettings());
    reduced.addEventListener('change', updateMedia);
    coarse.addEventListener('change', updateMedia);
    window.addEventListener('apex-ux-updated', updateUx);
    return () => { reduced.removeEventListener('change', updateMedia); coarse.removeEventListener('change', updateMedia); window.removeEventListener('apex-ux-updated', updateUx); };
  }, []);

  useEffect(() => {
    if (!motionAllowed || !finePointer || ux.reducedMotion || Number(ux.animSpeed) <= 0 || ux.smoothScroll === false) return undefined;
    const lenis = new Lenis({ duration: 1.92, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, syncTouch: false, wheelMultiplier: 0.62, touchMultiplier: 0.85, autoResize: true });
    lenisRef.current = lenis;
    window.__apexLenis = lenis;
    let rafId;
    const raf = (time) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); lenisRef.current = null; if (window.__apexLenis === lenis) delete window.__apexLenis; };
  }, [motionAllowed, finePointer, ux.reducedMotion, ux.animSpeed, ux.smoothScroll]);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return undefined;
    lenis.scrollTo(0, { immediate: true });
    const timer = setTimeout(() => lenis.resize(), 140);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Cursor glow is deliberately very faint, and inactive for touch/reduced motion.
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || !finePointer || !motionAllowed || ux.reducedMotion || Number(ux.animSpeed) <= 0) return undefined;
    let frame = 0; let targetX = -999; let targetY = -999; let x = -999; let y = -999;
    function update() {
      x += (targetX - x) * 0.14; y += (targetY - y) * 0.14;
      glow.style.transform = `translate3d(${(x - 150).toFixed(1)}px, ${(y - 150).toFixed(1)}px, 0)`;
      if (Math.abs(targetX - x) > 0.4 || Math.abs(targetY - y) > 0.4) frame = requestAnimationFrame(update);
      else frame = 0;
    }
    function move(e) { targetX = e.clientX; targetY = e.clientY; if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener('pointermove', move, { passive: true });
    return () => { if (frame) cancelAnimationFrame(frame); window.removeEventListener('pointermove', move); };
  }, [finePointer, motionAllowed, ux.reducedMotion, ux.animSpeed]);

  return <><div ref={glowRef} className="apex-cursor-glow" aria-hidden="true" />{children}</>;
}
