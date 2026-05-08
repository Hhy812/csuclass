import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const VISIT_TZ = process.env.VISIT_TZ || 'Asia/Shanghai';
const DATA_DB_PATH = process.env.DATA_DB_PATH
    ? path.resolve(process.env.DATA_DB_PATH)
    : path.resolve(process.cwd(), 'data.db');

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VISIT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

// ===================== 安全防护 =====================

// 1. gzip 压缩
app.use(compression());

// 2. 安全 HTTP 响应头 + CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],  // shadcn/ui 需要内联样式
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'", "https://pd.qq.com", "https://*.qq.com"],  // 允许 QQ 频道嵌入
            formAction: ["'self'"],
        },
    },
}));

// 3. 限制请求体大小，防止大 payload 攻击
app.use(express.json({ limit: '1kb' }));

// 4. 全局速率限制：所有请求，每个 IP 每分钟最多 60 次
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: '请求过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// 5. API 专用速率限制：更严格
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: '接口请求过于频繁' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// 6. 写入接口极严格限制（防止 CC 刷写入）
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10, // 每分钟最多 10 次写入
    message: { error: '操作过于频繁' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 7. API 防盗链
app.use('/api/', (req, res, next) => {
    const referer = req.headers.referer || '';
    if (referer && !referer.includes('ilovecsu.top') && !referer.includes('localhost')) {
        console.warn(`[Blocked] Unauthorized referer: ${referer}`);
        return res.status(403).json({ error: '禁止访问' });
    }
    next();
});

// ===================== 数据库 =====================

const db = new Database(DATA_DB_PATH);
console.log(`[DB] using sqlite file: ${DATA_DB_PATH}`);

// 开启 WAL 模式，提升并发读性能
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        count INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO visitors (id, count) VALUES (1, 3000);

    CREATE TABLE IF NOT EXISTS user_prefs (
        uid TEXT PRIMARY KEY,
        prefs TEXT NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visit_daily (
        date TEXT PRIMARY KEY,
        pv INTEGER NOT NULL DEFAULT 0,
        uv INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS visit_seen (
        date TEXT NOT NULL,
        uid_hash TEXT NOT NULL,
        last_seen INTEGER NOT NULL,
        PRIMARY KEY (date, uid_hash)
    );
`);

const stmtIncrement = db.prepare('UPDATE visitors SET count = count + 1 WHERE id = 1');
const stmtGetVisit = db.prepare('SELECT count FROM visitors WHERE id = 1');
const stmtGetPrefs = db.prepare('SELECT prefs FROM user_prefs WHERE uid = ?');
const stmtSetPrefs = db.prepare('INSERT OR REPLACE INTO user_prefs (uid, prefs, updated_at) VALUES (?, ?, ?)');
const stmtIncDailyPv = db.prepare(`
    INSERT INTO visit_daily (date, pv, uv) VALUES (?, 1, 0)
    ON CONFLICT(date) DO UPDATE SET pv = pv + 1
`);
const stmtIncDailyUv = db.prepare('UPDATE visit_daily SET uv = uv + 1 WHERE date = ?');
const stmtInsertDailySeen = db.prepare('INSERT OR IGNORE INTO visit_seen (date, uid_hash, last_seen) VALUES (?, ?, ?)');
const stmtTouchDailySeen = db.prepare('UPDATE visit_seen SET last_seen = ? WHERE date = ? AND uid_hash = ?');
const stmtGetDailyStats = db.prepare('SELECT pv, uv FROM visit_daily WHERE date = ?');
const stmtDeleteExpiredPrefs = db.prepare('DELETE FROM user_prefs WHERE updated_at < ?');
const stmtDeleteExpiredSeen = db.prepare('DELETE FROM visit_seen WHERE date < ?');

const visitTx = db.transaction((dateKey, uidHash, now) => {
    stmtIncrement.run();
    stmtIncDailyPv.run(dateKey);
    const insertResult = stmtInsertDailySeen.run(dateKey, uidHash, now);
    if (insertResult.changes > 0) {
        stmtIncDailyUv.run(dateKey);
    } else {
        stmtTouchDailySeen.run(now, dateKey, uidHash);
    }
    const total = stmtGetVisit.get().count;
    const today = stmtGetDailyStats.get(dateKey) || { pv: 0, uv: 0 };
    return { total, pv: today.pv, uv: today.uv };
});

// 定期清理过期偏好记录
setInterval(() => {
    const now = Date.now();
    const prefCutoff = now - 30 * 24 * 60 * 60 * 1000;
    stmtDeleteExpiredPrefs.run(prefCutoff);
    const seenCutoffDate = dateKeyFormatter.format(now - 90 * 24 * 60 * 60 * 1000);
    stmtDeleteExpiredSeen.run(seenCutoffDate);
}, 24 * 60 * 60 * 1000);

// ===================== 内存缓存 =====================

function loadClassroomData() {
    const classrooms = {};
    db.prepare('SELECT id, data FROM classrooms').all().forEach(row => {
        classrooms[row.id] = JSON.parse(row.data);
    });
    const buildings = {};
    db.prepare('SELECT id, data FROM buildings').all().forEach(row => {
        buildings[row.id] = JSON.parse(row.data);
    });
    const result = { classrooms, buildings };
    db.prepare('SELECT key, value FROM meta').all().forEach(row => {
        result[row.key] = JSON.parse(row.value);
    });
    return result;
}

let cachedData = loadClassroomData();
let cachedJson = JSON.stringify(cachedData);
let cachedEtag = `"${crypto.createHash('md5').update(cachedJson).digest('hex')}"`;
console.log(`Loaded ${Object.keys(cachedData.classrooms).length} classrooms, ${Object.keys(cachedData.buildings).length} buildings`);

// ===================== Cookie 工具 =====================

function getDateKey(ts = Date.now()) {
    return dateKeyFormatter.format(ts);
}

function hashUid(uid) {
    return crypto.createHash('sha256').update(uid).digest('hex');
}

function getUserId(req, res) {
    let uid = req.headers.cookie?.match(/csu_uid=([a-f0-9-]{36})/)?.[1]; // 只匹配合法 UUID
    if (!uid) {
        uid = crypto.randomUUID();
        const forwardedProto = (req.headers['x-forwarded-proto'] || '').toString().toLowerCase();
        const isSecure = req.secure || forwardedProto === 'https';
        const secureAttr = isSecure ? '; Secure' : '';
        res.setHeader('Set-Cookie', `csu_uid=${uid}; Path=/; Max-Age=${30 * 24 * 3600}; SameSite=Lax${secureAttr}; HttpOnly`);
    }
    return uid;
}

// ===================== API 路由 =====================

// 访客统计
app.post('/api/visit', writeLimiter, (req, res) => {
    try {
        const uid = getUserId(req, res);
        const dateKey = getDateKey();
        const result = visitTx(dateKey, hashUid(uid), Date.now());
        res.json({
            count: result.total, // 兼容旧前端字段
            total: result.total,
            pv: result.pv,
            uv: result.uv,
            date: dateKey,
        });
    } catch (error) {
        console.error('visit log error', error);
        res.status(500).json({ error: '写入失败' });
    }
});

app.get('/api/visit', (req, res) => {
    try {
        const row = stmtGetVisit.get();
        const dateKey = getDateKey();
        const daily = stmtGetDailyStats.get(dateKey) || { pv: 0, uv: 0 };
        res.json({
            count: row.count,
            total: row.count,
            pv: daily.pv,
            uv: daily.uv,
            date: dateKey,
        });
    } catch (error) {
        res.status(500).json({ error: '读取失败' });
    }
});

// 用户偏好
app.get('/api/prefs', (req, res) => {
    const uid = getUserId(req, res);
    const row = stmtGetPrefs.get(uid);
    res.json(row ? JSON.parse(row.prefs) : null);
});

app.post('/api/prefs', writeLimiter, (req, res) => {
    const uid = getUserId(req, res);
    const body = req.body;

    // 校验偏好数据格式，防止恶意注入
    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: '无效数据' });
    }
    const allowed = ['building', 'floor', 'week', 'day', 'slots'];
    const cleaned = {};
    for (const key of allowed) {
        if (body[key] !== undefined) cleaned[key] = body[key];
    }

    // 限制存储大小（防止塞入超大数据）
    const json = JSON.stringify(cleaned);
    if (json.length > 500) {
        return res.status(400).json({ error: '数据过大' });
    }

    stmtSetPrefs.run(uid, json, Date.now());
    res.json({ ok: true });
});

// 教室数据（内存缓存直出 + ETag 协商缓存）
app.get('/api/classroom_data', (req, res) => {
    // 如果客户端已有最新数据，直接 304，不传输任何内容
    if (req.headers['if-none-match'] === cachedEtag) {
        return res.status(304).end();
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('ETag', cachedEtag);
    res.send(cachedJson);
});

// 手动刷新缓存（仅本地/内网可调用）
app.post('/api/reload', (req, res) => {
    const ip = req.ip;
    if (ip !== '127.0.0.1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
        return res.status(403).json({ error: '仅允许本地调用' });
    }
    cachedData = loadClassroomData();
    cachedJson = JSON.stringify(cachedData);
    cachedEtag = `"${crypto.createHash('md5').update(cachedJson).digest('hex')}"`;
    res.json({ ok: true, classrooms: Object.keys(cachedData.classrooms).length });
});

// ===================== 静态文件 =====================

// 禁止访问敏感文件
app.use((req, res, next) => {
    const forbidden = ['.db', '.sqlite', '.env', '.git', '.json'];
    const ext = path.extname(req.path).toLowerCase();
    const basename = path.basename(req.path).toLowerCase();

    // 阻止直接访问数据库、环境变量、源码配置等文件
    if (forbidden.includes(ext) && !req.path.startsWith('/api/')) {
        return res.status(404).send('Not Found');
    }
    // 阻止访问隐藏文件和目录（但放行 .well-known）
    if (basename.startsWith('.') && !req.path.startsWith('/.well-known/')) {
        return res.status(404).send('Not Found');
    }
    // 阻止访问 node_modules
    if (req.path.includes('node_modules')) {
        return res.status(404).send('Not Found');
    }
    // 阻止访问 server.js 源码
    if (basename === 'server.js' || basename === 'package.json' || basename === 'package-lock.json') {
        return res.status(404).send('Not Found');
    }
    next();
});

app.use(express.static(path.resolve(process.cwd(), 'dist'), {
    dotfiles: 'deny', // 禁止访问 .xxx 隐藏文件
    index: false,      // 禁止目录列表
}));

// 禁止直接访问数据文件
app.get('/classroom_data.json', (req, res) => {
    res.status(404).send('Not Found');
});

// SPA 兜底
app.get('*', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
});

// ===================== 错误处理 =====================

// 全局错误处理，防止报错信息泄露服务器细节
app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ error: '服务器内部错误' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
