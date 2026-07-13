#!/usr/bin/env python3
"""
Parses the raw "Ball TD Units stat sheet.txt" dump into structured JSON
matching the site's unit schema (src/data/units.js UNIT_OVERRIDES shape).

Usage: python3 parse_units.py <input.txt> <output.json>
"""
import re
import sys
import json

RARITY_MAP = {
    'Normie': 'Normie',
    'Odd': 'Odds',
    'Odds': 'Odds',
    'Rare': 'Rares',
    'Awesome': 'Awesome',
    'Legendary': 'Legendaries',
    'Mythic': 'Mythics',
    'Transcendent': 'Transcendents',
    'Transcendant': 'Transcendents',
    'Omega': 'Omegas',
}


def slugify(name):
    s = name.lower().strip()
    s = s.replace('+', 'plus')
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = s.strip('-')
    return s


def parse_num(raw):
    """Parse numbers like '150$', '2K$', '1.5M$', '0.05', '5' -> float"""
    if raw is None:
        return None
    s = raw.strip().replace(',', '').replace('$', '').strip()
    if s in ('N/A', '???', '-', '', 'false', 'true'):
        return None
    mult = 1
    if s.upper().endswith('K'):
        mult = 1_000
        s = s[:-1]
    elif s.upper().endswith('M'):
        mult = 1_000_000
        s = s[:-1]
    elif s.upper().endswith('B'):
        mult = 1_000_000_000
        s = s[:-1]
    try:
        return float(s) * mult
    except ValueError:
        return None


def parse_rarity_line(line):
    """## Normie ⬜  or  ## Rare 🟦 (Seasonal)  or ## Mythic 🟥 (Seasonal)/(Exclusive)"""
    line = line.lstrip('#').strip()
    # strip emoji and other non-ascii symbol chars, keep words and parens/slash
    # extract leading word(s) before any emoji/symbol
    m = re.match(r'^([A-Za-z]+)', line)
    base_word = m.group(1) if m else None
    rarity = RARITY_MAP.get(base_word, base_word)

    categories = []
    if 'Seasonal' in line:
        categories.append('Seasonal')
    if 'Exclusive' in line:
        categories.append('Exclusive')
    if 'Unobtainable' in line:
        categories.append('Unobtainable')
    if not categories:
        categories.append('Standard')
    return rarity, categories


