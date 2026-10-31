import { describe, expect, it } from 'vitest';
import { motionIsAllowed } from './motionPreference';

describe('motion preferences', () => {
  it('allows default and legacy nonzero speed values', () => {
    expect(motionIsAllowed()).toBe(true);
    expect(motionIsAllowed({ animSpeed: 'normal' })).toBe(true);
    expect(motionIsAllowed({ animSpeed: 'slow' })).toBe(true);
  });

  it('honors OS reduction, the site reduction option, and animation off', () => {
    expect(motionIsAllowed({}, true)).toBe(false);
    expect(motionIsAllowed({ reducedMotion: true })).toBe(false);
    expect(motionIsAllowed({ animSpeed: 0 })).toBe(false);
    expect(motionIsAllowed({ animSpeed: 'none' })).toBe(false);
  });
});
