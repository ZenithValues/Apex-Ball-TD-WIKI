import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ALL_UNITS } from '../../data/units';
import { ALL_MAPS } from '../../data/maps';
import { CRATES } from '../../data/items';
import { useData } from '../../context/DataContext';
import { UNIT_RARITIES } from '../../data/taxonomy';
import { computeTradeValue } from '../../utils/calculator';
import { getDisplayName, getTeamMember } from '../../utils/teamMembers';
import {
  isMissingTableError,
  supabase,
} from '../../utils/supabase';
import { removeCachedWikiImage, saveCachedWikiImage } from '../../utils/wikiImageCache';
import {
  canEditValue,
  canEditWiki,
  errorMessage,
  getFallbackValueData,
  linesToObject,
  normalizeValueForm,
  valueRowToForm,
  wikiRowToForm,
} from '../../utils/adminForms';
import { uploadUnitImage } from '../../utils/adminImage';
import Dropdown from '../../components/Dropdown';
import { AdminLog, AuthPanel, EditorTitle, UnitPicker, ValueEditor, WikiEditor } from '../../components/admin/AdminParts';
import BugReportAdmin from '../../components/bugs/BugReportAdmin';
import ContributionGraph from '../../components/admin/ContributionGraph';
import { setLocalValueOverride, setLocalWikiOverride } from '../../utils/localOverrides';
import './AdminHome.css';

