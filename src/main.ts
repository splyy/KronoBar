import { app, globalShortcut } from 'electron';
import { TrayManager } from './main/tray';
import { registerIpcHandlers } from './main/ipc/handlers';
import { initDatabase, closeDatabase } from './main/database/connection';
import { syncLoginItemSetting } from './main/services/settings';
import { handleSquirrelEvents } from './main/squirrel';

// Windows: handle Squirrel install/update/uninstall events
if (handleSquirrelEvents()) {
  process.exit(0);
}

// Hide dock icon (macOS only — menu bar app)
if (process.platform === 'darwin') {
  app.dock?.hide();
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let trayManager: TrayManager | null = null;

app.whenReady().then(async () => {
  try {
    console.log('[KronoBar] App ready, initializing...');
    await initDatabase();
    console.log('[KronoBar] Database initialized');
    registerIpcHandlers();
    console.log('[KronoBar] IPC handlers registered');
    syncLoginItemSetting();
    console.log('[KronoBar] Login item synced');
    trayManager = TrayManager.getInstance();
    console.log('[KronoBar] Tray created');
    globalShortcut.register('CommandOrControl+Shift+K', () => {
      trayManager?.toggleWindow();
    });
    console.log('[KronoBar] Global shortcut registered');

    // Update check is handled via IPC (manual check in Settings + badge)
    // No forced auto-download — the user decides when to update
  } catch (err) {
    console.error('[KronoBar] Fatal startup error:', err);
  }
});

app.on('second-instance', () => {
  trayManager?.showWindow();
});

// macOS: keep app running when all windows closed
app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  closeDatabase();
});
