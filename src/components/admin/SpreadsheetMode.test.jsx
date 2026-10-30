import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SpreadsheetMode from './SpreadsheetMode';

describe('spreadsheet prefill', () => {
  it('renders the existing numeric values and category controls, including special values', () => {
    const html = renderToStaticMarkup(<SpreadsheetMode canEdit units={[{ slug: 'ball', name: 'Ball', rarity: 'Normie' }]} valueRows={[{ slug: 'ball', baseValue: 1234, baseValueMax: 1500, gems: 'O/C', coins: 55, demand: 'High', scarcity: 'Limited', trend: 'rising', notes: 'Keep' }]} />);
    expect(html).toContain('value="1234"');
    expect(html).toContain('value="1500"');
    expect(html).toContain('value="O/C"');
    expect(html).toContain('value="55"');
    expect(html).toContain('High');
    expect(html).toContain('Limited');
    expect(html.toLowerCase()).toContain('rising');
  });
});
