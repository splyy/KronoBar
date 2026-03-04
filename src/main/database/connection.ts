import { app } from 'electron';
import type { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './migrations';

let db: Database | null = null;
let dbPath: string = '';

function getSqlJsPath(): string {
  const candidates = [
    // Development: node_modules relative to project root
    path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.js'),
    // Development: app.getAppPath() may be inside .vite/build/
    path.resolve(app.getAppPath(), '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.js'),
    // Production: copied into asar by afterCopy hook
    path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(`sql-wasm.js not found. Searched: ${candidates.join(', ')}`);
}

function getWasmPath(): string {
  const candidates = [
    // Development: node_modules relative to project root
    path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    // Development: app.getAppPath() may be inside .vite/build/
    path.resolve(app.getAppPath(), '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    // Production: packaged as extraResource
    path.join(process.resourcesPath ?? '', 'sql-wasm.wasm'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(`sql-wasm.wasm not found. Searched: ${candidates.join(', ')}`);
}

export async function initDatabase(): Promise<void> {
  // Load sql.js at runtime via dynamic require to avoid Vite bundling
  // Emscripten-generated CJS code that breaks when processed by Rollup
  const sqlJsPath = getSqlJsPath();
  // Use Function constructor to get a clean require that Vite won't transform
  const nodeRequire = typeof require !== 'undefined'
    ? require
    : Function('return require')() as NodeRequire;
  const initSqlJs = nodeRequire(sqlJsPath);

  const wasmPath = getWasmPath();
  const wasmBinary = fs.readFileSync(wasmPath);

  const SQL = await initSqlJs({ wasmBinary });

  // In dev mode, use a local DB in the project directory to avoid overwriting production data
  if (!app.isPackaged) {
    let root = app.getAppPath();
    console.log('[KronoBar] app.getAppPath():', root);
    if (!fs.existsSync(path.join(root, 'package.json'))) {
      root = path.resolve(root, '..', '..');
    }
    const devDir = path.join(root, '.dev-data');
    fs.mkdirSync(devDir, { recursive: true });
    dbPath = path.join(devDir, 'kronobar.db');
  } else {
    dbPath = path.join(app.getPath('userData'), 'kronobar.db');
  }
  console.log('[KronoBar] DB path:', dbPath, '| exists:', fs.existsSync(dbPath));

  // Load existing DB or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Run migrations
  runMigrations(db);

  // Save after migrations
  saveDatabase();
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function saveDatabase(): void {
  if (!db || !dbPath) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
