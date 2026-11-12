import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveFormDraft, loadFormDraft, listFormDrafts, clearFormDraft } from './adminSafety';

class FakeStorage {
  constructor() { this.map = new Map(); }
  get length() { return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}

describe('per-slug form drafts', () => {
  beforeEach(() => {
    global.window = { sessionStorage: new FakeStorage(), localStorage: new FakeStorage() };
  });
  afterEach(() => { delete global.window; });

  it('keeps a separate draft for every slug and clears only one', () => {
    saveFormDraft('value', 'unit-a', { baseValue: 1 });
    saveFormDraft('value', 'unit-b', { baseValue: 2 });
    expect(listFormDrafts().map((d) => d.slug).sort()).toEqual(['unit-a', 'unit-b']);
    expect(loadFormDraft('value', 'unit-a').form.baseValue).toBe(1);
    expect(loadFormDraft('value', 'unit-b').form.baseValue).toBe(2);
    clearFormDraft('value', 'unit-a');
    expect(loadFormDraft('value', 'unit-a')).toBeNull();
    expect(loadFormDraft('value', 'unit-b')).not.toBeNull();
  });
});
