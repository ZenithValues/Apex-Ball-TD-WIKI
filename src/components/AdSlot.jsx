import { useEffect, useState } from 'react';
import { AD_CLIENT, areAdsAllowed, ensureAdSenseScript } from '../utils/ads';

// Deliberately renders nothing until all launch/privacy and route gates pass.
// TFAT=1 is a conservative child treatment signal, NOT parental consent or a
// replacement for a certified CMP. Ads remain disabled in this build.
export default function AdSlot({ slotId, ready = true }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let timer;
    const update = () => {
      window.clearTimeout(timer);
      if (!areAdsAllowed() || !ready || !slotId) {
        setAllowed(false);
        return;
      }
      timer = window.setTimeout(() => {
        if (ensureAdSenseScript()) setAllowed(true);
      }, 1200);
    };
    window.addEventListener('apex-ads-state', update);
    update();
    return () => { window.clearTimeout(timer); window.removeEventListener('apex-ads-state', update); };
  }, [ready, slotId]);

  useEffect(() => {
    if (!allowed || !slotId || !areAdsAllowed()) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('AdSense failed to push slot:', error);
    }
  }, [allowed, slotId]);

  if (!allowed) return null;
  return (
    <aside className="apex-ad-slot-wrapper" aria-label="Advertisement" style={{ margin: '64px auto', textAlign: 'center', width: '100%' }}>
      <span style={{ display: 'block', marginBottom: 12, fontSize: 11, color: 'var(--text-dim)' }}>Advertisement</span>
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client={AD_CLIENT} data-ad-slot={slotId} data-ad-format="auto" data-full-width-responsive="true" data-tag-for-age-treatment="1" />
    </aside>
  );
}
