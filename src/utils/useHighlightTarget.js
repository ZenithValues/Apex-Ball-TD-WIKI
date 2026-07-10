import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reads ?highlight=<slug> from the URL, scrolls the matching element
 * (identified by a `data-slug="<slug>"` attribute) into view once mounted,
 * and returns the currently-highlighted slug (or null) so callers can apply
 * a visual pulse class to that one card. Used by the header's "jump to
 * unit" search feature — see GlobalUnitSearch.jsx.
 */
export function useHighlightTarget() {
  const location = useLocation();
  const [highlighted, setHighlighted] = useState(null);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get('highlight');
    if (!target) return undefined;

    setHighlighted(target);
    const scrollTimer = setTimeout(() => {
      const el = document.querySelector(`[data-slug="${CSS.escape(target)}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);

    clearTimerRef.current = setTimeout(() => setHighlighted(null), 2400);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimerRef.current);
    };
  }, [location.search]);

  return highlighted;
}
