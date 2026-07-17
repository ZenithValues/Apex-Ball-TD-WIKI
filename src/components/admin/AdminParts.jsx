import { useState } from 'react';
import UnitIcon from '../UnitIcon';
import Dropdown from '../Dropdown';
import { DEMAND_LABELS, SCARCITY_LABELS, getRarityGlow, isShinyRarity, UNIT_RARITIES } from '../../data/taxonomy';
import { upgradeToForm } from '../../utils/adminForms';

const TRENDS = ['stable', 'rising', 'falling'];

const RARITY_OPTIONS = [
  { value: 'all', label: 'All units' },
  { value: 'live', label: 'Live overrides' },
  { value: 'custom', label: 'Custom units' },
  ...UNIT_RARITIES.map((rarity) => ({ value: rarity, label: rarity })),
];

export function AuthPanel({ title, message, children }) {
  return (
    <section className="admin-auth card">
      <p className="admin-kicker">APEX Admin Portal</p>
      <h1>{title}</h1>
      {message && <div className="admin-message">{message}</div>}
      {children}
    </section>
  );
}

export function EditorTitle({ unit, label, live, dirty }) {
  const glow = unit?.rarity ? getRarityGlow(unit.rarity) : 'var(--accent)';
  return (
    <div className="admin-editor-head">
      <div className="admin-editor-title">
        {unit && (
          <UnitIcon
            slug={unit.slug}
            name={unit.name}
            glowColor={glow}
            shiny={isShinyRarity(unit.rarity)}
            size={52}
          />
        )}
        <div className="admin-editor-meta">
          <span className="admin-kicker">{label}</span>
          <h2>{unit?.name || 'Select Item'}</h2>
          <span className="admin-sub-meta" style={{ color: glow }}>
            {unit?.rarity || 'Standard'} · {unit?.type || 'Unit'}
          </span>
        </div>
      </div>
      <div className="admin-title-pills">
        {dirty && <div className="admin-dirty-pill">● Unsaved Changes</div>}
        {live && <div className="admin-local-pill">✓ Live Override</div>}
      </div>
    </div>
  );
}

