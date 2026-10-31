import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUnitIcon } from '../data/unitIcons';
import { getCachedWikiImage, onWikiImageCacheChange } from '../utils/wikiImageCache';
import { loadUXSettings } from '../utils/uxSettings';
import { HERO_ROTATION_MS, HERO_START_SLUG, heroUnitName, nextHeroSlug, orderHeroUnits } from '../utils/heroCarousel';
import { CUTOUT_MAP } from './ThemeCutout';
import HeroAtmosphere from './HeroAtmosphere';
import CoolIcon from './CoolIcon';
import './HeroShowcase.css';

export default function HeroShowcase({ units = [] }) {
  const heroRef = useRef(null);
  const roster = useMemo(() => orderHeroUnits(units), [units]);
  const [currentSlug, setCurrentSlug] = useState(HERO_START_SLUG);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [settings, setSettings] = useState(() => loadUXSettings());
  const [cached, setCached] = useState({ slug: '', url: null });
  const [failedImages, setFailedImages] = useState({ slug: '', urls: [] });
  const [announcement, setAnnouncement] = useState('');
  const unit = roster.find((entry) => entry.slug === currentSlug) || roster[0];
  const activeSlug = unit?.slug || HERO_START_SLUG;
  const name = unit ? heroUnitName(unit) : 'Overclocked Overlord';

  useEffect(() => {
    const update = () => setCached({ slug: activeSlug, url: getCachedWikiImage(activeSlug) });
    update();
    return onWikiImageCacheChange((event) => { if (event.detail?.slug === activeSlug) update(); });
  }, [activeSlug]);

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
    if (paused || !motionAllowed || !inView || !tabVisible || roster.length < 2) return undefined;
    const timer = window.setTimeout(() => setCurrentSlug((current) => nextHeroSlug(roster, current)), HERO_ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [roster, currentSlug, paused, motionAllowed, inView, tabVisible]);

  const changeUnit = useCallback((direction) => {
    const next = nextHeroSlug(roster, activeSlug, direction);
    if (!next) return;
    setCurrentSlug(next);
    setAnnouncement(heroUnitName(roster.find((entry) => entry.slug === next)));
  }, [activeSlug, roster]);

  // Same priority as the site's existing unit art. Optional website icons are
  // never substituted here. The original cutout is only a loading fallback.
  const fallback = getUnitIcon(activeSlug, !!unit?.shiny || activeSlug.startsWith('shiny-'))
    || (activeSlug === HERO_START_SLUG ? CUTOUT_MAP.overlord.src : null);
  const failures = failedImages.slug === activeSlug ? failedImages.urls : [];
  const image = [unit?.imageUrl, cached.slug === activeSlug ? cached.url : null, fallback]
    .find((url) => typeof url === 'string' && url && !failures.includes(url));
  const imageStyle = image ? { '--hero-image': `url(${JSON.stringify(image)})` } : undefined;

  return (
    <section ref={heroRef} className="apex-hero" aria-labelledby="apex-hero-title" aria-roledescription="carousel" data-unit-count={roster.length}>
      <HeroAtmosphere />
      <h1 id="apex-hero-title" className="apex-hero-display">APEX<span className="apex-sr-only"> Wiki &amp; Values</span></h1>

      <figure className="apex-hero-visual" aria-label={name} data-unit-slug={activeSlug}>
        <div key={activeSlug} className="apex-hero-art" style={imageStyle}>
          {image ? <>
            <img src={image} className="apex-hero-unit" alt={`${name} unit artwork`} fetchPriority={activeSlug === HERO_START_SLUG ? 'high' : 'auto'} decoding="async" draggable="false" onError={() => setFailedImages((previous) => ({ slug: activeSlug, urls: [...(previous.slug === activeSlug ? previous.urls : []), image] }))} />
            <span className="apex-hero-unit-tint" aria-hidden="true" />
          </> : <div className="apex-hero-art-missing" aria-hidden="true">{name.charAt(0)}</div>}
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
