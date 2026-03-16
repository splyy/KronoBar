export const IPC = {
  // Clients
  CLIENTS_LIST: 'clients:list',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_ARCHIVE: 'clients:archive',
  CLIENTS_UNARCHIVE: 'clients:unarchive',

  // Projects
  PROJECTS_LIST: 'projects:list',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_UPDATE: 'projects:update',
  PROJECTS_ARCHIVE: 'projects:archive',
  PROJECTS_UNARCHIVE: 'projects:unarchive',

  // Tracking
  TRACKING_LIST: 'tracking:list',
  TRACKING_LIST_BY_RANGE: 'tracking:listByRange',
  TRACKING_CREATE: 'tracking:create',
  TRACKING_UPDATE: 'tracking:update',
  TRACKING_DELETE: 'tracking:delete',
  TRACKING_TODAY_TOTAL: 'tracking:todayTotal',
  TRACKING_STATS: 'tracking:stats',
  TRACKING_EXPORT: 'tracking:export',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',

  // Shell
  OPEN_EXTERNAL: 'shell:openExternal',

  // App
  APP_VERSION: 'app:version',
  APP_CHECK_UPDATE: 'app:checkUpdate',
} as const;
