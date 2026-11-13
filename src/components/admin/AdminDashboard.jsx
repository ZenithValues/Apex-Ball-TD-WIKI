import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchActiveAnnouncements, fetchWorkerInfo, fetchWorkerVersion } from '../../utils/apexClient';
import { EXPECTED_WORKER_VERSION } from '../../config/workerVersion';
import ThemeCutout from '../ThemeCutout';
import AdminGuide from './AdminGuide';
import AdminTeamPanel from './AdminTeamPanel';
import CollapsiblePanel from './CollapsiblePanel';
import { BUILD_STAMP } from '../../generated/buildStamp.js';
import { quotaState } from '../../utils/kvQuota';
import { listPublishes } from '../../utils/publishOutbox';

const EDIT_ICONS = { values: '💰', wiki: '📖', map: '🗺️', crate: '📦', material: '🧪', skin: '🎨', system: '⚙️' };

export default function AdminDashboard({
  stats, wikiCount, shinyCount, edits24h, role,
  wikiAllowed, valueAllowed, maintenance, onToggleMaintenance,
  deletedCount, recentEdits, onNavigate,
}) {
  const canManage = role === 'owner' || role === 'admin';
  // Cloudflare free plan: 1,000 KV writes/day. Every publish costs ~4 of them
  // (a full bundle publish costs more), so this meter is what stops an editor
  // from discovering the limit by getting a failed save.
  const budget = quotaState();
  const queued = listPublishes().length;
  const [announcementCount, setAnnouncementCount] = useState(null);
  const [worker, setWorker] = useState({ version: null, loading: true });
  const [batchLive, setBatchLive] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchWorkerVersion()
      .then((v) => { if (alive) setWorker({ version: v, loading: false }); })
      .catch(() => { if (alive) setWorker({ version: null, loading: false }); });
    return () => { alive = false; };
  }, []);

  // Is the deployed worker new enough to accept ONE commit for many rows? A
  // stale worker silently falls back to one publish per row, which is the exact
  // thing that burns the 1,000/day allowance — so say it out loud.
  useEffect(() => {
    let alive = true;
    fetchWorkerInfo()
      .then((info) => { if (alive) setBatchLive(info.capabilities.includes('batch-commit')); })
      .catch(() => { if (alive) setBatchLive(null); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    fetchActiveAnnouncements()
      .then((list) => { if (alive) setAnnouncementCount(Array.isArray(list) ? list.length : 0); })
      .catch(() => {});
    const onUpdated = () =>
      fetchActiveAnnouncements()
        .then((list) => { if (alive) setAnnouncementCount(Array.isArray(list) ? list.length : 0); })
        .catch(() => {});
    window.addEventListener('apex-announcements-updated', onUpdated);
    return () => {
      alive = false;
      window.removeEventListener('apex-announcements-updated', onUpdated);
    };
  }, []);

  return (
    <div className="admin-dashboard-shell">
      {/* Plain-language welcome. The old "Mission Control" banner used jargon
          a first-time editor could not act on; the guide below does the teaching. */}
      <motion.section
        className="admin-hero-banner card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <ThemeCutout variant="overlord" floating className="admin-hero-cutout" />
        <div className="admin-hero-copy">
          <span className="admin-kicker">WELCOME TO THE EDITOR</span>
          <h2>Edit what visitors see</h2>
          <p className="admin-muted">
            Changes you save here appear on both the Test Realm and the live site within about a minute. Pick a section below, find a unit, edit it, and press Save.
          </p>
        </div>
        <div className="admin-quick-actions">
          {valueAllowed && (
            <button type="button" className="admin-quick-btn primary" onClick={() => onNavigate('values')} title="Change trade values, demand and scarcity">
              💰 Edit values
            </button>
          )}
          {wikiAllowed && (
            <button type="button" className="admin-quick-btn" onClick={() => onNavigate('wiki')} title="Change unit stats, descriptions and images">
              📖 Edit WIKI
            </button>
          )}
          {wikiAllowed && (
            <button type="button" className="admin-quick-btn" onClick={() => onNavigate('create')} title="Add a brand-new unit, map, crate or material">
              ✨ Add new
            </button>
          )}
          <button type="button" className="admin-quick-btn" onClick={() => onNavigate('logs')} title="See who changed what, and restore older values">
            🕒 Change history
          </button>
          {canManage && (
            <button type="button" className="admin-quick-btn" onClick={() => onNavigate('announcements')} title="Show a banner message on the site">
              📢 Site banner
            </button>
          )}
        </div>
      </motion.section>

      <AdminGuide role={role} valueAllowed={valueAllowed} wikiAllowed={wikiAllowed} />
      <CollapsiblePanel
        title="Team & access"
        icon="👥"
        subtitle="Invite, rename, re-role or remove accounts — and edit Shiny O/C ranks"
        defaultOpen
      >
        <AdminTeamPanel role={role} />
      </CollapsiblePanel>

      {/* Telemetry Stat Grid */}
      <motion.div
        className="admin-dashboard"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.26 }}
      >
        <div className="admin-stat-card">
          <div className="admin-stat-icon">⚔️</div>
          <div className="admin-stat-value">{stats.units}</div>
          <div className="admin-stat-label">Total Units</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">💰</div>
          <div className="admin-stat-value">{stats.values}</div>
          <div className="admin-stat-label">Value Overrides</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📖</div>
          <div className="admin-stat-value">{wikiCount}</div>
          <div className="admin-stat-label">WIKI Overrides</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🌟</div>
          <div className="admin-stat-value">{shinyCount}</div>
          <div className="admin-stat-label">Shiny Units</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">⚡</div>
          <div className="admin-stat-value">{edits24h ?? '—'}</div>
          <div className="admin-stat-label" title="Counted from the latest 200 shared changes; older entries may not be included.">Recent shared changes (24h)</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📢</div>
          <div className="admin-stat-value">{announcementCount === null ? '—' : `${announcementCount}/5`}</div>
          <div className="admin-stat-label">Announcements Live</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🗑️</div>
          <div className="admin-stat-value">{deletedCount}</div>
          <div className="admin-stat-label">Recycle Bin</div>
        </div>
      </motion.div>

      <div
        className="admin-dashboard-columns"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginTop: '18px',
        }}
      >
        {/* System controls */}
        <section className="card" style={{ padding: '20px' }}>
          <div className="admin-section-head">
            <h2>🛠️ Site status</h2>
            <p className="admin-muted" style={{ margin: '4px 0 0', fontSize: '11.5px' }}>Whether the site is open, which server version is running, and who can get in.</p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <strong style={{ fontSize: '14px' }}>Maintenance Mode</strong>
              <p className="admin-muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                {maintenance?.on
                  ? 'ON — visitors see the maintenance page. Team keeps access.'
                  : 'OFF — the site is open to everyone.'}
              </p>
            </div>
            {canManage ? (
              <button
                type="button"
                className={maintenance?.on ? 'filled' : ''}
                style={
                  maintenance?.on
                    ? { background: 'var(--c-danger, #e5484d)', borderColor: 'var(--c-danger, #e5484d)' }
                    : undefined
                }
                onClick={onToggleMaintenance}
                disabled={maintenance?.loading}
              >
                {maintenance?.loading ? '…' : maintenance?.on ? 'Turn OFF' : 'Turn ON'}
              </button>
            ) : (
              <span className="admin-count-badge">{maintenance?.on ? 'ON' : 'OFF'}</span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
            data-admin-build-row=""
          >
            <div>
              <strong style={{ fontSize: '14px' }}>🧱 Front-end build (this page)</strong>
              <p className="admin-muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                {BUILD_STAMP.label} · built{' '}
                {new Date(BUILD_STAMP.builtAt).toLocaleString()} · id <code>{BUILD_STAMP.id}</code>
                <br />
                Nothing here updates the live site: GitHub Pages only changes after the ZIP is
                pushed. After a deploy, open <code>/build.json</code> on the site — if its id
                matches this one, the deploy really landed.
              </p>
            </div>
            <span
              className="admin-count-badge"
              data-admin-build-id={BUILD_STAMP.id}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                color: '#7cd4ff',
                border: '1px solid rgba(124,212,255,0.45)',
                whiteSpace: 'nowrap',
              }}
            >
              {BUILD_STAMP.hash}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
            data-admin-quota-row=""
            data-quota-level={budget.level}
          >
            <div>
              <strong style={{ fontSize: '14px' }}>✍️ Cloudflare write budget (free plan)</strong>
              <p className="admin-muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                ~{budget.used.toLocaleString()} / {budget.limit.toLocaleString()} KV writes used today
                (estimate from this browser) · resets in {budget.resetIn} (00:00 UTC).
                {queued > 0 ? ` ${queued} edit${queued === 1 ? '' : 's'} queued locally — they publish on the next retry.` : ''}
                {' '}Bulk saves go out as ONE commit, so a 40-row spreadsheet save costs ~4 writes instead of ~160.
                {batchLive === true && (
                  <span data-admin-batch-capability="live" style={{ display: 'block', color: '#42d392' }}>
                    ✓ Batch commits are live on the deployed worker.
                  </span>
                )}
                {batchLive === false && (
                  <span data-admin-batch-capability="missing" style={{ display: 'block', color: '#ffd24d' }}>
                    ⚠ The deployed worker predates batch commits (needs 2026-11-03.1) — saves fall back to one
                    publish per row, ~4 writes each. Deploy the worker before bulk editing.
                  </span>
                )}
              </p>
            </div>
            <span
              className="admin-count-badge"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                whiteSpace: 'nowrap',
                color: budget.level === 'exhausted' ? '#ff5c5c' : budget.level === 'warning' ? '#ffd24d' : '#42d392',
                border: `1px solid ${
                  budget.level === 'exhausted' ? 'rgba(255,92,92,0.5)'
                    : budget.level === 'warning' ? 'rgba(255,210,77,0.5)'
                      : 'rgba(66,211,146,0.45)'
                }`,
              }}
            >
              {budget.level === 'exhausted' ? '⚠ Limit reached' : `${budget.remaining.toLocaleString()} left`}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <strong style={{ fontSize: '14px' }}>☁️ Worker (database server)</strong>
              <p className="admin-muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                {worker.loading
                  ? 'Checking deploy status…'
                  : worker.version === null
                    ? 'Could not reach the worker — edits stay local until it is back.'
                    : worker.version === EXPECTED_WORKER_VERSION
                      ? `Up to date (${worker.version}) — server-side features live. This only describes the worker, NOT the front-end build below.`
                      : `Outdated (${worker.version || 'old'}) — deploy pending (${EXPECTED_WORKER_VERSION}). Some features wait on wrangler deploy.`}
              </p>
            </div>
            {!worker.loading && (
              <span
                className="admin-count-badge"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  color: worker.version === EXPECTED_WORKER_VERSION ? '#42d392' : '#ffd24d',
                  border: `1px solid ${
                    worker.version === EXPECTED_WORKER_VERSION
                      ? 'rgba(66,211,146,0.45)'
                      : 'rgba(255,210,77,0.45)'
                  }`,
                }}
              >
                {worker.loading ? '…' : worker.version === EXPECTED_WORKER_VERSION ? '✓ Current' : '⚠ Deploy due'}
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '12px 0',
            }}
          >
            <div>
              <strong style={{ fontSize: '14px' }}>🔒 Test Realm Gate</strong>
              <p className="admin-muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Active — the Test Realm asks for an admin account before letting anyone in.
              </p>
            </div>
            <span className="admin-count-badge">ON</span>
          </div>
        </section>

        {/* Recent activity */}
        <section className="card" style={{ padding: '20px' }}>
          <div className="admin-section-head">
            <h2>🕒 Units you edited lately</h2>
            <p className="admin-muted" style={{ margin: '4px 0 0', fontSize: '11.5px' }}>Click one to jump back to that editor.</p>
          </div>
          {recentEdits && recentEdits.length ? (
            <div>
              {recentEdits.slice(0, 8).map((e) => (
                <button
                  key={`${e.slug}-${e.kind}`}
                  type="button"
                  onClick={() => onNavigate(e.kind === 'values' ? 'values' : 'wiki')}
                  style={{
                    display: 'flex',
                    width: '100%',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '9px 6px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                  }}
                >
                  <span>{EDIT_ICONS[e.kind] || '•'}</span>
                  <span style={{ flex: 1, fontWeight: 700 }}>{e.name || e.slug}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase' }}>
                    {e.kind}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="admin-muted">
              No recent edits yet — open an editor and your last units will show up here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
