import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './shared/constants/ipc-channels';
import type { KronoBarAPI } from './shared/types';

const api: KronoBarAPI = {
  clients: {
    list: (includeArchived) => ipcRenderer.invoke(IPC.CLIENTS_LIST, includeArchived),
    create: (input) => ipcRenderer.invoke(IPC.CLIENTS_CREATE, input),
    update: (id, input) => ipcRenderer.invoke(IPC.CLIENTS_UPDATE, id, input),
    archive: (id) => ipcRenderer.invoke(IPC.CLIENTS_ARCHIVE, id),
    unarchive: (id) => ipcRenderer.invoke(IPC.CLIENTS_UNARCHIVE, id),
  },
  projects: {
    list: (clientId, includeArchived) => ipcRenderer.invoke(IPC.PROJECTS_LIST, clientId, includeArchived),
    create: (input) => ipcRenderer.invoke(IPC.PROJECTS_CREATE, input),
    update: (id, input) => ipcRenderer.invoke(IPC.PROJECTS_UPDATE, id, input),
    archive: (id) => ipcRenderer.invoke(IPC.PROJECTS_ARCHIVE, id),
    unarchive: (id) => ipcRenderer.invoke(IPC.PROJECTS_UNARCHIVE, id),
  },
  tracking: {
    list: (date) => ipcRenderer.invoke(IPC.TRACKING_LIST, date),
    listByRange: (start, end, clientId, projectId) => ipcRenderer.invoke(IPC.TRACKING_LIST_BY_RANGE, start, end, clientId, projectId),
    create: (input) => ipcRenderer.invoke(IPC.TRACKING_CREATE, input),
    update: (id, input) => ipcRenderer.invoke(IPC.TRACKING_UPDATE, id, input),
    delete: (id) => ipcRenderer.invoke(IPC.TRACKING_DELETE, id),
    getTodayTotal: (date) => ipcRenderer.invoke(IPC.TRACKING_TODAY_TOTAL, date),
    getStats: (start, end) => ipcRenderer.invoke(IPC.TRACKING_STATS, start, end),
    export: (start, end) => ipcRenderer.invoke(IPC.TRACKING_EXPORT, start, end),
  },
  settings: {
    get: (key) => ipcRenderer.invoke(IPC.SETTINGS_GET, key),
    set: (key, value) => ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),
    getAll: () => ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke(IPC.OPEN_EXTERNAL, url),
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IPC.APP_VERSION),
    checkForUpdate: () => ipcRenderer.invoke(IPC.APP_CHECK_UPDATE),
  },
  platform: process.platform,
};

contextBridge.exposeInMainWorld('kronobar', api);
