import { ipcMain, shell, dialog, app } from 'electron';
import fs from 'fs';
// eslint-disable-next-line import/no-unresolved
import { IPC } from '@/shared/constants/ipc-channels';
import type { UpdateCheckResult } from '@/shared/types';
import * as clientsService from '../services/clients';
import * as projectsService from '../services/projects';
import * as trackingService from '../services/tracking';
import * as settingsService from '../services/settings';

export function registerIpcHandlers(): void {
  // --- Clients ---
  ipcMain.handle(IPC.CLIENTS_LIST, (_event, includeArchived?: boolean) => {
    return clientsService.listClients(includeArchived);
  });

  ipcMain.handle(IPC.CLIENTS_CREATE, (_event, input) => {
    return clientsService.createClient(input);
  });

  ipcMain.handle(IPC.CLIENTS_UPDATE, (_event, id: number, input) => {
    return clientsService.updateClient(id, input);
  });

  ipcMain.handle(IPC.CLIENTS_ARCHIVE, (_event, id: number) => {
    clientsService.archiveClient(id);
  });

  ipcMain.handle(IPC.CLIENTS_UNARCHIVE, (_event, id: number) => {
    clientsService.unarchiveClient(id);
  });

  // --- Projects ---
  ipcMain.handle(IPC.PROJECTS_LIST, (_event, clientId?: number, includeArchived?: boolean) => {
    return projectsService.listProjects(clientId, includeArchived);
  });

  ipcMain.handle(IPC.PROJECTS_CREATE, (_event, input) => {
    return projectsService.createProject(input);
  });

  ipcMain.handle(IPC.PROJECTS_UPDATE, (_event, id: number, input) => {
    return projectsService.updateProject(id, input);
  });

  ipcMain.handle(IPC.PROJECTS_ARCHIVE, (_event, id: number) => {
    projectsService.archiveProject(id);
  });

  ipcMain.handle(IPC.PROJECTS_UNARCHIVE, (_event, id: number) => {
    projectsService.unarchiveProject(id);
  });

  // --- Tracking ---
  ipcMain.handle(IPC.TRACKING_LIST, (_event, date: string) => {
    return trackingService.listTracking(date);
  });

  ipcMain.handle(IPC.TRACKING_LIST_BY_RANGE, (_event, startDate: string, endDate: string, clientId?: number, projectId?: number) => {
    return trackingService.listTrackingByRange(startDate, endDate, clientId, projectId);
  });

  ipcMain.handle(IPC.TRACKING_CREATE, (_event, input) => {
    return trackingService.createTrackingEntry(input);
  });

  ipcMain.handle(IPC.TRACKING_UPDATE, (_event, id: number, input) => {
    return trackingService.updateTrackingEntry(id, input);
  });

  ipcMain.handle(IPC.TRACKING_DELETE, (_event, id: number) => {
    trackingService.deleteTrackingEntry(id);
  });

  ipcMain.handle(IPC.TRACKING_TODAY_TOTAL, (_event, date: string) => {
    return trackingService.getTodayTotal(date);
  });

  ipcMain.handle(IPC.TRACKING_STATS, (_event, startDate: string, endDate: string) => {
    return trackingService.getStatsByPeriod(startDate, endDate);
  });

  ipcMain.handle(IPC.TRACKING_EXPORT, async (_event, startDate: string, endDate: string) => {
    const { headers, rows } = trackingService.exportTrackingData(startDate, endDate);

    const escapeCsv = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ];
    const csv = csvLines.join('\n');

    const result = await dialog.showSaveDialog({
      title: 'Exporter les données',
      defaultPath: `kronobar-export-${startDate}-${endDate}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false };
    }

    fs.writeFileSync(result.filePath, '\uFEFF' + csv, 'utf-8');
    return { success: true };
  });

  // --- Settings ---
  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => {
    return settingsService.getSetting(key);
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: unknown) => {
    return settingsService.setSetting(key, value);
  });

  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    return settingsService.getAllSettings();
  });

  // --- Shell ---
  ipcMain.handle(IPC.OPEN_EXTERNAL, (_event, url: string) => {
    if (typeof url !== 'string' || !url.startsWith('https://')) {
      throw new Error('Only https URLs are allowed');
    }
    return shell.openExternal(url);
  });

  // --- App ---
  ipcMain.handle(IPC.APP_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(IPC.APP_CHECK_UPDATE, async (): Promise<UpdateCheckResult> => {
    const currentVersion = app.getVersion();
    try {
      const response = await fetch(
        'https://api.github.com/repos/splyy/KronoBar/releases/latest',
        { headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'KronoBar' } }
      );
      if (!response.ok) {
        return { status: 'error', currentVersion, error: `GitHub API error: ${response.status}` };
      }
      const data = await response.json() as { tag_name: string; html_url: string };
      const latestVersion = data.tag_name.replace(/^v/, '');
      if (compareVersions(latestVersion, currentVersion) > 0) {
        return { status: 'update-available', currentVersion, latestVersion, downloadUrl: data.html_url };
      }
      return { status: 'up-to-date', currentVersion, latestVersion };
    } catch (err) {
      return { status: 'error', currentVersion, error: (err as Error).message };
    }
  });
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
