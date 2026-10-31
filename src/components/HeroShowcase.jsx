import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HERO_ARTWORK } from '../data/heroArtwork';
import useMotionPreference from '../hooks/useMotionPreference';
import { HERO_ROTATION_MS, nextHeroSlug } from '../utils/heroCarousel';
import HeroAtmosphere from './HeroAtmosphere';
import CoolIcon from './CoolIcon';
import './HeroShowcase.css';

const firstSlide = { artwork: HERO_ARTWORK[0], id: 0 };

function ArtworkLayer({ slide, phase, failed, onReady, onFailure }) {
  const { artwork } = slide;
  const imageStyle = { '--hero-image': `url(${JSON.stringify(artwork.image)})` };
  const readyWhenDecoded = (event) => {
    if (phase !== 'pending') return;
    const image = event.currentTarget;
    // Keep the preceding portrait visible until the replacement is decoded.
    // Failure to decode is non-fatal: an onLoad image can still be displayed.
    if (typeof image.decode === 'function') image.decode().catch(() => {}).then(() => onReady(slide));
    else onReady(slide);
  };
  return (
    <div className={`apex-hero-art-layer is-${phase}`} data-artwork={artwork.slug} aria-hidden="true">
      {failed ? <div className="apex-hero-art-missing">{artwork.name.charAt(0)}</div> : (
        <div className="apex-hero-portrait" style={imageStyle}>
          <img
            src={artwork.image}
            className="apex-hero-unit"
            alt=""
            fetchPriority={slide.id === 0 ? 'high' : 'auto'}
            decoding="async"
            draggable="false"
            onLoad={readyWhenDecoded}
            onError={() => onFailure(slide, phase)}
          />
          <span className="apex-hero-unit-tint" />
        </div>
      )}
    </div>
  );
}

export default function HeroShowcase() {
  const heroRef = useRef(null);
  const requestId = useRef(0);
  const [slides, setSlides] = useState({ current: firstSlide, previous: null, pending: null });
  const [paused, setPaused] = useState(false);
  const [playOverride, setPlayOverride] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const [announcement, setAnnouncement] = useState('');
  const motionAllowed = useMotionPreference();
  const artwork = slides.current.artwork;
  const playing = !paused && (motionAllowed || playOverride);

  useEffect(() => {
    const updateVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!heroRef.current || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  // If the visitor changes a global motion setting later, require a fresh
  // explicit opt-in before overriding that preference for this carousel.
  useEffect(() => setPlayOverride(false), [motionAllowed]);

  const changeUnit = useCallback((direction, announce = true) => {
    const id = ++requestId.current;
    setSlides((current) => {
      const origin = current.pending?.artwork.slug || current.current.artwork.slug;
      const next = nextHeroSlug(HERO_ARTWORK, origin, direction);
      const nextArtwork = HERO_ARTWORK.find((entry) => entry.slug === next);
      if (!nextArtwork || nextArtwork.slug === current.current.artwork.slug) {
        return { ...current, pending: null };
      }
      return { ...current, pending: { artwork: nextArtwork, id, announce } };
    });
  }, []);

  const commitPending = useCallback((pending) => {
    if (requestId.current !== pending.id) return;
    setSlides((current) => current.pending?.id === pending.id
      ? { previous: current.current, current: pending, pending: null }
      : current);
    if (pending.announce) setAnnouncement(pending.artwork.name);
  }, []);

  const onFailure = useCallback((slide, phase) => {
    setFailedImages((previous) => new Set(previous).add(slide.artwork.slug));
    if (phase === 'pending') commitPending(slide);
  }, [commitPending]);

  // A previously failed image has a fallback rather than an <img> load event.
  useEffect(() => {
    if (slides.pending && failedImages.has(slides.pending.artwork.slug)) commitPending(slides.pending);
  }, [slides.pending, failedImages, commitPending]);

  // Keep the DOM to two visible layers only for the duration of the dissolve.
  useEffect(() => {
    if (!slides.previous) return undefined;
    const id = slides.current.id;
    const timer = window.setTimeout(() => setSlides((current) => current.current.id === id
      ? { ...current, previous: null }
      : current), 850);
    return () => window.clearTimeout(timer);
  }, [slides.current.id, slides.previous]);

  // Warm the next supplied image so automatic changes usually decode before
  // their turn; data-saver visitors do not receive speculative downloads.
  useEffect(() => {
    if (navigator.connection?.saveData) return undefined;
    const next = nextHeroSlug(HERO_ARTWORK, artwork.slug);
    const entry = HERO_ARTWORK.find((item) => item.slug === next);
    if (!entry) return undefined;
    const preloader = new Image();
    preloader.decoding = 'async';
    preloader.src = entry.image;
    return () => { preloader.onload = null; preloader.onerror = null; };
  }, [artwork.slug]);

  useEffect(() => {
    if (!playing || !inView || !tabVisible || slides.pending || HERO_ARTWORK.length < 2) return undefined;
    const timer = window.setTimeout(() => changeUnit(1, false), HERO_ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [slides.current.id, slides.pending, playing, inView, tabVisible, changeUnit]);

  const toggleRotation = () => {
    if (playing) setPaused(true);
    else {
      if (!motionAllowed) setPlayOverride(true);
      setPaused(false);
    }
  };

  const layer = (slide, phase) => <ArtworkLayer
    key={slide.id}
    slide={slide}
    phase={phase}
    failed={failedImages.has(slide.artwork.slug)}
    onReady={commitPending}
    onFailure={onFailure}
  />;

  return (
    <section ref={heroRef} className="apex-hero" aria-labelledby="apex-hero-title" aria-roledescription="carousel" data-unit-count={HERO_ARTWORK.length}>
      <HeroAtmosphere />
      <h1 id="apex-hero-title" className="apex-hero-display">APEX<span className="apex-sr-only"> Wiki &amp; Values</span></h1>

      <figure className="apex-hero-visual" aria-label={`${artwork.name} artwork`} data-unit-slug={artwork.slug}>
        <div className="apex-hero-art">
          {slides.previous && layer(slides.previous, 'leaving')}
          {layer(slides.current, slides.previous ? 'entering' : slides.current.id === 0 ? 'initial' : 'current')}
          {slides.pending && layer(slides.pending, 'pending')}
        </div>
      </figure>

      <nav className="apex-hero-actions" aria-label="Explore Apex">
        <Link to="/wiki" className="apex-hero-primary">Wiki <CoolIcon name="arrow-up-right" size={17} /></Link>
        <Link to="/values" className="apex-hero-secondary">Values <CoolIcon name="arrow-up-right" size={17} /></Link>
      </nav>

      <div className="apex-hero-controls" aria-label="Unit carousel controls">
        <button type="button" onClick={() => changeUnit(-1)} aria-label="Previous unit"><CoolIcon name="arrow-left" size={19} /></button>
        <button type="button" onClick={toggleRotation} aria-label={playing ? 'Pause unit rotation' : 'Play unit rotation'} title={!motionAllowed && !playing ? 'Play this carousel despite the reduced-motion setting' : undefined}>
          <CoolIcon name={playing ? 'pause' : 'play'} size={16} />
        </button>
        <button type="button" onClick={() => changeUnit(1)} aria-label="Next unit"><CoolIcon name="arrow-right" size={19} /></button>
      </div>
      <span className="apex-sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
    </section>
  );
}
