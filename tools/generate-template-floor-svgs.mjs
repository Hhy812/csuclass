import fs from 'fs';
import path from 'path';

const APP_ROOT = process.cwd();
const PROJECT_ROOT = path.resolve(APP_ROOT, '..');
const TEMPLATE_DIR = path.join(PROJECT_ROOT, 'svg');
const OUTPUT_DIR = path.join(TEMPLATE_DIR, 'floors');
const LABEL_FONT_SIZE = 20;

const FLOOR_TASKS = [
  { key: 'A1', template: 'A.svg', output: 'A1.svg' },
  { key: 'A2', template: 'A2.svg', output: 'A2.svg' },
  { key: 'A3', template: 'A2.svg', output: 'A3.svg' },
  { key: 'A4', template: 'A4.svg', output: 'A4.svg' },
  { key: 'B1', template: 'B.svg', output: 'B1.svg' },
  { key: 'B2', template: 'B.svg', output: 'B2.svg' },
  { key: 'B3', template: 'B.svg', output: 'B3.svg' },
  { key: 'B4', template: 'B.svg', output: 'B4.svg' },
  { key: 'B5', template: 'B.svg', output: 'B5.svg' },
  { key: 'C1', template: 'C1.svg', output: 'C1.svg' },
  { key: 'C2', template: 'C2.svg', output: 'C2.svg' },
  { key: 'C3', template: 'C3.svg', output: 'C3.svg' },
  { key: 'C4', template: 'C4.svg', output: 'C4.svg' },
  { key: 'C5', template: 'C5.svg', output: 'C5.svg' },
  { key: '科北1', template: '科北.svg', output: '科北1.svg' },
  { key: '科北2', template: '科北.svg', output: '科北2.svg' },
  { key: '科北3', template: '科北.svg', output: '科北3.svg' },
  { key: '科北4', template: '科北.svg', output: '科北4.svg' },
  { key: '科北5', template: '科北.svg', output: '科北5.svg' },
  { key: '科南1', template: '科南5.svg', output: '科南1.svg' },
  { key: '科南2', template: '科南5.svg', output: '科南2.svg' },
  { key: '科南3', template: '科南5.svg', output: '科南3.svg' },
  { key: '科南4', template: '科南5.svg', output: '科南4.svg' },
  { key: '科南5', template: '科南5.svg', output: '科南5.svg' },
];

