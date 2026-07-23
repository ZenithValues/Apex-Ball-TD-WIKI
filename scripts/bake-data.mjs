import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://atcdrypwompjzsxyaohu.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_mZoC_DE3z3BCJrxH_-wlVA_noBjhsKy';

async function fetchTable(tableName) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${tableName}: ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  console.log('⏳ Baking live Supabase data into public/overrides/staticOverrides.json...');
  try {
    const [values, units] = await Promise.all([
      fetchTable('value_entries'),
      fetchTable('unit_wiki_overrides'),
    ]);

    // Build staticOverrides.json structure
    const valueOverrides = {};
    values.forEach(row => {
      valueOverrides[row.slug] = {
        baseValue: row.base_value,
        demand: row.demand,
        scarcity: row.scarcity,
        trend: row.trend,
        gems: row.gems,
        coins: row.coins,
        updated_at: row.updated_at,
      };
    });

    const wikiOverrides = {};
    units.forEach(row => {
      wikiOverrides[row.slug] = {
        name: row.name,
        rarity: row.rarity,
        image_url: row.image_url,
        description: row.description,
        type: row.type,
        raw_type: row.raw_type,
        category: row.category,
        placement_limit: row.placement_limit,
        total_cost: row.total_cost,
        custom_unit: row.custom_unit,
        early_game_rank: row.early_game_rank,
        late_game_rank: row.late_game_rank,
        obtain: row.obtain,
        passive: row.passive,
        ability: row.ability,
        synergy: row.synergy,
        min_max_stats: row.min_max_stats,
        upgrades: row.upgrades,
        updated_at: row.updated_at,
      };
    });

    const bundle = {
      timestamp: new Date().toISOString(),
      valueOverrides,
      wikiOverrides,
    };

    const targetPath = path.join(ROOT, 'public', 'overrides', 'staticOverrides.json');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(bundle, null, 2), 'utf-8');
    console.log(`\x1b[32m✅ Successfully baked data! Wrote ${values.length} value overrides and ${units.length} wiki overrides to ${targetPath}\x1b[0m`);
  } catch (error) {
    console.error('\x1b[31m⚠️ Error baking data from Supabase, using existing fallback staticOverrides.json\x1b[0m');
    console.error(error.message);
  }
}

main();
