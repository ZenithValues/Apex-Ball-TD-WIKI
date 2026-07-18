import { ALL_UNITS } from '../src/data/units.js';
import { wikiRowToForm, valueRowToForm } from '../src/utils/adminForms.js';

console.log('Testing ALL_UNITS length:', ALL_UNITS.length);

let errors = 0;
ALL_UNITS.forEach((unit, i) => {
  try {
    const vf = valueRowToForm(null, unit.slug);
    const wf = wikiRowToForm(null, unit);
  } catch (err) {
    errors++;
    console.error('CRASH on unit index', i, unit?.name, unit?.slug, err.stack);
  }
});

if (errors === 0) {
  console.log('PASSED ALL UNITS cleanly!');
}