def parse_block(block):
    lines = block.split('\n')
    name = lines[0].lstrip('#').strip()

    rarity = None
    categories = ['Standard']
    unit_type = None
    placement_limit = None
    obtain_sources = []
    passive = None
    ability = None
    synergy = None
    unavailable = '⚠️ UNAVAILABLE DATA ⚠️' in block or 'UNAVAILABLE DATA' in block

    for line in lines[1:6]:
        if line.startswith('##'):
            rarity, categories = parse_rarity_line(line)
            break

    type_match = re.search(r'-# Type:\s*(.+)', block)
    if type_match:
        unit_type = type_match.group(1).strip()

    placement_match = re.search(r'Placement Count:\s*([^\n\r]+)', block)
    if placement_match:
        placement_limit = placement_match.group(1).strip()

    # How to Obtain section -> list of "- Something" bullet lines after the header
    obtain_match = re.search(r'-# How to Obtain:\s*\r?\n\r?\n(.*?)(?:\Z)', block, re.S)
    if obtain_match:
        obtain_block = obtain_match.group(1)
        for l in obtain_block.split('\n'):
            l = l.strip().rstrip('\r')
            if l.startswith('-'):
                src = l.lstrip('-').strip()
                if src:
                    obtain_sources.append(src)

    passive_match = re.search(r'Passive:\s*(.+)', block)
    if passive_match:
        val = passive_match.group(1).strip()
        if val and val != '-':
            passive = val

    ability_match = re.search(r'Ability:\s*(.+)', block)
    if ability_match:
        val = ability_match.group(1).strip()
        if val and val != '-':
            ability = val

    synergy_match = re.search(r'Synergy:\s*(.+)', block)
    if synergy_match:
        val = synergy_match.group(1).strip()
        if val and val != '-':
            synergy = val

    # ---- Upgrades ----
    # Split the "Upgrades & Costs" section into per-upgrade chunks starting
    # with "- Placement" or "- Upgrade N"
    upgrades_section_match = re.search(
        r'-# Upgrades & Costs:\s*\r?\n(.*?)(?:\r?\n\r?\n>\s*-# Total Cost|\Z)',
        block, re.S,
    )
    upgrades = []
    if upgrades_section_match and not unavailable:
        section = upgrades_section_match.group(1)
        # split on lines that start a new upgrade entry
        chunks = re.split(r'\n(?=- (?:Placement|Upgrade \d+))', section)
        level = 0
        for chunk in chunks:
            chunk = chunk.strip()
            if not chunk.startswith('-'):
                continue
            header_match = re.match(r'-\s*(Placement|Upgrade\s*\d+(?:\(MAX\))?)\s*:?\s*([^\n\r]*)', chunk)
            if not header_match:
                continue
            label = header_match.group(1)
            cost_raw = header_match.group(2).strip()
            cost = parse_num(cost_raw)

            desc_match = re.search(r'Upgrade Description:\s*([^\n\r]+)', chunk)
            description = desc_match.group(1).strip() if desc_match else None

            cooldown_match = re.search(r'Cooldown:\s*([^\n\r]+)', chunk)
            cooldown = cooldown_match.group(1).strip() if cooldown_match else None

            range_match = re.search(r'Range:\s*([^\n\r]+)', chunk)
            range_val = range_match.group(1).strip() if range_match else None

            # DPS lines: could be multiple (e.g. "Gun DPS", "Missile DPS")
            dps_matches = re.findall(r'>\s*-\s*([\w\s\'()./-]*?DPS):\s*([^\n\r]+)', chunk)
            dps_entries = {k.strip(): v.strip() for k, v in dps_matches}

            cost_per_dps_match = re.search(r'Cost Per DPS:\s*([^\n\r]+)', chunk)
            cost_per_dps = cost_per_dps_match.group(1).strip() if cost_per_dps_match else None

            # Attack sub-blocks: a line like "Gun:" / "Melee:" / "Aoe:" followed
            # by more-indented "key: value" lines (Damage, bullets, pierce, etc.)
            attacks = {}
            chunk_lines = [l.expandtabs(8) for l in chunk.split('\n')]
            current_block = None
            for cl in chunk_lines:
                stripped = cl.strip().lstrip('-').strip()
                if not stripped:
                    continue
                # count leading spaces (rough indentation depth) ignoring '-' markers
                indent = len(cl) - len(cl.lstrip(' '))
                if stripped.endswith(':') and 'Cooldown' not in stripped and 'Range' not in stripped:
                    # candidate block header e.g. "Gun:" "Melee:" "Aoe:"
                    label_name = stripped[:-1].strip()
                    if label_name and label_name not in ('Upgrade Description',):
                        current_block = label_name
                        attacks.setdefault(current_block, {})
                    continue
                if current_block and ':' in stripped and indent >= 8:
                    k, v = stripped.split(':', 1)
                    attacks[current_block][k.strip()] = v.strip()

            level += 1
            upgrades.append({
                'level': level,
                'label': label,
                'cost': cost,
                'costRaw': cost_raw,
                'description': description,
                'cooldown': cooldown,
                'range': range_val,
                'attacks': attacks,
                'dps': dps_entries,
                'costPerDps': cost_per_dps,
            })

    # ---- Min-Max stats block ----
    minmax_match = re.search(
        r'-# Minimum - Maximum Stats:\s*\r?\n\r?\n?(.*?)(?:——×——|\Z)', block, re.S
    )
    min_max = {}
    if minmax_match:
        mm_block = minmax_match.group(1)
        for l in mm_block.split('\n'):
            l = l.strip().lstrip('>').strip()
            if not l or ':' not in l:
                continue
            key, val = l.split(':', 1)
            min_max[key.strip()] = val.strip()

    return {
        'slug': slugify(name),
        'name': name,
        'rarity': rarity,
        'categories': categories,
        'category': categories[0] if len(categories) == 1 else '/'.join(categories),
        'type': unit_type,
        'placementLimit': placement_limit,
        'obtain': obtain_sources,
        'passive': passive,
        'ability': ability,
        'synergy': synergy,
        'unavailableData': unavailable,
        'upgrades': upgrades,
        'minMaxStats': min_max,
    }


def main():
    infile = sys.argv[1] if len(sys.argv) > 1 else 'uploads/Ball TD Units stat sheet.txt'
    outfile = sys.argv[2] if len(sys.argv) > 2 else 'units_parsed.json'

    content = open(infile, encoding='utf-8').read()
    blocks = re.split(r'\n(?=# [^#\n])', content)
    blocks = [b for b in blocks if b.strip().startswith('#')]

    results = []
    errors = []
    for b in blocks:
        try:
            parsed = parse_block(b)
            results.append(parsed)
        except Exception as e:
            first_line = b.split('\n')[0]
            errors.append(f'{first_line}: {e}')

    print(f'Parsed {len(results)} units, {len(errors)} errors', file=sys.stderr)
    for e in errors:
        print(f'  ERROR: {e}', file=sys.stderr)

    with open(outfile, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # sanity: rarity distribution
    from collections import Counter
    c = Counter(r['rarity'] for r in results)
    print('Rarity distribution:', dict(c), file=sys.stderr)
    unknown = [r['name'] for r in results if r['rarity'] not in (
        'Normie','Odds','Rares','Awesome','Legendaries','Mythics','Transcendents','Omegas'
    )]
    if unknown:
        print('Unknown rarity units:', unknown, file=sys.stderr)


if __name__ == '__main__':
    main()