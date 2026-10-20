import { Fragment, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

/**
 * Global Lenis Smooth Scrolling + Subtle Theme-Colored Cursor Glow
 *
 * - Applies silky exponential-ease Lenis smooth scrolling across the entire website
 * - Resets & resizes cleanly on route navigation
 * - Renders a hardware-accelerated (`translate3d`) subtle cursor glow that follows
 *   the pointer and adapts dynamically to the active theme color (`var(--accent)`)
 */
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const glowRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const isCoarsePointer =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: coarse)')?.matches;

    // Initialize Lenis across the entire site (smoothWheel on desktop; native
    // compositor touch momentum on coarse touch screens so Firefox/Chrome mobile
    // stay 100% lag-free)
    const lenis = new Lenis({
      duration: 1.32,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.88,
      touchMultiplier: 1.0,
      prevent: (node) => {
        return (
          node.classList?.contains('admin-log-list') ||
          node.classList?.contains('admin-unit-list') ||
          Boolean(node.closest?.('.admin-log-list')) ||
          Boolean(node.closest?.('.admin-unit-list')) ||
          node.hasAttribute?.('data-lenis-prevent') ||
          Boolean(node.closest?.('[data-lenis-prevent]'))
        );
      },
    });
    lenisRef.current = lenis;
    window.__apexLenis = lenis;

    // Cursor glow state (desktop fine pointer only)
    let targetX = typeof window !== 'undefined' ? window.innerWidth * 0.5 : 0;
    let targetY = typeof window !== 'undefined' ? window.innerHeight * 0.35 : 0;
    let currentX = targetX;
    let currentY = targetY;
    let pointerActive = false;

    function onPointerMove(e) {
      if (isCoarsePointer) return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!pointerActive && glowRef.current) {
        pointerActive = true;
        glowRef.current.style.opacity = '1';
      }
    }

    let rafId = 0;
    function raf(time) {
      if (document.hidden) {
        rafId = 0;
        return;
      }
      lenis.raf(time);

      if (!isCoarsePointer && glowRef.current && pointerActive) {
        currentX += (targetX - currentX) * 0.14;
        currentY += (targetY - currentY) * 0.14;
        glowRef.current.style.transform = `translate3d(${(currentX - 210).toFixed(1)}px, ${(currentY - 210).toFixed(1)}px, 0)`;
      }

      rafId = requestAnimationFrame(raf);
    }

    function onVisibilityChange() {
      if (!document.hidden && !rafId) {
        rafId = requestAnimationFrame(raf);
      }
    }

    rafId = requestAnimationFrame(raf);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!isCoarsePointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pointermove', onPointerMove);
      if (window.__apexLenis === lenis) {
        window.__apexLenis = null;
      }
      lenis.destroy();
    };
  }, []);

  // Recalculate Lenis scroll dimensions on route change
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return undefined;
    const t = setTimeout(() => {
      lenis.resize();
    }, 120);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <Fragment>
      <div ref={glowRef} className="apex-cursor-glow" aria-hidden="true" />
      {children}
    </Fragment>
  );
}
