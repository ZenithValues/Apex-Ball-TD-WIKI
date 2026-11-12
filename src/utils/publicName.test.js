import { describe, it, expect } from 'vitest';
import { publicDisplayName, updatedByline } from './publicName';

describe('public update byline', () => {
  it('prefers an explicit display name', () => {
    expect(publicDisplayName({ updatedByName: 'JustABacon' })).toBe('JustABacon');
    expect(publicDisplayName({ updated_by_name: 'Moonlight' })).toBe('Moonlight');
    expect(publicDisplayName({ byName: 'Hellfire' })).toBe('Hellfire');
  });

  it('maps a staff email to the public display name and never returns the email', () => {
    const name = publicDisplayName({ updated_by: 'knwasdo@gmail.com' });
    expect(name).toBe('Marshadow');
    expect(name).not.toContain('@');
  });

  it('never leaks an unknown or email-shaped name', () => {
    expect(publicDisplayName({ updated_by: 'someone@example.com' })).toBeNull();
    expect(publicDisplayName({ updatedByName: 'a@b.com' })).toBeNull();
    expect(publicDisplayName(null)).toBeNull();
  });

  it('formats "updated by X | Yh ago" and keeps a safe fallback', () => {
    expect(updatedByline({ updatedByName: 'Marshadow' }, '2026-11-12T00:00:00Z', '3h ago')).toBe('updated by Marshadow | 3h ago');
    expect(updatedByline({}, '2026-11-12T00:00:00Z', '3h ago')).toBe('Updated 3h ago');
    expect(updatedByline({ updatedByName: 'X' }, null, '3h ago')).toBeNull();
  });
});
