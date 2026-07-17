import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ALL_UNITS } from '../../data/units';
import { ALL_MAPS } from '../../data/maps';
import { CRATES } from '../../data/items';
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
import { uploadUnitImage, uploadContentImage, removeUnitImages } from '../../utils/adminImage';
import Dropdown from '../../components/Dropdown';
import { AdminLog, AuthPanel, ContentEditor, EditorTitle, UnitPicker, ValueEditor, WikiEditor } from '../../components/admin/AdminParts';
import BugReportAdmin from '../../components/bugs/BugReportAdmin';
import ContributionGraph from '../../components/admin/ContributionGraph';
import { setLocalValueOverride, setLocalWikiOverride } from '../../utils/localOverrides';
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
  const [unitFilter, setUnitFilter] = useState('all');
  const [showAdminPanel, setShowAdminPanel] = useState(true);
  const [clientSideOnly, setClientSideOnly] = useState(() => localStorage.getItem('apex-client-admin-mode') === 'on');
  const [showEmail, setShowEmail] = useState(false);
  const [valueRows, setValueRows] = useState([]);
  const [valueLog, setValueLog] = useState([]);
  const [wikiRows, setWikiRows] = useState([]);
  const [mapRows, setMapRows] = useState([]);
  const [crateRows, setCrateRows] = useState([]);
  const [wikiLog, setWikiLog] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncementMsg, setNewAnnouncementMsg] = useState('');

  const units = useMemo(() => [...generatedUnits, ...customUnits], [generatedUnits, customUnits]);
  const [selectedSlug, setSelectedSlug] = useState(generatedUnits[0]?.slug || '');
  const [activeTool, setActiveTool] = useState('values');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRarity, setNewUnitRarity] = useState('Normie');
  const [contentSlug, setContentSlug] = useState(ALL_MAPS[0]?.slug || CRATES[0]?.slug || '');
  const [contentForm, setContentForm] = useState({});
  const [contentImageFile, setContentImageFile] = useState(null);

  const selectedUnit = units.find((unit) => unit.slug === selectedSlug) || units[0];
  const selectedValueRow = valueRows.find((row) => row.slug === selectedUnit?.slug);
  const selectedWikiRow = wikiRows.find((row) => row.slug === selectedUnit?.slug);
  const contentItems = activeTool === 'maps' ? ALL_MAPS : CRATES;
  const selectedContentItem = contentItems.find((item) => item.slug === contentSlug) || contentItems[0];
  const selectedContentRow = (activeTool === 'maps' ? mapRows : crateRows).find((row) => row.slug === selectedContentItem?.slug);

  const [valueForm, setValueForm] = useState(() => valueRowToForm(null, generatedUnits[0]?.slug));
  const [wikiForm, setWikiForm] = useState(() => wikiRowToForm(null, generatedUnits[0]));
  const [wikiImageFile, setWikiImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const valueDirty = JSON.stringify(valueForm) !== JSON.stringify(valueRowToForm(selectedValueRow, selectedUnit?.slug));
  const wikiDirty = JSON.stringify(wikiForm) !== JSON.stringify(wikiRowToForm(selectedWikiRow, selectedUnit)) || !!wikiImageFile;

  useEffect(() => {
    const dirty = valueDirty || wikiDirty;
    function warn(event) { if (dirty) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [valueDirty, wikiDirty]);

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
    const [valuesRes, valueLogRes, wikiRes, mapRes, crateRes, wikiLogRes, annRes] = await Promise.all([
      supabase.from('value_entries').select('*').order('updated_at', { ascending: false }),
      supabase.from('value_change_log_public').select('*').order('changed_at', { ascending: false }).limit(40),
      supabase.from('unit_wiki_overrides').select('*').order('updated_at', { ascending: false }),
      supabase.from('map_wiki_overrides').select('*').order('updated_at', { ascending: false }),
      supabase.from('crate_wiki_overrides').select('*').order('updated_at', { ascending: false }),
      supabase.from('wiki_change_log_public').select('*').order('changed_at', { ascending: false }).limit(40),
      supabase.from('site_announcements').select('*').order('created_at', { ascending: false }),
    ]);

    if (!valuesRes.error) setValueRows(valuesRes.data || []);
    if (!valueLogRes.error) setValueLog(valueLogRes.data || []);
    if (!wikiRes.error) setWikiRows(wikiRes.data || []);
    if (!mapRes.error) setMapRows(mapRes.data || []);
    if (!crateRes.error) setCrateRows(crateRes.data || []);
    if (!wikiLogRes.error) setWikiLog(wikiLogRes.data || []);
    if (!annRes.error) setAnnouncements(annRes.data || []);
  }

  useEffect(() => {
    if (session && anyAllowed) refreshAdminData();
  }, [session, anyAllowed]);

  useEffect(() => {
    setValueForm(valueRowToForm(selectedValueRow, selectedUnit?.slug));
    setWikiForm(wikiRowToForm(selectedWikiRow, selectedUnit));
    setWikiImageFile(null);
  }, [selectedSlug, valueRows, wikiRows, selectedUnit, selectedValueRow, selectedWikiRow]);

  function selectUnit(slug) {
    setSelectedSlug(slug);
    setMessage('');
  }

  function updateValueField(field, value) {
    setValueForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateWikiField(field, value) {
    setWikiForm((prev) => ({ ...prev, [field]: value }));
  }

  async function signIn(event) {
    event.preventDefault();
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthMessage(`Login failed: ${errorMessage(error)}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAdminUser(null);
    setSession(null);
  }

  async function sendPasswordReset() {
    setAuthMessage('');
    if (!email) {
      setAuthMessage('Enter your editor email address first.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAdminRedirectUrl(),
    });
    if (error) setAuthMessage(`Password reset failed: ${errorMessage(error)}`);
    else setAuthMessage('Password reset link sent! Check your inbox.');
  }

  async function updatePassword(event) {
    event.preventDefault();
    setAuthMessage('');
    if (newPassword !== confirmPassword) {
      setAuthMessage('New passwords do not match.');
      return;
    }
    setResetSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setResetSaving(false);
    if (error) setAuthMessage(`Password update failed: ${errorMessage(error)}`);
    else {
      setAuthMessage('Password updated successfully!');
      setTimeout(() => navigate('/admin'), 1500);
    }
  }

  async function saveValue(event) {
    event.preventDefault();
    if (!selectedUnit?.slug) return;
    setSaving(true);
    setMessage('');

    if (clientSideOnly) {
      const fallback = getFallbackValueData(selectedUnit.slug);
      const normalized = normalizeValueForm(valueForm, fallback);

      setLocalValueOverride(selectedUnit.slug, {
        base_value: normalized.baseValue,
        gems: normalized.gems,
        coins: normalized.coins,
        demand: normalized.demand,
        scarcity: normalized.scarcity,
        trend: normalized.trend,
        notes: normalized.notes,
        liveTag: 'prvw',
      });

      refresh();
      setMessage('Client-side local preview override saved! (Tag: PRVW)');
      setSaving(false);
      return;
    }

    const fallback = getFallbackValueData(selectedUnit.slug);
    const normalized = normalizeValueForm(valueForm, fallback);

    const payload = {
      slug: selectedUnit.slug,
      kind: selectedUnit.kind || 'unit',
      base_value: normalized.baseValue,
      gems: normalized.gems,
      coins: normalized.coins,
      demand: normalized.demand,
      scarcity: normalized.scarcity,
      trend: normalized.trend,
      notes: normalized.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('value_entries').upsert(payload);
    if (error) setMessage(`Save failed: ${errorMessage(error)}`);
    else {
      setMessage('Global value updated live!');
      await refreshAdminData();
      refresh();
    }
    setSaving(false);
  }

  async function resetValue() {
    if (!selectedUnit?.slug) return;
    if (clientSideOnly) {
      setLocalValueOverride(selectedUnit.slug, null);
      refresh();
      setMessage('Client-side override cleared.');
      return;
    }

    const { error } = await supabase.from('value_entries').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Reset failed: ${errorMessage(error)}`);
    else {
      setMessage('Reset to bundled value.');
      await refreshAdminData();
      refresh();
    }
  }

  async function saveWiki(event) {
    event.preventDefault();
    if (!selectedUnit?.slug) return;
    setSaving(true);
    setMessage('');

    if (clientSideOnly) {
      setLocalWikiOverride(selectedUnit.slug, {
        name: wikiForm.name,
        rarity: wikiForm.rarity,
        description: wikiForm.description,
        type: wikiForm.type,
        category: wikiForm.category,
        liveTag: 'prvw',
      });
      refreshWiki();
      setMessage('Client-side wiki preview override saved! (Tag: PRVW)');
      setSaving(false);
      return;
    }

    let imageUrl = selectedWikiRow?.image_url || null;
    if (wikiImageFile) {
      try {
        imageUrl = await uploadUnitImage(selectedUnit.slug, wikiImageFile);
        saveCachedWikiImage(selectedUnit.slug, imageUrl);
      } catch (uploadError) {
        setMessage(`Image upload failed: ${errorMessage(uploadError)}`);
        setSaving(false);
        return;
      }
    }

    const upgradesParsed = linesToObject(wikiForm.upgradesRaw);
    const minMaxStatsParsed = linesToObject(wikiForm.minMaxStatsRaw);

    const payload = {
      slug: selectedUnit.slug,
      name: wikiForm.name || selectedUnit.name,
      rarity: wikiForm.rarity || selectedUnit.rarity,
      custom_unit: selectedUnit.customUnit || false,
      image_url: imageUrl,
      description: wikiForm.description || null,
      type: wikiForm.type || null,
      category: wikiForm.category || null,
      placement_limit: wikiForm.placementLimit || null,
      total_cost: wikiForm.totalCost || null,
      early_game_rank: wikiForm.earlyGameRank ? Number(wikiForm.earlyGameRank) : null,
      late_game_rank: wikiForm.lateGameRank ? Number(wikiForm.lateGameRank) : null,
      obtain: { method: wikiForm.obtainMethod || '', source: wikiForm.obtainSource || '' },
      passive: wikiForm.passive || null,
      ability: wikiForm.ability || null,
      synergy: wikiForm.synergy || null,
      min_max_stats: minMaxStatsParsed,
      upgrades: upgradesParsed,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('unit_wiki_overrides').upsert(payload);
    if (error) setMessage(`Save failed: ${errorMessage(error)}`);
    else {
      setMessage('WIKI page updated globally!');
      await refreshAdminData();
      refreshWiki();
    }
    setSaving(false);
  }

  async function resetWiki() {
    if (!selectedUnit?.slug) return;
    if (clientSideOnly) {
      setLocalWikiOverride(selectedUnit.slug, null);
      refreshWiki();
      setMessage('Client-side wiki override cleared.');
      return;
    }

    const { error } = await supabase.from('unit_wiki_overrides').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Reset failed: ${errorMessage(error)}`);
    else {
      removeCachedWikiImage(selectedUnit.slug);
      setMessage('WIKI reset to default.');
      await refreshAdminData();
      refreshWiki();
    }
  }

  async function createCustomUnit(event) {
    event.preventDefault();
    if (!newUnitName) return;
    const newSlug = slugify(newUnitName);
    const payload = {
      slug: newSlug,
      name: newUnitName,
      rarity: newUnitRarity,
      custom_unit: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('unit_wiki_overrides').insert(payload);
    if (error) setMessage(`Creation failed: ${errorMessage(error)}`);
    else {
      setMessage(`Unit "${newUnitName}" created!`);
      setNewUnitName('');
      await refreshAdminData();
      refreshWiki();
      setSelectedSlug(newSlug);
    }
  }

  async function addAnnouncement(event) {
    event.preventDefault();
    if (!newAnnouncementMsg) return;
    const { error } = await supabase.from('site_announcements').insert({ message: newAnnouncementMsg, active: true });
    if (!error) {
      setNewAnnouncementMsg('');
      await refreshAdminData();
    }
  }

  async function toggleAnnouncement(id, active) {
    await supabase.from('site_announcements').update({ active: !active }).eq('id', id);
    await refreshAdminData();
  }

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesQuery = !query || unit.name.toLowerCase().includes(query.toLowerCase()) || unit.slug.includes(query.toLowerCase());
      const matchesFilter = unitFilter === 'all' || unit.rarity === unitFilter;
      return matchesQuery && matchesFilter;
    });
  }, [units, query, unitFilter]);

  const tradeValue = useMemo(() => {
    const fallback = getFallbackValueData(selectedUnit?.slug);
    const normalized = normalizeValueForm(valueForm, fallback);
    return computeTradeValue(normalized.baseValue, normalized.demand, normalized.scarcity);
  }, [valueForm, selectedUnit]);

  if (authLoading) return <main className="admin-page"><div className="admin-editor card">Loading admin…</div></main>;

  if (resetMode) {
    return (
      <main className="admin-page">
        <AuthPanel title="Reset Password" message={authMessage}>
          {resetChecking ? (
            <p className="admin-muted">Verifying reset link…</p>
          ) : resetReady ? (
            <form className="admin-auth-form" onSubmit={updatePassword}>
              <p className="admin-muted">Choose a new password with at least 8 characters.</p>
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password…" minLength={8} required />
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password…" minLength={8} required />
              <button type="submit" className="filled" disabled={resetSaving}>{resetSaving ? 'Updating…' : 'Update Password'}</button>
            </form>
          ) : (
            <form className="admin-auth-form" onSubmit={(e) => { e.preventDefault(); sendPasswordReset(); }}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="editor@email.com" />
              <button type="submit" className="filled">Send Reset Email</button>
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

  function toggleClientAdminMode() {
    setClientSideOnly((curr) => {
      const next = !curr;
      localStorage.setItem('apex-client-admin-mode', next ? 'on' : 'off');
      return next;
    });
  }

  return (
    <main className="admin-page">
      <motion.section className="admin-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="admin-kicker">Secure Admin</p>
        <h1>APEX Admin Studio</h1>
        <p>Logged in as <strong>{showEmail ? session.user.email : '••••••••••••'}</strong> · Role: <strong>{role}</strong></p>
        <div className="admin-hero-actions">
          <button type="button" className="admin-denied-button" onClick={() => setShowEmail((curr) => !curr)}>{showEmail ? 'Hide Email' : 'Show Email'}</button>
          <button type="button" className="admin-denied-button" onClick={() => navigate('/admin/reset-password')}>Change Password</button>
          <button type="button" className="admin-denied-button" onClick={signOut}>Logout</button>
        </div>
      </motion.section>

      <div className="admin-panel-slide-row">
        <span className="admin-panel-slide-title">Client-Side Admin Panel Mode</span>
        <div className="admin-switch-wrapper" onClick={toggleClientAdminMode} role="button" tabIndex={0} aria-label="Toggle client-side admin mode">
          <span className={`admin-switch-label ${clientSideOnly ? 'active' : ''}`}>Client Preview (Tag: PRVW)</span>
          <div className={`admin-switch ${!clientSideOnly ? 'on' : ''}`}><i /></div>
          <span className={`admin-switch-label ${!clientSideOnly ? 'active' : ''}`}>Global Live (Tag: LIVE)</span>
        </div>
      </div>

      <div className="admin-tabs">
        {valueAllowed && <button type="button" className={activeTool === 'values' ? 'active' : ''} onClick={() => { setActiveTool('values'); setMessage(''); }}>Values Editor</button>}
        {wikiAllowed && <button type="button" className={activeTool === 'wiki' ? 'active' : ''} onClick={() => { setActiveTool('wiki'); setMessage(''); }}>WIKI Editor</button>}
        {(role === 'owner' || role === 'admin' || role === 'admin_plus') && <button type="button" className={activeTool === 'announcements' ? 'active' : ''} onClick={() => { setActiveTool('announcements'); setMessage(''); }}>Announcements</button>}
        {(role === 'owner' || role === 'admin' || role === 'admin_plus') && <button type="button" className={activeTool === 'bugReports' ? 'active' : ''} onClick={() => { setActiveTool('bugReports'); setMessage(''); }}>Bug Reports</button>}
      </div>

      {activeTool === 'announcements' ? (
        <div className="admin-editor card">
          <h2>Site-wide Announcement Messages</h2>
          <form onSubmit={addAnnouncement} style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <input
              type="text"
              value={newAnnouncementMsg}
              onChange={(e) => setNewAnnouncementMsg(e.target.value)}
              placeholder="Type announcement message…"
              style={{ flex: 1, padding: 10, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <button type="submit" className="filled">+ Broadcast</button>
          </form>

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {announcements.map((ann) => (
              <div key={ann.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <span>{ann.message}</span>
                <button type="button" onClick={() => toggleAnnouncement(ann.id, ann.active)}>
                  {ann.active ? 'Active (Click to Mute)' : 'Muted (Click to Activate)'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : activeTool === 'bugReports' ? (
        <BugReportAdmin />
      ) : (
        <section className="admin-layout">
          <UnitPicker
            units={filteredUnits} total={units.length} query={query} setQuery={setQuery} filter={unitFilter} setFilter={setUnitFilter}
            selectedUnit={selectedUnit} selectUnit={selectUnit} valueRows={valueRows} wikiRows={wikiRows} mode={activeTool}
          />
          {activeTool === 'values' ? (
            <ValueEditor
              unit={selectedUnit} form={valueForm} tradeValue={tradeValue} selectedRow={selectedValueRow}
              updateField={updateValueField} saveValue={saveValue} resetValue={resetValue} refresh={refreshAdminData}
              saving={saving} message={message} navigate={navigate} dirty={valueDirty}
            />
          ) : (
            <WikiEditor
              unit={selectedUnit} form={wikiForm} selectedRow={selectedWikiRow} updateField={updateWikiField}
              imageFile={wikiImageFile} setImageFile={setWikiImageFile} saveWiki={saveWiki} resetWiki={resetWiki}
              refresh={refreshAdminData} saving={saving} message={message} navigate={navigate} dirty={wikiDirty}
            />
          )}
        </section>
      )}

      <ContributionGraph valueLog={valueLog} wikiLog={wikiLog} />
      <AdminLog activeTool={activeTool} valueLog={valueLog} wikiLog={wikiLog} role={role} />
    </main>
  );
}
