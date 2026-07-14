import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getUnitIcon } from '../data/unitIcons';
import { getCachedWikiImage, saveCachedWikiImage } from '../utils/wikiImageCache';
import { isMissingTableError, isSupabaseConfigured, supabase } from '../utils/supabase';
import './UnitIcon.css';

const overrideCache = new Map();
const pendingFetches = new Map();
let overrideTableUnavailable = false;

async function fetchUnitImageOverride(slug) {
  if (!slug || !isSupabaseConfigured || overrideTableUnavailable) return null;
  const cached = getCachedWikiImage(slug);
  if (cached) {
    overrideCache.set(slug, cached);
    return cached;
  }
  if (overrideCache.has(slug)) return overrideCache.get(slug);
  if (pendingFetches.has(slug)) return pendingFetches.get(slug);

  const request = supabase
    .from('unit_wiki_overrides')
    .select('image_url')
    .eq('slug', slug)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error) {
        if (isMissingTableError(error)) overrideTableUnavailable = true;
        overrideCache.set(slug, null);
        return null;
      }
      const url = data?.image_url || null;
      overrideCache.set(slug, url);
      if (url) saveCachedWikiImage(slug, url);
      return url;
    })
    .catch(() => {
      overrideCache.set(slug, null);
      return null;
    })
    .finally(() => {
      pendingFetches.delete(slug);
    });

  pendingFetches.set(slug, request);
  return request;
}

function useUnitImageOverride(slug, explicitImageUrl) {
  const [overrideUrl, setOverrideUrl] = useState(() => explicitImageUrl || getCachedWikiImage(slug) || overrideCache.get(slug) || null);

  useEffect(() => {
    let cancelled = false;

    if (explicitImageUrl) {
      setOverrideUrl(explicitImageUrl);
      return undefined;
    }

    setOverrideUrl(getCachedWikiImage(slug) || overrideCache.get(slug) || null);
    fetchUnitImageOverride(slug).then((url) => {
      if (!cancelled) setOverrideUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [slug, explicitImageUrl]);

  return overrideUrl;
}

export default function UnitIcon({ slug, name, glowColor, shiny = false, size = 64, imageUrl = null }) {
  const overrideUrl = useUnitImageOverride(slug, imageUrl);
  const icon = overrideUrl || getUnitIcon(slug, shiny);

  return (
    <motion.div
      className="unit-icon"
      style={{
        width: size,
        height: size,
        '--icon-glow': glowColor || 'rgba(255,255,255,0.35)',
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="unit-icon-glow" />
      <div className="unit-icon-squircle">
        {icon ? (
          <img src={icon} alt={name} className="unit-icon-img" />
        ) : (
          <div className="unit-icon-fallback">{name?.[0] ?? '?'}</div>
        )}
      </div>
    </motion.div>
  );
}
