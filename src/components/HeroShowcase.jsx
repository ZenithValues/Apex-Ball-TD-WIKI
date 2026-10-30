import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CUTOUT_MAP } from './ThemeCutout';
import './HeroShowcase.css';

// An editorial product-style showcase inspired by the reference, using the
// project's own unit artwork rather than the reference's third-party image.
const SUBJECTS = [
  { id: 'overlord', name: 'Overclocked Overlord', word: 'OVERLORD', number: '01' },
  { id: 'poseidon', name: 'Poseidon', word: 'POSEIDON', number: '02' },
  { id: 'king', name: 'King Ball', word: 'KING BALL', number: '03' },
  { id: 'laserminigunner', name: 'Laser Minigunner', word: 'MINIGUNNER', number: '04' },
  { id: 'hacker', name: 'Hacker Ball', word: 'HACKER', number: '05' },
];

export default function HeroShowcase({ unitCount, variantCount }) {
  const [index, setIndex] = useState(0);
  const active = SUBJECTS[index];
  const change = (direction) => setIndex((current) => (current + direction + SUBJECTS.length) % SUBJECTS.length);

  return (
    <section className="apex-hero" aria-labelledby="apex-hero-title">
      <div className="apex-hero-diagonal" aria-hidden="true" />
      <div className="apex-hero-edge" aria-hidden="true" />

      <div className="apex-hero-topline">
        <span className="apex-hero-kicker">APEX WIKI &amp; VALUES</span>
        <span className="apex-hero-topline-note">THE BALL TOWER DEFENSE COMPANION</span>
      </div>

      <nav className="apex-hero-rail" aria-label="Featured unit artwork">
        {SUBJECTS.map((subject, i) => (
          <button
            className={`apex-hero-rail-button${i === index ? ' is-active' : ''}`}
            type="button"
            key={subject.id}
            onClick={() => setIndex(i)}
            aria-label={`Show ${subject.name}`}
            aria-pressed={i === index}
          >
            <img src={CUTOUT_MAP[subject.id].src} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
            <span aria-hidden="true">{subject.number}</span>
          </button>
        ))}
      </nav>

      <div className="apex-hero-copy">
        <div className="apex-hero-eyebrow"><span /> YOUR GAME, IN FOCUS</div>
        <h1 id="apex-hero-title">Know the game.<br /><em>Make your move.</em></h1>
        <p>Discover units, understand values, and make more confident trades in Ball Tower Defense.</p>
        <div className="apex-hero-actions">
          <Link to="/values" className="apex-hero-button apex-hero-button-main">Explore values <span aria-hidden="true">↗</span></Link>
          <Link to="/wiki" className="apex-hero-button apex-hero-button-quiet">Browse the wiki <span aria-hidden="true">→</span></Link>
        </div>
      </div>

      <figure className="apex-hero-product" aria-live="polite" aria-atomic="true">
        <span className="apex-hero-product-word" aria-hidden="true">{active.word}</span>
        <span className="apex-hero-product-shadow" aria-hidden="true" />
        <img key={active.id} className="apex-hero-product-image" src={CUTOUT_MAP[active.id].src} alt={`${active.name} unit artwork`} fetchPriority="high" />
        <figcaption className="apex-hero-product-caption">
          <span>FEATURED UNIT</span>
          <strong>{active.name}</strong>
        </figcaption>
      </figure>

      <div className="apex-hero-bottom">
        <div className="apex-hero-pagination" aria-label="Unit showcase controls">
          <strong>{active.number}</strong><span> / {String(SUBJECTS.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => change(-1)} aria-label="Previous unit">←</button>
          <button type="button" onClick={() => change(1)} aria-label="Next unit">→</button>
        </div>
        <div className="apex-hero-specs" aria-label="What you can explore">
          <div><strong>{variantCount || unitCount || '—'}</strong><span>UNIT VARIANTS</span></div>
          <div><strong>VALUES</strong><span>MARKET INDEX</span></div>
          <div><strong>W / F / L</strong><span>TRADE TOOL</span></div>
        </div>
        <Link to="/values/calculator" className="apex-hero-bottom-link">Open calculator <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
