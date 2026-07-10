// ============================================================================
// UNIT ICONS
// ----------------------------------------------------------------------------
// Maps a unit slug (and its shiny variant, prefixed "shiny-") to its in-game
// render image. Only a handful of units have real art so far — everything
// else falls back to a simple placeholder rendered in CSS (see UnitIcon.jsx).
// Add more entries here as art comes in; no other code needs to change.
// ============================================================================
import ball from '../assets/units/ball.png';
import shinyBall from '../assets/units/shiny-ball.png';
import eletricball from '../assets/units/eletricball.png';
import shinyEletricball from '../assets/units/shiny-eletricball.png';
import fireball from '../assets/units/fireball.png';
import shinyFireball from '../assets/units/shiny-fireball.png';
import iceball from '../assets/units/iceball.png';
import shinyIceball from '../assets/units/shiny-iceball.png';

export const UNIT_ICONS = {
  ball,
  eletricball,
  fireball,
  iceball,
};

export const SHINY_UNIT_ICONS = {
  ball: shinyBall,
  eletricball: shinyEletricball,
  fireball: shinyFireball,
  iceball: shinyIceball,
};

export function getUnitIcon(slug, shiny = false) {
  const table = shiny ? SHINY_UNIT_ICONS : UNIT_ICONS;
  return table[slug] || null;
}
