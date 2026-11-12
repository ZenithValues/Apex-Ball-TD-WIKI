import { useCallback, useEffect, useState } from 'react';
import {
  listAdminAccounts, createAdminInvite, resetAdminPasscode, mutateAdminRoster,
} from '../../utils/adminAccounts';
import OCRankEditor from './OCRankEditor';
import './AdminTeamPanel.css';

function relative(iso) {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return 'unknown';
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Self-service team management. The owner can create, rename, re-role and
 * remove accounts right here — no worker deploy, no code change, no asking
 * anyone. Presence (joined / online) comes from the worker's heartbeat.
 */
export default function AdminTeamPanel({ role }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [canEditRanks, setCanEditRanks] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const isOwner = role === 'owner';

  const load = useCallback(async () => {
    const res = await listAdminAccounts();
    if (res.ok && Array.isArray(res.accounts)) {
      setAccounts(res.accounts);
      setCanEditRanks(Boolean(res.canEditRanks));
      setError('');
    } else {
      setError(res.status === 404
        ? 'The database server still needs its 2026-11-02.5 update. Deploy scripts/cloudflare-proxy-worker.js to enable account management.'
        : (res.error || 'Could not load team accounts.'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function invite(email) {
    setBusy(email); setResult(null); setError('');
    const res = await createAdminInvite(email, 60);
    if (!res.ok) setError(res.error || 'Could not create an invite.');
    else {
      setResult({
        kind: 'invite', email,
        title: 'Invite link ready — send it privately',
        body: `${window.location.origin}${res.claimPath}`,
        note: 'Works once, expires in 60 minutes. Never post this link publicly.',
      });
    }
    setBusy('');
  }

  async function reset(email) {
    if (!window.confirm(`Reset the passcode for ${email}? Their old passcode and all active sessions will stop working immediately.`)) return;
    setBusy(email); setResult(null); setError('');
    const res = await resetAdminPasscode(email);
    if (!res.ok) setError(res.error || 'Could not reset the passcode.');
    else {
      setResult({ kind: 'reset', email, title: 'New passcode — shown once', body: res.passcode, note: 'Copy this and give it to the editor privately.' });
      await load();
    }
    setBusy('');
  }

  function changeRole(account, nextRole) {
    if (nextRole === 'owner' && account.role !== 'owner' && !window.confirm(
      `Transfer OWNER to ${account.email}? They will be able to create, remove and re-role every account.`
    )) return;
    mutate('role', account.email, { role: nextRole });
  }

  async function mutate(action, email, extra = {}) {
    if (action === 'remove' && !window.confirm(`Remove ${email} from the team? Their passcode and sessions stop working immediately.`)) return;
    setBusy(email); setError('');
    const res = await mutateAdminRoster(action, email, extra);
    if (!res.ok) setError(res.error || `Could not ${action} that account.`);
    else await load();
    setBusy('');
  }

  async function create() {
    setBusy('create'); setError('');
    const res = await mutateAdminRoster('create', newEmail.trim(), { role: newRole, name: newName.trim() });
    if (!res.ok) setError(res.error || 'Could not create that account.');
    else { setNewEmail(''); setNewName(''); setNewRole('editor'); await load(); }
    setBusy('');
  }

  async function copy() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.body); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { /* selectable */ }
  }

  if (role !== 'owner' && role !== 'admin') return null;

  return (
    <section className="admin-team" aria-label="Team accounts and access">
      <div className="admin-team-head">
        <div>
          <h2>👥 Team &amp; access</h2>
          <p>Create accounts yourself — no code changes needed. Passcodes are generated with a one-time invite link.</p>
        </div>
        <button type="button" className="admin-team-refresh" onClick={load} aria-label="Refresh account list">↻ Refresh</button>
      </div>

      {error && <p className="admin-team-error" role="alert">{error}</p>}

      {isOwner && (
        <div className="admin-team-create">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="neweditor@email.com" aria-label="New account email" />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Display name" aria-label="Display name" />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} aria-label="New account role">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="button" className="filled" onClick={create} disabled={busy === 'create' || !newEmail.trim()}>
            {busy === 'create' ? 'Working…' : '➕ Create account'}
          </button>
        </div>
      )}

      <div className="admin-team-list">
        {loading && <p className="admin-team-empty">Loading accounts…</p>}
        {!loading && accounts.map((account) => (
          <div className="admin-team-row" key={account.email}>
            <div className="admin-team-person">
              <span className={`admin-team-dot ${account.online ? 'online' : account.provisioned ? 'ready' : 'pending'}`} aria-hidden="true" />
              <div>
                <strong>{account.name || account.email}</strong>
                <small>{account.email}</small>
                <small className="admin-team-meta">
                  {account.online ? '🟢 Online now' : `⚪ Offline · seen ${relative(account.lastSeenAt)}`}
                  {' · '}Joined {relative(account.joinedAt)}
                </small>
              </div>
            </div>
            {isOwner && (
              <div className="admin-team-edit">
                <input
                  defaultValue={account.name || ''}
                  key={`name-${account.name}`}
                  aria-label={`Display name for ${account.email}`}
                  onBlur={(e) => { if (e.target.value !== account.name) mutate('name', account.email, { name: e.target.value }); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                />
                <select
                  value={account.role}
                  aria-label={`Role for ${account.email}`}
                  disabled={account.role === 'owner'}
                  onChange={(e) => changeRole(account, e.target.value)}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            )}
            <div className="admin-team-actions">
              <button type="button" disabled={busy === account.email} onClick={() => invite(account.email)}>🔗 Invite</button>
              <button type="button" disabled={busy === account.email} onClick={() => reset(account.email)}>🔄 Reset</button>
              {isOwner && account.role !== 'owner' && (
                <button type="button" className="admin-btn-danger" disabled={busy === account.email} onClick={() => mutate('remove', account.email)}>🗑️ Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="admin-team-result">
          <div className="admin-team-result-head">
            <strong>{result.title}</strong>
            <button type="button" onClick={() => { setResult(null); setCopied(false); }} aria-label="Dismiss">✕</button>
          </div>
          <p>{result.email}</p>
          <code>{result.body}</code>
          <div className="admin-team-result-actions">
            <button type="button" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
            <span>{result.note}</span>
          </div>
        </div>
      )}
      {canEditRanks && <OCRankEditor />}
      <p className="admin-team-foot">Only the owner can create, remove, rename or re-role accounts. Every change is written to the admin audit log.</p>
    </section>
  );
}