const MANUAL_ROOM_MAPS = {
  A1: {
    svg_1: 'A102', svg_2: 'A103', svg_3: 'A101',
    svg_4: 'A124', svg_5: 'A123',
    svg_6: 'A104', svg_7: 'A106', svg_8: 'A107',
    svg_9: 'A122', svg_10: 'A119', svg_11: 'A108',
    svg_12: 'A117', svg_13: 'A109', svg_14: 'A110',
    svg_15: 'A115', svg_16: 'A114', svg_17: 'A113',
    svg_18: 'A112', svg_19: 'A111',
  },
  A2: {
    svg_1: 'A202', svg_2: 'A203', svg_3: 'A201',
    svg_4: 'A224', svg_5: 'A223',
    svg_6: 'A204', svg_7: 'A206', svg_8: 'A207',
    svg_9: 'A222', svg_20: 'A221', svg_21: 'A220', svg_22: 'A219', svg_10: 'A218',
    svg_11: 'A208', svg_12: 'A217', svg_13: 'A209', svg_14: 'A210',
    svg_15: 'A215', svg_16: 'A214', svg_17: 'A213',
    svg_18: 'A212', svg_19: 'A211',
  },
  A3: {
    svg_1: 'A302', svg_2: 'A303', svg_3: 'A301',
    svg_4: 'A324', svg_5: 'A323',
    svg_6: 'A304', svg_7: 'A306', svg_8: 'A307',
    svg_9: 'A322', svg_20: 'A321', svg_21: 'A320', svg_22: 'A319', svg_10: 'A318',
    svg_11: 'A308', svg_12: 'A317', svg_13: 'A309', svg_14: 'A310',
    svg_15: 'A315', svg_16: 'A314', svg_17: 'A313',
    svg_18: 'A312', svg_19: 'A311',
  },
  A4: {
    svg_1: 'A402', svg_2: 'A403', svg_3: 'A401',
    svg_4: 'A423', svg_5: 'A422',
    svg_6: 'A404', svg_7: 'A406', svg_8: 'A407',
    svg_9: 'A421', svg_21: 'A420', svg_10: 'A419',
    svg_11: 'A408', svg_12: 'A417', svg_13: 'A409', svg_14: 'A410',
    svg_15: 'A415', svg_16: 'A414', svg_17: 'A413',
    svg_18: 'A412', svg_19: 'A411',
  },
  B1: {
    svg_1: 'B119', svg_3: 'B118', svg_4: 'B117',
    svg_5: 'B101', svg_6: 'B102', svg_7: 'B103',
    svg_8: 'B104', svg_10: 'B105', svg_11: 'B106', svg_12: 'B107', svg_13: 'B108', svg_14: 'B109',
    svg_15: 'B114', svg_16: 'B113', svg_17: 'B112', svg_18: 'B111', svg_19: 'B110',
  },
  B2: {
    svg_1: 'B219', svg_3: 'B218', svg_4: 'B217',
    svg_5: 'B202', svg_6: 'B203', svg_7: 'B201',
    svg_8: 'B204', svg_10: 'B205', svg_11: 'B206', svg_12: 'B207', svg_13: 'B208', svg_14: 'B209',
    svg_15: 'B214', svg_16: 'B213', svg_17: 'B212', svg_18: 'B211', svg_19: 'B210',
  },
  B3: {
    svg_1: 'B320', svg_3: 'B319', svg_4: 'B318',
    svg_5: 'B301', svg_6: 'B302', svg_7: 'B303',
    svg_8: 'B304', svg_10: 'B305', svg_11: 'B306', svg_12: 'B307', svg_13: 'B308', svg_14: 'B309',
    svg_15: 'B315', svg_16: 'B314', svg_17: 'B313', svg_18: 'B312', svg_19: 'B311',
  },
  B4: {
    svg_1: 'B420', svg_3: 'B419', svg_4: 'B418',
    svg_5: 'B401', svg_6: 'B402', svg_7: 'B403',
    svg_8: 'B404', svg_10: 'B405', svg_11: 'B406', svg_12: 'B407', svg_13: 'B408', svg_14: 'B409',
    svg_15: 'B415', svg_16: 'B414', svg_17: 'B413', svg_18: 'B412', svg_19: 'B411',
  },
  B5: {
    svg_1: 'B519', svg_3: 'B518', svg_4: 'B517',
    svg_5: 'B501', svg_6: 'B502', svg_7: 'B503',
    svg_8: 'B504', svg_10: 'B505', svg_11: 'B506', svg_12: 'B507', svg_13: 'B508', svg_14: 'B509',
    svg_15: 'B514', svg_16: 'B513', svg_17: 'B512', svg_18: 'B511', svg_19: 'B510',
  },
  科北1: {
    svg_1: '科教北106', svg_2: '科教北105', svg_3: '科教北104', svg_4: '科教北103',
    svg_5: '科教北107', svg_6: '科教北108', svg_7: '科教北101', svg_8: '科教北102',
  },
  科北2: {
    svg_1: '科教北206', svg_2: '科教北205', svg_3: '科教北204', svg_4: '科教北203',
    svg_5: '科教北207', svg_6: '科教北208', svg_7: '科教北201', svg_8: '科教北202',
  },
  科北3: {
    svg_1: '科教北306', svg_2: '科教北305', svg_3: '科教北304', svg_4: '科教北303',
    svg_5: '科教北307', svg_6: '科教北308', svg_7: '科教北301', svg_8: '科教北302',
  },
  科北4: {
    svg_1: '科教北406', svg_2: '科教北405', svg_3: '科教北404', svg_4: '科教北403',
    svg_5: '科教北407', svg_6: '科教北408', svg_7: '科教北401', svg_8: '科教北402',
  },
  科北5: {
    svg_1: '科教北506', svg_2: '科教北505', svg_3: '科教北504', svg_4: '科教北503',
    svg_5: '科教北507', svg_6: '科教北508', svg_7: '科教北501-1', svg_8: '科教北501-2',
  },
  科南1: { 科教南504: '科教南104', 科教南503: '科教南103', 科教南502: '科教南102', 科教南507: '科教南107', 科教南501: '科教南101', svg_6: '科教南105' },
  科南2: { 科教南504: '科教南204', 科教南503: '科教南203', 科教南502: '科教南202', 科教南507: '科教南207', 科教南501: '科教南201', svg_6: '科教南205' },
  科南3: { 科教南504: '科教南304', 科教南503: '科教南303', 科教南502: '科教南302', 科教南507: '科教南307', 科教南501: '科教南301', svg_6: '科教南305' },
  科南4: { 科教南504: '科教南404', 科教南503: '科教南403', 科教南502: '科教南402', 科教南507: '科教南407', 科教南501: '科教南401', svg_6: '科教南405' },
  科南5: { 科教南504: '科教南504', 科教南503: '科教南503', 科教南502: '科教南502', 科教南507: '科教南507', 科教南501: '科教南501', svg_6: '科教南505' },
};

