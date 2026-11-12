import { readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { dirname, resolve } from 'node:path';
import { buildRouteManifest, cardSpecFor } from './route-manifest.mjs';

const ROOT = process.env.APEX_PROJECT_ROOT || process.cwd();
const routes = buildRouteManifest();
const keep = new Set(routes.map((route, i) => cardSpecFor(route, i)?.fileName).filter(Boolean));
let removed = 0;
for (const dir of [join(ROOT, 'public', 'social'), join(ROOT, 'dist', 'social')]) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!keep.has(file)) { unlinkSync(join(dir, file)); removed += 1; }
  }
}
console.log(`[cards] routes=${routes.length} expected=${keep.size} pruned=${removed}`);
