import './KineticText.css';

/**
 * Kinetic headline: words (and lines split by \n) rise in one by one with a
 * slow, evenly-spread ease. Accessible: the parent carries aria-label with the
 * full string and every animated span is aria-hidden. Honours the site motion
 * gates (data-motion="off" / data-anim-speed="none" render instantly).
 */
export default function KineticText({ text = '', as: Tag = 'span', className = '', step = 0.07 }) {
  const lines = String(text).split('\n');
  let index = 0;
  return (
    <Tag className={className ? `kt ${className}` : 'kt'} aria-label={String(text).replace(/\n/g, ' ')}>
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
