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
    const icon = nativeImage.createFromPath(iconPath);
    const tray = new Tray(icon);
    tray.setToolTip('KronoBar');
    return tray;
  }

  private getIconPath(): string {
    // In production, icons are in the resources folder
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'icons', 'iconTemplate.png');
    }
    return path.join(app.getAppPath(), 'assets', 'icons', 'iconTemplate.png');
  }

  private createWindow(): BrowserWindow {
    const savedSize = this.loadWindowSize();

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
      vibrancy: 'menu',
      visualEffectState: 'active',
      transparent: true,
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

    // Center horizontally under tray icon
    let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
    // Position just below tray
    let y = Math.round(trayBounds.y + trayBounds.height);

    // Clamp to display bounds
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
