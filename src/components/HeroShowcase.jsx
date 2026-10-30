import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CUTOUT_MAP } from './ThemeCutout';
import HeroAtmosphere from './HeroAtmosphere';
import CoolIcon from './CoolIcon';
import './HeroShowcase.css';

// These are the project's existing showcase cutouts, not the optional icons
// supplied for the website. They do not modify wiki or value unit images.
const SUBJECTS = [
  { id: 'overlord', name: 'Overclocked Overlord' },
  { id: 'poseidon', name: 'Poseidon' },
  { id: 'king', name: 'King Ball' },
];

export default function HeroShowcase({ unitCount, variantCount }) {
  const [index, setIndex] = useState(0);
  const active = SUBJECTS[index];
  const change = (direction) => setIndex((current) => (current + direction + SUBJECTS.length) % SUBJECTS.length);
  const count = variantCount || unitCount;

  return (
    <section className="apex-hero" aria-labelledby="apex-hero-title">
      <HeroAtmosphere />
      <div className="apex-hero-meta"><span>A guide to Ball Tower Defense</span><span>Wiki &amp; values</span></div>

      <span className="apex-hero-display" aria-hidden="true">APEX</span>
      <figure className="apex-hero-visual">
        <img key={active.id} src={CUTOUT_MAP[active.id].src} className="apex-hero-unit" alt={`${active.name} unit artwork`} fetchPriority={index === 0 ? 'high' : 'auto'} />
      </figure>

      <div className="apex-hero-copy">
        <h1 id="apex-hero-title">Everything<br />Ball Tower Defense.</h1>
        <p>Explore units, understand values, and find the tools for your next move.</p>
        <div className="apex-hero-actions">
          <Link to="/wiki" className="apex-hero-primary">Explore the wiki <CoolIcon name="arrow-up-right" size={17} /></Link>
          <Link to="/values" className="apex-hero-secondary">View values <CoolIcon name="arrow-right" size={16} /></Link>
        </div>
      </div>

      <div className="apex-hero-featured" aria-live="polite" aria-atomic="true">
        <span>Featured unit</span>
        <strong>{active.name}</strong>
        <div className="apex-hero-controls" aria-label="Featured unit controls">
          <button type="button" onClick={() => change(-1)} aria-label="Previous unit"><CoolIcon name="arrow-left" size={19} /></button>
          <span>{String(index + 1).padStart(2, '0')} <i>/</i> {String(SUBJECTS.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => change(1)} aria-label="Next unit"><CoolIcon name="arrow-right" size={19} /></button>
        </div>
      </div>

      <div className="apex-hero-bottom">
        <a href="#inside-apex">Discover the index <span className="apex-hero-down" aria-hidden="true">↓</span></a>
        <span>{count ? `${count} unit variants` : 'Unit index'} <span className="apex-hero-separator" aria-hidden="true">/</span> Made for the game</span>
      </div>
    </section>
  );
}