export function UnitPicker({ units, total, query, setQuery, filter, setFilter, selectedUnit, selectUnit, valueRows, wikiRows, mode }) {
  const liveRows = mode === 'values' ? valueRows : wikiRows;
  return (
    <aside className="admin-unit-picker card">
      <div className="admin-section-head">
        <h2>Units</h2>
        <span className="admin-count-badge">{total}</span>
      </div>
      <input
        className="admin-search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search units, rarity, or type…"
      />
      <div className="admin-filter-wrap">
        <Dropdown
          value={filter}
          onChange={setFilter}
          options={RARITY_OPTIONS}
          ariaLabel="Filter units by rarity or status"
        />
      </div>
      <div className="admin-unit-list" data-lenis-prevent>
        {units.map((unit) => {
          const isSelected = unit.slug === selectedUnit?.slug;
          const isLive = liveRows.some((row) => row.slug === unit.slug);
          const glow = getRarityGlow(unit.rarity);

          return (
            <button
              key={unit.slug}
              type="button"
              className={isSelected ? 'admin-unit active' : 'admin-unit'}
              onClick={() => selectUnit(unit.slug)}
            >
              <UnitIcon
                slug={unit.slug}
                name={unit.name}
                glowColor={glow}
                shiny={isShinyRarity(unit.rarity)}
                size={34}
              />
              <span className="admin-unit-text">
                <strong className="unit-name-title">{unit.name}</strong>
                <small className="unit-rarity-sub" style={{ color: glow }}>{unit.rarity}</small>
              </span>
              {isLive && <b className="unit-live-badge">LIVE</b>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function ValueEditor({ unit, form, tradeValue, selectedRow, updateField, saveValue, resetValue, refresh, saving, message, navigate, dirty }) {
  return (
    <section className="admin-editor card">
      <EditorTitle unit={unit} label="Editing Values" live={!!selectedRow} dirty={dirty} />

      <div className="admin-preview-value">
        <span>Computed Trade Value</span>
        <strong>{formatCompactNumber(tradeValue)}</strong>
      </div>

      <div className="admin-form-grid">
        <AdminInput label="Base Value" value={form.baseValue} onChange={(value) => updateField('baseValue', value)} type="number" />
        <AdminInput label="Gems" value={form.gems} onChange={(value) => updateField('gems', value)} type="number" />
        <AdminInput label="Coins" value={form.coins} onChange={(value) => updateField('coins', value)} type="number" />
        <AdminSelect label="Demand" value={form.demand} onChange={(value) => updateField('demand', value)} options={DEMAND_LABELS} />
        <AdminSelect label="Scarcity" value={form.scarcity} onChange={(value) => updateField('scarcity', value)} options={SCARCITY_LABELS} />
        <AdminSelect label="Trend" value={form.trend} onChange={(value) => updateField('trend', value)} options={TRENDS} />
        <label className="admin-field full">
          <span>Notes &amp; Rationale</span>
          <textarea
            className="admin-textarea"
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            placeholder="Reasoning, market evidence, trading observations…"
          />
        </label>
      </div>

      <div className="admin-actions">
        <button type="button" className="filled" onClick={saveValue} disabled={saving}>
          {saving ? 'Saving…' : '💾 Save Global Value'}
        </button>
        <button type="button" onClick={resetValue}>🔄 Reset Value</button>
        <button type="button" onClick={refresh}>⚡ Refresh</button>
      </div>
      {message && <div className="admin-message">{message}</div>}
    </section>
  );
}

export function WikiEditor({ unit, form, selectedRow, updateField, imageFile, setImageFile, saveWiki, resetWiki, deleteCustomUnit, refresh, saving, message, navigate, dirty }) {
  const [dragging, setDragging] = useState(false);
  const previewSrc = imageFile ? URL.createObjectURL(imageFile) : form.imageUrl;

  function acceptImage(file) { if (file?.type?.startsWith('image/')) setImageFile(file); }
  function onDrop(event) { event.preventDefault(); setDragging(false); acceptImage(event.dataTransfer.files?.[0]); }

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
      <EditorTitle unit={unit} label="Editing WIKI" live={!!selectedRow} dirty={dirty} />

      <div className="admin-section-block">
        <h3 className="admin-block-title">Basic Unit Information</h3>
        <div className="admin-form-grid">
          <div
            className={`admin-upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {previewSrc ? (
              <img src={previewSrc} alt="Selected unit preview" className="admin-image-preview" />
            ) : (
              <strong>Drop unit artwork image here</strong>
            )}
            <label className="admin-upload-button">
              📸 Upload Render / Image
              <input type="file" accept="image/*" onChange={(event) => acceptImage(event.target.files?.[0])} />
            </label>
            <span className="admin-upload-meta">Automatic WebP optimization &amp; cloud compression</span>
          </div>

          <AdminInput label="Type" value={form.type} onChange={(value) => updateField('type', value)} />
          <AdminInput label="Raw Type" value={form.rawType} onChange={(value) => updateField('rawType', value)} />
          <AdminInput label="Category" value={form.category} onChange={(value) => updateField('category', value)} />
          <AdminInput label="Placement Limit" value={form.placementLimit} onChange={(value) => updateField('placementLimit', value)} />
          <AdminInput label="Total Cost" value={form.totalCost} onChange={(value) => updateField('totalCost', value)} />
          <AdminInput label="Early-Game Rank" value={form.earlyGameRank} onChange={(value) => updateField('earlyGameRank', value)} type="number" />
          <AdminInput label="Late-Game Rank" value={form.lateGameRank} onChange={(value) => updateField('lateGameRank', value)} type="number" />

          <label className="admin-field full">
            <span>Unit Description</span>
            <textarea className="admin-textarea" value={form.description || ''} onChange={(event) => updateField('description', event.target.value)} />
          </label>

          <label className="admin-field">
            <span>Passive Ability</span>
            <textarea className="admin-textarea" value={form.passive || ''} onChange={(event) => updateField('passive', event.target.value)} />
          </label>

          <label className="admin-field"><span>Active Ability</span><textarea className="admin-textarea" value={form.ability || ''} onChange={(event) => updateField('ability', event.target.value)} /></label>
          <label className="admin-field"><span>Synergy Traits</span><textarea className="admin-textarea" value={form.synergy || ''} onChange={(event) => updateField('synergy', event.target.value)} /></label>

          <label className="admin-field full">
            <span>Obtain Methods (one per line)</span>
            <textarea className="admin-textarea" value={form.obtainText || ''} onChange={(event) => updateField('obtainText', event.target.value)} />
          </label>

          <label className="admin-field full">
            <span>Min / Max Stats (one per line, e.g. Damage: 10 → 50)</span>
            <textarea className="admin-textarea admin-code-box" value={form.minMaxStatsText || ''} onChange={(event) => updateField('minMaxStatsText', event.target.value)} />
          </label>
        </div>
      </div>

      <div className="admin-level-editor">
        <div className="admin-section-head">
          <h3>Per-Level Upgrade Progression</h3>
          <button type="button" className="admin-btn-subtle" onClick={addUpgrade}>+ Add Level</button>
        </div>

        {(form.upgradeForms || []).map((upgrade, index) => (
          <div key={index} className="admin-level-card card">
            <div className="admin-level-head">
              <strong>Level {index}: {upgrade.label || `Upgrade ${index}`}</strong>
              <button type="button" className="admin-btn-danger" onClick={() => removeUpgrade(index)}>Remove Level</button>
            </div>
            <div className="admin-form-grid compact" style={{ marginTop: 12 }}>
              <AdminInput label="Level Name" value={upgrade.label} onChange={(value) => updateUpgrade(index, 'label', value)} />
              <AdminInput label="Upgrade Cost" value={upgrade.costRaw} onChange={(value) => updateUpgrade(index, 'costRaw', value)} />
              <AdminInput label="Attack Cooldown (s)" value={upgrade.cooldown} onChange={(value) => updateUpgrade(index, 'cooldown', value)} />
              <AdminInput label="Attack Range" value={upgrade.range} onChange={(value) => updateUpgrade(index, 'range', value)} />
              <AdminInput label="Cost/DPS" value={upgrade.costPerDps} onChange={(value) => updateUpgrade(index, 'costPerDps', value)} />

              <label className="admin-field full">
                <span>Level Notes &amp; Description</span>
                <textarea className="admin-textarea" value={upgrade.description || ''} onChange={(event) => updateUpgrade(index, 'description', event.target.value)} />
              </label>

              <label className="admin-field"><span>DPS Metrics</span><textarea className="admin-textarea" value={upgrade.dpsText || ''} onChange={(event) => updateUpgrade(index, 'dpsText', event.target.value)} placeholder="DPS: 100" /></label>
              <label className="admin-field"><span>Extra Stat Lines</span><textarea className="admin-textarea" value={upgrade.statsText || ''} onChange={(event) => updateUpgrade(index, 'statsText', event.target.value)} placeholder="Health: 500" /></label>
              <label className="admin-field"><span>Attack Stat Lines</span><textarea className="admin-textarea" value={upgrade.attacksText || ''} onChange={(event) => updateUpgrade(index, 'attacksText', event.target.value)} placeholder="Melee / Damage: 25" /></label>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-actions">
        <button type="button" className="filled" onClick={saveWiki} disabled={saving}>
          {saving ? 'Saving…' : '💾 Save WIKI Override'}
        </button>
        <button type="button" onClick={resetWiki}>🔄 Reset WIKI</button>
        {unit?.customUnit && <button type="button" className="admin-btn-danger" onClick={deleteCustomUnit}>🗑️ Delete Custom Unit</button>}
        <button type="button" onClick={refresh}>⚡ Refresh</button>
      </div>
      {message && <div className="admin-message">{message}</div>}
    </section>
  );
}

export function AdminLog({ activeTool, valueLog, wikiLog, role }) {
  const log = activeTool === 'values' ? valueLog : wikiLog;
  return (
    <section className="admin-log card">
      <div className="admin-section-head">
        <h2>{activeTool === 'values' ? 'Global Value Change History' : 'Global WIKI Change History'}</h2>
        <span className="admin-count-badge">{log.length} Entries</span>
      </div>
      {log.length === 0 ? <p className="admin-muted">No global change logs recorded.</p> : (
        <div className="admin-log-list">
          {log.map((entry) => (
            <div key={entry.id} className="admin-log-entry">
              <div className="admin-log-head">
                <strong>{entry.slug}</strong>
                <span>{new Date(entry.changed_at).toLocaleString()}{role === 'owner' && entry.changed_by_email ? ` · ${entry.changed_by_email}` : ''}</span>
              </div>
              {activeTool === 'values' ? (
                <p className="admin-log-meta">
                  Value {entry.old_value?.base_value ?? entry.old_value?.baseValue ?? '—'} → {entry.new_value?.base_value ?? '—'} · Demand {entry.old_value?.demand ?? '—'} → {entry.new_value?.demand ?? '—'} · Scarcity {entry.old_value?.scarcity ?? '—'} → {entry.new_value?.scarcity ?? '—'}
                </p>
              ) : (
                <p className="admin-log-meta">WIKI parameters updated globally.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function formatCompactNumber(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 ? 1 : 0)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 ? 1 : 0)}K`;
  return n.toLocaleString();
}

export function AdminInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input className="admin-text-input" type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
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

export function ContentEditor({ kind, item, form, setForm, imageFile, setImageFile, onSave, onReset, saving, dirty }) {
  const [dragging, setDragging] = useState(false);
  const mapMode = kind === 'maps';
  const previewSrc = imageFile ? URL.createObjectURL(imageFile) : form.imageUrl;
  const accept = (file) => { if (file?.type?.startsWith('image/')) setImageFile(file); };
  const chances = Object.entries(form.chances || {}).map(([key, value]) => `${key}: ${value}`).join('\n');

  return (
    <section className="admin-editor card">
      <EditorTitle unit={item} label={`Editing ${mapMode ? 'Map' : 'Crate'}`} dirty={dirty} />
      <div className={`admin-upload-zone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); accept(event.dataTransfer.files?.[0]); }}>
        {previewSrc ? <img src={previewSrc} alt="Content preview" className="admin-image-preview" /> : <strong>Drop artwork image here</strong>}
        <label className="admin-upload-button">📸 UPLOAD IMAGE<input type="file" accept="image/*" onChange={(event) => accept(event.target.files?.[0])} /></label>
        <span className="admin-upload-meta">Automatic cloud compression &amp; optimization</span>
      </div>
      <div className="admin-form-grid">
        <AdminInput label="Display Name" value={form.name || ''} onChange={(value) => setForm((p) => ({ ...p, name: value }))} />
        {mapMode ? (
          <>
            <AdminInput label="Difficulty Tier" value={form.difficulty || ''} onChange={(value) => setForm((p) => ({ ...p, difficulty: value }))} />
            <AdminInput label="Unlock Requirement" value={form.unlockRequirement || ''} onChange={(value) => setForm((p) => ({ ...p, unlockRequirement: value }))} />
          </>
        ) : (
          <>
            <AdminInput label="Obtain Source" value={form.obtain || ''} onChange={(value) => setForm((p) => ({ ...p, obtain: value }))} />
            <AdminInput label="Crate Effect" value={form.effect || ''} onChange={(value) => setForm((p) => ({ ...p, effect: value }))} />
            <label className="admin-field full">
              <span>Drop Probabilities (one per line, e.g. Item: 25%)</span>
              <textarea className="admin-textarea" value={chances} onChange={(event) => setForm((p) => ({ ...p, chances: linesToObject(event.target.value) }))} />
            </label>
          </>
        )}
        <label className="admin-field full">
          <span>Description</span>
          <textarea className="admin-textarea" value={form.description || ''} onChange={(event) => setForm((p) => ({ ...p, description: event.target.value }))} />
        </label>
      </div>
      <div className="admin-actions">
        <button type="button" className="filled" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : `💾 Save ${mapMode ? 'Map' : 'Crate'}`}</button>
        <button type="button" onClick={onReset}>🔄 Reset Override</button>
      </div>
    </section>
  );
}
