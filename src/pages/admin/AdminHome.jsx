import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ALL_UNITS } from '../../data/units';
import { DEMAND_LABELS, SCARCITY_LABELS, getRarityGlow, isShinyRarity } from '../../data/taxonomy';
import { GENERATED_VALUE_OVERRIDES } from '../../data/generated/units.generated';
import { VALUE_OVERRIDES } from '../../data/values';
import { computeTradeValue } from '../../utils/calculator';
import { getAdminRedirectUrl, isMissingTableError, supabase } from '../../utils/supabase';
import UnitIcon from '../../components/UnitIcon';
import './AdminHome.css';

const TRENDS = ['stable', 'rising', 'falling'];
const VALUE_ROLES = ['owner', 'admin', 'value_editor', 'editor'];
const WIKI_ROLES = ['owner', 'admin', 'wiki_editor', 'editor'];


function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message && error.message !== '{}') return error.message;
  if (error.error_description) return error.error_description;
  if (error.error && error.error !== '{}') return error.error;
  return fallback;
}

function getFallbackValueData(slug) {
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

function valueRowToForm(row, slug) {
  const fallback = getFallbackValueData(slug);
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

function normalizeValueForm(data) {
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

function wikiRowToForm(row, unit) {
  return {
    imageUrl: row?.image_url || '',
    description: row?.description ?? unit?.description ?? '',
    type: row?.type ?? unit?.type ?? '',
    rawType: row?.raw_type ?? unit?.rawType ?? '',
    category: row?.category ?? unit?.category ?? '',
    placementLimit: row?.placement_limit ?? unit?.placementLimit ?? '',
    totalCost: row?.total_cost ?? unit?.totalCost ?? '',
    earlyGameRank: row?.early_game_rank ?? unit?.earlyGameRank ?? '',
    lateGameRank: row?.late_game_rank ?? unit?.lateGameRank ?? '',
    passive: row?.passive ?? unit?.passive ?? '',
    ability: row?.ability ?? unit?.ability ?? '',
    synergy: row?.synergy ?? unit?.synergy ?? '',
    obtainText: Array.isArray(row?.obtain) ? row.obtain.join('\n') : (unit?.obtain || []).join('\n'),
    minMaxStatsText: objectToLines(row?.min_max_stats ?? unit?.minMaxStats ?? {}),
    upgradeForms: (row?.upgrades ?? unit?.upgrades ?? []).map(upgradeToForm),
  };
}

function parseCost(raw) {
  const text = String(raw || '').replace(/[$,]/g, '').trim();
  if (!text) return null;
  const mult = text.toUpperCase().endsWith('B') ? 1_000_000_000 : text.toUpperCase().endsWith('M') ? 1_000_000 : text.toUpperCase().endsWith('K') ? 1_000 : 1;
  const numeric = Number(mult === 1 ? text : text.slice(0, -1));
  return Number.isFinite(numeric) ? numeric * mult : null;
}

function objectToLines(obj) {
  return Object.entries(obj || {}).map(([key, value]) => `${key}: ${value}`).join('\n');
}

function linesToObject(text) {
  return String(text || '').split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed) return acc;
    const idx = trimmed.indexOf(':');
    if (idx === -1) return acc;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) acc[key] = value;
    return acc;
  }, {});
}

function attacksToLines(attacks) {
  return Object.entries(attacks || {}).flatMap(([attackName, stats]) =>
    Object.entries(stats || {}).map(([key, value]) => `${attackName} / ${key}: ${value}`)
  ).join('\n');
}

function linesToAttacks(text) {
  return String(text || '').split('\n').reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed) return acc;
    const idx = trimmed.indexOf(':');
    if (idx === -1) return acc;
    const left = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    const parts = left.split('/').map((part) => part.trim()).filter(Boolean);
    const attackName = parts.length > 1 ? parts[0] : 'Stats';
    const key = parts.length > 1 ? parts.slice(1).join(' / ') : parts[0];
    if (!key) return acc;
    acc[attackName] = { ...(acc[attackName] || {}), [key]: value };
    return acc;
  }, {});
}

