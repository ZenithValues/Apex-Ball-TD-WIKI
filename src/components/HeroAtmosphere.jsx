import { useEffect, useRef, useState } from 'react';
import { loadUXSettings } from '../utils/uxSettings';

// A quiet, scroll-responsive 3D star field behind the existing unit render.
// Touch, reduced motion, disabled scenes and WebGL failures keep the CSS sky.
export default function HeroAtmosphere() {
  const hostRef = useRef(null);
  const [allowed, setAllowed] = useState(false);
  const [settings, setSettings] = useState(() => loadUXSettings());

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(pointer: fine)');
    const update = () => setAllowed(!motion.matches && fine.matches && window.innerWidth > 900);
    const onSettings = (event) => setSettings(event.detail || loadUXSettings());
    update();
    motion.addEventListener('change', update);
    fine.addEventListener('change', update);
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('apex-ux-updated', onSettings);
    return () => {
      motion.removeEventListener('change', update);
      fine.removeEventListener('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('apex-ux-updated', onSettings);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !allowed || settings.reducedMotion || Number(settings.animSpeed) <= 0 || settings.scrollScene === false || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) return undefined;
    let disposed = false;
    let cleanup;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      try {
        const { createHeroAtmosphere } = await import('./heroAtmosphereScene');
        if (!disposed) cleanup = createHeroAtmosphere(host);
      } catch { /* CSS-only fallback remains visible. */ }
    }, { rootMargin: '80px' });
    observer.observe(host);
    return () => { disposed = true; observer.disconnect(); cleanup?.(); };
  }, [allowed, settings.reducedMotion, settings.animSpeed, settings.scrollScene]);

  return <div className="hero-atmosphere" aria-hidden="true"><div ref={hostRef} className="hero-atmosphere-canvas" /></div>;
}
