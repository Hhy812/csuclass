import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SOURCE_FILE = path.join(ROOT, 'src', 'components', 'FloorPlanSVG.tsx');
const OUTPUT_DIR = path.join(ROOT, 'floor_svgs');

function readSource() {
  return fs.readFileSync(SOURCE_FILE, 'utf8');
}

function extractBuildingBlock(source, buildingId) {
  const startToken = `const ${buildingId}_FLOOR_ABSOLUTE`;
  const start = source.indexOf(startToken);
  if (start === -1) {
    throw new Error(`Cannot find ${startToken}`);
  }

  // Find the next top-level building block as end boundary
  const nextPattern = /const [A-Z]_FLOOR_ABSOLUTE|export function FloorPlanSVG/g;
  nextPattern.lastIndex = start + startToken.length;

  let end = source.length;
  let match;
  while ((match = nextPattern.exec(source)) !== null) {
    if (match.index > start) {
      end = match.index;
      break;
    }
  }

  return source.slice(start, end);
}

function parseFloors(buildingBlock) {
  const floors = new Map();
  const floorRegex = /(\d+)\s*:\s*\[([\s\S]*?)\]\s*,?/g;
  let floorMatch;
  while ((floorMatch = floorRegex.exec(buildingBlock)) !== null) {
    const floor = Number(floorMatch[1]);
    const body = floorMatch[2];
    const rooms = [];

    const roomRegex = /{\s*id:\s*'([^']+)'\s*,\s*x:\s*([\d.]+)\s*,\s*y:\s*([\d.]+)\s*,\s*w:\s*([\d.]+)\s*,\s*h:\s*([\d.]+)(?:\s*,\s*rotate:\s*([-\d.]+))?\s*}/g;
    let roomMatch;
    while ((roomMatch = roomRegex.exec(body)) !== null) {
      rooms.push({
        id: roomMatch[1],
        x: Number(roomMatch[2]),
        y: Number(roomMatch[3]),
        w: Number(roomMatch[4]),
        h: Number(roomMatch[5]),
        rotate: roomMatch[6] ? Number(roomMatch[6]) : undefined,
      });
    }

    floors.set(floor, rooms);
  }
  return floors;
}

function chooseViewBox(building, rooms) {
  let maxX = 0;
  let maxY = 0;
  for (const room of rooms) {
    maxX = Math.max(maxX, room.x + room.w);
    maxY = Math.max(maxY, room.y + room.h);
  }

  const width = Math.max(980, Math.ceil(maxX + 40));
  const height = building === 'C' ? Math.max(260, Math.ceil(maxY + 40)) : Math.max(300, Math.ceil(maxY + 60));
  return { width, height };
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function buildSvg(building, floor, rooms) {
  const { width, height } = chooseViewBox(building, rooms);
  const titleY = 24;
  const contentOffsetY = 20;

  const roomGroups = rooms.map((room) => {
    const tx = room.x;
    const ty = room.y + contentOffsetY;
    const textX = room.w / 2;
    const textY = room.h / 2 + 5;
    const transform = room.rotate
      ? ` transform="translate(${tx} ${ty}) rotate(${room.rotate} ${room.w / 2} ${room.h / 2})"`
      : ` transform="translate(${tx} ${ty})"`;

    return `  <g id="${escapeXml(room.id)}" data-room="${escapeXml(room.id)}"${transform}>
    <rect x="0" y="0" width="${room.w}" height="${room.h}" rx="3" ry="3" fill="#ffffff" stroke="#222222" stroke-width="1.5" />
    <text x="${textX}" y="${textY}" text-anchor="middle" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="13" fill="#111111">${escapeXml(room.id)}</text>
  </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f8fafc" />
  <text x="${width / 2}" y="${titleY}" text-anchor="middle" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="18" font-weight="700" fill="#111827">${building} 座 ${floor} 楼</text>
${roomGroups.join('\n')}
</svg>
`;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function main() {
  const source = readSource();
  ensureDir(OUTPUT_DIR);

  const buildings = ['A', 'B', 'C'];
  for (const building of buildings) {
    const block = extractBuildingBlock(source, building);
    const floors = parseFloors(block);
    const buildingDir = path.join(OUTPUT_DIR, building);
    ensureDir(buildingDir);

    for (const [floor, rooms] of floors.entries()) {
      if (!rooms.length) continue;
      const svg = buildSvg(building, floor, rooms);
      const filePath = path.join(buildingDir, `${floor}.svg`);
      fs.writeFileSync(filePath, svg, 'utf8');
      console.log(`generated ${path.relative(ROOT, filePath)} (${rooms.length} rooms)`);
    }
  }
}

main();
