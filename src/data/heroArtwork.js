// Website decoration only. These are the 34 character images supplied by the
// team; they never change a unit's Wiki/Values image or its shiny variant.
// The PNGs are the portable/picture-fallback source, the WebP files are the
// lossless-fidelity desktop presentation copies. Both sets are self-hosted.
import wukong from '../assets/units/provided/wukongball.png';
import brainball from '../assets/units/provided/brainball.png';
import fancyball from '../assets/units/provided/fancyball.png';
import hephaestus from '../assets/units/provided/hephaestusball.png';
import autumn from '../assets/units/provided/autumnball.png';
import baller from '../assets/units/provided/baller.png';
import showman from '../assets/units/provided/showmanball.png';
import omegaKnight from '../assets/units/provided/omegaknight-omk.png';
import golem from '../assets/units/provided/golemball.png';
import dictator from '../assets/units/provided/dictatorball.png';
import plasma from '../assets/units/provided/plasmaball.png';
import mummy from '../assets/units/provided/mummyball.png';
import frutiger from '../assets/units/provided/frutigerball.png';
import kingBall from '../assets/units/provided/kingball.png';
import laserMiniGunner from '../assets/units/provided/laserminigunner.png';
import partyMan from '../assets/units/provided/partyman.png';
import elfCommander from '../assets/units/provided/elfcommander.png';
import overclockedOverlord from '../assets/units/provided/overclockedoverlord.png';
import hackerBall from '../assets/units/provided/hackerball.png';
import forestBall from '../assets/units/provided/forestball.png';

import wukongDesktop from '../assets/units/hero-desktop/wukongball.webp';
import brainballDesktop from '../assets/units/hero-desktop/brainball.webp';
import fancyballDesktop from '../assets/units/hero-desktop/fancyball.webp';
import hephaestusDesktop from '../assets/units/hero-desktop/hephaestusball.webp';
import autumnDesktop from '../assets/units/hero-desktop/autumnball.webp';
import ballerDesktop from '../assets/units/hero-desktop/baller.webp';
import showmanDesktop from '../assets/units/hero-desktop/showmanball.webp';
import omegaKnightDesktop from '../assets/units/hero-desktop/omegaknight-omk.webp';
import golemDesktop from '../assets/units/hero-desktop/golemball.webp';
import dictatorDesktop from '../assets/units/hero-desktop/dictatorball.webp';
import plasmaDesktop from '../assets/units/hero-desktop/plasmaball.webp';
import mummyDesktop from '../assets/units/hero-desktop/mummyball.webp';
import frutigerDesktop from '../assets/units/hero-desktop/frutigerball.webp';
import kingBallDesktop from '../assets/units/hero-desktop/kingball.webp';
import laserMiniGunnerDesktop from '../assets/units/hero-desktop/laserminigunner.webp';
import partyManDesktop from '../assets/units/hero-desktop/partyman.webp';
import elfCommanderDesktop from '../assets/units/hero-desktop/elfcommander.webp';
import overclockedOverlordDesktop from '../assets/units/hero-desktop/overclockedoverlord.webp';
import hackerBallDesktop from '../assets/units/hero-desktop/hackerball.webp';
import forestBallDesktop from '../assets/units/hero-desktop/forestball.webp';

import goldenMonkey from '../assets/units/provided/goldenmonkey.png';
import richBall from '../assets/units/provided/richball.png';
import mechaBall from '../assets/units/provided/mechaball.png';
import adBall from '../assets/units/provided/adball.png';
import angelBall from '../assets/units/provided/angelball.png';
import templeBall from '../assets/units/provided/templeball.png';
import piercer from '../assets/units/provided/piercer.png';
import geodeBall from '../assets/units/provided/geodeball.png';
import heartwormBall from '../assets/units/provided/heartwormball.png';
import robosanta from '../assets/units/provided/robosanta.png';
import tartarusBall from '../assets/units/provided/tartarusball.png';
import frostAngel from '../assets/units/provided/frostangel.png';
import tangoBall from '../assets/units/provided/tangoball.png';
import mafiaMonkey from '../assets/units/provided/mafiamonkey.png';

import goldenMonkeyDesktop from '../assets/units/hero-desktop/goldenmonkey.webp';
import richBallDesktop from '../assets/units/hero-desktop/richball.webp';
import mechaBallDesktop from '../assets/units/hero-desktop/mechaball.webp';
import adBallDesktop from '../assets/units/hero-desktop/adball.webp';
import angelBallDesktop from '../assets/units/hero-desktop/angelball.webp';
import templeBallDesktop from '../assets/units/hero-desktop/templeball.webp';
import piercerDesktop from '../assets/units/hero-desktop/piercer.webp';
import geodeBallDesktop from '../assets/units/hero-desktop/geodeball.webp';
import heartwormBallDesktop from '../assets/units/hero-desktop/heartwormball.webp';
import robosantaDesktop from '../assets/units/hero-desktop/robosanta.webp';
import tartarusBallDesktop from '../assets/units/hero-desktop/tartarusball.webp';
import frostAngelDesktop from '../assets/units/hero-desktop/frostangel.webp';
import tangoBallDesktop from '../assets/units/hero-desktop/tangoball.webp';
import mafiaMonkeyDesktop from '../assets/units/hero-desktop/mafiamonkey.webp';

