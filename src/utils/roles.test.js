import { describe, it, expect } from 'vitest';
import { VALUE_ROLES, WIKI_ROLES, FANART_ROLES, canEditValue, canEditWiki, canEditFanart } from './roles';

// Public entry graph (useAdminStatus, DataContext) must be able to import the
// role gates WITHOUT pulling utils/adminForms and its generated value datasets
// into the initial bundle. See scripts/check-entry-graph.mjs.
describe('utils/roles — entry-safe role gates', () => {
  it('answers the same role questions as adminForms', () => {
    expect(canEditValue('owner')).toBe(true);
    expect(canEditValue('value_editor')).toBe(true);
    expect(canEditValue('viewer')).toBe(false);
    expect(canEditValue(null)).toBe(false);
    expect(canEditWiki('wiki_editor')).toBe(true);
    expect(canEditWiki('value_editor')).toBe(false);
    expect(canEditFanart('fanart_editor')).toBe(true);
    expect(canEditFanart('editor')).toBe(true); // plain editors hold fanart rights
    expect(canEditFanart('wiki_editor')).toBe(false);
    expect(VALUE_ROLES).toContain('editor');
    expect(WIKI_ROLES).toContain('editor');
    expect(FANART_ROLES).toContain('fanart_editor');
  });
});
