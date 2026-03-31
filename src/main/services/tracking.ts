import { getDatabase, saveDatabase } from '../database/connection';
import { queryAll, queryOne, run } from '../database/helpers';
import type { TrackingEntry, TrackingEntryInput, TrackingEntryWithDetails } from '../../shared/types';

export function listTracking(date: string): TrackingEntryWithDetails[] {
  const db = getDatabase();
  return queryAll<TrackingEntryWithDetails>(
    db,
    `SELECT te.*, p.name as project_name, p.client_id, c.name as client_name, c.color as client_color
     FROM tracking te
     JOIN projects p ON te.project_id = p.id
     JOIN clients c ON p.client_id = c.id
     WHERE te.date = ?
     ORDER BY te.created_at DESC`,
    [date]
  );
}

export function listTrackingByRange(
  startDate: string,
  endDate: string,
  clientId?: number,
  projectId?: number,
): TrackingEntryWithDetails[] {
  const db = getDatabase();
  const conditions = ['te.date >= ?', 'te.date <= ?'];
  const params: unknown[] = [startDate, endDate];

  if (clientId) {
    conditions.push('c.id = ?');
    params.push(clientId);
  }
  if (projectId) {
    conditions.push('te.project_id = ?');
    params.push(projectId);
  }

  return queryAll<TrackingEntryWithDetails>(
    db,
    `SELECT te.*, p.name as project_name, p.client_id, c.name as client_name, c.color as client_color
     FROM tracking te
     JOIN projects p ON te.project_id = p.id
     JOIN clients c ON p.client_id = c.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY te.date DESC, te.created_at DESC`,
    params,
  );
}

export function getTrackingEntry(id: number): TrackingEntry | undefined {
  const db = getDatabase();
  return queryOne<TrackingEntry>(db, 'SELECT * FROM tracking WHERE id = ?', [id]);
}

export function createTrackingEntry(input: TrackingEntryInput): TrackingEntry {
  const db = getDatabase();
  const { lastId } = run(
    db,
    'INSERT INTO tracking (project_id, date, duration, title, description) VALUES (?, ?, ?, ?, ?)',
    [input.project_id, input.date, input.duration, input.title ?? null, input.description ?? null]
  );
  saveDatabase();
  return getTrackingEntry(lastId)!;
}

export function updateTrackingEntry(id: number, input: TrackingEntryInput): TrackingEntry {
  const db = getDatabase();
  run(
    db,
    `UPDATE tracking SET project_id = ?, date = ?, duration = ?, title = ?, description = ?, updated_at = datetime('now') WHERE id = ?`,
    [input.project_id, input.date, input.duration, input.title ?? null, input.description ?? null, id]
  );
  saveDatabase();
  return getTrackingEntry(id)!;
}

export function deleteTrackingEntry(id: number): void {
  const db = getDatabase();
  run(db, 'DELETE FROM tracking WHERE id = ?', [id]);
  saveDatabase();
}

export function getTodayTotal(date: string): number {
  const db = getDatabase();
  const result = queryOne<{ total: number }>(
    db,
    'SELECT COALESCE(SUM(duration), 0) as total FROM tracking WHERE date = ?',
    [date]
  );
  return result?.total ?? 0;
}

export function exportTrackingData(
  startDate: string,
  endDate: string,
): { headers: string[]; rows: string[][] } {
  const db = getDatabase();
  const entries = queryAll<TrackingEntryWithDetails & { daily_rate: number | null; title: string | null }>(
    db,
    `SELECT te.*, p.name as project_name, p.client_id, c.name as client_name, c.color as client_color, c.daily_rate
     FROM tracking te
     JOIN projects p ON te.project_id = p.id
     JOIN clients c ON p.client_id = c.id
     WHERE te.date >= ? AND te.date <= ?
     ORDER BY te.date ASC, c.name ASC, p.name ASC`,
    [startDate, endDate],
  );

  const headers = ['Date', 'Client', 'Projet', 'Titre', 'Durée (min)', 'Durée (h)', 'TJM', 'Description'];
  const rows = entries.map((e) => [
    e.date,
    e.client_name,
    e.project_name,
    e.title ?? '',
    String(e.duration),
    (e.duration / 60).toFixed(2),
    e.daily_rate != null ? String(e.daily_rate) : '',
    e.description ?? '',
  ]);

  return { headers, rows };
}

