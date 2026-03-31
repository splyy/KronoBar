import type { Database } from 'sql.js';

interface Migration {
  version: number;
  sql: string[];
}

const migrations: Migration[] = [
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
    sql: [
      `ALTER TABLE clients RENAME COLUMN hourly_rate TO daily_rate`,
    ],
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
  {
    version: 4,
    sql: [
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('charge_rate', '0')`,
    ],
  },
  {
    version: 5,
    sql: [
      `ALTER TABLE tracking ADD COLUMN title TEXT`,
      `UPDATE tracking SET title = description, description = NULL WHERE description IS NOT NULL`,
    ],
  },
];

export function runMigrations(db: Database): void {
  const result = db.exec('PRAGMA user_version');
  const currentVersion = result.length > 0 ? (result[0].values[0][0] as number) : 0;

  const pending = migrations.filter((m) => m.version > currentVersion);
  if (pending.length === 0) return;

  for (const migration of pending) {
    db.run('BEGIN TRANSACTION');
    try {
      for (const sql of migration.sql) {
        db.run(sql);
      }
      db.run('COMMIT');
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
    // PRAGMA must be outside transaction to be persisted
    db.run(`PRAGMA user_version = ${migration.version}`);
  }
}
