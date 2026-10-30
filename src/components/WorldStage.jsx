import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadUXSettings } from '../utils/uxSettings';
import CoolIcon from './CoolIcon';
import './WorldStage.css';

export default function WorldStage() {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(() => loadUXSettings());
  const [mediaAllowed, setMediaAllowed] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const update = () => setMediaAllowed(!reduced.matches && !coarse.matches);
    const onSettings = (event) => setSettings(event.detail || loadUXSettings());
    update();
    reduced.addEventListener('change', update); coarse.addEventListener('change', update);
    window.addEventListener('apex-ux-updated', onSettings);
    return () => { reduced.removeEventListener('change', update); coarse.removeEventListener('change', update); window.removeEventListener('apex-ux-updated', onSettings); };
  }, []);
  useEffect(() => {
    const host = hostRef.current;
    setReady(false);
    if (!host || !mediaAllowed || settings.reducedMotion || Number(settings.animSpeed) <= 0 || settings.scrollScene === false || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) return undefined;
    let disposed = false; let cleanup;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      try {
        const { createWorldScene } = await import('./worldScene');
        if (disposed) return;
        cleanup = createWorldScene(host);
        if (!disposed) setReady(true);
      } catch { /* Static artwork remains available if WebGL is unavailable. */ }
    }, { rootMargin: '160px' });
    observer.observe(host);
    return () => { disposed = true; observer.disconnect(); cleanup?.(); };
  }, [mediaAllowed, settings.reducedMotion, settings.animSpeed, settings.scrollScene]);
  return (
    <section className="depth-story" aria-labelledby="depth-story-title">
      <div className="depth-story-copy" data-scroll-reveal>
        <span className="depth-story-rule" aria-hidden="true" />
        <h2 id="depth-story-title">The details behind every move.</h2>
        <p>From a unit’s upgrade path to its place in the market, find the information you need in one place.</p>
        <Link to="/wiki/units/search">Explore units <CoolIcon name="arrow-up-right" size={18} /></Link>
      </div>
      <div className={`depth-story-scene${ready ? ' is-ready' : ''}`} aria-hidden="true">
        <div className="depth-story-canvas" ref={hostRef} />
        <svg className="depth-story-fallback" viewBox="0 0 440 310" fill="none" focusable="false">
          <path d="M59 251L220 296L381 251L220 211Z" stroke="currentColor" opacity=".18" />
          <path d="M126 234L220 261L314 234L220 207Z" fill="currentColor" opacity=".12" />
          <path d="M126 234V244L220 271L314 244V234L220 261Z" fill="currentColor" opacity=".2" />
          <path d="M220 42L285 102L267 169L220 195L173 169L155 102Z" fill="currentColor" opacity=".3" />
          <path d="M220 42L235 105L285 102M220 42L200 105L155 102M200 105L173 169L220 195L267 169L235 105L200 105Z" stroke="currentColor" opacity=".7" />
        </svg>
        <span className="depth-story-scene-caption">THE UNIT INDEX</span>
      </div>
    </section>
  );
}