const EXTRA_ROOM_PATHS = {
  科南1: [{ id: '科教南106', d: 'M347.5333 243.59998 L347.5333 154.59998 L409.5333 154.59998 L450.5333 200.59998 L450.5333 243.59998 Z' }],
  科南2: [{ id: '科教南206', d: 'M347.5333 243.59998 L347.5333 154.59998 L409.5333 154.59998 L450.5333 200.59998 L450.5333 243.59998 Z' }],
  科南3: [{ id: '科教南306', d: 'M347.5333 243.59998 L347.5333 154.59998 L409.5333 154.59998 L450.5333 200.59998 L450.5333 243.59998 Z' }],
  科南4: [{ id: '科教南406', d: 'M347.5333 243.59998 L347.5333 154.59998 L409.5333 154.59998 L450.5333 200.59998 L450.5333 243.59998 Z' }],
  科南5: [{ id: '科教南506', d: 'M347.5333 243.59998 L347.5333 154.59998 L409.5333 154.59998 L450.5333 200.59998 L450.5333 243.59998 Z' }],
};

function getAttr(tag, attr) {
  const match = tag.match(new RegExp(`(?:^|\\s)${attr}="([^"]+)"`));
  return match ? match[1] : null;
}

function parsePathBBox(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tokens || tokens.length === 0) return null;

  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  function mark(px, py) {
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  }

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[a-zA-Z]$/.test(token)) {
      cmd = token;
      i += 1;
      continue;
    }

    if (!cmd) return null;

    if (cmd === 'M' || cmd === 'L') {
      const nx = Number(tokens[i]);
      const ny = Number(tokens[i + 1]);
      x = nx;
      y = ny;
      if (cmd === 'M') {
        startX = x;
        startY = y;
        cmd = 'L';
      }
      mark(x, y);
      i += 2;
    } else if (cmd === 'm' || cmd === 'l') {
      const dx = Number(tokens[i]);
      const dy = Number(tokens[i + 1]);
      x += dx;
      y += dy;
      if (cmd === 'm') {
        startX = x;
        startY = y;
        cmd = 'l';
      }
      mark(x, y);
      i += 2;
    } else if (cmd === 'H') {
      x = Number(tokens[i]);
      mark(x, y);
      i += 1;
    } else if (cmd === 'h') {
      x += Number(tokens[i]);
      mark(x, y);
      i += 1;
    } else if (cmd === 'V') {
      y = Number(tokens[i]);
      mark(x, y);
      i += 1;
    } else if (cmd === 'v') {
      y += Number(tokens[i]);
      mark(x, y);
      i += 1;
    } else if (cmd === 'Z' || cmd === 'z') {
      x = startX;
      y = startY;
      mark(x, y);
      i += 1;
    } else {
      return null;
    }
  }

  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function parseShapes(svgText) {
  const tags = [...svgText.matchAll(/<(rect|path)\b[^>]*\/>/g)];
  return tags.map((m, index) => {
    const type = m[1];
    const tag = m[0];
    const id = getAttr(tag, 'id') || `${type}_${index + 1}`;

    if (type === 'rect') {
      const x = Number(getAttr(tag, 'x') || 0);
      const y = Number(getAttr(tag, 'y') || 0);
      const w = Number(getAttr(tag, 'width') || 0);
      const h = Number(getAttr(tag, 'height') || 0);
      return { index, type, tag, templateId: id, x, y, w, h };
    }

    const d = getAttr(tag, 'd') || '';
    const bbox = parsePathBBox(d);
    if (!bbox) {
      return { index, type, tag, templateId: id };
    }
    return { index, type, tag, templateId: id, ...bbox };
  });
}