function upgradeToForm(upgrade = {}, index = 0) {
  return {
    label: upgrade.label || (index === 0 ? 'Placement' : `Upgrade ${index}`),
    costRaw: upgrade.costRaw || '',
    description: upgrade.description || '',
    cooldown: upgrade.cooldown || '',
    range: upgrade.range || '',
    dpsText: objectToLines(upgrade.dps),
    costPerDps: upgrade.costPerDps || '',
    statsText: objectToLines(upgrade.stats),
    attacksText: attacksToLines(upgrade.attacks),
  };
}

function formToUpgrade(form, index) {
  return {
    level: index + 1,
    label: form.label || (index === 0 ? 'Placement' : `Upgrade ${index}`),
    isMax: /max/i.test(form.label || ''),
    cost: parseCost(form.costRaw),
    costRaw: form.costRaw || null,
    description: form.description || null,
    cooldown: form.cooldown || null,
    range: form.range || null,
    stats: linesToObject(form.statsText),
    attacks: linesToAttacks(form.attacksText),
    dps: linesToObject(form.dpsText),
    costPerDps: form.costPerDps || null,
  };
}

function canEditValue(role) {
  return VALUE_ROLES.includes(role);
}

function canEditWiki(role) {
  return WIKI_ROLES.includes(role);
}

