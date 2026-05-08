import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const APP_ROOT = process.cwd();
const PROJECT_ROOT = path.resolve(APP_ROOT, '..');
const TEMPLATE_DIR = path.join(PROJECT_ROOT, 'svg');
const PUBLIC_FLOOR_SVG_DIR = path.join(APP_ROOT, 'public', 'floor-svgs');

function hasSvgFiles(dir) {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).some((file) => file.toLowerCase().endsWith('.svg'));
}

function runNodeScript(fileName) {
  const scriptPath = path.join(APP_ROOT, 'tools', fileName);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: APP_ROOT,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`Failed to run ${fileName}`);
  }
}

function main() {
  if (fs.existsSync(TEMPLATE_DIR)) {
    runNodeScript('generate-template-floor-svgs.mjs');
    runNodeScript('sync-floor-svgs.mjs');
    return;
  }

  if (hasSvgFiles(PUBLIC_FLOOR_SVG_DIR)) {
    console.log('Template directory not found, reuse existing public/floor-svgs');
    return;
  }

  throw new Error(
    `Cannot prepare floor SVGs: missing "${TEMPLATE_DIR}" and "${PUBLIC_FLOOR_SVG_DIR}" has no svg files.`,
  );
}

main();
