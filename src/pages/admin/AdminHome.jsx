import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BASE_UNITS } from '../../data/units';
import { DEMAND_LABELS, SCARCITY_LABELS } from '../../data/taxonomy';
import { GENERATED_VALUE_OVERRIDES } from '../../data/generated/units.generated';
import { VALUE_OVERRIDES } from '../../data/values';
import { computeTradeValue } from '../../utils/calculator';
import { getAdminRedirectUrl, supabase } from '../../utils/supabase';
import './AdminHome.css';

const TRENDS = ['stable', 'rising', 'falling'];
const EDITOR_ROLES = ['owner', 'admin', 'editor'];

function getFallbackData(slug) {
  return VALUE_OVERRIDES[slug] || GENERATED_VALUE_OVERRIDES[slug] || {
    baseValue: 1,
    gems: 1,
    coins: 1,
    demand: 'Normal',
    scarcity: 'Standard',
    trend: 'stable',
    notes: '',
  };
}

function rowToForm(row, slug) {
  const fallback = getFallbackData(slug);
  return {
    baseValue: row?.base_value ?? fallback.baseValue ?? 1,
    gems: row?.gems ?? fallback.gems ?? 1,
    coins: row?.coins ?? fallback.coins ?? 1,
    demand: row?.demand ?? fallback.demand ?? 'Normal',
    scarcity: row?.scarcity ?? fallback.scarcity ?? 'Standard',
    trend: row?.trend ?? fallback.trend ?? 'stable',
    notes: row?.notes ?? fallback.notes ?? '',
  };
}

function normalizeForm(data) {
  return {
    baseValue: Number(data.baseValue) || 0,
    gems: Number(data.gems) || 0,
    coins: Number(data.coins) || 0,
    demand: data.demand || 'Normal',
    scarcity: data.scarcity || 'Standard',
    trend: data.trend || 'stable',
    notes: data.notes || '',
  };
}

function canEdit(role) {
  return EDITOR_ROLES.includes(role);
}

