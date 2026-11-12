import { useEffect, useState } from 'react';
import { getOCRanks, saveOCRanks } from '../../utils/adminAccounts';
import { refreshOCRanks } from '../../utils/ocRanks';
import './OCRankEditor.css';

// Highest → lowest. A line may contain several comma/slash-separated names:
// those units stay TIED at the same rank, matching the built-in ordering.
const DEFAULTS = [
  ['Shiny Temple'], ['Shiny CorruptMalware'], ['Shiny Zeus'], ['Shiny ShadowBall'],
  ['Shiny ShadowPrince'], ['Shiny Forest', 'Shiny FabledSurfer', 'Shiny GolemBall'],
  ['Shiny OCO'], ['Shiny OMK', 'Shiny Wukong'], ['Shiny Mecha'],
  ['Shiny TFO', 'Shiny TheFrozenOne'], ['Shiny Void'], ['Shiny Nightmare'],
  ['Shiny Puppet'], ['Shiny Showman'], ['Shiny Frutiger'],
];

const asGroups = (list) => (Array.isArray(list) && list.length
  ? list.map((row) => (Array.isArray(row) ? row.filter(Boolean) : [String(row)]))
  : DEFAULTS);

export default function OCRankEditor() {
  const [groups, setGroups] = useState(DEFAULTS);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    getOCRanks().then((list) => setGroups(asGroups(list))).catch(() => setGroups(DEFAULTS));
  }, []);

  function move(index, delta) {
    setGroups((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function remove(index) { setGroups((prev) => prev.filter((_, i) => i !== index)); }
  function add() {
    const names = draft.split(/[,/|]/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
    if (!names.length) return;
    setGroups((prev) => [...prev, names]);
    setDraft('');
  }
  async function save() {
    setBusy(true); setNote('');
    const res = await saveOCRanks(groups);
    setNote(res.ok ? '✓ Ranking saved — live for every visitor.' : (res.error || 'Only the Owner and Hellfire can save this.'));
    if (res.ok) await refreshOCRanks();
    setBusy(false);
  }

  return (
    <section className="oc-rank-editor" aria-label="Shiny O/C ranking">
      <div className="oc-rank-head">
        <div>
          <h3>🏆 Shiny O/C ranking</h3>
          <p>Highest → lowest. Owner + Hellfire only. Comma-separated names share a rank.</p>
        </div>
        <button type="button" className="oc-rank-save" onClick={save} disabled={busy}>{busy ? 'Saving…' : '💾 Save order'}</button>
      </div>
      <ol className="oc-rank-list">
        {groups.map((names, index) => (
          <li key={`${names.join('|')}-${index}`}>
            <span className="oc-rank-num">{index + 1}</span>
            <span className="oc-rank-name">{names.join(' · ')}</span>
            <span className="oc-rank-actions">
              <button type="button" onClick={() => move(index, -1)} aria-label="Move rank up" disabled={index === 0}>↑</button>
              <button type="button" onClick={() => move(index, 1)} aria-label="Move rank down" disabled={index === groups.length - 1}>↓</button>
              <button type="button" className="danger" onClick={() => remove(index)} aria-label="Remove rank">✕</button>
            </span>
          </li>
        ))}
      </ol>
      <div className="oc-rank-add">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a rank — use commas for a tie" aria-label="Add a rank" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add}>Add</button>
        <button type="button" onClick={() => setGroups(DEFAULTS)}>Reset</button>
      </div>
      {note && <p className="oc-rank-note">{note}</p>}
    </section>
  );
}
