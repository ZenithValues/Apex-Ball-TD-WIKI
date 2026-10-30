// UNIT ICONS
// Maps a unit slug (and its shiny variant) to its in-game render image. Only a
// handful of units have real art so far — everything else falls back to a
// simple placeholder rendered in CSS (see UnitIcon.jsx).
import ball from '../assets/units/ball.png';
import shinyBall from '../assets/units/shiny-ball.png';
import eletricball from '../assets/units/eletricball.png';
import shinyEletricball from '../assets/units/shiny-eletricball.png';
import fireball from '../assets/units/fireball.png';
import shinyFireball from '../assets/units/shiny-fireball.png';
import iceball from '../assets/units/iceball.png';
import shinyIceball from '../assets/units/shiny-iceball.png';
import grimreaper from '../assets/units/grimreaper.png';
import ballerArt from '../assets/units/provided/baller.png';
import showmanArt from '../assets/units/provided/showmanball.png';
import omegaKnightArt from '../assets/units/provided/omegaknight-omk.png';
import golemArt from '../assets/units/provided/golemball.png';
import dictatorArt from '../assets/units/provided/dictatorball.png';
import plasmaArt from '../assets/units/provided/plasmaball.png';
import mummyArt from '../assets/units/provided/mummyball.png';
import frutigerArt from '../assets/units/provided/frutigerball.png';
import brainArt from '../assets/units/provided/brainball.png';
import fancyArt from '../assets/units/provided/fancyball.png';
import hephaestusArt from '../assets/units/provided/hephaestusball.png';
import autumnArt from '../assets/units/provided/autumnball.png';
import wukongArt from '../assets/units/provided/wukongball.png';

// User-supplied normal-unit renders. They do not alter the shared database.
export const PROVIDED_UNIT_ICONS = {
  'baller': ballerArt,
  'showmanball': showmanArt,
  'omegaknight-omk': omegaKnightArt,
  'golemball': golemArt,
  'dictatorball': dictatorArt,
  'plasmaball': plasmaArt,
  'mummyball': mummyArt,
  'frutigerball': frutigerArt,
  'brainball': brainArt,
  'fancyball': fancyArt,
  'hephaestusball': hephaestusArt,
  'autumnball': autumnArt,
  'wukongball': wukongArt,
};

export const UNIT_ICONS = {
  ball,
  eletricball,
  fireball,
  iceball,
  grimreaper,
  ...PROVIDED_UNIT_ICONS,
};

export const SHINY_UNIT_ICONS = {
  ball: shinyBall,
  eletricball: shinyEletricball,
  fireball: shinyFireball,
  iceball: shinyIceball,
  grimreaper: grimreaper,
};

export function getUnitIcon(slug, shiny = false) {
  const baseSlug = shiny && slug?.startsWith('shiny-') ? slug.slice('shiny-'.length) : slug;
  const table = shiny ? SHINY_UNIT_ICONS : UNIT_ICONS;
  return table[baseSlug] || (shiny ? PROVIDED_UNIT_ICONS[baseSlug] : null) || null;
}
