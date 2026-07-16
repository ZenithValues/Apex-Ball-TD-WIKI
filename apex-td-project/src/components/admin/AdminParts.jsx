import UnitIcon from '../UnitIcon';
import Dropdown from '../Dropdown';
import { DEMAND_LABELS, SCARCITY_LABELS, getRarityGlow, isShinyRarity } from '../../data/taxonomy';
import { upgradeToForm } from '../../utils/adminForms';

const TRENDS = ['stable', 'rising', 'falling'];

export function AuthPanel({ title, message, children }) {
  return (
    <section className="admin-auth card">
      <p className="admin-kicker">APEX Values</p>
      <h1>{title}</h1>
      {message && <div className="admin-message">{message}</div>}
      {children}
    </section>
  );
}

export function EditorTitle({ unit, label, live }) {
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

export function UnitPicker({ units, total, query, setQuery, selectedUnit, selectUnit, valueRows, wikiRows, mode }) {
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

export function ValueEditor({ unit, form, tradeValue, selectedRow, updateField, saveValue, resetValue, refresh, saving, message, navigate }) {
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

export function WikiEditor({ unit, form, selectedRow, updateField, imageFile, setImageFile, saveWiki, resetWiki, deleteCustomUnit, refresh, saving, message, navigate }) {
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
          <span>Unit Render Image File</span>
          <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
          <em className="admin-field-help">This replaces the card/render image everywhere, including WIKI and Values cards.</em>
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
        {unit?.customUnit && <button type="button" className="admin-danger-btn" onClick={deleteCustomUnit}>Delete Custom Unit</button>}
        <button type="button" onClick={refresh}>Refresh</button>
        <button type="button" onClick={() => navigate('/admin/reset-password')}>Change Password</button>
      </div>
      {message && <div className="admin-message">{message}</div>}
    </section>
  );
}

export function AdminLog({ activeTool, valueLog, wikiLog, role }) {
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

export function AdminInput({ label, value, onChange, type = 'text' }) {
  return <label className="admin-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

export function AdminSelect({ label, value, onChange, options }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <Dropdown
        value={value}
        onChange={onChange}
        options={options.map((option) => ({ value: option, label: option }))}
        placeholder="Select…"
        ariaLabel={label}
      />
    </label>
  );
}
