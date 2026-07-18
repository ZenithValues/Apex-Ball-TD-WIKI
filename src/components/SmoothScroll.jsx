import { Fragment, useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      prevent: (node) =>
        node.hasAttribute?.('data-lenis-prevent') ||
        node.classList?.contains('admin-log-list') ||
        node.classList?.contains('admin-unit-list'),
    });
    lenisRef.current = lenis;

    window.__apexLenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      if (window.__apexLenis === lenis) {
        window.__apexLenis = null;
      }
      lenis.destroy();
    };
  }, []);

  return <Fragment>{children}</Fragment>;
}
