// Single source of truth for every category/rarity/section used across the
// site's navigation, WIKI pages, and Values pages. Keep this in sync with
// site structure. Colors are placeholders in the black/white theme
// (accent grayscale + rarity-tinted borders only).

// Unit Rarities (used in both WIKI > Units and Values > Units)
// All rarities enabled to display all 148 units from the Ball TD stat sheet.
export const UNIT_RARITIES = [
  'Normie',
  'Shiny Normie',
  'Odds',
  'Shiny Odds',
  'Rares',
  'Shiny Rares',
  'Awesome',
  'Shiny Awesome',
  'Legendaries',
  'Shiny Legendaries',
  'Mythics',
  'Shiny Mythics',
  'Transcendents',
  'Shiny Transcendents',
  'Omegas',
  'Shiny Omegas',
  '???',
  'Shiny ???',
];

export const ALL_UNIT_RARITIES = [
  'Normie',
  'Shiny Normie',
  'Odds',
  'Shiny Odds',
  'Rares',
  'Shiny Rares',
  'Awesome',
  'Shiny Awesome',
  'Legendaries',
  'Shiny Legendaries',
  'Mythics',
  'Shiny Mythics',
  'Transcendents',
  'Shiny Transcendents',
  'Omegas',
  'Shiny Omegas',
  '???',
  'Shiny ???',
];

// Unit "type" classification (gameplay role)
export const UNIT_TYPES = ['DPS', 'Economy', 'Support', 'Summoner'];

// Unit category tags (obtainability / event status)
export const UNIT_CATEGORIES = ['Standard', 'Seasonal', 'Exclusive', 'Unobtainable'];

// Items
export const ITEM_CONSUMABLES = [
  'Frost Key',
  'Hard Frost Key',
  'Moth Ball Potion',
  'V.I.P',
  '3x Speed',
  '4x Speed',
  '+50% More Gems',
  'More Storage',
];

export const ITEM_MATERIALS = [
  "Horseman's Cloak",
  'Rock',
  'Icicle',
  'Gold',
  'Perfect Circle',
  'Obsidian',
  'Pumpkin',
  'Hardened Snowflake',
  'Crooked Twig',
  'Molten Core',
  'Twig',
  'Moth Essence',
  'Magnum Opus',
  'Heart String',
  'Scribble',
  'Moth Core',
  'Eternal Snowflake',
];

export const ITEM_CURRENCIES = ['Gems', 'Coins', 'Christmas Tokens', 'Exp'];

export const ITEM_CRATES = [
  'Frozen Crate',
  'Royal Crate',
  'Mausoleum Crate',
  'Rock Crate',
  'Forest Crate',
  'Greek Crate',
  'Quest Crate',
  'Abstract Crate',
  'Holo Crate',
  'Lucky Crate',
  'Museum Crate',
  'Faberge Crate',
  'Circus Crate',
  'Baller Crate',
  'Super Present Crate',
  'Naughty Crate',
  'Christmas Crate',
  'Lovely Skin Crate',
  'Creepy Costume Crate',
  'Banner Crate',
  'Starter Crate',
  'Monkey Crate',
  'UltraBanner',
  'MapBanner',
  'Illegal Crate',
  'Super Illegal Crate',
  'Turkey Crate',
  'Valentines Crate',
];

// Maps
export const MAPS = [
  'DoodleMap',
  'IsleOfBalls',
  'MountainsMap',
  'ForestMap',
  'TheHallows',
  'InfernoAbyss',
  'Tundra',
  'HoloPlains',
  'Golden Castle',
  'Toxic Wasteland',
  'Railroad',
  'Skybound Isles',
  'SkyCastle',
  'Museum',
  'IsleOfBalls???',
  'SantasWorkshop',
  'Pyramids',
  'HallowManor',
];