export const HERO_ARTWORK = Object.freeze([
  { slug: 'wukong', name: 'Wukong', image: wukong, desktopImage: wukongDesktop },
  { slug: 'brainball', name: 'Brain Ball', image: brainball, desktopImage: brainballDesktop },
  { slug: 'fancyball', name: 'Fancy Ball', image: fancyball, desktopImage: fancyballDesktop },
  { slug: 'hephaestus', name: 'Hephaestus', image: hephaestus, desktopImage: hephaestusDesktop },
  { slug: 'autumn', name: 'Autumn', image: autumn, desktopImage: autumnDesktop },
  { slug: 'baller', name: 'Baller', image: baller, desktopImage: ballerDesktop },
  { slug: 'showman', name: 'Showman', image: showman, desktopImage: showmanDesktop },
  { slug: 'omega-knight', name: 'Omega Knight', image: omegaKnight, desktopImage: omegaKnightDesktop },
  { slug: 'golem', name: 'Golem', image: golem, desktopImage: golemDesktop },
  { slug: 'dictator', name: 'Dictator', image: dictator, desktopImage: dictatorDesktop },
  { slug: 'plasma', name: 'Plasma', image: plasma, desktopImage: plasmaDesktop },
  { slug: 'mummy', name: 'Mummy', image: mummy, desktopImage: mummyDesktop },
  { slug: 'frutiger', name: 'Frutiger', image: frutiger, desktopImage: frutigerDesktop },
  { slug: 'king-ball', name: 'King Ball', image: kingBall, desktopImage: kingBallDesktop },
  { slug: 'laser-minigunner', name: 'Laser Mini Gunner', image: laserMiniGunner, desktopImage: laserMiniGunnerDesktop },
  { slug: 'party-man', name: 'Party Man', image: partyMan, desktopImage: partyManDesktop },
  { slug: 'elf-commander', name: 'Elf Commander', image: elfCommander, desktopImage: elfCommanderDesktop },
  { slug: 'overclocked-overlord', name: 'Overclocked Overlord', image: overclockedOverlord, desktopImage: overclockedOverlordDesktop },
  { slug: 'hacker-ball', name: 'Hacker Ball', image: hackerBall, desktopImage: hackerBallDesktop },
  { slug: 'forest-ball', name: 'Forest Ball', image: forestBall, desktopImage: forestBallDesktop },
  { slug: 'golden-monkey', name: 'Golden Monkey', image: goldenMonkey, desktopImage: goldenMonkeyDesktop },
  { slug: 'rich-ball', name: 'Rich Ball', image: richBall, desktopImage: richBallDesktop },
  { slug: 'mecha-ball', name: 'Mecha Ball', image: mechaBall, desktopImage: mechaBallDesktop },
  { slug: 'ad-ball', name: 'Ad Ball', image: adBall, desktopImage: adBallDesktop },
  { slug: 'angel-ball', name: 'Angel Ball', image: angelBall, desktopImage: angelBallDesktop },
  { slug: 'temple-ball', name: 'Temple Ball', image: templeBall, desktopImage: templeBallDesktop },
  { slug: 'piercer', name: 'Piercer', image: piercer, desktopImage: piercerDesktop },
  { slug: 'geode-ball', name: 'Geode Ball', image: geodeBall, desktopImage: geodeBallDesktop },
  { slug: 'heartworm-ball', name: 'Heartworm Ball', image: heartwormBall, desktopImage: heartwormBallDesktop },
  { slug: 'robo-santa', name: 'Robo Santa', image: robosanta, desktopImage: robosantaDesktop },
  { slug: 'tartarus-ball', name: 'Tartarus Ball', image: tartarusBall, desktopImage: tartarusBallDesktop },
  { slug: 'frost-angel', name: 'Frost Angel', image: frostAngel, desktopImage: frostAngelDesktop },
  { slug: 'tango-ball', name: 'Tango Ball', image: tangoBall, desktopImage: tangoBallDesktop },
  { slug: 'mafia-monkey', name: 'Mafia Monkey', image: mafiaMonkey, desktopImage: mafiaMonkeyDesktop },
]);

export const HERO_ARTWORK_COUNT = HERO_ARTWORK.length;
