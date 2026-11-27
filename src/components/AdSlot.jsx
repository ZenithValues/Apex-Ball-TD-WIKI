import { useEffect, useMemo, useRef, useState } from 'react';
import {
  areAdsAllowed,
  buildAdsterraBannerSrcDoc,
  resolvePlacement,
} from '../utils/ads';
import { PRIVACY_CHANGE_EVENT } from '../utils/privacyChoices';
import './AdSlot.css';

const MOBILE_MEDIA = '(max-width: 767px)';

export default function AdSlot({ placement = 'banner', ready = true, className = '' }) {
  const [allowed, setAllowed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(MOBILE_MEDIA).matches
      : false
  ));
  const nativeContainerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia(MOBILE_MEDIA);
    const onMatch = (e) => setIsMobile(Boolean(e.matches));
    setIsMobile(mq.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onMatch);
      return () => mq.removeEventListener('change', onMatch);
    }
    mq.addListener?.(onMatch);
    return () => mq.removeListener?.(onMatch);
  }, []);

  const spec = useMemo(() => resolvePlacement(placement, isMobile), [placement, isMobile]);

  useEffect(() => {
    const update = () => {
      setAllowed(Boolean(areAdsAllowed() && ready && spec));
    };
    window.addEventListener('apex-ads-state', update);
    window.addEventListener(PRIVACY_CHANGE_EVENT, update);
    update();
    return () => {
      window.removeEventListener('apex-ads-state', update);
      window.removeEventListener(PRIVACY_CHANGE_EVENT, update);
    };
  }, [ready, spec]);

  useEffect(() => {
    if (!allowed || !spec || spec.format !== 'native') return undefined;
    const host = nativeContainerRef.current;
    if (!host) return undefined;

    // Ensure only one script instance runs per container mount
    const existingScript = document.querySelector(`script[data-apex-adsterra-key="${spec.key}"]`);
    if (existingScript) existingScript.remove();
    host.innerHTML = '';

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-apex-adsterra', 'true');
    script.setAttribute('data-apex-adsterra-key', spec.key);
    script.src = spec.invokeUrl;
    host.parentNode?.insertBefore(script, host);

    return () => {
      script.remove();
      host.innerHTML = '';
    };
  }, [allowed, spec]);

  const bannerSrcDoc = useMemo(() => (
    allowed && spec?.format === 'iframe' ? buildAdsterraBannerSrcDoc(spec) : ''
  ), [allowed, spec]);

  if (!allowed || !spec) return null;

  return (
    <aside
      className={['apex-ad-slot-wrapper', `apex-ad-${spec.format}`, className].filter(Boolean).join(' ')}
      aria-label="Advertisement"
      data-adsterra-placement={spec.id}
      data-adsterra-key={spec.key}
    >
      <span className="apex-ad-label">Advertisement</span>
      {spec.format === 'native' ? (
        <div
          id={spec.containerId}
          ref={nativeContainerRef}
          className="apex-ad-native-box"
          data-apex-adsterra-container="true"
        />
      ) : (
        <div
          className="apex-ad-banner-frame"
          style={{ width: spec.width, height: spec.height }}
        >
          <iframe
            title={`Advertisement (${spec.width}x${spec.height})`}
            srcDoc={bannerSrcDoc}
            width={spec.width}
            height={spec.height}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            scrolling="no"
            frameBorder="0"
            loading="lazy"
          />
        </div>
      )}
    </aside>
  );
}
