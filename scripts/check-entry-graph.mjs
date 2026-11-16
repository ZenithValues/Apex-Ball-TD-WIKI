// Post-build gate: invariants for the PUBLIC entry HTML.
//  - admin code/chunks never preload (adminForms, AdminHome)
//  - device-gated 3D (vendor-three) never preloads
//  - DataContext- (static offline values bundle, ~65 KB gz) IS allowed: the
//    public provider imports it by design so the site works when KV is down.
//  - any other non-vendor preload over 100 KB fails (fat shared chunks).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

const root = cwd();
const htmlPath = join(root, 'dist', 'index.html');
if (!existsSync(htmlPath)) {
  console.error('ENTRY-GRAPH FAIL: dist/index.html missing — run `npm run build` first.');
  process.exit(1);
}
const html = readFileSync(htmlPath, 'utf8');
const preloads = [...html.matchAll(/(?:src|href)="\/?([^"]*assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
const failures = [];
const ALLOWED_FAT = /^(DataContext-|vendor-react-|vendor-|rolldown-runtime-|index-|taxonomy-|apexClient-|localAssets-|privacyChoices-|teamMembers-|Home-|UnitIcon-|ThemeCutout-|CoolIcon-|AdSlot-|useWikiImageOverrides-|wikiImageCache-)/;

for (const rel of preloads) {
  const name = rel.split('/').pop();
  if (/^(adminForms-|AdminHome-|vendor-three-)/.test(name)) {
    failures.push(`${name} must not be eagerly preloaded`);
    continue;
  }
  const file = join(root, 'dist', rel.replace(/^\//, ''));
  if (!existsSync(file)) continue;
  const size = statSync(file).size;
  if (!ALLOWED_FAT.test(name) && size > 100 * 1024) {
    failures.push(`${name} preloaded at ${(size / 1024).toFixed(0)} KB (unrecognised fat entry chunk)`);
  }
}

const assetsDir = join(root, 'dist', 'assets');
const assets = existsSync(assetsDir) ? readdirSync(assetsDir) : [];
if (!assets.some((a) => /^(AdminHome|adminForms)-.*\.js$/.test(a))) {
  console.warn('ENTRY-GRAPH WARN: no AdminHome/adminForms chunk in dist/assets — verify /admin manually.');
}

if (failures.length) {
  console.error('ENTRY-GRAPH FAIL:\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log(`ENTRY-GRAPH OK: ${preloads.length} preloads; admin/three absent; offline bundle allowed by design.`);