// Traits
export const TRAITS = [
  'Strength',
  'Sizeup2x',
  'Sizeup',
  'Shiny',
  'Reflexes',
  'Ranger',
  'Party Hat',
  'Money Printer',
  'Money Bags',
  'Merged',
  'Melee',
  'Lightning',
  'Explody',
  'Divine',
  "Crone's eye",
  'Cool',
  'Binoculars',
];

// Skins (per-rarity skin lists; identical lists reused for Shiny Skins)
export const SKIN_CATEGORIES = [
  'Normie',
  'Odd',
  'Rare',
  'Awesome',
  'Legendary',
  'Mythic',
  'Deluxe',
  '???',
];

export const SKINS = {
  Normie: [
    'Alaballster',
    'Battle Scarred Ball',
    'Bone Psycho',
    'Chimney Ball',
    'DaZomby',
    'Enlightened Ball',
    'Fallen Angel Ball',
    'Franken Grug',
    'Goop Ball',
    'Holy Water Ball',
    'IcySurvivor',
    "Jack O' Ball",
    'Jolly Ball',
    'Poison Bauballe',
    'Polluted Beach Ball',
    'Snow Globall',
    'Spooky Lights Ball',
    'Super Scary Ball',
  ],
  Odd: [
    'Abandoned CyborgBall',
    'Ball but with a huge hat',
    'Chained Overseer',
    'Covid Ball',
    'Desert Rose',
    'Hiker',
    'Ice Noob',
    'M80 Firecracker',
    'Mini the MiniBaller',
    'Party Clown',
    'Role Reversal',
    'Snowman Snowman Builder',
    'Toy Cadet',
    'Wreath Man',
  ],
  Rare: [
    'Disco Contender',
    'Dummy Man',
    'Frost Demon',
    'Frycook',
    'Heartbreaker',
    'Jolly Chimp',
    'Love Master',
    'Meat Ball',
    'Pilot 2.0',
    'Sinister MB',
    'Wilted Ball',
    'Witch of Misfortune',
    'Zombrain Ball',
  ],
  Awesome: ['Crypt Pumpking', 'Darkness Ball', 'Healing Ball', 'Mime Jester', 'Trampoline Kid'],
  Legendary: [
    'Abominable Snow Golem',
    'Backwoodsman',
    'Blood Moon Ball',
    'Dusty Rose',
    'Mausoleum Ball',
    'Xenon Crusader',
    'Puppet Man',
    'Queen Of Shattered Hearts',
    'The Roaring Ball',
    'Sinister Drill MechaBall',
    'Sinister LMG',
  ],
  Mythic: [
    'Bit Crusher',
    'Creeking Whisp',
    'Cursed King',
    'Mecha Santa',
    'Soul Collector',
    'The Ghastly One',
  ],
  Deluxe: ['God Of Hats', 'Hat Bank', 'Hat Trick'],
  '???': ['Chud Worm', 'Mr. Clark', 'Present Of Doom', 'The Spoon Man', 'True Ooze Master'],
};

// Legacy tier weights are retained for compatibility and label ordering only.
// The current calculator uses the entered base value directly; these weights
// do not multiply trade values.
export const DEMAND = {
  Abysmal: 0.94,
  'Extremely Low': 0.95,
  'Very Low': 0.96,
  Low: 0.97,
  'Below Average': 0.98,
  'Slightly Below Average': 0.99,
  Normal: 1.0,
  'Slightly Above Average': 1.01,
  'Above Average': 1.02,
  High: 1.03,
  'Very High': 1.04,
  'Extremely High': 1.05,
  Godly: 1.06,
};

export const SCARCITY = {
  Flooded: 0.98,
  Common: 0.99,
  Standard: 1.0,
  Limited: 1.01,
  Rare: 1.02,
};

export const DEMAND_LABELS = Object.keys(DEMAND);
export const SCARCITY_LABELS = Object.keys(SCARCITY);