export default function AdminHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetMode = location.pathname.endsWith('/reset-password');
  const units = useMemo(() => ALL_UNITS.filter((unit) => unit.documented && !unit.unavailableData), []);

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
  const [valueLog, setValueLog] = useState([]);
  const [wikiRows, setWikiRows] = useState([]);
  const [wikiLog, setWikiLog] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(units[0]?.slug || '');
  const selectedUnit = units.find((unit) => unit.slug === selectedSlug) || units[0];
  const selectedValueRow = valueRows.find((row) => row.slug === selectedUnit?.slug);
  const selectedWikiRow = wikiRows.find((row) => row.slug === selectedUnit?.slug);

  const [valueForm, setValueForm] = useState(() => valueRowToForm(null, units[0]?.slug));
  const [wikiForm, setWikiForm] = useState(() => wikiRowToForm(null, units[0]));
  const [wikiImageFile, setWikiImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTool, setActiveTool] = useState('values');

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
    const [valuesRes, valueLogRes, wikiRes, wikiLogRes] = await Promise.all([
      supabase.from('value_entries').select('*').order('updated_at', { ascending: false }),
      supabase.from('value_change_log').select('*').order('changed_at', { ascending: false }).limit(40),
      supabase.from('unit_wiki_overrides').select('*').order('updated_at', { ascending: false }),
      supabase.from('wiki_change_log').select('*').order('changed_at', { ascending: false }).limit(40),
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
    if (!q) return units.slice(0, 60);
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAdminRedirectUrl('/admin/reset-password'),
    });
    setAuthMessage(error ? errorMessage(error, 'Could not send reset email right now.') : 'If this account exists, a password reset email was sent. Check inbox/spam.');
  }

  async function updatePassword(event) {
    event.preventDefault();
    setAuthMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setAuthMessage(errorMessage(error, 'Could not update password.'));
    else {
      setAuthMessage('Password updated. You can return to Admin.');
      setNewPassword('');
    }
  }

  async function saveValue() {
    if (!valueAllowed || !selectedUnit) return;
    setSaving(true);
    setMessage('');
    const next = normalizeValueForm(valueForm);
    const oldValue = selectedValueRow || getFallbackValueData(selectedUnit.slug);
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
      changed_by_email: session.user.email,
    });

    setMessage('Saved value globally. Values pages and calculator will sync automatically.');
    await refreshAdminData();
    setSaving(false);
  }

  async function resetValue() {
    if (!valueAllowed || !selectedUnit) return;
    const { error } = await supabase.from('value_entries').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Reset failed: ${error.message}`);
    else {
      setMessage('Live value override removed; fallback generated value restored.');
      await refreshAdminData();
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
        const safeName = wikiImageFile.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
        const path = `${selectedUnit.slug}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('unit-images')
          .upload(path, wikiImageFile, { upsert: true, contentType: wikiImageFile.type });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('unit-images').getPublicUrl(path);
        imageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        slug: selectedUnit.slug,
        image_url: imageUrl,
        description: wikiForm.description || null,
        type: wikiForm.type || null,
        raw_type: wikiForm.rawType || null,
        category: wikiForm.category || null,
        placement_limit: wikiForm.placementLimit || null,
        total_cost: wikiForm.totalCost || null,
        early_game_rank: wikiForm.earlyGameRank === '' ? null : Number(wikiForm.earlyGameRank),
        late_game_rank: wikiForm.lateGameRank === '' ? null : Number(wikiForm.lateGameRank),
        obtain,
        passive: wikiForm.passive || null,
        ability: wikiForm.ability || null,
        synergy: wikiForm.synergy || null,
        min_max_stats: minMaxStats,
        upgrades,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('unit_wiki_overrides').upsert(payload, { onConflict: 'slug' });
      if (error) throw error;

      await supabase.from('wiki_change_log').insert({
        slug: selectedUnit.slug,
        old_value: selectedWikiRow || {},
        new_value: payload,
        changed_by: session.user.id,
        changed_by_email: session.user.email,
      });

      setMessage('Saved WIKI override globally. Unit detail pages will use the live override.');
      await refreshAdminData();
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
      setMessage('WIKI override removed; generated stat-sheet data restored.');
      await refreshAdminData();
    }
  }

  if (authLoading) return <main className="admin-page"><div className="admin-editor card">Loading admin…</div></main>;

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
      </div>

      <section className="admin-layout">
        <UnitPicker
          units={filteredUnits}
          total={units.length}
          query={query}
          setQuery={setQuery}
          selectedUnit={selectedUnit}
          selectUnit={selectUnit}
          valueRows={valueRows}
          wikiRows={wikiRows}
          mode={activeTool}
        />

        {activeTool === 'values' ? (
          <ValueEditor
            unit={selectedUnit}
            form={valueForm}
            tradeValue={tradeValue}
            selectedRow={selectedValueRow}
            updateField={updateValueField}
            saveValue={saveValue}
            resetValue={resetValue}
            refresh={refreshAdminData}
            saving={saving}
            message={message}
            navigate={navigate}
          />
        ) : (
          <WikiEditor
            unit={selectedUnit}
            form={wikiForm}
            selectedRow={selectedWikiRow}
            updateField={updateWikiField}
            imageFile={wikiImageFile}
            setImageFile={setWikiImageFile}
            saveWiki={saveWiki}
            resetWiki={resetWiki}
            refresh={refreshAdminData}
            saving={saving}
            message={message}
            navigate={navigate}
          />
        )}
      </section>

      <AdminLog activeTool={activeTool} valueLog={valueLog} wikiLog={wikiLog} role={role} />
    </main>
  );
}

function UnitPicker({ units, total, query, setQuery, selectedUnit, selectUnit, valueRows, wikiRows, mode }) {
  const liveRows = mode === 'values' ? valueRows : wikiRows;
  return (
    <aside className="admin-unit-picker card">
      <div className="admin-section-head"><h2>Units</h2><span>{total}</span></div>
      <input className="admin-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search units…" />
      <div className="admin-unit-list" data-lenis-prevent>
        {units.map((unit) => (
          <button key={unit.slug} type="button" className={unit.slug === selectedUnit?.slug ? 'admin-unit active' : 'admin-unit'} onClick={() => selectUnit(unit)}>
            <UnitIcon slug={unit.slug} name={unit.name} glowColor={getRarityGlow(unit.rarity)} shiny={isShinyRarity(unit.rarity)} size={36} />
            <span className="admin-unit-text"><strong>{unit.name}</strong><small>{unit.rarity}</small></span>
            {liveRows.some((row) => row.slug === unit.slug) && <b>LIVE</b>}
          </button>
        ))}
      </div>
    </aside>
  );
}

