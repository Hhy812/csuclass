import fs from 'fs';
import path from 'path';

const APP_ROOT = process.cwd();
const PROJECT_ROOT = path.resolve(APP_ROOT, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'svg', 'floors');
const DEST_DIR = path.join(APP_ROOT, 'public', 'floor-svgs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanOldFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (file.toLowerCase().endsWith('.svg')) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`Source floor svg directory not found: ${SRC_DIR}`);
  }

  ensureDir(DEST_DIR);
  cleanOldFiles(DEST_DIR);

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.toLowerCase().endsWith('.svg'));
  for (const file of files) {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(DEST_DIR, file);
    fs.copyFileSync(src, dest);
    console.log(`synced ${path.relative(APP_ROOT, dest)}`);
  }
}

main();
