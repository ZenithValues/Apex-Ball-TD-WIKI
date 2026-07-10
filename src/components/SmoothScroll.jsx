import { Fragment, useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Drives the whole page's scroll with real inertia/momentum physics (via
 * Lenis) instead of relying on native OS scrolling or CSS scroll-behavior
 * (which only smooths programmatic jumps, not wheel/trackpad input).
 * Slightly slower duration + gentle easing gives the "buttery" feel —
 * scrolling is still fully interruptible at any moment, it just glides
 * to a stop rather than halting instantly.
 */
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.7,
      easing: (t) => 1 - Math.pow(1 - t, 2.2), // easeOutQuad-ish — quicker settle, less float
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <Fragment>{children}</Fragment>;
}