export default function AdminHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const { customUnits, refresh, refreshWiki } = useData();
  const generatedUnits = useMemo(() => ALL_UNITS.filter((unit) => unit.documented && !unit.unavailableData), []);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [query, setQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [clientSideOnly, setClientSideOnly] = useState(() => localStorage.getItem('apex-client-admin-mode') === 'on');
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

  const selectedUnit = units.find((unit) => unit.slug === selectedSlug) || units[0];
  const selectedValueRow = valueRows.find((row) => row.slug === selectedUnit?.slug);
  const selectedWikiRow = wikiRows.find((row) => row.slug === selectedUnit?.slug);

  const [valueForm, setValueForm] = useState(() => valueRowToForm(null, generatedUnits[0]?.slug));
  const [wikiForm, setWikiForm] = useState(() => wikiRowToForm(null, generatedUnits[0]));
  const [wikiImageFile, setWikiImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const valueDirty = JSON.stringify(valueForm) !== JSON.stringify(valueRowToForm(selectedValueRow, selectedUnit?.slug));
  const wikiDirty = JSON.stringify(wikiForm) !== JSON.stringify(wikiRowToForm(selectedWikiRow, selectedUnit)) || !!wikiImageFile;

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

  const memberInfo = getTeamMember(session?.user?.email);
  const role = adminUser?.role || memberInfo.roleKey || 'editor';
  const isOwnerRole = role === 'owner';
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

  async function saveValue(event) {
    event.preventDefault();
    if (!selectedUnit?.slug) return;
    setSaving(true);
    setMessage('');

    const fallback = getFallbackValueData(selectedUnit.slug);
    const normalized = normalizeValueForm(valueForm, fallback);

    if (clientSideOnly) {
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

      window.dispatchEvent(new Event('apex-values-updated'));
      setMessage('Client-side local preview override saved! (Tag: PRVW)');
      setSaving(false);
      return;
    }

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
      window.dispatchEvent(new Event('apex-values-updated'));
    }
    setSaving(false);
  }

  async function resetValue() {
    if (!selectedUnit?.slug) return;
    if (clientSideOnly) {
      setLocalValueOverride(selectedUnit.slug, null);
      window.dispatchEvent(new Event('apex-values-updated'));
      setMessage('Client-side override cleared.');
      return;
    }

    const { error } = await supabase.from('value_entries').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Reset failed: ${errorMessage(error)}`);
    else {
      setMessage('Reset to bundled value.');
      await refreshAdminData();
      window.dispatchEvent(new Event('apex-values-updated'));
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
      window.dispatchEvent(new Event('apex-wiki-updated'));
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
      window.dispatchEvent(new Event('apex-wiki-updated'));
    }
    setSaving(false);
  }

  async function resetWiki() {
    if (!selectedUnit?.slug) return;
    if (clientSideOnly) {
      setLocalWikiOverride(selectedUnit.slug, null);
      window.dispatchEvent(new Event('apex-wiki-updated'));
      setMessage('Client-side wiki override cleared.');
      return;
    }

    const { error } = await supabase.from('unit_wiki_overrides').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Reset failed: ${errorMessage(error)}`);
    else {
      removeCachedWikiImage(selectedUnit.slug);
      setMessage('WIKI reset to default.');
      await refreshAdminData();
      window.dispatchEvent(new Event('apex-wiki-updated'));
    }
  }

  async function addAnnouncement(event) {
    event.preventDefault();
    if (!newAnnouncementMsg) return;
    const uniqueId = `broadcast-${Date.now()}`;
    const newEntry = { id: uniqueId, message: newAnnouncementMsg, active: true, created_at: new Date().toISOString() };

    localStorage.removeItem('apex-dismissed-announcements');

    const { error } = await supabase.from('site_announcements').insert({ message: newAnnouncementMsg, active: true });
    if (error) {
      const local = JSON.parse(localStorage.getItem('apex-local-announcements') || '[]');
      localStorage.setItem('apex-local-announcements', JSON.stringify([newEntry, ...local]));
    }

    setNewAnnouncementMsg('');
    await refreshAdminData();
    window.dispatchEvent(new Event('apex-announcements-updated'));
  }

  async function toggleAnnouncement(id, active) {
    localStorage.removeItem('apex-dismissed-announcements');
    await supabase.from('site_announcements').update({ active: !active }).eq('id', id);
    const local = JSON.parse(localStorage.getItem('apex-local-announcements') || '[]');
    const nextLocal = local.map((a) => (a.id === id ? { ...a, active: !active } : a));
    localStorage.setItem('apex-local-announcements', JSON.stringify(nextLocal));

    await refreshAdminData();
    window.dispatchEvent(new Event('apex-announcements-updated'));
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
          </form>
        </AuthPanel>
      </main>
    );
  }

  if (adminLoading) return <main className="admin-page"><div className="admin-editor card">Checking permissions…</div></main>;

  if (!anyAllowed) {
    return (
      <main className="admin-page">
        <AuthPanel title="Access Denied" message={authMessage || `Logged in as ${memberInfo.name}, but this account does not have admin permissions.`}>
          <button type="button" className="admin-btn-danger" onClick={signOut}>Logout</button>
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
      <motion.section className="admin-hero card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="admin-hero-head">
          <div>
            <span className="admin-kicker">APEX Studio Command</span>
            <h1>Welcome, {memberInfo.name}</h1>
            <p className="admin-user-meta">
              Logged in as <strong>{memberInfo.name}</strong> · Role: <span className="role-pill">{memberInfo.roleLabel} {memberInfo.icon}</span>
            </p>
          </div>
          <div className="admin-hero-actions">
            <button type="button" className="admin-btn-danger" onClick={signOut}>Logout</button>
          </div>
        </div>
      </motion.section>

      <div className="admin-panel-slide-row card">
        <div className="slide-row-info">
          <span className="admin-panel-slide-title">Client-Side Preview Mode</span>
          <p className="admin-muted">Toggle local client overrides with &quot;PRVW&quot; badge vs live global broadcasts.</p>
        </div>
        <div className="admin-switch-wrapper" onClick={toggleClientAdminMode} role="button" tabIndex={0} aria-label="Toggle client-side admin mode">
          <span className={`admin-switch-label ${clientSideOnly ? 'active' : ''}`}>Client Preview (Tag: PRVW)</span>
          <div className={`admin-switch ${!clientSideOnly ? 'on' : ''}`}><i /></div>
          <span className={`admin-switch-label ${!clientSideOnly ? 'active' : ''}`}>Global Live (Tag: LIVE)</span>
        </div>
      </div>

      <div className="admin-tabs">
        {valueAllowed && <button type="button" className={activeTool === 'values' ? 'active' : ''} onClick={() => { setActiveTool('values'); setMessage(''); }}>📊 Values Editor</button>}
        {wikiAllowed && <button type="button" className={activeTool === 'wiki' ? 'active' : ''} onClick={() => { setActiveTool('wiki'); setMessage(''); }}>📖 WIKI Editor</button>}
        {(role === 'owner' || role === 'admin' || role === 'admin_plus') && <button type="button" className={activeTool === 'announcements' ? 'active' : ''} onClick={() => { setActiveTool('announcements'); setMessage(''); }}>📢 Announcements</button>}
        {(role === 'owner' || role === 'admin' || role === 'admin_plus') && <button type="button" className={activeTool === 'bugReports' ? 'active' : ''} onClick={() => { setActiveTool('bugReports'); setMessage(''); }}>🐞 Bug Reports</button>}
      </div>

      {activeTool === 'announcements' ? (
        <div className="admin-editor card">
          <h2>Site-wide Announcement Broadcast</h2>
          <p className="admin-muted">Broadcast real-time alerts to all visitors across the globe instantly.</p>
          <form onSubmit={addAnnouncement} style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <input
              type="text"
              value={newAnnouncementMsg}
              onChange={(e) => setNewAnnouncementMsg(e.target.value)}
              placeholder="Type site-wide announcement message…"
              style={{ flex: 1, padding: 12, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600 }}
            />
            <button type="submit" className="filled" style={{ padding: '12px 20px', fontWeight: 800 }}>+ Broadcast Now</button>
          </form>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3>Active &amp; Past Broadcasts</h3>
            {announcements.length === 0 ? (
              <p className="admin-muted">No broadcasts created yet.</p>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{ann.message}</span>
                  <button type="button" className={ann.active ? 'admin-btn-subtle' : 'filled'} onClick={() => toggleAnnouncement(ann.id, ann.active)}>
                    {ann.active ? 'Active (Click to Mute)' : 'Muted (Click to Activate)'}
                  </button>
                </div>
              ))
            )}
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

      {/* TEAM ACTIVITY & ROLE REWARDS — ONLY VISIBLE TO OWNER ROLE */}
      {isOwnerRole && <ContributionGraph valueLog={valueLog} wikiLog={wikiLog} />}

      <AdminLog activeTool={activeTool} valueLog={valueLog} wikiLog={wikiLog} role={role} />
    </main>
  );
}
