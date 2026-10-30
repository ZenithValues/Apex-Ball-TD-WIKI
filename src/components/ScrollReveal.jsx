import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loadUXSettings } from '../utils/uxSettings';

// No content is hidden while JS loads. A short, one-time reveal runs only when
// tagged content enters view; all content stays readable with motion disabled.
export default function ScrollReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    let observer;
    let mutations;
    let queued = 0;
    let seen = new WeakSet();
    function setup() {
      const settings = loadUXSettings();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || settings.reducedMotion || Number(settings.animSpeed) <= 0;
      observer?.disconnect();
      mutations?.disconnect();
      seen = new WeakSet();
      if (reduced) return;
      observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('scroll-revealed'); observer.unobserve(entry.target); }
      }), { threshold: 0.08 });
      const scan = () => {
        queued = 0;
        document.querySelectorAll('[data-scroll-reveal]').forEach((node) => {
          if (!seen.has(node)) { seen.add(node); observer.observe(node); }
        });
      };
      scan();
      // Lazy route chunks may mount after this component; batch DOM discovery.
      mutations = new MutationObserver(() => { if (!queued) queued = requestAnimationFrame(scan); });
      mutations.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    }
    setup();
    const onSettings = () => setup();
    window.addEventListener('apex-ux-updated', onSettings);
    return () => { observer?.disconnect(); mutations?.disconnect(); if (queued) cancelAnimationFrame(queued); window.removeEventListener('apex-ux-updated', onSettings); };
  }, [pathname]);
  return null;
}
