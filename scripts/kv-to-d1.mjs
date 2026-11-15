#!/usr/bin/env node
/**
 * Convert a KV bundle dump into D1 seed SQL (see DEPLOY-LIMITS.md).
 *   GET https://<worker>/overrides > bundle.json
 *   node scripts/kv-to-d1.mjs bundle.json > seed.sql
 *   npx wrangler d1 execute apex-db --remote --file seed.sql
 */
import { readFileSync } from 'node:fs';

const SECTIONS = {
  valueOverrides: 'value',
  wikiOverrides: 'wiki',
  mapOverrides: 'map',
  crateOverrides: 'crate',
  materialOverrides: 'material',
  itemOverrides: 'item',
};

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
const path = process.argv[2];
if (!path) {
  console.error('usage: node scripts/kv-to-d1.mjs bundle.json > seed.sql');
  process.exit(1);
}
const bundle = JSON.parse(readFileSync(path, 'utf8'));
const at = bundle.timestamp || new Date().toISOString();
const out = ['BEGIN TRANSACTION;'];

for (const [key, section] of Object.entries(SECTIONS)) {
  for (const [slug, row] of Object.entries(bundle[key] || {})) {
    out.push(
      `INSERT INTO rows (section, slug, body, updated_at) VALUES (${quote(section)}, ${quote(slug)}, ${quote(JSON.stringify(row))}, ${quote(row?.updated_at || at)}) ` +
      'ON CONFLICT(section, slug) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at;',
    );
  }
}
out.push(`INSERT INTO meta (key, value) VALUES ('__v', ${quote(bundle.__v ?? 0)}) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`);
out.push(`INSERT INTO meta (key, value) VALUES ('deletedUnits', ${quote(JSON.stringify(bundle.deletedUnits || []))}) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`);
out.push('COMMIT;');
console.log(out.join('\n'));
