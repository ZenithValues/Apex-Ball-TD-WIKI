import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ALL_UNITS } from '../../data/units';
import { useData } from '../../context/DataContext';
import { UNIT_RARITIES } from '../../data/taxonomy';
import { computeTradeValue } from '../../utils/calculator';
import { slugify } from '../../utils/slug';
import {
  clearRecoveryCredentialsFromUrl,
  getAdminRedirectUrl,
  getImplicitRecoveryTokensFromUrl,
  getRecoveryCodeFromUrl,
  isMissingTableError,
  supabase,
} from '../../utils/supabase';
import { removeCachedWikiImage, saveCachedWikiImage } from '../../utils/wikiImageCache';
import {
  canEditValue,
  canEditWiki,
  errorMessage,
  formToUpgrade,
  getFallbackValueData,
  linesToObject,
  normalizeValueForm,
  valueRowToForm,
  wikiRowToForm,
} from '../../utils/adminForms';
import { uploadUnitImage, removeUnitImages } from '../../utils/adminImage';
import Dropdown from '../../components/Dropdown';
import { AdminLog, AuthPanel, UnitPicker, ValueEditor, WikiEditor } from '../../components/admin/AdminParts';
import BugReportAdmin from '../../components/bugs/BugReportAdmin';
import './AdminHome.css';

const NEW_UNIT_RARITY_GROUPS = [
  { label: 'Base Rarities', options: UNIT_RARITIES.filter((r) => !r.startsWith('Shiny')).map((r) => ({ value: r, label: r })) },
  { label: 'Shiny Rarities', options: UNIT_RARITIES.filter((r) => r.startsWith('Shiny')).map((r) => ({ value: r, label: r })) },
];

