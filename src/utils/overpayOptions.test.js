import { describe, it, expect } from 'vitest';
import { OVERPAY_OPTIONS, UNDERPAY_OPTIONS, OVERPAY_COLORS, UNDERPAY_COLORS } from './overpayOptions';

describe('overpay / underpay controls', () => {
  it('uses the four operator-specified labels', () => {
    expect(OVERPAY_OPTIONS).toEqual(['Easily', 'Yes', 'Rarely', 'No']);
    expect(UNDERPAY_OPTIONS).toEqual(['Often', 'Yes', 'Rarely', 'No']);
  });
  it('gives every option a colour', () => {
    for (const option of OVERPAY_OPTIONS) expect(OVERPAY_COLORS[option]).toMatch(/^#/);
    for (const option of UNDERPAY_OPTIONS) expect(UNDERPAY_COLORS[option]).toMatch(/^#/);
  });
});
