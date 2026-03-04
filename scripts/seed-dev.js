/**
 * Creates a fresh dev database with demo data.
 * Replays all migrations then inserts seed data.
 *
 * Usage: node scripts/seed-dev.js
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '.dev-data', 'kronobar.db');
const WASM_PATH = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const initSqlJs = require(path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.js'));

// Same migrations as src/main/database/migrations.ts — keep in sync
const migrations = [
  {
    version: 1,
    sql: [
      `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#3B82F6',
        hourly_rate REAL,
        archived_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        archived_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )`,
      `CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        duration INTEGER NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('time_format', '"hhmm"')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('hours_per_day', '7')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', '"EUR"')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('launch_at_login', 'false')`,
      `CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date)`,
      `CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id)`,
      `CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id)`,
    ],
  },
  {
    version: 2,
    sql: [`ALTER TABLE clients RENAME COLUMN hourly_rate TO daily_rate`],
  },
  {
    version: 3,
    sql: [
      `ALTER TABLE time_entries RENAME TO tracking`,
      `DROP INDEX IF EXISTS idx_time_entries_date`,
      `DROP INDEX IF EXISTS idx_time_entries_project`,
      `CREATE INDEX IF NOT EXISTS idx_tracking_date ON tracking(date)`,
      `CREATE INDEX IF NOT EXISTS idx_tracking_project ON tracking(project_id)`,
    ],
  },
];

async function main() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const wasmBinary = fs.readFileSync(WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');

  // Run migrations
  for (const migration of migrations) {
    for (const sql of migration.sql) {
      db.run(sql);
    }
    db.run(`PRAGMA user_version = ${migration.version}`);
  }

  // --- Seed data ---
  const now = new Date().toISOString();

  const clients = [
    ['Studio ABC', '#EC4899', 400],
    ['Github', '#3B82F6', 300],
    ['Hôtel du Lac', '#10B981', 150],
    ['KronoBar', '#F97316', 0],
  ];
  for (const [name, color, rate] of clients) {
    db.run('INSERT INTO clients (name, color, daily_rate, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [name, color, rate, now, now]);
  }

  const projects = [
    [1, 'App Mobile'],
    [1, 'API'],
    [2, 'Projet'],
    [3, 'Site vitrine'],
    [4, 'Application MacOS'],
  ];
  for (const [clientId, name] of projects) {
    db.run('INSERT INTO projects (client_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [clientId, name, now, now]);
  }

  const entries = [
    // Week 1: Feb 17-21
    ['2026-02-17', 1, 180, 'Maquettes écrans login & dashboard'],
    ['2026-02-17', 1, 120, 'Intégration écran login'],
    ['2026-02-17', 5, 60,  'Setup projet Electron + React'],
    ['2026-02-18', 2, 210, 'Endpoints authentification JWT'],
    ['2026-02-18', 2, 90,  'Tests unitaires auth'],
    ['2026-02-18', 3, 120, 'Audit code PR #42'],
    ['2026-02-19', 4, 240, 'Intégration maquette page accueil'],
    ['2026-02-19', 4, 90,  'Formulaire de réservation'],
    ['2026-02-19', 5, 60,  'Architecture SQLite + migrations'],
    ['2026-02-20', 1, 240, 'Écran dashboard + graphiques'],
    ['2026-02-20', 2, 120, 'Endpoint CRUD projets'],
    ['2026-02-20', 3, 60,  'Review PR refactoring hooks'],
    ['2026-02-21', 4, 180, 'Page galerie photos + lightbox'],
    ['2026-02-21', 1, 120, 'Navigation bottom tabs'],
    ['2026-02-21', 5, 90,  'CRUD clients & projets'],
    // Week 2: Feb 23-27
    ['2026-02-23', 2, 180, 'Endpoints tracking + filtres date'],
    ['2026-02-23', 2, 120, 'Validation données & error handling'],
    ['2026-02-23', 5, 90,  'Vue Today + entrées du jour'],
    ['2026-02-24', 1, 210, 'Intégration API REST + state management'],
    ['2026-02-24', 1, 90,  'Gestion offline + cache local'],
    ['2026-02-24', 3, 120, 'Fix bug pagination issues'],
    ['2026-02-25', 4, 180, 'Page tarifs & disponibilités'],
    ['2026-02-25', 4, 120, 'Responsive mobile'],
    ['2026-02-25', 5, 60,  'Vue History + navigation périodes'],
    ['2026-02-26', 1, 180, 'Notifications push Firebase'],
    ['2026-02-26', 2, 150, 'Middleware rate limiting + logs'],
    ['2026-02-26', 3, 90,  'Code review + merge feature branch'],
    ['2026-02-27', 4, 150, 'SEO + meta tags + sitemap'],
    ['2026-02-27', 1, 120, 'Écran profil utilisateur'],
    ['2026-02-27', 5, 90,  'Stats + graphiques par client'],
    // Week 3: Mar 2-4
    ['2026-03-02', 2, 180, 'Endpoint export CSV'],
    ['2026-03-02', 1, 150, 'Tests E2E écrans principaux'],
    ['2026-03-02', 4, 90,  'Corrections retours client'],
    ['2026-03-03', 3, 180, 'Implémentation feature flags'],
    ['2026-03-03', 5, 120, 'Redesign UI complet'],
    ['2026-03-03', 4, 60,  'Mise en production'],
    ['2026-03-04', 1, 120, 'Fix crash écran dashboard'],
    ['2026-03-04', 5, 90,  'Fix packaging + install script'],
    ['2026-03-04', 3, 60,  'Review PR authentication'],
  ];

  const stmt = db.prepare('INSERT INTO tracking (project_id, date, duration, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  for (const [date, projectId, duration, desc] of entries) {
    stmt.run([projectId, date, duration, desc, now, now]);
  }
  stmt.free();

  // Save — patch user_version in SQLite header (bytes 60-63, big-endian)
  // because sql.js doesn't persist PRAGMA user_version in db.export()
  const data = Buffer.from(db.export());
  data.writeUInt32BE(migrations[migrations.length - 1].version, 60);
  fs.writeFileSync(DB_PATH, data);
  db.close();

  console.log(`✅ Dev database ready: ${clients.length} clients, ${projects.length} projects, ${entries.length} entries`);
}

main().catch(err => { console.error(err); process.exit(1); });