function EditorTitle({ unit, label, live }) {
  return (
    <div className="admin-editor-head">
      <div className="admin-editor-title">
        {unit && <UnitIcon slug={unit.slug} name={unit.name} glowColor={getRarityGlow(unit.rarity)} shiny={isShinyRarity(unit.rarity)} size={54} />}
        <div><p className="admin-kicker">{label}</p><h2>{unit?.name}</h2><span>{unit?.rarity} · {unit?.type}</span></div>
      </div>
      {live && <div className="admin-local-pill">Live Override</div>}
    </div>
  );
}

function ValueEditor({ unit, form, tradeValue, selectedRow, updateField, saveValue, resetValue, refresh, saving, message, navigate }) {
  return (
    <section className="admin-editor card">
      <EditorTitle unit={unit} label="Editing Values" live={!!selectedRow} />
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
        <button type="button" onClick={resetValue}>Reset Value</button>
        <button type="button" onClick={refresh}>Refresh</button>
        <button type="button" onClick={() => navigate('/admin/reset-password')}>Change Password</button>
      </div>
      {message && <div className="admin-message">{message}</div>}
    </section>
  );
}

function WikiEditor({ unit, form, selectedRow, updateField, imageFile, setImageFile, saveWiki, resetWiki, refresh, saving, message, navigate }) {
  const previewSrc = imageFile ? URL.createObjectURL(imageFile) : form.imageUrl;

  function updateUpgrade(index, key, value) {
    const next = [...(form.upgradeForms || [])];
    next[index] = { ...next[index], [key]: value };
    updateField('upgradeForms', next);
  }

  function addUpgrade() {
    updateField('upgradeForms', [...(form.upgradeForms || []), upgradeToForm({}, form.upgradeForms?.length || 0)]);
  }

  function removeUpgrade(index) {
    updateField('upgradeForms', (form.upgradeForms || []).filter((_, i) => i !== index));
  }

  return (
    <section className="admin-editor card">
      <EditorTitle unit={unit} label="Editing WIKI" live={!!selectedRow} />
      {previewSrc && <img src={previewSrc} alt="Preview" className="admin-image-preview" />}
      <div className="admin-form-grid">
        <label className="admin-field full">
          <span>Unit Image File</span>
          <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
        </label>
        <AdminInput label="Type" value={form.type} onChange={(value) => updateField('type', value)} />
        <AdminInput label="Raw Type" value={form.rawType} onChange={(value) => updateField('rawType', value)} />
        <AdminInput label="Category" value={form.category} onChange={(value) => updateField('category', value)} />
        <AdminInput label="Placement Limit" value={form.placementLimit} onChange={(value) => updateField('placementLimit', value)} />
        <AdminInput label="Total Cost" value={form.totalCost} onChange={(value) => updateField('totalCost', value)} />
        <AdminInput label="Early-Game Rank" value={form.earlyGameRank} onChange={(value) => updateField('earlyGameRank', value)} type="number" />
        <AdminInput label="Late-Game Rank" value={form.lateGameRank} onChange={(value) => updateField('lateGameRank', value)} type="number" />
        <label className="admin-field full"><span>Description</span><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} /></label>
        <label className="admin-field"><span>Passive</span><textarea value={form.passive} onChange={(event) => updateField('passive', event.target.value)} /></label>
        <label className="admin-field"><span>Ability</span><textarea value={form.ability} onChange={(event) => updateField('ability', event.target.value)} /></label>
        <label className="admin-field"><span>Synergy</span><textarea value={form.synergy} onChange={(event) => updateField('synergy', event.target.value)} /></label>
        <label className="admin-field full"><span>Obtain Methods — one per line</span><textarea value={form.obtainText} onChange={(event) => updateField('obtainText', event.target.value)} /></label>
        <label className="admin-field full"><span>Min / Max Stats — one per line, like Damage: 10 → 50</span><textarea className="admin-code-box" value={form.minMaxStatsText} onChange={(event) => updateField('minMaxStatsText', event.target.value)} /></label>
      </div>

      <div className="admin-level-editor">
        <div className="admin-section-head"><h3>Per-Level Stats</h3><button type="button" onClick={addUpgrade}>+ Add Level</button></div>
        {(form.upgradeForms || []).map((upgrade, index) => (
          <div key={index} className="admin-level-card">
            <div className="admin-level-head">
              <strong>{upgrade.label || `Level ${index + 1}`}</strong>
              <button type="button" onClick={() => removeUpgrade(index)}>Remove</button>
            </div>
            <div className="admin-form-grid compact">
              <AdminInput label="Level Name" value={upgrade.label} onChange={(value) => updateUpgrade(index, 'label', value)} />
              <AdminInput label="Cost" value={upgrade.costRaw} onChange={(value) => updateUpgrade(index, 'costRaw', value)} />
              <AdminInput label="Cooldown" value={upgrade.cooldown} onChange={(value) => updateUpgrade(index, 'cooldown', value)} />
              <AdminInput label="Range" value={upgrade.range} onChange={(value) => updateUpgrade(index, 'range', value)} />
              <AdminInput label="Cost/DPS" value={upgrade.costPerDps} onChange={(value) => updateUpgrade(index, 'costPerDps', value)} />
              <label className="admin-field full"><span>Description</span><textarea value={upgrade.description} onChange={(event) => updateUpgrade(index, 'description', event.target.value)} /></label>
              <label className="admin-field"><span>DPS lines</span><textarea value={upgrade.dpsText} onChange={(event) => updateUpgrade(index, 'dpsText', event.target.value)} placeholder="DPS: 100" /></label>
              <label className="admin-field"><span>Extra stat lines</span><textarea value={upgrade.statsText} onChange={(event) => updateUpgrade(index, 'statsText', event.target.value)} placeholder="Health: 500" /></label>
              <label className="admin-field"><span>Attack stat lines</span><textarea value={upgrade.attacksText} onChange={(event) => updateUpgrade(index, 'attacksText', event.target.value)} placeholder="Melee / Damage: 25" /></label>
            </div>
          </div>
        ))}
      </div>
      <div className="admin-actions">
        <button type="button" className="filled" onClick={saveWiki} disabled={saving}>{saving ? 'Saving…' : 'Save WIKI Override'}</button>
        <button type="button" onClick={resetWiki}>Reset WIKI Data</button>
        <button type="button" onClick={refresh}>Refresh</button>
        <button type="button" onClick={() => navigate('/admin/reset-password')}>Change Password</button>
      </div>
      {message && <div className="admin-message">{message}</div>}
    </section>
  );
}

