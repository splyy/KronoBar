import { useEffect, useRef, useState } from 'react';
import { useClients } from '../../hooks/useClients';
import { useProjects } from '../../hooks/useProjects';
import { IconXClose } from '../common/Icons';
import type { TrackingEntryInput, TrackingEntryWithDetails } from '../../../shared/types';
import styles from './TimeEntryModal.module.css';

interface TimeEntryModalProps {
  date: string;
  entry?: TrackingEntryWithDetails | null;
  onSave: (input: TrackingEntryInput) => Promise<void>;
  onClose: () => void;
}

export function TimeEntryModal({ date, entry, onSave, onClose }: TimeEntryModalProps) {
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<number | ''>(entry?.client_id ?? '');
  const { projects } = useProjects(selectedClientId || undefined);

  const [projectId, setProjectId] = useState<number | ''>(entry?.project_id ?? '');
  const [hours, setHours] = useState(entry ? Math.floor(entry.duration / 60).toString() : '');
  const [minutes, setMinutes] = useState(entry ? (entry.duration % 60).toString().padStart(2, '0') : '');
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
        description: description.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{entry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}</span>
          <button className={styles.btnClose} onClick={onClose} type="button">
            <IconXClose size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Client</label>
              <select
                className={styles.formSelect}
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : '')}
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Projet</label>
              <select
                className={styles.formSelect}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value ? parseInt(e.target.value) : '')}
                disabled={!selectedClientId}
              >
                <option value="">Sélectionner un projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <input
                type="text"
                className={styles.formInput}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Qu'avez-vous fait ?"
              />
            </div>

            <div className={styles.formRow3}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date</label>
                <input
                  type="date"
                  className={`${styles.formInput} ${styles.formInputMono}`}
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Heures</label>
                <input
                  type="number"
                  className={`${styles.formInput} ${styles.formInputMono}`}
                  placeholder="0"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Minutes</label>
                <input
                  type="number"
                  className={`${styles.formInput} ${styles.formInputMono}`}
                  placeholder="00"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={styles.btnSave} disabled={!canSave || saving}>
              {saving ? 'Enregistrement...' : entry ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
