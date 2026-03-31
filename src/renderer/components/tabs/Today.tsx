import { useMemo, useState } from 'react';
import { useTracking } from '../../hooks/useTracking';
import { useFormatDuration, useFormatDays } from '../../hooks/useFormatDuration';
import { EmptyState } from '../common/EmptyState';
import { AlertDialog } from '../common/AlertDialog';
import { Tooltip } from '../common/Tooltip';
import { IconPencil, IconTrash, IconClock, IconFabPlus } from '../common/Icons';
import { TimeEntryModal } from '../forms/TimeEntryModal';
import { getLocalDate, formatLocalDate } from '../../../shared/utils/date';
import type { TrackingEntryWithDetails } from '../../../shared/types';
import styles from './Today.module.css';

interface ClientSummary {
  clientId: number;
  clientName: string;
  clientColor: string;
  totalMinutes: number;
}

export function Today() {
  const today = getLocalDate();
  const { entries, totalMinutes, loading, create, update, remove } = useTracking(today);
  const formatDuration = useFormatDuration();
  const formatDays = useFormatDays();
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrackingEntryWithDetails | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);

  const clientSummaries = useMemo<ClientSummary[]>(() => {
    const map = new Map<number, ClientSummary>();
    for (const entry of entries) {
      let cs = map.get(entry.client_id);
      if (!cs) {
        cs = {
          clientId: entry.client_id,
          clientName: entry.client_name,
          clientColor: entry.client_color,
          totalMinutes: 0,
        };
        map.set(entry.client_id, cs);
      }
      cs.totalMinutes += entry.duration;
    }
    return Array.from(map.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [entries]);

  const handleEdit = (entry: TrackingEntryWithDetails) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  return (
    <div className={styles.page}>
      {/* Sticky header */}
      <div className={styles.sticky}>
        <div className={styles.header}>
          <div>
            <div className={styles.label}>Aujourd&apos;hui</div>
            <div className={styles.date}>{formatLocalDate(today)}</div>
          </div>
          <div>
            <span className={styles.total}>{formatDuration(totalMinutes)}</span>
            <span className={styles.days}>{formatDays(totalMinutes)}</span>
          </div>
        </div>

        {/* Progress bar */}
        {clientSummaries.length > 0 && (
          <div className={styles.progressBar}>
            {clientSummaries.map((cs) => (
              <div
                key={cs.clientId}
                className={styles.progressSegment}
                style={{
                  flex: cs.totalMinutes,
                  backgroundColor: cs.clientColor,
                }}
              />
            ))}
          </div>
        )}

        {/* Client pills */}
        {clientSummaries.length > 0 && (
          <div className={styles.clientPills}>
            {clientSummaries.map((cs) => (
              <div key={cs.clientId} className={styles.clientPill}>
                <span className={styles.dotSm} style={{ backgroundColor: cs.clientColor }} />
                <span className={styles.pillName}>{cs.clientName}</span>
                <span className={styles.pillTime}>{formatDuration(cs.totalMinutes)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entries */}
      <div className={styles.entries}>
        {loading ? null : entries.length === 0 ? (
          <EmptyState icon={<IconClock size={32} />} message="Aucune entrée aujourd'hui. Commencez à tracker !" />
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.entryRow} ${flashId === entry.id ? styles.entryFlash : ''}`}
            >
              <span className={styles.dot} style={{ backgroundColor: entry.client_color }} />
              <div className={styles.entryContent}>
                <div className={styles.entryHeader}>
                  <span className={styles.entryProject}>{entry.project_name}</span>
                  <span className={styles.entryClient}>{entry.client_name}</span>
                </div>
                {entry.title && (
                  <div className={styles.entryDesc}>{entry.title}</div>
                )}
                {entry.description && (
                  <div className={styles.entryDetail}>{entry.description}</div>
                )}
              </div>
              <span className={styles.badge}>{formatDuration(entry.duration)}</span>
              <div className={styles.entryActions}>
                <Tooltip content="Modifier">
                  <button className={styles.actionBtn} onClick={() => handleEdit(entry)}>
                    <IconPencil size={13} />
                  </button>
                </Tooltip>
                <AlertDialog
                  trigger={
                    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`}>
                      <IconTrash size={13} />
                    </button>
                  }
                  title="Supprimer l'entrée"
                  description="Cette action est irréversible. Voulez-vous vraiment supprimer cette entrée ?"
                  onConfirm={() => handleDelete(entry.id)}
                  variant="danger"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className={styles.fab} onClick={() => setShowModal(true)} title="Saisie manuelle">
        <IconFabPlus size={18} />
      </button>

      {/* Modal */}
      {showModal && (
        <TimeEntryModal
          date={today}
          entry={editingEntry}
          onSave={async (input) => {
            if (editingEntry) {
              await update(editingEntry.id, input);
            } else {
              const created = await create(input);
              if (created) {
                setFlashId(created.id);
                setTimeout(() => setFlashId(null), 1000);
              }
            }
            handleModalClose();
          }}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
