import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Full-site Lenis smooth scrolling + subtle theme-reactive cursor glow.
 * Configured with a slower, weighted wheel multiplier (0.62) and longer
 * glide duration (1.92s) so scrolling feels deliberate, smooth, and premium.
 */
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const glowRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isAdmin = location.pathname.startsWith('/admin');

    if (prefersReduced || isAdmin) {
      return undefined;
    }

    const lenis = new Lenis({
      duration: 1.92,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.62,
      touchMultiplier: 0.85,
      autoResize: true,
    });
    lenisRef.current = lenis;
    window.__apexLenis = lenis;

    let rafId = 0;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      if (window.__apexLenis === lenis) {
        delete window.__apexLenis;
      }
    };
  }, [location.pathname.startsWith('/admin')]);

  // Reset scroll to top & recalculate page height on route change
  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      const t = setTimeout(() => {
        lenis.resize();
      }, 140);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [location.pathname]);

  // Subtle hardware-accelerated cursor glow (skip on touch/mobile devices)
  useEffect(() => {
    const glowEl = glowRef.current;
    if (!glowEl || typeof window === 'undefined') return undefined;

    const isCoarse =
      window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) {
      glowEl.style.display = 'none';
      return undefined;
    }

    let raf = 0;
    let targetX = -999;
    let targetY = -999;
    let curX = -999;
    let curY = -999;

    function updatePosition() {
      curX += (targetX - curX) * 0.14;
      curY += (targetY - curY) * 0.14;
      glowEl.style.transform = `translate3d(${(curX - 150).toFixed(1)}px, ${(curY - 150).toFixed(1)}px, 0)`;
      if (Math.abs(targetX - curX) > 0.4 || Math.abs(targetY - curY) > 0.4) {
        raf = requestAnimationFrame(updatePosition);
      } else {
        raf = 0;
      }
    }

    function onPointerMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(updatePosition);
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="apex-cursor-glow" aria-hidden="true" />
      {children}
    </>
  );
}
