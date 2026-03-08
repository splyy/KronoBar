import { app } from 'electron';
import { getDatabase, saveDatabase } from '../database/connection';
import { queryAll, queryOne, run } from '../database/helpers';
import type { Settings } from '../../shared/types';

/**
 * Apply the login item setting at the OS level and verify it took effect.
 * Returns true if the OS confirms the setting, false otherwise.
 */
function applyLoginItemSetting(enabled: boolean): boolean {
  if (!app.isPackaged) {
    console.log('[KronoBar] Skipping login item (dev mode)');
    return true; // Don't block in dev
  }

  app.setLoginItemSettings({
    openAtLogin: enabled,
    ...(process.platform === 'darwin' ? { name: 'KronoBar' } : {}),
  });

  const status = app.getLoginItemSettings();
  console.log('[KronoBar] Login item status:', JSON.stringify(status));

  // Verify the OS actually registered the change
  if (status.openAtLogin !== enabled) {
    console.error(
      `[KronoBar] Login item mismatch: requested ${enabled}, OS reports ${status.openAtLogin}.` +
      (process.platform === 'darwin'
        ? ' The app may not be code-signed or not in /Applications.'
        : ' Check that the app was installed correctly.')
    );
    return false;
  }

  return true;
}

export function syncLoginItemSetting(): void {
  const enabled = getSetting<boolean>('launch_at_login') ?? false;
  const success = applyLoginItemSetting(enabled);
  if (!success && enabled) {
    // OS rejected — reset the DB setting to avoid a confusing toggle state
    run(getDatabase(), "INSERT OR REPLACE INTO settings (key, value) VALUES ('launch_at_login', 'false')", []);
    saveDatabase();
    console.warn('[KronoBar] Reset launch_at_login to false (OS rejected)');
  }
}

export function getSetting<T>(key: string): T | undefined {
  const db = getDatabase();
  const row = queryOne<{ value: string }>(db, 'SELECT value FROM settings WHERE key = ?', [key]);
  if (!row) return undefined;
  return JSON.parse(row.value) as T;
}

export interface SetSettingResult {
  success: boolean;
  error?: string;
}

export function setSetting<T>(key: string, value: T): SetSettingResult {
  const db = getDatabase();
  run(db, 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
  saveDatabase();

  if (key === 'launch_at_login') {
    const ok = applyLoginItemSetting(Boolean(value));
    if (!ok) {
      // Revert the setting in DB since the OS rejected it
      run(db, "INSERT OR REPLACE INTO settings (key, value) VALUES ('launch_at_login', 'false')", []);
      saveDatabase();
      return {
        success: false,
        error: process.platform === 'darwin'
          ? "Impossible d'activer le lancement au démarrage. Vérifiez que l'app est dans /Applications et qu'elle est signée."
          : "Impossible d'activer le lancement au démarrage. Vérifiez que l'application est correctement installée.",
      };
    }
  }

  return { success: true };
}

export function getAllSettings(): Settings {
  const db = getDatabase();
  const rows = queryAll<{ key: string; value: string }>(db, 'SELECT key, value FROM settings');
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = JSON.parse(row.value);
  }
  return settings as unknown as Settings;
}