function AdminLog({ activeTool, valueLog, wikiLog, role }) {
  const log = activeTool === 'values' ? valueLog : wikiLog;
  return (
    <section className="admin-log card">
      <div className="admin-section-head"><h2>{activeTool === 'values' ? 'Global Value Log' : 'Global WIKI Log'}</h2><span>{log.length}</span></div>
      {log.length === 0 ? <p className="admin-muted">No global changes yet.</p> : (
        <div className="admin-log-list">
          {log.map((entry) => (
            <div key={entry.id} className="admin-log-entry">
              <strong>{entry.slug}</strong>
              <span>{new Date(entry.changed_at).toLocaleString()}{role === 'owner' && entry.changed_by_email ? ` · ${entry.changed_by_email}` : ''}</span>
              {activeTool === 'values' ? (
                <p>Value {entry.old_value?.base_value ?? entry.old_value?.baseValue ?? '—'} → {entry.new_value?.base_value ?? '—'} · Demand {entry.old_value?.demand ?? '—'} → {entry.new_value?.demand ?? '—'} · Scarcity {entry.old_value?.scarcity ?? '—'} → {entry.new_value?.scarcity ?? '—'}</p>
              ) : (
                <p>WIKI override updated.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AuthPanel({ title, message, children }) {
  return <section className="admin-auth card"><p className="admin-kicker">APEX Values</p><h1>{title}</h1>{message && <div className="admin-message">{message}</div>}{children}</section>;
}

function AdminInput({ label, value, onChange, type = 'text' }) {
  return <label className="admin-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function AdminSelect({ label, value, onChange, options }) {
  return <label className="admin-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
