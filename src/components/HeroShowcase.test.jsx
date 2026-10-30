import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import HeroShowcase from './HeroShowcase';

describe('editorial landing showcase', () => {
  it('renders accessible unit controls, real artwork, links and current count without WebGL/video', () => {
    const html = renderToStaticMarkup(<MemoryRouter><HeroShowcase unitCount={174} variantCount={349} /></MemoryRouter>);
    expect(html).toContain('Know the game.');
    expect(html).toContain('349');
    expect(html).toContain('Overclocked Overlord unit artwork');
    expect(html).toContain('aria-label="Next unit"');
    expect(html).toContain('aria-label="Previous unit"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('href="/values"');
    expect(html).toContain('href="/wiki"');
    expect(html).not.toMatch(/<(canvas|video)\b/);
  });
});
