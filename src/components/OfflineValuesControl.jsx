import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { toggleOfflineValuesMode } from '../utils/offlineValues';
import './OfflineValuesControl.css';

/**
 * Visible OFFLINE Values switch in the header. Shows where the numbers on
 * screen came from, so nobody mistakes a cached snapshot for live data.
 */
export default function OfflineValuesControl() {
  const { offlineMode, setOfflineMode, browserOnline, dataSource } = useData();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const forcedOffline = offlineMode || !browserOnline;
  // Three honest states instead of two (operator, 2026-11-12 — "databases still
  // disagree, the site says LIVE while it shows stale numbers"):
  //   live  → the worker bundle on screen is current
  //   cache → online, but the live database could not be reached, so the page
  //           is showing the bundled snapshot / this browser's last copy
  //   offline → the visitor (or the network) forced OFFLINE Values
  const stale = !forcedOffline && dataSource === 'baked';
  const chipState = forcedOffline ? 'offline' : stale ? 'cache' : 'live';
  const chipLabel = forcedOffline ? 'OFFLINE' : stale ? 'CACHED' : 'LIVE';
  const chipTitle = forcedOffline
    ? 'OFFLINE Values mode is on — manage'
    : stale
      ? 'Live database unreachable — showing the bundled snapshot. Click for details.'
      : 'Live values — manage offline mode';

  useEffect(() => { setExpanded(false); }, [location.pathname]);

  return (
    <div className="apex-offline-wrap">
      <button
        type="button"
        className={`apex-offline-chip is-${chipState}`}
        data-apex-offline-toggle=""
        data-apex-data-source={chipState}
        aria-expanded={expanded}
        aria-label={chipTitle}
        title={chipTitle}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="apex-offline-dot" aria-hidden="true" />
        <span>{chipLabel}</span>
      </button>

      {expanded && (
        <div className="apex-offline-popover" role="dialog" aria-label="OFFLINE Values mode settings">
          <div className="apex-offline-popover-head">
            <strong>OFFLINE Values mode</strong>
            <button type="button" onClick={() => setExpanded(false)} aria-label="Close">✕</button>
          </div>
          <p>
            {offlineMode
              ? 'Values are served from the bundled snapshot and this browser’s last cached data. No live value requests are made.'
              : !browserOnline
                ? 'Your browser is offline. The site is showing cached values until the connection returns.'
                : stale
                  ? 'The live database could not be reached, so every page is showing the bundled snapshot. Nothing here is invented — it is the last snapshot shipped with the site, and it converges the moment the worker answers again.'
                  : 'Live values are being synced from the APEX worker.'}
          </p>
          <div className="apex-offline-source">
            <span>Data source</span>
            <strong data-apex-source-label="">{dataSource === 'offline' ? 'Baked snapshot + cache' : dataSource === 'live' ? 'Live worker bundle' : 'Bundled snapshot (worker unreachable)'}</strong>
          </div>
          <label className="apex-offline-switch">
            <input
              type="checkbox"
              checked={offlineMode}
              onChange={() => setOfflineMode(!offlineMode)}
              data-apex-offline-checkbox=""
            />
            <span>Force OFFLINE Values</span>
          </label>
          <small>Admins can still publish edits after switching back to live. Your choice is saved in this browser.</small>
          <button type="button" className="apex-offline-quick" onClick={() => { toggleOfflineValuesMode(); setExpanded(false); }}>
            Switch to {offlineMode ? 'live' : 'offline'} now
          </button>
        </div>
      )}
    </div>
  );
}

/** Fixed banner, mounted at app root so no filtered header traps it. */
export function OfflineValuesBanner() {
  const { offlineMode, setOfflineMode, browserOnline } = useData();
  const location = useLocation();
  const forcedOffline = offlineMode || !browserOnline;
  const onValuesPage = location.pathname.startsWith('/values')
    || location.pathname.startsWith('/wiki')
    || location.pathname === '/';
  if (!forcedOffline || !onValuesPage) return null;
  return (
    <div className="apex-offline-banner" role="status" data-apex-offline-badge="on">
      <span>📴 OFFLINE VALUES</span>
      <small>{offlineMode ? 'Showing the baked snapshot + cache' : 'No connection — showing cached data'}</small>
      <button type="button" onClick={() => setOfflineMode(false)} disabled={!browserOnline}>
        {browserOnline ? 'Go live' : 'Waiting for connection'}
      </button>
    </div>
  );
}
