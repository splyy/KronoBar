import { useEffect, useRef, useState } from 'react';
import { useClients } from '../../hooks/useClients';
import { useProjects } from '../../hooks/useProjects';
import { Select } from '../common/Select';
import type { TrackingEntryInput, TrackingEntryWithDetails } from '../../../shared/types';
import styles from './TimeEntryForm.module.css';

interface TimeEntryFormProps {
  date: string;
  entry?: TrackingEntryWithDetails | null;
  clients?: { id: number; name: string }[];
  onSave: (input: TrackingEntryInput) => Promise<void>;
  onCancel: () => void;
}

export function TimeEntryForm({ date, entry, clients: clientsProp, onSave, onCancel }: TimeEntryFormProps) {
  const { clients: fetchedClients } = useClients();
  const clients = clientsProp ?? fetchedClients;
  const [selectedClientId, setSelectedClientId] = useState<number | ''>(entry?.client_id ?? '');
  const { projects } = useProjects(selectedClientId || undefined);

  const [projectId, setProjectId] = useState<number | ''>(entry?.project_id ?? '');
  const [hours, setHours] = useState(entry ? Math.floor(entry.duration / 60).toString() : '');
  const [minutes, setMinutes] = useState(entry ? (entry.duration % 60).toString().padStart(2, '0') : '');
  const [title, setTitle] = useState(entry?.title ?? '');
  const [description, setDescription] = useState(entry?.description ?? '');
  const [entryDate, setEntryDate] = useState(entry?.date ?? date);
  const [saving, setSaving] = useState(false);
  const prevClientId = useRef(selectedClientId);

  // Only reset project when client actually changes (not on initial load)
  useEffect(() => {
    if (prevClientId.current !== selectedClientId) {
      prevClientId.current = selectedClientId;
      setProjectId('');
    }
  }, [selectedClientId]);

  const totalMinutes = (parseInt(hours || '0') * 60) + parseInt(minutes || '0');
  const canSave = projectId !== '' && totalMinutes > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({
        project_id: projectId as number,
        date: entryDate,
        duration: totalMinutes,
        title: title.trim() || null,
        description: description.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>{entry ? 'Modifier' : 'Nouvelle entrée'}</h2>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Annuler
        </button>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Client</label>
        <Select
          value={String(selectedClientId)}
          onValueChange={(v) => setSelectedClientId(v ? parseInt(v) : '')}
          options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
          placeholder="Sélectionner un client"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Projet</label>
        <Select
          value={String(projectId)}
          onValueChange={(v) => setProjectId(v ? parseInt(v) : '')}
          options={projects.map((p) => ({ value: String(p.id), label: p.name }))}
          placeholder="Sélectionner un projet"
          disabled={!selectedClientId}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Date</label>
        <input
          type="date"
          className={styles.input}
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Durée</label>
        <div className={styles.durationRow}>
          <input
            type="number"
            className={`${styles.input} ${styles.durationInput}`}
            placeholder="0"
            min="0"
            max="23"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <span className={styles.durationSep}>h</span>
          <input
            type="number"
            className={`${styles.input} ${styles.durationInput}`}
            placeholder="00"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <span className={styles.durationSep}>min</span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Titre</label>
        <input
          type="text"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Migration API, Correction bugs…"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Description (optionnel)</label>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Détail de ce qui a été fait"
          rows={2}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.saveBtn} disabled={!canSave || saving}>
          {saving ? 'Enregistrement...' : entry ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
