import { Fragment, useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Drives desktop wheel scrolling with smooth inertia/momentum physics (via
 * Lenis), while letting mobile touch devices use 100% native OS hardware-
 * accelerated compositor scrolling with zero main-thread rAF overhead.
 */
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const isTouchDevice =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)')?.matches ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

    // On mobile / coarse-pointer devices, native touch momentum scrolling is
    // handled directly by the GPU compositor thread — avoid running a 60Hz JS
    // rAF loop on mobile.
    if (isTouchDevice) {
      return undefined;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 2),
      smoothWheel: true,
      wheelMultiplier: 0.82,
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

    let rafId = 0;
    function raf(time) {
      if (document.hidden) {
        rafId = 0;
        return;
      }
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    function onVisibilityChange() {
      if (!document.hidden && !rafId) {
        rafId = requestAnimationFrame(raf);
      }
    }

    rafId = requestAnimationFrame(raf);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (window.__apexLenis === lenis) {
        window.__apexLenis = null;
      }
      lenis.destroy();
    };
  }, []);

  return <Fragment>{children}</Fragment>;
}