// RARITY COLORS
// Each rarity has a 6-stop palette (light → dark). `glow` (the brightest
// stop) is used as the solid glow color for rarity name/labels. The full
// array is used as a left-to-right gradient for card accent borders/stripes.
// "Shiny <Rarity>" variants reuse their base rarity's palette.
export const RARITY_PALETTES = {
  Normie: ['#C0C0C0', '#BDBDBD', '#B0B0B0', '#A8A8A8', '#959595', '#8F8F8F'],
  Odd: ['#33A033', '#2E8B2E', '#238B23', '#206B20', '#155A15', '#0F4F0F'],
  Rare: ['#0CEDE8', '#08E9E4', '#08E6E1', '#08DAD6', '#06D2CE', '#04C9C5'],
  Awesome: ['#C04DFF', '#B42EFF', '#A81AF5', '#9A00E8', '#8A00D0', '#7500B5'],
  Legendary: ['#FFB84D', '#FFAA33', '#FF9E1F', '#F59010', '#E08000', '#C56E00'],
  Mythic: ['#FF6B6B', '#F55A5A', '#EB4848', '#E03838', '#C82828', '#B01E1E'],
  Transcendent: ['#5FE8A8', '#48E098', '#33D888', '#20C878', '#18B068', '#109858'],
  Omega: ['#3020B0', '#2818A0', '#201090', '#180880', '#100470', '#080060'],
};

// Maps a full rarity name (as used in UNIT_RARITIES, including "Shiny X" and
// "???" variants) to its base palette key above.
const RARITY_ALIAS = {
  Normie: 'Normie',
  'Shiny Normie': 'Normie',
  Normies: 'Normie',
  'Shiny Normies': 'Normie',
  Odds: 'Odd',
  'Shiny Odds': 'Odd',
  Rares: 'Rare',
  'Shiny Rares': 'Rare',
  Awesome: 'Awesome',
  'Shiny Awesome': 'Awesome',
  Legendaries: 'Legendary',
  'Shiny Legendaries': 'Legendary',
  Mythics: 'Mythic',
  'Shiny Mythics': 'Mythic',
  Transcendents: 'Transcendent',
  'Shiny Transcendents': 'Transcendent',
  Omegas: 'Omega',
  'Shiny Omegas': 'Omega',
  '???': 'Omega',
  'Shiny ???': 'Omega',
};

// SHINY COLOURS (operator, 2026-11-12 rev 3)
// A shiny is not "its base rarity in a different wrapper" — every shiny rarity
// gets its OWN colour, distinct from the base one, so a shiny card is
// recognisable on colour alone. Shiny Omega / shiny ??? keep the reserved
// magenta that the shiny system has always used.
export const SHINY_GLOWS = {
  Normie: '#F7F0CE',        // yellowish white
  Odd: '#34E0B6',           // aqua green
  Rare: '#2A66F5',          // deep blue
  Awesome: '#7A2BD6',       // dark purple
  Legendary: '#FFE33B',     // bright / neon yellow
  Mythic: '#FF5C7A',        // pinkish red
  Transcendent: '#2E8C6E',  // darker aqua-mould green
  Omega: '#e879f9',         // reserved shiny magenta
  '???': '#FFFFFF',         // shiny ??? is pure white
};

