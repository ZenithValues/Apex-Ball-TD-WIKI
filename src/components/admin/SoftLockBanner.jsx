import { useEffect, useRef, useState } from 'react';
import { fetchChangeLog } from '../../utils/apexClient';
import { getTeamMember, getDisplayName } from '../../utils/teamMembers';
import { subscribeLiveStatus, getLiveStatus, SELF_PUBLISH_EVENT } from '../../utils/liveStatus';
import { useData } from '../../context/DataContext';
import './SoftLockBanner.css';

// Stale-form warning: three independent signals — a recent edit by someone
// else, this unit open in another tab, and a newer published database version.
const RECENT_MS = 15 * 60 * 1000;

function ago(iso) {
  const diff = Date.now() - new Date(iso || 0).getTime();
  if (!Number.isFinite(diff)) return '';
  const mins = Math.max(1, Math.round(diff / 60000));
  return mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
}

export default function SoftLockBanner({ slug, selfEmail }) {
  const { refresh } = useData();
  const [recent, setRecent] = useState(null);
  const [otherTabs, setOtherTabs] = useState(0);
  const openedAtVersion = useRef(getLiveStatus()?.v ?? null);
  const [newVersion, setNewVersion] = useState(null);

  useEffect(() => {
    if (!slug) { setRecent(null); return undefined; }
    let alive = true;
    const load = async () => {
      const rows = await fetchChangeLog();
      if (!alive) return;
      const self = String(selfEmail || '').toLowerCase();
      const hit = (Array.isArray(rows) ? rows : [])
        .filter((r) => r.slug === slug && r.by && String(r.by).toLowerCase() !== self)
        .map((r) => ({ by: r.by, byName: r.byName, at: new Date(r.at || 0).getTime() }))
        .filter((r) => Number.isFinite(r.at) && Date.now() - r.at < RECENT_MS)
        .sort((a, b) => b.at - a.at)[0];
      setRecent(hit ? { name: hit.byName || getTeamMember(hit.by).name, mins: Math.max(1, Math.round((Date.now() - hit.at) / 60000)) } : null);
    };
    load();
    const poll = window.setInterval(load, 60000);

    // Presence is a SET of slugs: one tab closing must not clear another.
    const present = new Set();
    let chan = null;
    try {
      chan = new BroadcastChannel('apex-admin-presence');
      chan.onmessage = (ev) => {
        const msg = ev.data || {};
        if (msg.closed) present.delete(msg.from);
        else if (msg.slug) { present.add(msg.from); }
        setOtherTabs([...present].filter((id) => id !== chan.__selfId).length);
      };
      chan.__selfId = `${Date.now()}-${Math.random()}`;
      chan.postMessage({ from: chan.__selfId, slug });
    } catch { /* soft feature */ }

    return () => {
      alive = false;
      window.clearInterval(poll);
      try { chan?.postMessage({ from: chan.__selfId, closed: true }); chan?.close(); } catch { /* ignore */ }
    };
  }, [slug, selfEmail]);

  useEffect(() => subscribeLiveStatus((status) => {
    if (typeof status?.v !== 'number') return;
    if (openedAtVersion.current === null) { openedAtVersion.current = status.v; return; }
    if (status.v > openedAtVersion.current) setNewVersion(status.v);
  }), []);

  // OUR OWN publish bumps the version too. Before this, saving any unit made
  // the "database moved to vN" warning appear immediately, every single time
  // (operator, 2026-11-12). Re-baseline instead of warning.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onSelfPublish = (event) => {
      const next = event?.detail?.version ?? getLiveStatus()?.v ?? openedAtVersion.current;
      if (typeof next === 'number') openedAtVersion.current = next;
      setNewVersion(null);
    };
    window.addEventListener(SELF_PUBLISH_EVENT, onSelfPublish);
    return () => window.removeEventListener(SELF_PUBLISH_EVENT, onSelfPublish);
  }, []);

  const hasAny = recent || otherTabs > 0 || newVersion !== null;
  if (!slug || !hasAny) return null;

  return (
    <div className="softlock-card" role="status" aria-label="Editing warnings">
      <div className="softlock-icon" aria-hidden="true">⚠️</div>
      <div className="softlock-body">
        <strong>Heads up before you save</strong>
        {newVersion !== null && <span>The database moved to <b>v{newVersion}</b> while this form was open. Your changes may overwrite newer values.</span>}
        {otherTabs > 0 && <span>This unit is open in <b>{otherTabs} other tab{otherTabs === 1 ? '' : 's'}</b> — editing both will overwrite each other.</span>}
        {recent && <span><b>{recent.name}</b> edited this unit about {recent.mins === 1 ? 'a minute' : `${recent.mins} minutes`} ago.</span>}
      </div>
      <div className="softlock-actions">
        {newVersion !== null && (
          <button type="button" onClick={() => { openedAtVersion.current = newVersion; setNewVersion(null); refresh?.(); }}>↻ Load latest</button>
        )}
        <button type="button" className="ghost" onClick={() => { setRecent(null); setNewVersion(null); }}>Dismiss</button>
      </div>
    </div>
  );
}