export default function AdminHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetMode = location.pathname.endsWith('/reset-password');
  const { customUnits, refresh, refreshWiki } = useData();
  const generatedUnits = useMemo(() => ALL_UNITS.filter((unit) => unit.documented && !unit.unavailableData), []);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [resetReady, setResetReady] = useState(false);
  const [resetChecking, setResetChecking] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);

  const [query, setQuery] = useState('');
  const [valueRows, setValueRows] = useState([]);
  const [valueLog, setValueLog] = useState([]);
  const [wikiRows, setWikiRows] = useState([]);
  const [wikiLog, setWikiLog] = useState([]);
  const units = useMemo(() => [...generatedUnits, ...customUnits], [generatedUnits, customUnits]);
  const [selectedSlug, setSelectedSlug] = useState(generatedUnits[0]?.slug || '');
  const selectedUnit = units.find((unit) => unit.slug === selectedSlug) || units[0];
  const selectedValueRow = valueRows.find((row) => row.slug === selectedUnit?.slug);
  const selectedWikiRow = wikiRows.find((row) => row.slug === selectedUnit?.slug);

  const [valueForm, setValueForm] = useState(() => valueRowToForm(null, generatedUnits[0]?.slug));
  const [wikiForm, setWikiForm] = useState(() => wikiRowToForm(null, generatedUnits[0]));
  const [wikiImageFile, setWikiImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTool, setActiveTool] = useState('values');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRarity, setNewUnitRarity] = useState('Normie');

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

  // Password reset: exchange PKCE codes or consume implicit-flow tokens, then
  // show the visible reset form. Links are single-use, so failures keep a clear
  // request-new-email state.
  useEffect(() => {
    if (!resetMode) return undefined;
    let active = true;
    setResetChecking(true);
    setResetReady(false);

    async function resolveRecovery() {
      const code = getRecoveryCodeFromUrl();
      const tokens = getImplicitRecoveryTokensFromUrl();
      let recoveryError = null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        recoveryError = error;
      } else if (tokens) {
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        recoveryError = error;
      }

      if (!active) return;

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session && !sessionError) {
        setResetReady(true);
        setAuthMessage('Reset link verified. Enter your new password. Reset links are single-use.');
        clearRecoveryCredentialsFromUrl();
      } else if (recoveryError) {
        setResetReady(false);
        setAuthMessage(`This reset link is invalid, expired, or already used: ${errorMessage(recoveryError)} Request a fresh reset email below.`);
      } else {
        setResetReady(false);
        setAuthMessage('This reset link is missing or has expired. Request a fresh reset email below. Reset links are single-use and should be opened in the same browser that requested them.');
      }
      setResetChecking(false);
    }

    resolveRecovery();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setResetReady(true);
        setResetChecking(false);
        setAuthMessage('Reset link verified. Enter your new password. Reset links are single-use.');
        clearRecoveryCredentialsFromUrl();
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [resetMode]);

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
        setAuthMessage(`Admin role check failed: ${errorMessage(error)}`);
        setAdminUser(null);
      } else {
        setAdminUser(data);
      }
      setAdminLoading(false);
    }
    loadAdminUser();
  }, [session]);

  const role = adminUser?.role || null;
  const valueAllowed = canEditValue(role);
  const wikiAllowed = canEditWiki(role);
  const anyAllowed = valueAllowed || wikiAllowed;

  useEffect(() => {
    if (valueAllowed) setActiveTool('values');
    else if (wikiAllowed) setActiveTool('wiki');
  }, [valueAllowed, wikiAllowed]);

  async function refreshAdminData() {
    const [valuesRes, valueLogRes, wikiRes, wikiLogRes] = await Promise.all([
      supabase.from('value_entries').select('*').order('updated_at', { ascending: false }),
      supabase.from('value_change_log_public').select('*').order('changed_at', { ascending: false }).limit(40),
      supabase.from('unit_wiki_overrides').select('*').order('updated_at', { ascending: false }),
      supabase.from('wiki_change_log_public').select('*').order('changed_at', { ascending: false }).limit(40),
    ]);

    if (valuesRes.error) {
      setValueRows([]);
      if (!isMissingTableError(valuesRes.error)) setMessage(`Value load failed: ${valuesRes.error.message}`);
    } else setValueRows(valuesRes.data || []);

    if (!valueLogRes.error) setValueLog(valueLogRes.data || []);
    else if (!isMissingTableError(valueLogRes.error)) setMessage(`Value log load failed: ${valueLogRes.error.message}`);

    if (wikiRes.error) {
      setWikiRows([]);
      if (isMissingTableError(wikiRes.error)) setMessage('WIKI editor tables are not created yet. Run the updated supabase/schema.sql.');
      else setMessage(`Wiki override load failed: ${wikiRes.error.message}`);
    } else setWikiRows(wikiRes.data || []);

    if (!wikiLogRes.error) setWikiLog(wikiLogRes.data || []);
    else if (!isMissingTableError(wikiLogRes.error)) setMessage(`Wiki log load failed: ${wikiLogRes.error.message}`);
  }

  useEffect(() => {
    if (anyAllowed) refreshAdminData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyAllowed]);

  useEffect(() => {
    setValueForm(valueRowToForm(selectedValueRow, selectedUnit?.slug));
    setWikiForm(wikiRowToForm(selectedWikiRow, selectedUnit));
    setWikiImageFile(null);
  }, [selectedValueRow, selectedWikiRow, selectedUnit]);

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return units;
    return units.filter((unit) => unit.name.toLowerCase().includes(q) || unit.slug.includes(q)).slice(0, 120);
  }, [query, units]);

  const tradeValue = computeTradeValue(valueForm.baseValue, valueForm.demand, valueForm.scarcity);

  function selectUnit(unit) {
    setSelectedSlug(unit.slug);
    setMessage('');
  }
  function updateValueField(key, value) {
    setValueForm((prev) => ({ ...prev, [key]: value }));
  }
  function updateWikiField(key, value) {
    setWikiForm((prev) => ({ ...prev, [key]: value }));
  }

  async function createCustomUnit(event) {
    event.preventDefault();
    if (!wikiAllowed) return;
    const name = newUnitName.trim();
    if (!name) {
      setMessage('Type a custom unit name first.');
      return;
    }
    const slug = slugify(name);
    const payload = {
      slug, name, rarity: newUnitRarity, custom_unit: true, type: 'DPS', raw_type: 'Unit',
      category: 'Standard', obtain: [], min_max_stats: {}, upgrades: [],
      updated_by: session.user.id, updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('unit_wiki_overrides').upsert(payload, { onConflict: 'slug' });
    if (error) {
      setMessage(`Could not create custom unit: ${error.message}`);
      return;
    }
    await supabase.from('wiki_change_log').insert({ slug, old_value: {}, new_value: payload });
    setNewUnitName('');
    setSelectedSlug(slug);
    setActiveTool('wiki');
    setMessage(`Created custom unit ${name}. Fill in its WIKI data and save.`);
    await Promise.all([refreshAdminData(), refreshWiki()]);
  }

  async function signIn(event) {
    event.preventDefault();
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMessage(errorMessage(error, 'Login failed. Check the email/password and try again.'));
    else setAuthMessage('Logged in. Checking permissions…');
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAdminUser(null);
    setValueRows([]);
    setWikiRows([]);
  }

  async function sendPasswordReset() {
    if (!email) {
      setAuthMessage('Type your email first.');
      return;
    }
    setAuthMessage('Sending reset email…');

    // Always send the recovery link back to the site currently serving this
    // admin page. Without redirectTo, Supabase uses its dashboard "Site URL",
    // which can still point at a previous repository/deployment. The helper
    // strips any query/fragment so Supabase receives a normal, allow-listable
    // URL such as https://zenithvalues.github.io/<repo>/.
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAdminRedirectUrl(),
    });

    if (!result.error) {
      setAuthMessage('If this account exists, a password reset email was sent. Check your inbox and spam. Open the link in THIS browser.');
      return;
    }

    const err = result.error;
    const isRateLimit = err.status === 429 || /rate|too many|once every|cooldown|hour/i.test(`${err.message || ''} ${err.error_description || ''}`);
    const isSendFailure = [500, 502, 503, 504].includes(err.status) || /error sending recovery email|smtp|send/i.test(`${err.message || ''} ${err.error_description || ''}`);

    const detail = [
      err.message,
      err.error_description,
      err.code && `code ${err.code}`,
      err.status && `status ${err.status}`,
    ].filter(Boolean).join(' · ') || 'No detail returned.';

    if (isRateLimit) {
      setAuthMessage('Supabase rate-limited the email. The BUILT-IN sender allows only 2/hour (cannot be raised without custom SMTP). Wait 1 hour and try once. WORKAROUND for your team: the owner can set any member\'s password directly in Supabase → Authentication → Users → click the user → set password — no email needed.');
    } else if (isSendFailure) {
      setAuthMessage('Could not send the password-reset email because Supabase reported an email/SMTP gateway failure. Gmail SMTP may be temporarily unavailable or Supabase may have timed out. Please try again in a few minutes, then check Supabase → Logs → Auth Logs if it continues.');
    } else {
      setAuthMessage(`Reset email not sent: ${detail}`);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    setAuthMessage('');
    if (newPassword.length < 8) {
      setAuthMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthMessage('New password and confirmation do not match.');
      return;
    }

    setResetSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setResetSaving(false);
    if (error) setAuthMessage(errorMessage(error, 'Could not update password.'));
    else {
      setAuthMessage('Password updated successfully. You can return to Admin and log in with the new password.');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  async function saveValue() {
    if (!valueAllowed || !selectedUnit) return;
    setSaving(true);
    setMessage('');
    const next = normalizeValueForm(valueForm);
    const oldValue = selectedValueRow || getFallbackValueData(selectedUnit.slug);
    const payload = {
      slug: selectedUnit.slug, kind: 'unit', base_value: next.baseValue, gems: next.gems, coins: next.coins,
      demand: next.demand, scarcity: next.scarcity, trend: next.trend, notes: next.notes,
      updated_by: session.user.id, updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('value_entries').upsert(payload, { onConflict: 'slug' });
    if (error) {
      setMessage(`Save failed: ${error.message}`);
      setSaving(false);
      return;
    }
    await supabase.from('value_change_log').insert({ slug: selectedUnit.slug, kind: 'unit', old_value: oldValue, new_value: payload });
    setMessage('Saved value globally. Values pages and calculator will sync automatically.');
    await Promise.all([refreshAdminData(), refresh()]);
    setSaving(false);
  }

  async function resetValue() {
    if (!valueAllowed || !selectedUnit) return;
    const { error } = await supabase.from('value_entries').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Reset failed: ${error.message}`);
    else {
      setMessage('Live value override removed; fallback generated value restored.');
      await Promise.all([refreshAdminData(), refresh()]);
    }
  }

  async function saveWiki() {
    if (!wikiAllowed || !selectedUnit) return;
    setSaving(true);
    setMessage('');
    try {
      const minMaxStats = linesToObject(wikiForm.minMaxStatsText);
      const upgrades = (wikiForm.upgradeForms || []).map(formToUpgrade);
      const obtain = wikiForm.obtainText.split('\n').map((line) => line.trim()).filter(Boolean);
      let imageUrl = wikiForm.imageUrl || null;
      if (wikiImageFile) {
        imageUrl = await uploadUnitImage(wikiImageFile, selectedUnit.slug, session);
      }
      const payload = {
        slug: selectedUnit.slug, image_url: imageUrl, description: wikiForm.description || null,
        type: wikiForm.type || null, raw_type: wikiForm.rawType || null, category: wikiForm.category || null,
        placement_limit: wikiForm.placementLimit || null, total_cost: wikiForm.totalCost || null,
        early_game_rank: wikiForm.earlyGameRank === '' ? null : Number(wikiForm.earlyGameRank),
        late_game_rank: wikiForm.lateGameRank === '' ? null : Number(wikiForm.lateGameRank),
        obtain, passive: wikiForm.passive || null, ability: wikiForm.ability || null, synergy: wikiForm.synergy || null,
        min_max_stats: minMaxStats, upgrades, updated_by: session.user.id, updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('unit_wiki_overrides').upsert(payload, { onConflict: 'slug' });
      if (error) throw error;
      await supabase.from('wiki_change_log').insert({ slug: selectedUnit.slug, old_value: selectedWikiRow || {}, new_value: payload });
      if (imageUrl) saveCachedWikiImage(selectedUnit.slug, imageUrl);
      setMessage('Saved WIKI override globally. Unit cards/details will use the uploaded render.');
      await Promise.all([refreshAdminData(), refreshWiki()]);
    } catch (error) {
      setMessage(`Wiki save failed: ${error.message}`);
    }
    setSaving(false);
  }

  async function resetWiki() {
    if (!wikiAllowed || !selectedUnit) return;
    const { error } = await supabase.from('unit_wiki_overrides').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Wiki reset failed: ${error.message}`);
    else {
      removeCachedWikiImage(selectedUnit.slug);
      await removeUnitImages(selectedUnit.slug);
      setMessage('WIKI override removed; generated stat-sheet data restored.');
      await Promise.all([refreshAdminData(), refreshWiki()]);
    }
  }

  async function deleteCustomUnit() {
    if (!wikiAllowed || !selectedUnit?.customUnit) return;
    if (!window.confirm(`Delete custom unit "${selectedUnit.name}"? This permanently removes it from the WIKI and Values everywhere.`)) return;
    const slug = selectedUnit.slug;
    const name = selectedUnit.name;
    await supabase.from('unit_wiki_overrides').delete().eq('slug', slug);
    await supabase.from('value_entries').delete().eq('slug', slug);
    await removeUnitImages(slug);
    removeCachedWikiImage(slug);
    await supabase.from('wiki_change_log').insert({ slug, old_value: { deleted: true }, new_value: {} });
    setMessage(`Deleted custom unit ${name}.`);
    setSelectedSlug(generatedUnits[0]?.slug || '');
    await Promise.all([refreshAdminData(), refresh(), refreshWiki()]);
  }

  if (authLoading) return <main className="admin-page"><div className="admin-editor card">Loading admin…</div></main>;

  if (resetMode) {
    return (
      <main className="admin-page">
        <AuthPanel title="Reset Password" message={authMessage}>
          {resetChecking ? (
            <p className="admin-muted">Verifying reset link…</p>
          ) : resetReady ? (
            <form className="admin-auth-form" onSubmit={updatePassword}>
              <p className="admin-muted">Choose a new password with at least 8 characters. Reset links are single-use, so request a fresh email if this page stops working.</p>
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password…" autoComplete="new-password" minLength={8} required />
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password…" autoComplete="new-password" minLength={8} required />
              <button type="submit" className="filled" disabled={resetSaving}>{resetSaving ? 'Updating…' : 'Update Password'}</button>
              <button type="button" onClick={() => navigate('/admin')} disabled={resetSaving}>Back to Admin</button>
            </form>
          ) : (
            <form className="admin-auth-form" onSubmit={(event) => { event.preventDefault(); sendPasswordReset(); }}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="editor@email.com" />
              <button type="submit" className="filled">Send Password Reset Email</button>
              <button type="button" onClick={() => navigate('/admin')}>Back to Login</button>
            </form>
          )}
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

  if (adminLoading) return <main className="admin-page"><div className="admin-editor card">Checking permissions…</div></main>;

  if (!anyAllowed) {
    return (
      <main className="admin-page">
        <AuthPanel title="Access Denied" message={authMessage || `Logged in as ${session.user.email}, but this account does not have admin permissions.`}>
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

      <div className="admin-tabs">
        {valueAllowed && <button type="button" className={activeTool === 'values' ? 'active' : ''} onClick={() => setActiveTool('values')}>Values Editor</button>}
        {wikiAllowed && <button type="button" className={activeTool === 'wiki' ? 'active' : ''} onClick={() => setActiveTool('wiki')}>WIKI Editor</button>}
        {(role === 'owner' || role === 'admin') && <button type="button" className={activeTool === 'bugReports' ? 'active' : ''} onClick={() => setActiveTool('bugReports')}>Bug Reports</button>}
      </div>

      {wikiAllowed && activeTool === 'wiki' && (
        <form className="admin-create-unit card" onSubmit={createCustomUnit}>
          <div>
            <p className="admin-kicker">Create New Unit</p>
            <strong>Build a WIKI unit from scratch</strong>
          </div>
          <input value={newUnitName} onChange={(event) => setNewUnitName(event.target.value)} placeholder="New unit name…" />
          <Dropdown value={newUnitRarity} onChange={setNewUnitRarity} groups={NEW_UNIT_RARITY_GROUPS} ariaLabel="New unit rarity" />
          <button type="submit">+ Create Unit</button>
        </form>
      )}

      {activeTool === 'bugReports' && (role === 'owner' || role === 'admin') ? (
        <BugReportAdmin />
      ) : activeTool !== 'bugReports' && (
        <section className="admin-layout">
          <UnitPicker
            units={filteredUnits} total={units.length} query={query} setQuery={setQuery}
            selectedUnit={selectedUnit} selectUnit={selectUnit} valueRows={valueRows} wikiRows={wikiRows} mode={activeTool}
          />
          {activeTool === 'values' ? (
            <ValueEditor
              unit={selectedUnit} form={valueForm} tradeValue={tradeValue} selectedRow={selectedValueRow}
              updateField={updateValueField} saveValue={saveValue} resetValue={resetValue} refresh={refreshAdminData}
              saving={saving} message={message} navigate={navigate}
            />
          ) : (
            <WikiEditor
              unit={selectedUnit} form={wikiForm} selectedRow={selectedWikiRow} updateField={updateWikiField}
              imageFile={wikiImageFile} setImageFile={setWikiImageFile} saveWiki={saveWiki} resetWiki={resetWiki}
              deleteCustomUnit={deleteCustomUnit} refresh={refreshAdminData} saving={saving} message={message} navigate={navigate}
            />
          )}
        </section>
      )}

      <AdminLog activeTool={activeTool} valueLog={valueLog} wikiLog={wikiLog} role={role} />
    </main>
  );
}