function updateTagId(tag, newId) {
  if (/\bid="/.test(tag)) {
    return tag.replace(/\bid="[^"]*"/, `id="${newId}"`);
  }
  const isRect = tag.startsWith('<rect');
  if (isRect) return tag.replace('<rect', `<rect id="${newId}"`);
  return tag.replace('<path', `<path id="${newId}"`);
}

function isClassroomId(id) {
  return /^(?:[ABCD]\d{3}(?:-\d+)?|科教北\d{3}(?:-\d+)?|科教南\d{3}(?:-\d+)?)$/.test(id);
}

function displayLabel(id) {
  if (id.startsWith('科教北')) return `北${id.replace('科教北', '')}`;
  if (id.startsWith('科教南')) return `南${id.replace('科教南', '')}`;
  return id;
}

function labelForShape(roomId, shape) {
  if (typeof shape.x !== 'number' || typeof shape.y !== 'number' || typeof shape.w !== 'number' || typeof shape.h !== 'number') {
    return null;
  }
  const x = shape.x + shape.w / 2;
  const y = shape.y + shape.h / 2;
  return `<text data-generated-label="1" data-room-id="${roomId}" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, 'Microsoft YaHei', sans-serif" font-size="${LABEL_FONT_SIZE}" fill="#111111" pointer-events="none">${displayLabel(roomId)}</text>`;
}

function applyRoomIds(templateSvgText, shapes, idMap, extraPaths = []) {
  let shapeIndex = 0;
  const labels = [];
  const map = idMap || {};
  const pathLines = [];

  const withoutOldLabels = templateSvgText.replace(/<text\b[^>]*data-generated-label="1"[^>]*>[\s\S]*?<\/text>\s*/g, '');
  const updated = withoutOldLabels.replace(/<(rect|path)\b[^>]*\/>/g, (tag) => {
    const shape = shapes[shapeIndex++];
    if (!shape) return tag;

    const roomId = map[shape.templateId] || shape.templateId;
    const newTag = updateTagId(tag, roomId);
    if (isClassroomId(roomId)) {
      const label = labelForShape(roomId, shape);
      if (label) labels.push(label);
    }
    return newTag;
  });

  for (const extra of extraPaths) {
    pathLines.push(`<path id="${extra.id}" d="${extra.d}" fill="#fff" stroke="#000" />`);
    const box = parsePathBBox(extra.d);
    if (box) {
      const label = labelForShape(extra.id, box);
      if (label) labels.push(label);
    }
  }

  const injections = [...pathLines, ...labels];
  if (!injections.length) return updated;

  return updated.replace(/\s*<\/g>\s*<\/svg>\s*$/i, `\n  ${injections.join('\n  ')}\n </g>\n</svg>\n`);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function main() {
  ensureDir(OUTPUT_DIR);

  for (const task of FLOOR_TASKS) {
    const templatePath = path.join(TEMPLATE_DIR, task.template);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Missing template: ${templatePath}`);
    }

    const templateText = fs.readFileSync(templatePath, 'utf8');
    const shapes = parseShapes(templateText);
    const map = MANUAL_ROOM_MAPS[task.key];
    const extraPaths = EXTRA_ROOM_PATHS[task.key] || [];
    const output = applyRoomIds(templateText, shapes, map, extraPaths);
    const outputPath = path.join(OUTPUT_DIR, task.output);

    fs.writeFileSync(outputPath, output, 'utf8');
    const mappedCount = map ? Object.keys(map).length : 0;
    console.log(`generated ${path.relative(PROJECT_ROOT, outputPath)} mapped=${mappedCount}`);
  }
}

main();