export function exportAllData(): {
  clients: { headers: string[]; rows: string[][] };
  projects: { headers: string[]; rows: string[][] };
  tracking: { headers: string[]; rows: string[][] };
  settings: { headers: string[]; rows: string[][] };
} {
  const db = getDatabase();

  // Clients
  const clients = queryAll<{ id: number; name: string; color: string; daily_rate: number | null; archived_at: string | null; created_at: string }>(
    db, 'SELECT * FROM clients ORDER BY name'
  );
  const clientsData = {
    headers: ['ID', 'Nom', 'Couleur', 'TJM', 'Archivé', 'Créé le'],
    rows: clients.map(c => [
      String(c.id), c.name, c.color,
      c.daily_rate != null ? String(c.daily_rate) : '',
      c.archived_at ? 'Oui' : 'Non',
      c.created_at,
    ]),
  };

  // Projects
  const projects = queryAll<{ id: number; name: string; client_id: number; description: string | null; archived_at: string | null; created_at: string; client_name: string }>(
    db, `SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON p.client_id = c.id ORDER BY c.name, p.name`
  );
  const projectsData = {
    headers: ['ID', 'Nom', 'Client', 'Description', 'Archivé', 'Créé le'],
    rows: projects.map(p => [
      String(p.id), p.name, p.client_name,
      p.description ?? '',
      p.archived_at ? 'Oui' : 'Non',
      p.created_at,
    ]),
  };

  // All tracking entries
  const entries = queryAll<TrackingEntryWithDetails & { daily_rate: number | null; title: string | null }>(
    db,
    `SELECT te.*, p.name as project_name, p.client_id, c.name as client_name, c.color as client_color, c.daily_rate
     FROM tracking te
     JOIN projects p ON te.project_id = p.id
     JOIN clients c ON p.client_id = c.id
     ORDER BY te.date ASC, c.name ASC, p.name ASC`
  );
  const trackingData = {
    headers: ['Date', 'Client', 'Projet', 'Titre', 'Durée (min)', 'Durée (h)', 'TJM', 'Description'],
    rows: entries.map(e => [
      e.date, e.client_name, e.project_name,
      e.title ?? '',
      String(e.duration), (e.duration / 60).toFixed(2),
      e.daily_rate != null ? String(e.daily_rate) : '',
      e.description ?? '',
    ]),
  };

  // Settings
  const settingsRows = queryAll<{ key: string; value: string }>(db, 'SELECT key, value FROM settings ORDER BY key');
  const settingsData = {
    headers: ['Clé', 'Valeur'],
    rows: settingsRows.map(s => [s.key, JSON.parse(s.value).toString()]),
  };

  return { clients: clientsData, projects: projectsData, tracking: trackingData, settings: settingsData };
}

export function getStatsByPeriod(
  startDate: string,
  endDate: string
): { client_id: number; client_name: string; client_color: string; daily_rate: number | null; project_id: number; project_name: string; total_minutes: number }[] {
  const db = getDatabase();
  return queryAll(
    db,
    `SELECT c.id as client_id, c.name as client_name, c.color as client_color, c.daily_rate,
            p.id as project_id, p.name as project_name,
            COALESCE(SUM(te.duration), 0) as total_minutes
     FROM tracking te
     JOIN projects p ON te.project_id = p.id
     JOIN clients c ON p.client_id = c.id
     WHERE te.date >= ? AND te.date <= ?
     GROUP BY c.id, p.id
     ORDER BY c.name, p.name`,
    [startDate, endDate]
  );
}
