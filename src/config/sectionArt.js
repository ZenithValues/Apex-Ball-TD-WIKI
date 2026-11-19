// Render artwork for WIKI section chips, section header panels and portals.
// Supplied by the team (2026-11-18); decorative only — never unit records.
import tartarusball from '../assets/units/provided/tartarusball.png';
import adball from '../assets/units/provided/adball.png';
import geodeball from '../assets/units/provided/geodeball.png';
import richball from '../assets/units/provided/richball.png';
import robosanta from '../assets/units/provided/robosanta.png';
import tangoball from '../assets/units/provided/tangoball.png';
import mafiamonkey from '../assets/units/provided/mafiamonkey.png';
import templeball from '../assets/units/provided/templeball.png';
import angelball from '../assets/units/provided/angelball.png';
import mechaball from '../assets/units/provided/mechaball.png';
import goldenmonkey from '../assets/units/provided/goldenmonkey.png';
import piercer from '../assets/units/provided/piercer.png';
import heartwormball from '../assets/units/provided/heartwormball.png';
import frostangel from '../assets/units/provided/frostangel.png';

export const WIKI_SECTION_ART = Object.freeze({
  artifacts: tartarusball,
  gamepasses: adball,
  materials: geodeball,
  currencies: richball,
  crates: robosanta,
  items: tangoball,
  consumables: tangoball,
  skins: mafiamonkey,
  maps: templeball,
  traits: angelball,
  gears: mechaball,
});

export const WIKI_PORTAL_ART = Object.freeze({
  compare: mechaball,
  search: piercer,
  omega: heartwormball,
  shiny: frostangel,
  value: goldenmonkey,
});

export function sectionArtFor(key) {
  const k = String(key || '').toLowerCase();
  return WIKI_SECTION_ART[k] || null;
}
