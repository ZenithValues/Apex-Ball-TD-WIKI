import { describe, expect, it } from 'vitest';
import { pickFairDefaultSides } from './LandingCalculator';
import { evaluateTrade } from '../utils/calculator';

describe('LandingCalculator fair trade default', () => {
  it('picks a balanced fair trade example from priced units', () => {
    const priced = [
      { slug: 'a', name: 'A', tradeValue: 100_000_000 },
      { slug: 'b', name: 'B', tradeValue: 60_000_000 },
      { slug: 'c', name: 'C', tradeValue: 40_000_000 },
      { slug: 'd', name: 'D', tradeValue: 35_000_000 },
      { slug: 'e', name: 'E', tradeValue: 15_000_000 },
    ];
    const [sideA, sideB] = pickFairDefaultSides(priced);
    const bySlug = new Map(priced.map((u) => [u.slug, u]));
    const res = evaluateTrade(
      sideA.map((s) => ({ tradeValue: bySlug.get(s).tradeValue })),
      sideB.map((s) => ({ tradeValue: bySlug.get(s).tradeValue })),
    );
    expect(sideA.length).toBeGreaterThan(0);
    expect(sideB.length).toBeGreaterThan(0);
    expect(res.outcome).toBe('fair');
  });
});
