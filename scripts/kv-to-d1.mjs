#!/usr/bin/env node
/**
 * Turn a KV bundle dump into D1 seed SQL (see DEPLOY-LIMITS.md / D1-SETUP.md).
 *
 *   # straight from the live worker (no download, no shell redirection)
 *   node scripts/kv-to-d1.mjs https://apex-db.apexballtd-admin.workers.dev/overrides --out d1-seed.sql
 *
 *   # from a file you already have
 *   node scripts/kv-to-d1.mjs bundle.json --out d1-seed.sql
 *
 *   # to stdout
 *   node scripts/kv-to-d1.mjs bundle.json > seed.sql
 *
 * `--out` writes UTF-8 without a BOM, which matters on Windows: PowerShell's
 * `>` redirection produces UTF-16 and wrangler then reads garbage.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SECTIONS = {
  valueOverrides: 'value',
  wikiOverrides: 'wiki',
  mapOverrides: 'map',
  crateOverrides: 'crate',
  materialOverrides: 'material',
  itemOverrides: 'item',
};

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
const usage = () => {
  console.error('usage: node scripts/kv-to-d1.mjs <bundle.json|https://worker/overrides> [--out seed.sql]');
  process.exit(1);
};

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outFile = outIndex >= 0 ? args[outIndex + 1] : null;
const source = args.find((a, i) => i !== outIndex && i !== outIndex + 1);
if (!source || (outIndex >= 0 && !outFile)) usage();

let raw;
if (/^https?:\/\//i.test(source)) {
  const response = await fetch(source, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    console.error(`fetch failed: ${response.status} ${response.statusText} (${source})`);
    process.exit(1);
  }
  raw = await response.text();
} else {
  raw = readFileSync(source, 'utf8');
}

let bundle;
try {
  bundle = JSON.parse(raw);
} catch {
  console.error(`${source} is not valid JSON. If you redirected with PowerShell ">", re-run with --out: it wrote UTF-16.`);
  process.exit(1);
}

const at = bundle.timestamp || new Date().toISOString();
// NO BEGIN TRANSACTION / COMMIT: D1 rejects them on import ("please use
// state.storage.transaction()..."), and its batch import is already atomic.
const out = [];
let rows = 0;

for (const [key, section] of Object.entries(SECTIONS)) {
  for (const [slug, row] of Object.entries(bundle[key] || {})) {
    rows += 1;
    out.push(
      `INSERT INTO rows (section, slug, body, updated_at) VALUES (${quote(section)}, ${quote(slug)}, ${quote(JSON.stringify(row))}, ${quote(row?.updated_at || at)}) ` +
      'ON CONFLICT(section, slug) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at;',
    );
  }
}
out.push(`INSERT INTO meta (key, value) VALUES ('__v', ${quote(bundle.__v ?? 0)}) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`);
out.push(`INSERT INTO meta (key, value) VALUES ('deletedUnits', ${quote(JSON.stringify(bundle.deletedUnits || []))}) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`);

const sql = out.join('\n') + '\n';
if (outFile) {
  writeFileSync(outFile, sql, 'utf8'); // utf8 without BOM
  console.log(`wrote ${outFile}`);
  console.log(`  ${rows} rows + 2 meta rows, bundle __v = ${bundle.__v ?? 0}, ${(Buffer.byteLength(sql) / 1048576).toFixed(2)} MB`);
  console.log('  next: npx wrangler d1 execute apex-db --remote --file ' + outFile);
} else {
  process.stdout.write(sql);
}
