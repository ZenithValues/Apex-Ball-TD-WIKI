import { useState } from 'react';
import { useData } from '../context/DataContext';

/**
 * DataStatusChip (rev 8) — the site says OUT LOUD when it is not looking at the
 * live database.
 *
 * The complaint that started this: "every unit image and some units gone". Every
 * image on a card comes from the shared database bundle (346 of the 353 unit rows
 * carry one), so if that 7.6 MB request fails the page silently falls back to an
 * older snapshot — same units, same layout, but no artwork and some rows missing.
 * Nothing on screen said so. Now it does, with the counts it actually loaded and
 * a Retry button.
 */
export default function DataStatusChip() {
  const { dataSource, diagnostics, refresh, offlineMode } = useData();
  const [busy, setBusy] = useState(false);

  if (offlineMode || dataSource === 'live') return null;
  const { wikiRows = 0, wikiImages = 0, version = null, lastError = null } = diagnostics || {};

  async function retry() {
    setBusy(true);
    try { await refresh?.(); } finally { setBusy(false); }
  }

  return (
    <div
      role="status"
      style={{
        position: 'fixed', bottom: '14px', left: '14px', zIndex: 95,
        display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '340px',
        padding: '10px 14px', borderRadius: '12px', fontSize: '12px', lineHeight: 1.45,
        background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.5)',
        color: '#fde68a', backdropFilter: 'blur(8px)',
      }}
    >
      <strong style={{ fontSize: '12px', letterSpacing: '0.02em' }}>
        ⚠ Offline snapshot — the shared database did not answer
      </strong>
      <span>
        Loaded {wikiRows} unit rows · {wikiImages} with images
        {version ? ` · snapshot v${version}` : ''}
        {lastError ? ` · ${String(lastError).slice(0, 60)}` : ''}
      </span>
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        style={{
          alignSelf: 'flex-start', marginTop: '2px', padding: '5px 12px', borderRadius: '999px',
          border: '1px solid rgba(234, 179, 8, 0.6)', background: 'rgba(234, 179, 8, 0.18)',
          color: '#fde68a', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
        }}
      >
        {busy ? 'Retrying…' : 'Retry live data'}
      </button>
    </div>
  );
}
