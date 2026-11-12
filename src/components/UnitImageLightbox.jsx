import { useEffect, useState } from 'react';
import './UnitImageLightbox.css';

/**
 * Click ANY unit image anywhere on the site to see it big. Capture-phase so
 * the surrounding <Link> does not navigate at the same time. Escape / click
 * outside / the close button all dismiss it.
 */
export default function UnitImageLightbox() {
  const [view, setView] = useState(null);

  useEffect(() => {
    function onClick(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const img = event.target?.closest?.('.unit-icon-img');
      if (!img) return;
      const src = img.currentSrc || img.src;
      if (!src) return;
      event.preventDefault();
      event.stopPropagation();
      setView({ src, name: img.alt || 'Unit image' });
    }
    function onKey(event) { if (event.key === 'Escape') setView(null); }
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!view) return null;
  return (
    <div className="apex-img-lightbox" role="dialog" aria-modal="true" aria-label={`${view.name} — larger view`} onClick={() => setView(null)}>
      <button type="button" className="apex-img-lightbox-close" onClick={() => setView(null)} aria-label="Close image">✕</button>
      <figure onClick={(event) => event.stopPropagation()}>
        <img src={view.src} alt={view.name} />
        <figcaption>{view.name}</figcaption>
      </figure>
    </div>
  );
}
