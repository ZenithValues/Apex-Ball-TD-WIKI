import { useEffect, useRef, useState } from 'react';
import './KineticText.css';

/**
 * Kinetic headline: words (and lines split by \n) rise in sequentially with a
 * calm 1.55s ease once visible in the viewport (immediate check on mount for
 * above-the-fold headings so animated page routes trigger cleanly).
 */
export default function KineticText({ text = '', as: Tag = 'span', className = '', step = 0.09 }) {
  const rootRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.98) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -3% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [text]);

  const lines = String(text).split('\n');
  let index = 0;
  const classes = [className ? `kt ${className}` : 'kt', inView ? 'kt-in' : ''].filter(Boolean).join(' ');
  return (
    <Tag ref={rootRef} className={classes} aria-label={String(text).replace(/\n/g, ' ')}>
      {lines.map((line, li) => {
        const parts = line.split(/(\s+)/);
        return (
          <span className="kt-line" key={li}>
            {parts.map((part, i) => {
              if (!part) return null;
              if (!part.trim()) return <span key={i}> </span>;
              const n = index++;
              return (
                <span
                  key={i}
                  className="kt-unit"
                  aria-hidden="true"
                  style={{ '--kt-i': n, animationDelay: `${(n * step).toFixed(2)}s` }}
                >
                  {part}
                </span>
              );
            })}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </Tag>
  );
}
