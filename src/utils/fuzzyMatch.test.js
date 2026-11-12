import { describe, it, expect } from 'vitest';
import { editDistance, fuzzyContains } from './fuzzyMatch';

describe('fuzzy typo matching', () => {
  it('accepts a one-character typo in a longer unit name', () => {
    expect(editDistance('showman', 'showmn')).toBe(1);
    expect(fuzzyContains('Shiny Showman', 'showmn')).toBe(true);
  });
  it('still matches substrings and ignores punctuation', () => {
    expect(fuzzyContains('Shiny Zeus', 'zeus')).toBe(true);
    expect(fuzzyContains('shiny-zeus-ball', 'zeus')).toBe(true);
  });
  it('does not turn unrelated words into a match', () => {
    expect(fuzzyContains('Shiny Temple', 'golem')).toBe(false);
  });
});
