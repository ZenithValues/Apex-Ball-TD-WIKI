import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ALL_UNITS } from '../../data/units';
import staticOverridesJson from '../../data/overrides/staticOverrides.json';
import { ALL_MAPS } from '../../data/maps';
import { CRATES } from '../../data/items';
import { useData } from '../../context/DataContext';
import { useWikiImageOverrides } from '../../hooks/useWikiImageOverrides';
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
  SUPABASE_URL,
} from '../../utils/supabase';
import { removeCachedWikiImage, saveCachedWikiImage, loadCachedWikiImages } from '../../utils/wikiImageCache';
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
import { setLocalValueOverride, setLocalWikiOverride, loadLocalValueOverrides, loadLocalWikiOverrides, loadLocalMapOverrides, setLocalMapOverride, loadLocalCrateOverrides, setLocalCrateOverride } from '../../utils/localOverrides';
import { getDisplayName, TEAM_MEMBERS } from '../../utils/teamMembers';
import Dropdown from '../../components/Dropdown';
import { AdminLog, AuthPanel, ContentEditor, UnitPicker, ValueEditor, WikiEditor } from '../../components/admin/AdminParts';
import CreateUnitPanel from '../../components/admin/CreateUnitPanel';
import ContributionGraph from '../../components/admin/ContributionGraph';
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
  const { customUnits, refresh, refreshWiki, wikiRows: liveWikiRows = [] } = useData();
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
  const [previewMode, setPreviewMode] = useState(true);
  const [valueRows, setValueRows] = useState([]);
  const [valueLog, setValueLog] = useState([]);
  const [wikiRows, setWikiRows] = useState([]);
  const [mapRows, setMapRows] = useState([]);
  const [crateRows, setCrateRows] = useState([]);
  const [wikiLog, setWikiLog] = useState([]);
  const [dataVersion, setDataVersion] = useState(0);
  const units = useMemo(() => [...generatedUnits, ...customUnits], [generatedUnits, customUnits]);
  const allSlugs = useMemo(() => units.map((u) => u.slug), [units]);
  const { imageMap } = useWikiImageOverrides(allSlugs);

  // Robustly build the admin image map merging all sources
  const adminImageMap = useMemo(() => {
    const map = {};
    
    // 1. Cached image overrides (lowest priority)
    try {
      const cache = loadCachedWikiImages() || {};
      Object.entries(cache).forEach(([slug, url]) => {
        if (url) map[slug] = url;
      });
    } catch (e) {
      console.warn('Failed to load cached wiki images in adminImageMap', e);
    }

    // 2. Global context live rows (from useData().wikiRows)
    (Array.isArray(liveWikiRows) ? liveWikiRows : []).forEach((row) => {
      if (row?.slug && (row.image_url || row.imageUrl)) {
        map[row.slug] = row.image_url || row.imageUrl;
      }
    });

    // 3. Local admin fetched rows (from AdminHome state wikiRows)
    (Array.isArray(wikiRows) ? wikiRows : []).forEach((row) => {
      if (row?.slug && (row.image_url || row.imageUrl)) {
        map[row.slug] = row.image_url || row.imageUrl;
      }
    });

    // 4. Local draft overrides (client PRVW - highest priority)
    try {
      const localWiki = loadLocalWikiOverrides() || {};
      Object.entries(localWiki).forEach(([slug, row]) => {
        if (row && (row.image_url || row.imageUrl)) {
          map[slug] = row.image_url || row.imageUrl;
        }
      });
    } catch (e) {
      console.warn('Failed to load local wiki overrides in adminImageMap', e);
    }

    return map;
  }, [liveWikiRows, wikiRows, dataVersion]);

  const unitsWithImages = useMemo(
    () => units.map((u) => ({ ...u, imageUrl: adminImageMap[u.slug] || imageMap[u.slug] || u.imageUrl || u.image_url || null })),
    [units, adminImageMap, imageMap]
  );
  const [selectedSlug, setSelectedSlug] = useState(generatedUnits[0]?.slug || '');
  const [activeTool, setActiveTool] = useState('values');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRarity, setNewUnitRarity] = useState('Normie');
  const [contentSlug, setContentSlug] = useState(ALL_MAPS[0]?.slug || CRATES[0]?.slug || '');
  const [contentForm, setContentForm] = useState({});
  const [contentImageFile, setContentImageFile] = useState(null);
  const [showCreateUnit, setShowCreateUnit] = useState(false);

  const selectedUnit = unitsWithImages.find((unit) => unit.slug === selectedSlug) || unitsWithImages[0];
  const selectedValueRow = useMemo(() => {
    const dbRow = valueRows.find((row) => row.slug === selectedUnit?.slug);
    if (!previewMode || !selectedUnit) return dbRow || null;
    const localOver = loadLocalValueOverrides()[selectedUnit.slug];
    return localOver ? { ...(dbRow || {}), ...localOver, slug: selectedUnit.slug } : (dbRow || null);
  }, [valueRows, selectedUnit, previewMode, dataVersion]);

  const selectedWikiRow = useMemo(() => {
    const dbRow = wikiRows.find((row) => row.slug === selectedUnit?.slug);
    if (!previewMode || !selectedUnit) return dbRow || null;
    const localOver = loadLocalWikiOverrides()[selectedUnit.slug];
    return localOver ? { ...(dbRow || {}), ...localOver, slug: selectedUnit.slug } : (dbRow || null);
  }, [wikiRows, selectedUnit, previewMode, dataVersion]);

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
    const savedEmail = localStorage.getItem('apex-admin-email-v1');
    const savedPasscode = localStorage.getItem('apex-admin-passcode-v1');
    if (savedEmail && savedPasscode) {
      const cleanEmail = savedEmail.trim().toLowerCase();
      const member = TEAM_MEMBERS[cleanEmail];
      if (member) {
        setSession({
          user: {
            id: cleanEmail,
            email: cleanEmail,
          }
        });
        setAdminUser({
          email: cleanEmail,
          role: member.roleKey,
        });
      }
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!session?.user?.email) {
      setAdminUser(null);
      return;
    }
    setAdminLoading(true);
    const cleanEmail = session.user.email.toLowerCase();
    const member = TEAM_MEMBERS[cleanEmail];
    if (member) {
      setAdminUser({
        email: cleanEmail,
        role: member.roleKey,
      });
    } else {
      setAdminUser(null);
    }
    setAdminLoading(false);
  }, [session]);

  const role = adminUser?.role || null;
  const valueAllowed = canEditValue(role);
  const wikiAllowed = canEditWiki(role);
  const anyAllowed = valueAllowed || wikiAllowed;

  useEffect(() => {
    if (valueAllowed) setActiveTool('values');
    else if (wikiAllowed) setActiveTool('wiki');
  }, [valueAllowed, wikiAllowed]);

  async function refreshAdminData({ logsOnly = false } = {}) {
    setDataVersion((v) => v + 1);
    
    const localValues = loadLocalValueOverrides() || {};
    const localWiki = loadLocalWikiOverrides() || {};
    
    const valueMap = {};
    Object.entries(staticOverridesJson?.valueOverrides || {}).forEach(([slug, val]) => {
      valueMap[slug] = {
        slug,
        base_value: val.baseValue,
        demand: val.demand,
        scarcity: val.scarcity,
        gems: val.gems,
        coins: val.coins,
      };
    });
    Object.entries(localValues).forEach(([slug, val]) => {
      valueMap[slug] = {
        slug,
        base_value: val.baseValue,
        demand: val.demand,
        scarcity: val.scarcity,
        gems: val.gems,
        coins: val.coins,
      };
    });

    const wikiMap = {};
    Object.entries(staticOverridesJson?.wikiOverrides || {}).forEach(([slug, wiki]) => {
      wikiMap[slug] = {
        slug,
        name: wiki.name,
        rarity: wiki.rarity,
        image_url: wiki.image_url,
        description: wiki.description,
        type: wiki.type,
        raw_type: wiki.raw_type,
        category: wiki.category,
        placement_limit: wiki.placement_limit,
        total_cost: wiki.total_cost,
        custom_unit: wiki.custom_unit,
        early_game_rank: wiki.early_game_rank,
        late_game_rank: wiki.late_game_rank,
        obtain: wiki.obtain,
        passive: wiki.passive,
        ability: wiki.ability,
        synergy: wiki.synergy,
        min_max_stats: wiki.min_max_stats,
        upgrades: wiki.upgrades,
      };
    });
    Object.entries(localWiki).forEach(([slug, wiki]) => {
      wikiMap[slug] = {
        slug,
        name: wiki.name,
        rarity: wiki.rarity,
        image_url: wiki.image_url,
        description: wiki.description,
        type: wiki.type,
        raw_type: wiki.raw_type,
        category: wiki.category,
        placement_limit: wiki.placement_limit,
        total_cost: wiki.total_cost,
        custom_unit: wiki.custom_unit,
        early_game_rank: wiki.early_game_rank,
        late_game_rank: wiki.late_game_rank,
        obtain: wiki.obtain,
        passive: wiki.passive,
        ability: wiki.ability,
        synergy: wiki.synergy,
        min_max_stats: wiki.min_max_stats,
        upgrades: wiki.upgrades,
      };
    });

    setValueRows(Object.values(valueMap));
    setWikiRows(Object.values(wikiMap));
    return;
  }

  async function pushToCloudflareKV() {
    try {
      const savedEmail = localStorage.getItem('apex-admin-email-v1') || '';
      const savedPasscode = localStorage.getItem('apex-admin-passcode-v1') || '';

      const valOver = loadLocalValueOverrides();
      const wikiOver = loadLocalWikiOverrides();
      const mapOver = loadLocalMapOverrides();
      const crateOver = loadLocalCrateOverrides();
      const bundle = {
        timestamp: new Date().toISOString(),
        valueOverrides: valOver,
        wikiOverrides: wikiOver,
        mapOverrides: mapOver,
        crateOverrides: crateOver,
      };
      
      const response = await fetch(`${SUPABASE_URL}/overrides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Email': savedEmail,
          'X-Admin-Passcode': savedPasscode,
        },
        body: JSON.stringify(bundle),
      });
      
      if (response.ok) {
        setMessage('✓ Saved & Published live to Cloudflare KV database! Updates are active for all players instantly.');
      } else {
        const errData = await response.json().catch(() => ({}));
        setMessage(`⚠️ Saved locally, but cloud publish failed: ${errData.error || 'Server error'}`);
      }
    } catch (e) {
      setMessage(`⚠️ Saved locally, but could not connect to Cloudflare KV database: ${e.message}`);
    }
  }

  function isContentFormDirty(form, row, item, kind) {
    if (!item) return false;
    const isMap = kind === 'maps';
    
    const currentName = form.name ?? '';
    const currentDesc = form.description ?? '';
    const currentImage = form.imageUrl ?? '';
    
    const originalName = row?.name || item.name || '';
    const originalDesc = row?.description || '';
    const originalImage = row?.image_url || (isMap ? item.image : item.imageUrl) || '';
    
    if (isMap) {
      const currentDiff = form.difficulty ?? '';
      const currentUnlock = form.unlockRequirement ?? '';
      
      const originalDiff = row?.difficulty || '';
      const originalUnlock = row?.unlock_requirement || item.unlockRequirement || '';
      
      return currentName !== originalName ||
             currentDesc !== originalDesc ||
             currentImage !== originalImage ||
             currentDiff !== originalDiff ||
             currentUnlock !== originalUnlock;
    } else {
      const currentObtain = form.obtain ?? '';
      const currentEffect = form.effect ?? '';
      const currentChances = JSON.stringify(form.chances || {});
      
      const originalObtain = row?.obtain || '';
      const originalEffect = row?.effect || '';
      const originalChances = JSON.stringify(row?.chances || {});
      
      return currentName !== originalName ||
             currentDesc !== originalDesc ||
             currentImage !== originalImage ||
             currentObtain !== originalObtain ||
             currentEffect !== originalEffect ||
             currentChances !== originalChances;
    }
  }

  useEffect(() => {
    if (anyAllowed) refreshAdminData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyAllowed]);

  useEffect(() => {
    setValueForm(valueRowToForm(selectedValueRow, selectedUnit?.slug));
    setWikiForm(wikiRowToForm(selectedWikiRow, selectedUnit));
    setWikiImageFile(null);
  }, [selectedUnit?.slug, previewMode]);

  useEffect(() => {
    if (!valueDirty) setValueForm(valueRowToForm(selectedValueRow, selectedUnit?.slug));
    if (!wikiDirty && !wikiImageFile) setWikiForm(wikiRowToForm(selectedWikiRow, selectedUnit));
  }, [dataVersion]);

  useEffect(() => {
    if (!selectedContentItem) return;
    setContentForm(activeTool === 'maps' ? { name: selectedContentRow?.name || selectedContentItem.name, description: selectedContentRow?.description || '', difficulty: selectedContentRow?.difficulty || '', unlockRequirement: selectedContentRow?.unlock_requirement || selectedContentItem.unlockRequirement || '', imageUrl: selectedContentRow?.image_url || selectedContentItem.image || '' } : { name: selectedContentRow?.name || selectedContentItem.name, description: selectedContentRow?.description || '', chances: selectedContentRow?.chances || {}, obtain: selectedContentRow?.obtain || '', effect: selectedContentRow?.effect || '', imageUrl: selectedContentRow?.image_url || selectedContentItem.imageUrl || '' });
    setContentImageFile(null);
  }, [activeTool, selectedContentItem, selectedContentRow]);

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = unitsWithImages.filter((unit) => {
      const matchesText = !q || unit.name.toLowerCase().includes(q) || unit.slug.includes(q) || unit.rarity?.toLowerCase().includes(q) || unit.type?.toLowerCase().includes(q);
      const matchesFilter = unitFilter === 'all' || (unitFilter === 'live' ? (activeTool === 'values' ? valueRows : wikiRows).some((row) => row.slug === unit.slug) : unitFilter === 'custom' ? unit.customUnit : unit.rarity === unitFilter);
      return matchesText && matchesFilter;
    });
    const custom = filtered.filter((u) => u.customUnit);
    const regular = filtered.filter((u) => !u.customUnit).slice(0, Math.max(20, 240 - custom.length));
    return [...custom, ...regular];
  }, [query, unitsWithImages, unitFilter, activeTool, valueRows, wikiRows]);

  const tradeValue = computeTradeValue(valueForm.baseValue, valueForm.demand, valueForm.scarcity);

  function selectUnit(unitOrSlug) {
    if (!unitOrSlug) return;
    const targetSlug = typeof unitOrSlug === 'string' ? unitOrSlug : unitOrSlug.slug;
    if (targetSlug) {
      setSelectedSlug(targetSlug);
      setMessage('');
    }
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
    if (!session?.user?.id) {
      setMessage('Session expired. Please log in again.');
      return;
    }
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
      setMessage(`Could not create custom unit: ${errorMessage(error)}`);
      return;
    }
    try {
      await supabase.from('wiki_change_log').insert({ slug, old_value: {}, new_value: payload });
    } catch {
      // ignore log failure
    }
    setNewUnitName('');
    setSelectedSlug(slug);
    setActiveTool('wiki');
    setMessage(`Created custom unit ${name}. Fill in its WIKI data and save.`);
    try {
      await Promise.all([refreshAdminData(), refresh(), refreshWiki()]);
    } catch {
      // ignore
    }
  }

  async function signIn(event) {
    event.preventDefault();
    setAuthMessage('');
    const cleanEmail = email.trim().toLowerCase();
    const member = TEAM_MEMBERS[cleanEmail];
    if (!member) {
      setAuthMessage('⚠️ Email not found on the APEX team roster.');
      return;
    }
    
    setAdminLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, password: password.trim() }),
      });
      
      if (response.ok) {
        localStorage.setItem('apex-admin-email-v1', cleanEmail);
        localStorage.setItem('apex-admin-passcode-v1', password.trim());
        
        const mockSession = {
          user: {
            id: cleanEmail,
            email: cleanEmail,
          }
        };
        setSession(mockSession);
        setAdminUser({
          email: cleanEmail,
          role: member.roleKey,
        });
        setPreviewMode(true);
        setAuthMessage('✓ Authenticated in Serverless Sandbox Editor mode!');
      } else {
        const errData = await response.json().catch(() => ({}));
        setAuthMessage(`⚠️ Login failed: ${errData.error || 'Incorrect password.'}`);
      }
    } catch (e) {
      setAuthMessage(`⚠️ Error: Could not connect to the database: ${e.message}`);
    }
    setAdminLoading(false);
  }

  async function signOut() {
    localStorage.removeItem('apex-admin-email-v1');
    localStorage.removeItem('apex-admin-passcode-v1');
    setSession(null);
    setAdminUser(null);
    setAuthMessage('');
    setValueRows([]);
    setWikiRows([]);
  }

  async function sendPasswordReset() {
    if (!email) {
      setAuthMessage('Type your email first.');
      return;
    }
    setAuthMessage('Sending reset email…');

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
      setAuthMessage('Supabase rate-limited the email. The BUILT-IN sender allows only 2/hour. Wait 1 hour and try once. WORKAROUND: the owner can set any member\'s password directly in Supabase → Authentication → Users → click the user → set password.');
    } else if (isSendFailure) {
      setAuthMessage('Could not send the password-reset email because Supabase reported an email/SMTP gateway failure. Please try again in a few minutes.');
    } else {
      setAuthMessage(`Reset email not sent: ${detail}`);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    setAuthMessage('');
    const cleanEmail = email.trim().toLowerCase();
    const currentPass = password.trim();
    const nextPasscode = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (nextPasscode.length < 6) {
      setAuthMessage('⚠️ New password must be at least 6 characters.');
      return;
    }
    if (nextPasscode !== confirm) {
      setAuthMessage('⚠️ New password and confirmation do not match.');
      return;
    }

    setResetSaving(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, currentPassword: currentPass, newPassword: nextPasscode }),
      });
      
      if (response.ok) {
        localStorage.removeItem('apex-admin-email-v1');
        localStorage.removeItem('apex-admin-passcode-v1');
        setSession(null);
        setAdminUser(null);
        
        setAuthMessage('✅ Password updated successfully! You have been logged out. Please return to the login screen and log in with your new password.');
        setEmail('');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errData = await response.json().catch(() => ({}));
        setAuthMessage(`⚠️ Error: ${errData.error || 'Could not update password.'}`);
      }
    } catch (e) {
      setAuthMessage(`⚠️ Error: Could not connect to the database: ${e.message}`);
    }
    setResetSaving(false);
  }

  async function saveValue() {
    if (!valueAllowed || !selectedUnit) return;
    if (!session?.user?.id) {
      setMessage('Session expired. Please log in again.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const next = normalizeValueForm(valueForm);
      if (previewMode) {
        const payload = {
          slug: selectedUnit.slug,
          base_value: next.baseValue, baseValue: next.baseValue, gems: next.gems, coins: next.coins,
          demand: next.demand, scarcity: next.scarcity, trend: next.trend, notes: next.notes,
          updated_at: new Date().toISOString(), updated_by: 'local-preview', isPrvw: true, prvw: true
        };
        setLocalValueOverride(selectedUnit.slug, payload);
        setMessage('✓ Saved local Client PRVW value override!');
        setValueRows((prev) => {
          const filtered = prev.filter((r) => r.slug !== selectedUnit.slug);
          return [payload, ...filtered];
        });
        try {
          refresh();
        } catch {
          // ignore
        }
        pushToCloudflareKV();
        setSaving(false);
        return;
      }
      const oldValue = selectedValueRow || getFallbackValueData(selectedUnit.slug);
      const payload = {
        slug: selectedUnit.slug, kind: 'unit', base_value: next.baseValue, gems: next.gems, coins: next.coins,
        demand: next.demand, scarcity: next.scarcity, trend: next.trend, notes: next.notes,
        updated_by: session.user.id, updated_at: new Date().toISOString(),
      };
      setLocalValueOverride(selectedUnit.slug, null);
      const { error } = await supabase.from('value_entries').upsert(payload, { onConflict: 'slug' });
      if (error) throw error;
      setValueRows((prev) => {
        const filtered = prev.filter((r) => r.slug !== selectedUnit.slug);
        return [payload, ...filtered];
      });
      setValueForm(valueRowToForm(payload, selectedUnit.slug));
      try {
        await supabase.from('value_change_log').insert({ slug: selectedUnit.slug, kind: 'unit', old_value: oldValue, new_value: payload });
      } catch {
        // ignore log failure
      }
      setMessage('Saved value globally. Values pages and calculator will sync automatically.');
      try {
        await refreshAdminData({ logsOnly: true });
      } catch {
        // ignore
      }
    } catch (error) {
      setMessage(`Save failed: ${errorMessage(error)}`);
    }
    setSaving(false);
  }

  async function resetValue() {
    if (!valueAllowed || !selectedUnit) return;
    if (previewMode) {
      setLocalValueOverride(selectedUnit.slug, null);
      setMessage(`✓ Removed local Client PRVW value override for ${selectedUnit.name}! Restored live/fallback value.`);
      setValueRows((prev) => [...prev]);
      try {
        await refresh();
        await refreshAdminData();
      } catch {
        // ignore
      }
      return;
    }
    setLocalValueOverride(selectedUnit.slug, null);
    const { error } = await supabase.from('value_entries').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Reset failed: ${errorMessage(error)}`);
    else {
      setMessage('Live value override removed; fallback generated value restored.');
      try {
        await refreshAdminData({ logsOnly: true });
      } catch {
        // ignore
      }
    }
  }

  async function saveWiki() {
    if (!wikiAllowed || !selectedUnit) return;
    if (!session?.user?.id) {
      setMessage('Session expired. Please log in again.');
      return;
    }
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
      if (previewMode) {
        const payload = {
          slug: selectedUnit.slug,
          name: wikiForm.name || selectedUnit.name, description: wikiForm.description, type: wikiForm.type,
          raw_type: wikiForm.rawType, category: wikiForm.category, placement_limit: wikiForm.placementLimit,
          total_cost: wikiForm.totalCost, early_game_rank: wikiForm.earlyGameRank || null, late_game_rank: wikiForm.lateGameRank || null,
          passive: wikiForm.passive, ability: wikiForm.ability, synergy: wikiForm.synergy,
          obtain, min_max_stats: minMaxStats, upgrades, image_url: imageUrl, updated_at: new Date().toISOString(),
          isPrvw: true, prvw: true
        };
        setLocalWikiOverride(selectedUnit.slug, payload);
        setMessage('✓ Saved local Client PRVW wiki override!');
        setWikiRows((prev) => {
          const filtered = prev.filter((r) => r.slug !== selectedUnit.slug);
          return [payload, ...filtered];
        });
        try {
          refreshWiki();
        } catch {
          // ignore
        }
        pushToCloudflareKV();
        setSaving(false);
        return;
      }
      setLocalWikiOverride(selectedUnit.slug, null);
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
      setWikiRows((prev) => {
        const filtered = prev.filter((r) => r.slug !== selectedUnit.slug);
        return [payload, ...filtered];
      });
      setWikiForm(wikiRowToForm(payload, selectedUnit));
      try {
        await supabase.from('wiki_change_log').insert({ slug: selectedUnit.slug, old_value: selectedWikiRow || {}, new_value: payload });
      } catch {
        // ignore log failure
      }
      if (imageUrl) saveCachedWikiImage(selectedUnit.slug, imageUrl);
      setMessage('Saved WIKI override globally. Unit cards/details will use the uploaded render.');
      try {
        await refreshAdminData({ logsOnly: true });
      } catch {
        // ignore
      }
    } catch (error) {
      setMessage(`Wiki save failed: ${errorMessage(error)}`);
    }
    setSaving(false);
  }

  async function saveContent() {
    if (!wikiAllowed || !selectedContentItem) return;
    if (!session?.user?.id) {
      setMessage('Session expired. Please log in again.');
      return;
    }
    setSaving(true); setMessage('');
    try {
      const mapsMode = activeTool === 'maps';
      const imageUrl = contentImageFile ? await uploadContentImage(contentImageFile, mapsMode ? 'maps' : 'crates', selectedContentItem.slug, session) : (contentForm.imageUrl || null);
      const payload = mapsMode ? { slug: selectedContentItem.slug, name: contentForm.name, description: contentForm.description || null, difficulty: contentForm.difficulty || null, unlock_requirement: contentForm.unlockRequirement || null, image_url: imageUrl, updated_by: session.user.id, updated_at: new Date().toISOString() } : { slug: selectedContentItem.slug, name: contentForm.name, description: contentForm.description || null, image_url: imageUrl, chances: contentForm.chances || {}, obtain: contentForm.obtain || null, effect: contentForm.effect || null, updated_by: session.user.id, updated_at: new Date().toISOString() };
      
      if (previewMode) {
        if (mapsMode) {
          setLocalMapOverride(selectedContentItem.slug, payload);
          setMapRows((prev) => {
            const filtered = prev.filter((r) => r.slug !== selectedContentItem.slug);
            return [payload, ...filtered];
          });
        } else {
          setLocalCrateOverride(selectedContentItem.slug, payload);
          setCrateRows((prev) => {
            const filtered = prev.filter((r) => r.slug !== selectedContentItem.slug);
            return [payload, ...filtered];
          });
        }
        setMessage(`Saved ${mapsMode ? 'map' : 'crate'} locally.`);
        pushToCloudflareKV();
        setSaving(false);
        return;
      }

      const { error } = await supabase.from(mapsMode ? 'map_wiki_overrides' : 'crate_wiki_overrides').upsert(payload, { onConflict: 'slug' });
      if (error) throw error;
      const setRows = mapsMode ? setMapRows : setCrateRows;
      setRows((prev) => {
        const filtered = prev.filter((r) => r.slug !== selectedContentItem.slug);
        return [payload, ...filtered];
      });
      setMessage(`Saved ${mapsMode ? 'map' : 'crate'} globally.`);
      try {
        await refreshAdminData({ logsOnly: true });
      } catch {
        // ignore
      }
    } catch (error) { setMessage(`Content save failed: ${errorMessage(error)}`); }
    setSaving(false);
  }

  async function resetContent() {
    if (!selectedContentItem) return;
    const mapsMode = activeTool === 'maps';
    if (previewMode) {
      if (mapsMode) {
        setLocalMapOverride(selectedContentItem.slug, null);
        setMapRows((prev) => prev.filter((r) => r.slug !== selectedContentItem.slug));
      } else {
        setLocalCrateOverride(selectedContentItem.slug, null);
        setCrateRows((prev) => prev.filter((r) => r.slug !== selectedContentItem.slug));
      }
      setMessage('Content override removed; default data restored.');
      pushToCloudflareKV();
      return;
    }

    const { error } = await supabase.from(activeTool === 'maps' ? 'map_wiki_overrides' : 'crate_wiki_overrides').delete().eq('slug', selectedContentItem.slug);
    setMessage(error ? `Reset failed: ${errorMessage(error)}` : 'Content override removed; default data restored.');
    if (!error) {
      try {
        await refreshAdminData({ logsOnly: true });
      } catch {
        // ignore
      }
    }
  }

  async function resetWiki() {
    if (!wikiAllowed || !selectedUnit) return;
    if (previewMode) {
      setLocalWikiOverride(selectedUnit.slug, null);
      setMessage(`✓ Removed local Client PRVW wiki override for ${selectedUnit.name}!`);
      setWikiRows((prev) => [...prev]);
      try {
        await refreshAdminData({ logsOnly: true });
      } catch {
        // ignore
      }
      return;
    }
    setLocalWikiOverride(selectedUnit.slug, null);
    const { error } = await supabase.from('unit_wiki_overrides').delete().eq('slug', selectedUnit.slug);
    if (error) setMessage(`Wiki reset failed: ${errorMessage(error)}`);
    else {
      removeCachedWikiImage(selectedUnit.slug);
      try {
        await removeUnitImages(selectedUnit.slug);
      } catch {
        // ignore
      }
      setMessage('WIKI override removed; generated stat-sheet data restored.');
      try {
        await refreshAdminData({ logsOnly: true });
      } catch {
        // ignore
      }
    }
  }

  async function deleteCustomUnit() {
    if (!wikiAllowed || !selectedUnit?.customUnit) return;
    if (!window.confirm(`Delete custom unit "${selectedUnit.name}"? This permanently removes it from the WIKI and Values everywhere.`)) return;
    const slug = selectedUnit.slug;
    const name = selectedUnit.name;
    if (previewMode) {
      setLocalWikiOverride(slug, null);
      setLocalValueOverride(slug, null);
      setMessage(`✓ Deleted local Client PRVW custom unit "${name}"!`);
      setWikiRows((prev) => [...prev]);
      setValueRows((prev) => [...prev]);
      try {
        await refreshAdminData({ logsOnly: true });
      } catch {
        // ignore
      }
      pushToCloudflareKV();
      return;
    }
    setLocalWikiOverride(slug, null);
    setLocalValueOverride(slug, null);
    await supabase.from('unit_wiki_overrides').delete().eq('slug', slug);
    await supabase.from('value_entries').delete().eq('slug', slug);
    try {
      await removeUnitImages(slug);
    } catch {
      // ignore
    }
    removeCachedWikiImage(slug);
    try {
      await supabase.from('wiki_change_log').insert({ slug, old_value: { deleted: true }, new_value: {} });
    } catch {
      // ignore
    }
    setMessage(`Deleted custom unit ${name}.`);
    setSelectedSlug(generatedUnits[0]?.slug || '');
    try {
      await refreshAdminData({ logsOnly: true });
    } catch {
      // ignore
    }
  }

  function clearAllLocalOverrides() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('apex-local-value-overrides-v1');
      localStorage.removeItem('apex-local-wiki-overrides-v1');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex-values-updated'));
      window.dispatchEvent(new CustomEvent('apex-wiki-updated'));
    }
    setValueRows((prev) => [...prev]);
    setWikiRows((prev) => [...prev]);
    try {
      refreshAdminData({ logsOnly: true });
    } catch {
      // ignore
    }
    setMessage('🗑️ Cleared all local PRVW overrides across the entire site! All items restored to clean live fallback/Supabase data.');
  }

  function exportStaticOverridesBundle() {
    const valOver = loadLocalValueOverrides();
    const wikiOver = loadLocalWikiOverrides();
    const bundle = {
      timestamp: new Date().toISOString(),
      valueOverrides: valOver,
      wikiOverrides: wikiOver,
    };
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staticOverrides.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('📦 Exported staticOverrides.json! Place this file into src/data/overrides/staticOverrides.json and double-click push.cmd to publish all local edits live!');
  }

  async function migrateFromOldSupabase() {
    if (!window.confirm('Restore all historical edits and copy all value_entries and unit_wiki_overrides from your old project rfeoicbcprziqlcmbjgi into your new atcdrypwompjzsxyaohu database right now?')) return;
    setSaving(true);
    setMessage('⏳ Connecting to old project rfeoicbcprziqlcmbjgi and downloading all historical values and WIKI overrides...');
    try {
      const oldUrl = 'https://rfeoicbcprziqlcmbjgi.supabase.co';
      const oldKey = 'sb_publishable_PPGNsXC7Uc-Sr8m4Z_DaRQ_AZxl36bg';
      const [oldVals, oldWikis, oldMaps, oldCrates] = await Promise.all([
        fetch(`${oldUrl}/rest/v1/value_entries?select=*`, { headers: { apikey: oldKey, Authorization: `Bearer ${oldKey}` } }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${oldUrl}/rest/v1/unit_wiki_overrides?select=*`, { headers: { apikey: oldKey, Authorization: `Bearer ${oldKey}` } }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${oldUrl}/rest/v1/map_wiki_overrides?select=*`, { headers: { apikey: oldKey, Authorization: `Bearer ${oldKey}` } }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch(`${oldUrl}/rest/v1/crate_wiki_overrides?select=*`, { headers: { apikey: oldKey, Authorization: `Bearer ${oldKey}` } }).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      const currentUserId = session?.user?.id || null;
      const cleanVals = Array.isArray(oldVals) ? oldVals.map((r) => {
        const { id, ...rest } = r;
        return { ...rest, updated_by: currentUserId };
      }) : [];
      const cleanWikis = Array.isArray(oldWikis) ? oldWikis.map((r) => {
        const { id, ...rest } = r;
        return { ...rest, updated_by: currentUserId };
      }) : [];
      const cleanMaps = Array.isArray(oldMaps) ? oldMaps.map((r) => {
        const { id, ...rest } = r;
        return { ...rest };
      }) : [];
      const cleanCrates = Array.isArray(oldCrates) ? oldCrates.map((r) => {
        const { id, ...rest } = r;
        return { ...rest };
      }) : [];

      let restoredCount = 0;
      if (cleanVals.length > 0) {
        const { error: valErr } = await supabase.from('value_entries').upsert(cleanVals, { onConflict: 'slug' });
        if (valErr) throw new Error(`Value entries insert failed: ${valErr.message}`);
        restoredCount += cleanVals.length;
      }
      if (cleanWikis.length > 0) {
        const { error: wikiErr } = await supabase.from('unit_wiki_overrides').upsert(cleanWikis, { onConflict: 'slug' });
        if (wikiErr) throw new Error(`WIKI overrides insert failed: ${wikiErr.message}`);
        restoredCount += cleanWikis.length;
      }
      if (cleanMaps.length > 0) {
        await supabase.from('map_wiki_overrides').upsert(cleanMaps, { onConflict: 'slug' });
      }
      if (cleanCrates.length > 0) {
        await supabase.from('crate_wiki_overrides').upsert(cleanCrates, { onConflict: 'slug' });
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('apex-local-value-overrides-v1');
        localStorage.removeItem('apex-local-wiki-overrides-v1');
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apex-values-updated'));
        window.dispatchEvent(new CustomEvent('apex-wiki-updated'));
      }

      if (restoredCount === 0) {
        setMessage('⚠️ Could not fetch directly from old cloud due to 429 rate limit. Use Method 2 (Table Editor CSV/JSON export) if old cloud rejects REST queries.');
      } else {
        setMessage(`✅ SUCCESS! Migrated and restored ${cleanVals.length} unit values and ${cleanWikis.length} WIKI sheets globally right into atcdrypwompjzsxyaohu!`);
        setDataVersion((v) => v + 1);
        try {
          await Promise.all([refreshAdminData(), refresh({ force: true }), refreshWiki({ force: true }), refreshContent({ force: true })]);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      setMessage(`Migration error: ${errorMessage(e)}`);
    }
    setSaving(false);
  }

  if (authLoading) return <main className="admin-page"><div className="admin-editor card">Loading admin…</div></main>;

  if (resetMode) {
    return (
      <main className="admin-page">
        <AuthPanel title="Change Personal Password" message={authMessage}>
          <form className="admin-auth-form" onSubmit={updatePassword}>
            <p className="admin-muted">Change your personal admin password dynamically. Initial default password is "apex2026".</p>
            <label>Your Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="editor@email.com" required />
            <label>Current Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Current Password…" required />
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password…" minLength={6} required />
            <label>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password…" minLength={6} required />
            <button type="submit" className="filled" disabled={resetSaving}>{resetSaving ? 'Updating…' : 'Update Password'}</button>
            <button type="button" onClick={() => { setEmail(''); setPassword(''); navigate('/admin'); }} disabled={resetSaving}>Back to Login</button>
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
            <label>Personal Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password…" />
            <button type="submit" className="filled">Login</button>
            <button type="button" onClick={() => { setAuthMessage(''); setEmail(''); setPassword(''); navigate('/admin/reset-password'); }}>🔒 Change Personal Password</button>
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

  function toggleAdminPanel() {
    setShowAdminPanel((current) => { const next = !current; localStorage.setItem('apex-admin-panel', next ? 'on' : 'off'); return next; });
  }

  return (
    <main className="admin-page">
      <motion.section className="admin-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="admin-kicker">Secure Admin</p>
        <h1>APEX Admin</h1>
        <p>Logged in as <strong>{getDisplayName(session?.user?.email, true)}</strong> · Role: <strong>{role}</strong></p>
        <div className="admin-hero-actions">
          <button type="button" className="admin-denied-button" onClick={() => navigate('/admin/reset-password')}>Change Passcode</button>
          <button type="button" className="admin-denied-button" onClick={signOut}>Logout</button>
        </div>
      </motion.section>

      {role === 'owner' && <ContributionGraph valueLogs={valueLog} wikiLogs={wikiLog} />}

      <div className="admin-panel-slide-row" style={{ marginTop: 20 }}>
        <span className="admin-panel-slide-title">🛠️ APEX Serverless Local Sandbox Editor</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginLeft: 16 }}>
          {wikiAllowed && (
            <button type="button" className="admin-denied-button" style={{ borderColor: 'var(--success, #00ff91)', color: 'var(--success, #00ff91)', fontWeight: 900 }} onClick={() => setShowCreateUnit(!showCreateUnit)}>
              ✨ {showCreateUnit ? 'Close Create Panel' : '+ Create New Custom Unit'}
            </button>
          )}
          <button type="button" className="admin-denied-button" style={{ borderColor: 'var(--accent, #4d9dff)', color: 'var(--text, #ffffff)' }} onClick={exportStaticOverridesBundle}>
            📦 Export Static Overrides JSON
          </button>
          <button type="button" className="admin-denied-button" style={{ borderColor: 'var(--danger, #ff4d4d)', color: 'var(--danger, #ff4d4d)' }} onClick={clearAllLocalOverrides}>
            🗑️ Clear All PRVW Overrides
          </button>
        </div>
      </div>

      {showCreateUnit && (
        <CreateUnitPanel
          session={session}
          supabase={supabase}
          previewMode={previewMode}
          setLocalWikiOverride={setLocalWikiOverride}
          setLocalValueOverride={setLocalValueOverride}
          onCreated={(slug, name) => {
            setShowCreateUnit(false);
            setSelectedSlug(slug);
            setActiveTool('wiki');
            setMessage(`Created custom unit "${name}"! Fill in its WIKI stat sheet below.`);
            refreshAdminData().then(() => {
              pushToCloudflareKV();
            });
          }}
          onClose={() => setShowCreateUnit(false)}
        />
      )}

      <div className="admin-tabs">
        {valueAllowed && <button type="button" className={activeTool === 'values' ? 'active' : ''} onClick={() => { setActiveTool('values'); setMessage(''); }}>Values Editor</button>}
        {wikiAllowed && <button type="button" className={activeTool === 'wiki' ? 'active' : ''} onClick={() => { setActiveTool('wiki'); setMessage(''); }}>WIKI Editor</button>}
        {(role === 'owner' || role === 'admin') && <button type="button" className={activeTool === 'bugReports' ? 'active' : ''} onClick={() => { setActiveTool('bugReports'); setMessage(''); }}>Bug Reports</button>}
        {wikiAllowed && <button type="button" className={activeTool === 'maps' ? 'active' : ''} onClick={() => { setActiveTool('maps'); setMessage(''); }}>Maps</button>}
        {wikiAllowed && <button type="button" className={activeTool === 'crates' ? 'active' : ''} onClick={() => { setActiveTool('crates'); setMessage(''); }}>Crates</button>}
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
      ) : activeTool === 'maps' || activeTool === 'crates' ? (
        <section className="admin-content-layout"><aside className="admin-unit-picker card"><div className="admin-section-head"><h2>{activeTool === 'maps' ? 'Maps' : 'Crates'}</h2><span>{contentItems.length}</span></div><input className="admin-search" placeholder={`Search ${activeTool}…`} onChange={(e) => { const q = e.target.value.toLowerCase(); setContentSlug(contentItems.find((item) => item.name.toLowerCase().includes(q))?.slug || contentItems[0]?.slug); }} /><div className="admin-unit-list">{contentItems.map((item) => <button type="button" key={item.slug} className={item.slug === selectedContentItem?.slug ? 'admin-unit active' : 'admin-unit'} onClick={() => setContentSlug(item.slug)}><span className="admin-unit-text"><strong>{item.name}</strong><small>{item.slug}</small></span></button>)}</div></aside><ContentEditor kind={activeTool} item={selectedContentItem} form={contentForm} setForm={setContentForm} imageFile={contentImageFile} setImageFile={setContentImageFile} onSave={saveContent} onReset={resetContent} saving={saving} dirty={!!contentImageFile || isContentFormDirty(contentForm, selectedContentRow, selectedContentItem, activeTool)} /></section>
      ) : activeTool !== 'bugReports' && (
        <section className="admin-layout">
          <UnitPicker
            units={filteredUnits} total={units.length} query={query} setQuery={setQuery} filter={unitFilter} setFilter={setUnitFilter}
            selectedUnit={selectedUnit} selectUnit={selectUnit} valueRows={valueRows} wikiRows={wikiRows} mode={activeTool}
            imageMap={adminImageMap}
          />
          {activeTool === 'values' ? (
            <ValueEditor
              unit={selectedUnit} form={valueForm} tradeValue={tradeValue} selectedRow={selectedValueRow}
              updateField={updateValueField} saveValue={saveValue} resetValue={resetValue} refresh={refreshAdminData}
              saving={saving} message={message} navigate={navigate} dirty={valueDirty}
              imageMap={adminImageMap} wikiRows={wikiRows}
            />
          ) : (
            <WikiEditor
              unit={selectedUnit} form={wikiForm} selectedRow={selectedWikiRow} updateField={updateWikiField}
              imageFile={wikiImageFile} setImageFile={setWikiImageFile} saveWiki={saveWiki} resetWiki={resetWiki}
              deleteCustomUnit={deleteCustomUnit} refresh={refreshAdminData} saving={saving} message={message} navigate={navigate} dirty={wikiDirty}
              imageMap={adminImageMap} wikiRows={wikiRows}
            />
          )}
        </section>
      )}

      <AdminLog activeTool={activeTool} valueLog={valueLog} wikiLog={wikiLog} role={role} />
      {wikiAllowed && (
        <div className="admin-control-dock" aria-label="Admin panel controls">
          <span className="admin-control-label">Maps</span><button type="button" className={`admin-switch-btn ${activeTool === 'maps' ? 'on' : ''}`} onClick={() => setActiveTool('maps')} aria-label="Open maps editor"><i /></button><span className="admin-control-label">Crates</span><button type="button" className={`admin-switch-btn ${activeTool === 'crates' ? 'on' : ''}`} onClick={() => setActiveTool('crates')} aria-label="Open crates editor"><i /></button>
        </div>
      )}
    </main>
  );
}