export default function AdminHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetMode = location.pathname.endsWith('/reset-password');
  const units = useMemo(() => BASE_UNITS.filter((unit) => unit.documented && !unit.unavailableData), []);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [query, setQuery] = useState('');
  const [valueRows, setValueRows] = useState([]);
  const [changeLog, setChangeLog] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(units[0]?.slug || '');
  const selectedUnit = units.find((unit) => unit.slug === selectedSlug) || units[0];
  const selectedRow = valueRows.find((row) => row.slug === selectedUnit?.slug);
  const [form, setForm] = useState(() => rowToForm(null, units[0]?.slug));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadAdminUser() {
      if (!session?.user?.email) {
        setAdminUser(null);
        return;
      }
      setAdminLoading(true);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', session.user.email.toLowerCase())
        .maybeSingle();

      if (error) {
        setAuthMessage(`Admin role check failed: ${error.message}`);
        setAdminUser(null);
      } else {
        setAdminUser(data);
      }
      setAdminLoading(false);
    }

    loadAdminUser();
  }, [session]);

  async function refreshValues() {
    const [{ data: values, error: valuesError }, { data: logs, error: logsError }] = await Promise.all([
      supabase.from('value_entries').select('*').order('updated_at', { ascending: false }),
      supabase.from('value_change_log').select('*').order('changed_at', { ascending: false }).limit(40),
    ]);

    if (valuesError) setMessage(`Value load failed: ${valuesError.message}`);
    else setValueRows(values || []);

    if (!logsError) setChangeLog(logs || []);
  }

  useEffect(() => {
    if (adminUser && canEdit(adminUser.role)) refreshValues();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser]);

  useEffect(() => {
    setForm(rowToForm(selectedRow, selectedUnit?.slug));
  }, [selectedRow, selectedUnit?.slug]);

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return units.slice(0, 40);
    return units.filter((unit) => unit.name.toLowerCase().includes(q) || unit.slug.includes(q)).slice(0, 80);
  }, [query, units]);

  const tradeValue = computeTradeValue(form.baseValue, form.demand, form.scarcity);
  const role = adminUser?.role || null;
  const allowed = adminUser && canEdit(role);

  function selectUnit(unit) {
    setSelectedSlug(unit.slug);
    setMessage('');
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function signIn(event) {
    event.preventDefault();
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMessage(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAdminUser(null);
    setValueRows([]);
  }

  async function sendPasswordReset() {
    if (!email) {
      setAuthMessage('Type your email first.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAdminRedirectUrl('/admin/reset-password'),
    });
    setAuthMessage(error ? error.message : 'Password reset email sent.');
  }

  async function updatePassword(event) {
    event.preventDefault();
    setAuthMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setAuthMessage(error.message);
    else {
      setAuthMessage('Password updated. You can return to Admin.');
      setNewPassword('');
    }
  }

  async function saveValue() {
    if (!allowed || !selectedUnit) return;
    setSaving(true);
    setMessage('');
    const next = normalizeForm(form);
    const oldValue = selectedRow || getFallbackData(selectedUnit.slug);
    const payload = {
      slug: selectedUnit.slug,
      kind: 'unit',
      base_value: next.baseValue,
      gems: next.gems,
      coins: next.coins,
      demand: next.demand,
      scarcity: next.scarcity,
      trend: next.trend,
      notes: next.notes,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('value_entries').upsert(payload, { onConflict: 'slug' });
    if (error) {
      setMessage(`Save failed: ${error.message}`);
      setSaving(false);
      return;
    }

    await supabase.from('value_change_log').insert({
      slug: selectedUnit.slug,
      kind: 'unit',
      old_value: oldValue,
      new_value: payload,
      changed_by: session.user.id,
    });

    setMessage('Saved globally. Values pages and calculator will sync automatically.');
    await refreshValues();
    setSaving(false);
  }

  async function resetUnit() {
    if (!allowed || !selectedUnit) return;
    const { error } = await supabase.from('value_entries').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Reset failed: ${error.message}`);
    else {
      setMessage('Live override removed; fallback generated value restored.');
      await refreshValues();
    }
  }

  if (authLoading) {
    return <main className="admin-page"><div className="admin-editor card">Loading admin…</div></main>;
  }

  if (resetMode) {
    return (
      <main className="admin-page">
        <AuthPanel title="Reset Password" message={authMessage}>
          <form className="admin-auth-form" onSubmit={updatePassword}>
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password…" />
            <button type="submit" className="filled">Update Password</button>
            <button type="button" onClick={() => navigate('/admin')}>Back to Admin</button>
          </form>
        </AuthPanel>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-page">
        <AuthPanel title="APEX Admin Login" message={authMessage}>
          <form className="admin-auth-form" onSubmit={signIn}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="editor@email.com" />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password…" />
            <button type="submit" className="filled">Login</button>
            <button type="button" onClick={sendPasswordReset}>Send Password Reset Email</button>
          </form>
        </AuthPanel>
      </main>
    );
  }

  if (adminLoading) {
    return <main className="admin-page"><div className="admin-editor card">Checking permissions…</div></main>;
  }

  if (!allowed) {
    return (
      <main className="admin-page">
        <AuthPanel title="Access Denied" message={authMessage || `Logged in as ${session.user.email}, but this account is not an editor.`}>
          <button type="button" className="admin-denied-button" onClick={signOut}>Logout</button>
        </AuthPanel>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <motion.section className="admin-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="admin-kicker">Secure Admin</p>
        <h1>APEX Admin</h1>
        <p>Logged in as <strong>{session.user.email}</strong> · Role: <strong>{role}</strong></p>
        <button type="button" className="admin-denied-button" onClick={signOut}>Logout</button>
      </motion.section>

      <section className="admin-layout">
        <aside className="admin-unit-picker card">
          <div className="admin-section-head"><h2>Units</h2><span>{units.length}</span></div>
          <input className="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search units…" />
          <div className="admin-unit-list" data-lenis-prevent>
            {filteredUnits.map((unit) => (
              <button key={unit.slug} type="button" className={unit.slug === selectedUnit?.slug ? 'admin-unit active' : 'admin-unit'} onClick={() => selectUnit(unit)}>
                <span>{unit.name}</span>
                <small>{unit.rarity}</small>
                {valueRows.some((row) => row.slug === unit.slug) && <b>LIVE</b>}
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-editor card">
          <div className="admin-editor-head">
            <div>
              <p className="admin-kicker">Editing</p>
              <h2>{selectedUnit?.name}</h2>
              <span>{selectedUnit?.rarity} · {selectedUnit?.type}</span>
            </div>
            {selectedRow && <div className="admin-local-pill">Live Override</div>}
          </div>

          <div className="admin-preview-value"><span>Computed Trade Value</span><strong>{tradeValue.toLocaleString()}</strong></div>

          <div className="admin-form-grid">
            <AdminInput label="Base Value" value={form.baseValue} onChange={(value) => updateField('baseValue', value)} type="number" />
            <AdminInput label="Gems" value={form.gems} onChange={(value) => updateField('gems', value)} type="number" />
            <AdminInput label="Coins" value={form.coins} onChange={(value) => updateField('coins', value)} type="number" />
            <AdminSelect label="Demand" value={form.demand} onChange={(value) => updateField('demand', value)} options={DEMAND_LABELS} />
            <AdminSelect label="Scarcity" value={form.scarcity} onChange={(value) => updateField('scarcity', value)} options={SCARCITY_LABELS} />
            <AdminSelect label="Trend" value={form.trend} onChange={(value) => updateField('trend', value)} options={TRENDS} />
            <label className="admin-field full"><span>Notes</span><textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Reason / evidence / notes…" /></label>
          </div>

          <div className="admin-actions">
            <button type="button" className="filled" onClick={saveValue} disabled={saving}>{saving ? 'Saving…' : 'Save Global Value'}</button>
            <button type="button" onClick={resetUnit}>Reset Unit</button>
            <button type="button" onClick={refreshValues}>Refresh Live Values</button>
            <button type="button" onClick={() => navigate('/admin/reset-password')}>Change Password</button>
          </div>
          {message && <div className="admin-message">{message}</div>}
        </section>
      </section>

      <section className="admin-log card">
        <div className="admin-section-head"><h2>Global Change Log</h2><span>{changeLog.length}</span></div>
        {changeLog.length === 0 ? <p className="admin-muted">No global changes yet.</p> : (
          <div className="admin-log-list">
            {changeLog.map((entry) => (
              <div key={entry.id} className="admin-log-entry">
                <strong>{entry.slug}</strong>
                <span>{new Date(entry.changed_at).toLocaleString()}</span>
                <p>Value {entry.old_value?.base_value ?? entry.old_value?.baseValue ?? '—'} → {entry.new_value?.base_value ?? '—'} · Demand {entry.old_value?.demand ?? '—'} → {entry.new_value?.demand ?? '—'} · Scarcity {entry.old_value?.scarcity ?? '—'} → {entry.new_value?.scarcity ?? '—'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function AuthPanel({ title, message, children }) {
  return (
    <section className="admin-auth card">
      <p className="admin-kicker">APEX Values</p>
      <h1>{title}</h1>
      {message && <div className="admin-message">{message}</div>}
      {children}
    </section>
  );
}

function AdminInput({ label, value, onChange, type = 'text' }) {
  return <label className="admin-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function AdminSelect({ label, value, onChange, options }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
    </label>
  );
}
