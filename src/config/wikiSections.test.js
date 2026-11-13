import { describe, it, expect } from 'vitest';
import { WIKI_ITEM_SECTIONS, wikiSectionForAdminGroup, wikiSectionByPath } from './wikiSections';

describe('restored WIKI sections', () => {
  it('maps every admin item group to a public page', () => {
    for (const group of ['Gamepass', 'Artifact', 'Key', 'Crate', 'Currency', 'Skin', 'Material', 'Item']) {
      expect(wikiSectionForAdminGroup(group)).toBeTruthy();
    }
  });
  it('has unique paths and a lookup for each one', () => {
    expect(new Set(WIKI_ITEM_SECTIONS.map((s) => s.path)).size).toBe(WIKI_ITEM_SECTIONS.length);
    for (const section of WIKI_ITEM_SECTIONS) expect(wikiSectionByPath(section.path)).toBe(section);
  });
});
