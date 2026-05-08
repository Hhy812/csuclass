import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const jsonPath = path.resolve(process.cwd(), 'public/classroom_data.json');
const visitorPath = path.resolve(process.cwd(), 'visitors.json');
const dbPath = path.resolve(process.cwd(), 'data.db');

console.log('Reading data files...');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const visitors = fs.existsSync(visitorPath) ? JSON.parse(fs.readFileSync(visitorPath, 'utf8')) : { count: 3000 };

const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY,
        building TEXT,
        floor INTEGER,
        data JSON
    );

    CREATE TABLE IF NOT EXISTS buildings (
        id TEXT PRIMARY KEY,
        data JSON
    );

    CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value JSON
    );
`);

const insertVisitor = db.prepare('INSERT OR REPLACE INTO visitors (id, count) VALUES (1, ?)');
const insertClassroom = db.prepare('INSERT OR REPLACE INTO classrooms (id, building, floor, data) VALUES (?, ?, ?, ?)');
const insertBuilding = db.prepare('INSERT OR REPLACE INTO buildings (id, data) VALUES (?, ?)');
const insertMeta = db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)');

const migrate = db.transaction(() => {
    // 迁移访客数据
    insertVisitor.run(visitors.count || 100000);

    // 迁移教室数据
    if (data.classrooms) {
        for (const [id, info] of Object.entries(data.classrooms)) {
            insertClassroom.run(id, info.building, info.floor, JSON.stringify(info));
        }
    }

    // 迁移楼栋数据
    if (data.buildings) {
        for (const [id, info] of Object.entries(data.buildings)) {
            insertBuilding.run(id, JSON.stringify(info));
        }
    }

    // 迁移其他元数据
    for (const [key, value] of Object.entries(data)) {
        if (key !== 'classrooms' && key !== 'buildings') {
            insertMeta.run(key, JSON.stringify(value));
        }
    }
});

console.log('Starting migration...');
migrate();
console.log('Migration completed successfully.');
db.close();
