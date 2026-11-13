import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './AdminDraftsPanel.css';

/**
 * The "N unsaved" popup.
 *
 * BUG (operator, 2026-11-13 — image-13): the panel was `position: absolute`
 * inside `.admin-topbar`, and the top bar has `overflow: hidden` (it clips its
 * own cutout artwork). So the panel was chopped off by the bar's bottom border
 * the moment it opened.
 *
 * Fix: render the panel in a PORTAL on `document.body` with fixed positioning
 * measured from the pill, so no ancestor overflow, transform or z-index stack
 * can ever clip it again.
 */

const SECTION_META = {
  value: { icon: '💰', label: 'Value' },
  values: { icon: '💰', label: 'Value' },
  wiki: { icon: '📖', label: 'WIKI' },
  map: { icon: '🗺️', label: 'Map' },
  maps: { icon: '🗺️', label: 'Map' },
  crate: { icon: '📦', label: 'Crate' },
  crates: { icon: '📦', label: 'Crate' },
  material: { icon: '🧪', label: 'Material' },
  materials: { icon: '🧪', label: 'Material' },
  unit: { icon: '🗿', label: 'Unit' },
};

export default function AdminDraftsPanel({
  anchorRef,
  draftEntries = [],
  onClose,
  openDraft,
  discardDraft,
  publishPendingDelete,
}) {
  const [pos, setPos] = useState(null);
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    function place() {
      const anchor = anchorRef?.current;
      const rect = anchor?.getBoundingClientRect();
      if (!rect) return;
      // The bar itself can be taller than its buttons (cutout art, safe-area
      // padding), so hang the panel off whichever bottom edge is lowest — it
      // must never start underneath the bar and look "cut".
      const barRect = anchor.closest?.('.admin-topbar')?.getBoundingClientRect?.();
      const top = Math.max(rect.bottom, barRect?.bottom ?? 0) + 10;
      const width = Math.min(380, Math.max(240, window.innerWidth - 24));
      const right = Math.max(12, Math.min(window.innerWidth - width - 12, window.innerWidth - rect.right - 60));
      setPos({ top: Math.round(top), right: Math.round(right), width });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    function onDocDown(event) {
      if (panelRef.current?.contains(event.target)) return;
      if (anchorRef?.current?.contains(event.target)) return;
      onClose?.();
    }
    function onKey(event) {
      if (event.key === 'Escape') onClose?.();
    }
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorRef, onClose]);

  if (!pos || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      className="admin-drafts-panel card"
      style={{ position: 'fixed', top: pos.top, right: pos.right, width: pos.width }}
      role="dialog"
      aria-label="Unsaved drafts in this browser"
    >
      <div className="admin-drafts-head">
        <strong>Not live yet (this browser)</strong>
        <button type="button" onClick={onClose} aria-label="Close drafts panel">✕</button>
      </div>
      <div className="admin-drafts-list" data-lenis-prevent>
        {draftEntries.map((entry) => {
          const meta = SECTION_META[entry.kind] || SECTION_META.value;
          return (
            <div key={`${entry.type}:${entry.kind}:${entry.slug}`} className="admin-drafts-row">
              <span>
                <strong>{meta.icon} {entry.slug}</strong>
                {entry.savedAt && (
                  <small>Saved {new Date(entry.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                )}
              </span>
              <span className="admin-drafts-row-actions">
                {entry.type === 'form' ? (
                  <>
                    <button type="button" onClick={() => openDraft(entry)} title="Open this editor to review and save">✏️ Open</button>
                    <button type="button" onClick={() => discardDraft(entry)} title="Throw this draft away">🗑️ Discard</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => publishPendingDelete(entry)} title="Apply this deletion to the live database">🗑️ Make live</button>
                    <button type="button" onClick={() => discardDraft(entry)} title="Cancel this deletion">↩️ Cancel</button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
