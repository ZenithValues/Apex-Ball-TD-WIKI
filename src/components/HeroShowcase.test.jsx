import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import HeroShowcase from './HeroShowcase';

describe('unit artwork hero', () => {
  it('uses original data artwork, minimal navigation and accessible controls', () => {
    const units = [
      { slug: 'overclockedoverlord-oco', name: 'Overclocked Overlord', imageUrl: '/original-unit.png' },
      { slug: 'shiny-ball', name: 'Ball', imageUrl: '/original-shiny.png', shiny: true },
    ];
    const html = renderToStaticMarkup(<MemoryRouter><HeroShowcase units={units} /></MemoryRouter>);
    expect(html).toContain('src="/original-unit.png"');
    expect(html).toContain('Overclocked Overlord unit artwork');
    expect(html).toContain('aria-label="Next unit"');
    expect(html).toContain('aria-label="Previous unit"');
    expect(html).toContain('aria-label="Pause unit rotation"');
    expect(html).toContain('href="/values"');
    expect(html).toContain('href="/wiki"');
    for (const oldCopy of ['Featured unit', 'A guide to Ball Tower Defense', 'Discover the index', 'Made for the game']) expect(html).not.toContain(oldCopy);
    expect(html).not.toContain('/provided/');
    expect(html).not.toMatch(/<(canvas|video)\b/);
  });
});
