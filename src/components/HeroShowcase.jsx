import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HERO_ARTWORK } from '../data/heroArtwork';
import { loadUXSettings } from '../utils/uxSettings';
import { HERO_ROTATION_MS, nextHeroSlug } from '../utils/heroCarousel';
import HeroAtmosphere from './HeroAtmosphere';
import CoolIcon from './CoolIcon';
import './HeroShowcase.css';

export default function HeroShowcase() {
  const heroRef = useRef(null);
  const [currentSlug, setCurrentSlug] = useState(HERO_ARTWORK[0].slug);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [settings, setSettings] = useState(() => loadUXSettings());
  const [failedImages, setFailedImages] = useState(() => new Set());
  const [announcement, setAnnouncement] = useState('');
  const artwork = HERO_ARTWORK.find((entry) => entry.slug === currentSlug) || HERO_ARTWORK[0];
  const image = failedImages.has(artwork.slug) ? null : artwork.image;
  const imageStyle = image ? { '--hero-image': `url(${JSON.stringify(image)})` } : undefined;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMedia = () => setSystemReducedMotion(media.matches);
    const updateSettings = (event) => setSettings(event.detail || loadUXSettings());
    const updateVisibility = () => setTabVisible(document.visibilityState === 'visible');
    media.addEventListener('change', updateMedia);
    window.addEventListener('apex-ux-updated', updateSettings);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      media.removeEventListener('change', updateMedia);
      window.removeEventListener('apex-ux-updated', updateSettings);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!heroRef.current || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const motionAllowed = !systemReducedMotion && !settings.reducedMotion && Number(settings.animSpeed) > 0;
  useEffect(() => {
    if (paused || !motionAllowed || !inView || !tabVisible || HERO_ARTWORK.length < 2) return undefined;
    const timer = window.setTimeout(() => setCurrentSlug((current) => nextHeroSlug(HERO_ARTWORK, current)), HERO_ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [currentSlug, paused, motionAllowed, inView, tabVisible]);

  const changeUnit = useCallback((direction) => {
    const next = nextHeroSlug(HERO_ARTWORK, artwork.slug, direction);
    if (!next) return;
    setCurrentSlug(next);
    setAnnouncement(HERO_ARTWORK.find((entry) => entry.slug === next)?.name || 'Artwork');
  }, [artwork.slug]);

  return (
    <section ref={heroRef} className="apex-hero" aria-labelledby="apex-hero-title" aria-roledescription="carousel" data-unit-count={HERO_ARTWORK.length}>
      <HeroAtmosphere />
      <h1 id="apex-hero-title" className="apex-hero-display">APEX<span className="apex-sr-only"> Wiki &amp; Values</span></h1>

      <figure className="apex-hero-visual" aria-label={artwork.name} data-unit-slug={artwork.slug}>
        <div key={artwork.slug} className="apex-hero-art">
          {image ? <div className="apex-hero-portrait" style={imageStyle}>
            <img src={image} className="apex-hero-unit" alt={`${artwork.name} artwork`} fetchPriority={artwork.slug === HERO_ARTWORK[0].slug ? 'high' : 'auto'} decoding="async" draggable="false" onError={() => setFailedImages((previous) => new Set(previous).add(artwork.slug))} />
            <span className="apex-hero-unit-tint" aria-hidden="true" />
          </div> : <div className="apex-hero-art-missing" aria-hidden="true">{artwork.name.charAt(0)}</div>}
        </div>
      </figure>

      <nav className="apex-hero-actions" aria-label="Explore Apex">
        <Link to="/wiki" className="apex-hero-primary">Wiki <CoolIcon name="arrow-up-right" size={17} /></Link>
        <Link to="/values" className="apex-hero-secondary">Values <CoolIcon name="arrow-up-right" size={17} /></Link>
      </nav>

      <div className="apex-hero-controls" aria-label="Unit carousel controls">
        <button type="button" onClick={() => changeUnit(-1)} aria-label="Previous unit"><CoolIcon name="arrow-left" size={19} /></button>
        {motionAllowed && <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play unit rotation' : 'Pause unit rotation'}><CoolIcon name={paused ? 'play' : 'pause'} size={16} /></button>}
        <button type="button" onClick={() => changeUnit(1)} aria-label="Next unit"><CoolIcon name="arrow-right" size={19} /></button>
      </div>
      <span className="apex-sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
    </section>
  );
}
