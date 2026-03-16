// --- Clients ---
export interface Client {
  id: number;
  name: string;
  color: string;
  daily_rate: number | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  name: string;
  color?: string;
  daily_rate?: number | null;
}

// --- Projects ---
export interface Project {
  id: number;
  client_id: number;
  name: string;
  description: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInput {
  client_id: number;
  name: string;
  description?: string | null;
}

// --- Tracking ---
export interface TrackingEntry {
  id: number;
  project_id: number;
  date: string;
  duration: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackingEntryWithDetails extends TrackingEntry {
  project_name: string;
  client_id: number;
  client_name: string;
  client_color: string;
}

export interface TrackingEntryInput {
  project_id: number;
  date: string;
  duration: number;
  description?: string | null;
}

// --- Settings ---
export interface Settings {
  time_format: 'hhmm' | 'decimal';
  hours_per_day: number;
  currency: string;
  launch_at_login: boolean;
}

// --- Setting result ---
export interface SetSettingResult {
  success: boolean;
  error?: string;
}

// --- Stats ---
export interface StatEntry {
  client_id: number;
  client_name: string;
  client_color: string;
  daily_rate: number | null;
  project_id: number;
  project_name: string;
  total_minutes: number;
}

// --- Update ---
export interface UpdateCheckResult {
  status: 'up-to-date' | 'update-available' | 'error';
  currentVersion: string;
  latestVersion?: string;
  downloadUrl?: string;
  error?: string;
}

// --- IPC API ---
export interface KronoBarAPI {
  clients: {
    list(includeArchived?: boolean): Promise<Client[]>;
    create(input: ClientInput): Promise<Client>;
    update(id: number, input: ClientInput): Promise<Client>;
    archive(id: number): Promise<void>;
    unarchive(id: number): Promise<void>;
  };
  projects: {
    list(clientId?: number, includeArchived?: boolean): Promise<Project[]>;
    create(input: ProjectInput): Promise<Project>;
    update(id: number, input: ProjectInput): Promise<Project>;
    archive(id: number): Promise<void>;
    unarchive(id: number): Promise<void>;
  };
  tracking: {
    list(date: string): Promise<TrackingEntryWithDetails[]>;
    listByRange(startDate: string, endDate: string, clientId?: number, projectId?: number): Promise<TrackingEntryWithDetails[]>;
    create(input: TrackingEntryInput): Promise<TrackingEntry>;
    update(id: number, input: TrackingEntryInput): Promise<TrackingEntry>;
    delete(id: number): Promise<void>;
    getTodayTotal(date: string): Promise<number>;
    getStats(startDate: string, endDate: string): Promise<StatEntry[]>;
    export(startDate: string, endDate: string): Promise<{ success: boolean }>;
  };
  settings: {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T): Promise<SetSettingResult>;
    getAll(): Promise<Settings>;
  };
  shell: {
    openExternal(url: string): Promise<void>;
  };
  app: {
    getVersion(): Promise<string>;
    checkForUpdate(): Promise<UpdateCheckResult>;
  };
  platform: NodeJS.Platform;
}
