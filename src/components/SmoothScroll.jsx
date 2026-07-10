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
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic — smooth deceleration
      smoothWheel: true,
      wheelMultiplier: 0.9,
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