// light → dark stop, same direction as RARITY_PALETTES
function shadeHex(hex, amount) {
  const clean = String(hex).replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.abs(amount);
  const channel = (shift) => {
    const value = (num >> shift) & 0xff;
    return Math.round(value + (target - value) * ratio);
  };
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, '0')).join('')}`;
}

const shinyPaletteCache = new Map();
function shinyPalette(glow) {
  if (shinyPaletteCache.has(glow)) return shinyPaletteCache.get(glow);
  const palette = [0.5, 0.32, 0.14, 0, -0.18, -0.36].map((amount) => shadeHex(glow, amount));
  shinyPaletteCache.set(glow, palette);
  return palette;
}

/**
 * Base rarity key for both "Shiny Rares" and "Shiny Rare". "???" is kept as its
 * own key — only the shiny table has a white entry for it, while the plain
 * (non-shiny) palette still falls back to Omega through RARITY_ALIAS.
 */
export function baseRarityKey(rarityName) {
  const bare = String(rarityName || '').replace(/^Shiny\s+/i, '').trim();
  if (bare === '???') return '???';
  return RARITY_ALIAS[bare] || bare;
}

export function getRarityPalette(rarityName) {
  const name = String(rarityName || '');
  if (/^Shiny\s+/i.test(name)) {
    const shinyGlow = SHINY_GLOWS[baseRarityKey(name)];
    if (shinyGlow) return shinyPalette(shinyGlow);
  }
  const key = RARITY_ALIAS[name] || name;
  return RARITY_PALETTES[key] || RARITY_PALETTES.Normie;
}

export function getRarityGlow(rarityName) {
  const name = String(rarityName || '');
  if (/^Shiny\s+/i.test(name)) {
    const shinyGlow = SHINY_GLOWS[baseRarityKey(name)];
    if (shinyGlow) return shinyGlow;
  }
  return getRarityPalette(name)[0];
}

export function isShinyRarity(rarityName) {
  return typeof rarityName === 'string' && rarityName.startsWith('Shiny');
}

// Shiny units keep the "Shiny …" RARITY but their display name drops the word,
// so every card needs one shared way to know it must glow differently
// (operator, 2026-11-12). Trade Calculator, WIKI, Values and Afford all use it.
// The magenta sheen is reserved for the top of the food chain: shiny Omega
// (and shiny ???) units. Every other shiny keeps ITS OWN rarity colour, so a
// shiny Rare reads cyan, a shiny Mythic reads red, … (operator, 2026-11-12:
// "all the shiny unit border colors are the same").
export const SHINY_CARD_GLOW = '#e879f9';

export function unitIsShiny(entity) {
  if (!entity) return false;
  return Boolean(entity.shiny || isShinyRarity(entity.rarity));
}

/** The dedicated colour of a shiny rarity (magenta only for Omega / ???). */
export function shinyAccent(rarityName) {
  return SHINY_GLOWS[baseRarityKey(rarityName)] || SHINY_CARD_GLOW;
}

/** Accent colour for a card/hero: rarity colour, or the shiny rule above. */
export function getCardGlow(entity) {
  if (!entity) return '#ffffff';
  return unitIsShiny(entity) ? shinyAccent(entity.rarity) : getRarityGlow(entity.rarity);
}

// DEMAND / SCARCITY BAR COLORS
// Demand runs dark red (Abysmal, worst) through the spectrum to purple
// (Godly, best). Scarcity runs red (Flooded — lots of copies) to purple
// (Rare — very few copies). Both power the filled progress bars on unit
// value cards.
export const DEMAND_COLORS = {
  Abysmal: '#dc2626',
  'Extremely Low': '#ef4444',
  'Very Low': '#f87171',
  Low: '#f97316',
  'Below Average': '#fb923c',
  'Slightly Below Average': '#f59e0b',
  Normal: '#eab308',
  'Slightly Above Average': '#84cc16',
  'Above Average': '#22c55e',
  High: '#10b981',
  'Very High': '#06b6d4',
  'Extremely High': '#3b82f6',
  Godly: '#a855f7',
};

export const SCARCITY_COLORS = {
  Flooded: '#ef4444',
  Common: '#f97316',
  Standard: '#eab308',
  Limited: '#22c55e',
  Rare: '#a855f7',
};

// Percent fill (0-100) for each tier, used to size the progress bar fill.
export const DEMAND_PERCENT = Object.fromEntries(
  DEMAND_LABELS.map((label, i) => [label, Math.round(((i + 1) / DEMAND_LABELS.length) * 100)])
);

export const SCARCITY_PERCENT = Object.fromEntries(
  SCARCITY_LABELS.map((label, i) => [label, Math.round(((i + 1) / SCARCITY_LABELS.length) * 100)])
);
