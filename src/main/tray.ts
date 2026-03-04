import { app, BrowserWindow, Menu, nativeImage, screen, Tray } from 'electron';
import path from 'path';
import fs from 'fs';

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 500;
const WINDOW_MIN_WIDTH = 380;
const WINDOW_MIN_HEIGHT = 400;
const WINDOW_MAX_WIDTH = 700;
const WINDOW_MAX_HEIGHT = 800;

const SIZE_FILE = 'window-size.json';

interface WindowSize {
  width: number;
  height: number;
}

export class TrayManager {
  private static instance: TrayManager | null = null;

  private tray: Tray;
  private window: BrowserWindow;

  private constructor() {
    this.tray = this.createTray();
    this.window = this.createWindow();
    this.setupEventListeners();
  }

  static getInstance(): TrayManager {
    if (!TrayManager.instance) {
      TrayManager.instance = new TrayManager();
    }
    return TrayManager.instance;
  }

  private createTray(): Tray {
    const iconPath = this.getIconPath();
    let icon = nativeImage.createFromPath(iconPath);
    // Windows tray icons should be 16x16
    if (process.platform === 'win32') {
      icon = icon.resize({ width: 16, height: 16 });
    }
    const tray = new Tray(icon);
    tray.setToolTip('KronoBar');
    return tray;
  }

  private getIconPath(): string {
    const isMac = process.platform === 'darwin';
    const iconName = isMac ? 'iconTemplate.png' : 'icon.png';

    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'icons', iconName);
    }
    return path.join(app.getAppPath(), 'assets', 'icons', iconName);
  }

  private createWindow(): BrowserWindow {
    const savedSize = this.loadWindowSize();
    const isMac = process.platform === 'darwin';

    const window = new BrowserWindow({
      width: savedSize.width,
      height: savedSize.height,
      minWidth: WINDOW_MIN_WIDTH,
      minHeight: WINDOW_MIN_HEIGHT,
      maxWidth: WINDOW_MAX_WIDTH,
      maxHeight: WINDOW_MAX_HEIGHT,
      show: false,
      frame: false,
      resizable: true,
      movable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      ...(isMac
        ? { vibrancy: 'menu' as const, visualEffectState: 'active' as const, transparent: true }
        : { backgroundMaterial: 'acrylic' as const }
      ),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load the renderer
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    return window;
  }

  private setupEventListeners(): void {
    // Toggle window on tray click
    this.tray.on('click', () => {
      this.toggleWindow();
    });

    // Right-click context menu
    this.tray.on('right-click', () => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Quitter KronoBar',
          click: () => app.quit(),
        },
      ]);
      this.tray.popUpContextMenu(contextMenu);
    });

    // Hide on blur
    this.window.on('blur', () => {
      this.hideWindow();
    });

    // Escape closes popup
    this.window.webContents.on('before-input-event', (_event, input) => {
      if (input.key === 'Escape' && input.type === 'keyDown') {
        this.hideWindow();
      }
    });

    // Save size on resize
    this.window.on('resize', () => {
      const [width, height] = this.window.getSize();
      this.saveWindowSize({ width, height });
    });
  }

  toggleWindow(): void {
    if (this.window.isVisible()) {
      this.hideWindow();
    } else {
      this.showWindow();
    }
  }

  showWindow(): void {
    this.positionWindow();
    this.window.show();
    this.window.focus();
  }

  private hideWindow(): void {
    this.window.hide();
  }

  private positionWindow(): void {
    const trayBounds = this.tray.getBounds();
    const windowBounds = this.window.getBounds();
    const display = screen.getDisplayNearestPoint({
      x: trayBounds.x,
      y: trayBounds.y,
    });
    const workArea = display.workArea;

    // Center horizontally on tray icon
    let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);

    let y: number;
    if (process.platform === 'darwin') {
      // macOS: taskbar at top, position below tray
      y = Math.round(trayBounds.y + trayBounds.height);
    } else {
      // Windows/Linux: taskbar at bottom, position above tray
      y = Math.round(trayBounds.y - windowBounds.height);
    }

    // Clamp to work area bounds
    x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - windowBounds.width));
    y = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - windowBounds.height));

    this.window.setPosition(x, y, false);
  }

  private getSizeFilePath(): string {
    return path.join(app.getPath('userData'), SIZE_FILE);
  }

  private loadWindowSize(): WindowSize {
    try {
      const data = fs.readFileSync(this.getSizeFilePath(), 'utf-8');
      const size = JSON.parse(data) as WindowSize;
      if (size.width && size.height) {
        return size;
      }
    } catch {
      // File doesn't exist or is invalid
    }
    return { width: WINDOW_WIDTH, height: WINDOW_HEIGHT };
  }

  private saveWindowSize(size: WindowSize): void {
    try {
      fs.writeFileSync(this.getSizeFilePath(), JSON.stringify(size));
    } catch {
      // Ignore write errors
    }
  }
}
