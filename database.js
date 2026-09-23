const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'arcade.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize tables
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      game TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_scores_game ON scores(game)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_scores_player ON scores(player_id)`);

  // Insert default announcement if none exists
  const result = db.exec('SELECT COUNT(*) as cnt FROM announcements');
  const count = result[0]?.values[0][0] || 0;
  if (count === 0) {
    db.run('INSERT INTO announcements (title, content) VALUES (?, ?)',
      ['Welcome to ArcadeZone!', 'Play 5 classic games, compete for the highest score, and have fun!']);
  }

  saveDatabase();
  return db;
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Convert BigInt to Number for JSON serialization
function sanitize(val) {
  if (typeof val === 'bigint') return Number(val);
  return val;
}

function sanitizeRow(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = sanitize(v);
  return out;
}

// Helper: run a query and return all rows as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(sanitizeRow(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row as object
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// Helper: run a write query (INSERT/UPDATE/DELETE)
function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  // sql.js last_insert_rowid() is unreliable; use MAX(id) instead
  const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
  if (tableMatch) {
    const table = tableMatch[1];
    const lastRow = queryOne(`SELECT MAX(id) as id FROM "${table}"`);
    return { lastInsertRowid: lastRow ? (lastRow.id || 0) : 0, changes: 1 };
  }
  return { lastInsertRowid: 0, changes: db.getRowsModified() };
}

module.exports = { initDatabase, queryAll, queryOne, run, saveDatabase, getDb: () => db };
