import { useMemo, useState } from 'react';
import { useTrackingByRange } from '../../hooks/useTracking';
import { useFormatDuration, useFormatDays } from '../../hooks/useFormatDuration';
import { useClients } from '../../hooks/useClients';
import { TimeEntryModal } from '../forms/TimeEntryModal';
import { ClientDetailModal } from './ClientDetailModal';
import { EmptyState } from '../common/EmptyState';
import { AlertDialog } from '../common/AlertDialog';
import { Tooltip } from '../common/Tooltip';
import { IconChevronLeft, IconChevronRight, IconPencil, IconTrash, IconFabPlus, IconClipboard, IconTabStats } from '../common/Icons';
import { getLocalDate } from '../../../shared/utils/date';
import type { TrackingEntryWithDetails } from '../../../shared/types';
import styles from './History.module.css';

type Period = 'day' | 'week' | 'month' | 'year';

function getDateRange(date: Date, period: Period): { start: string; end: string } {
  const fmt = (d: Date) => d.toLocaleDateString('en-CA');

  switch (period) {
    case 'day':
      return { start: fmt(date), end: fmt(date) };
    case 'week': {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      const start = fmt(d);
      d.setDate(d.getDate() + 6);
      return { start, end: fmt(d) };
    }
    case 'month': {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case 'year': {
      return { start: `${date.getFullYear()}-01-01`, end: `${date.getFullYear()}-12-31` };
    }
  }
}

function navigateDate(date: Date, period: Period, direction: -1 | 1): Date {
  const d = new Date(date);
  switch (period) {
    case 'day':
      d.setDate(d.getDate() + direction);
      break;
    case 'week':
      d.setDate(d.getDate() + direction * 7);
      break;
    case 'month':
      d.setMonth(d.getMonth() + direction);
      break;
    case 'year':
      d.setFullYear(d.getFullYear() + direction);
      break;
  }
  return d;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

interface DayGroup {
  date: string;
  entries: TrackingEntryWithDetails[];
  totalMinutes: number;
}

export function History() {
  const [period, setPeriod] = useState<Period>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clientFilter, setClientFilter] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrackingEntryWithDetails | null>(null);
  const [showClientDetail, setShowClientDetail] = useState(false);

  const { start, end } = getDateRange(currentDate, period);
  const { entries, loading, create, update, remove } = useTrackingByRange(
    start,
    end,
    clientFilter ?? undefined,
    undefined,
  );
  const { clients } = useClients();
  const formatDuration = useFormatDuration();
  const formatDays = useFormatDays();

  const groups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const entry of entries) {
      let group = map.get(entry.date);
      if (!group) {
        group = { date: entry.date, entries: [], totalMinutes: 0 };
        map.set(entry.date, group);
      }
      group.entries.push(entry);
      group.totalMinutes += entry.duration;
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
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

  const today = getLocalDate();
  const isCurrentPeriod = start <= today && end >= today;

  return (
    <div className={styles.page}>
      {/* Period tabs + nav */}
      <div className={styles.top}>
        <div className={styles.periodTabs}>
          {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {{ day: 'Jour', week: 'Semaine', month: 'Mois', year: 'Année' }[p]}
            </button>
          ))}
        </div>

        {/* Nav arrows */}
        <div className={styles.nav}>
          <button className={styles.navBtn} onClick={() => setCurrentDate(navigateDate(currentDate, period, -1))}>
            <IconChevronLeft size={14} />
          </button>
          <span className={styles.navLabel}>
            {formatPeriodLabel(currentDate, period)}
          </span>
          <button className={styles.navBtn} onClick={() => setCurrentDate(navigateDate(currentDate, period, 1))}>
            <IconChevronRight size={14} />
          </button>
          {!isCurrentPeriod && (
            <button className={styles.todayBtn} onClick={() => setCurrentDate(new Date())}>
              Aujourd&apos;hui
            </button>
          )}
          {clientFilter != null && (period === 'month' || period === 'year') && (
            <button className={styles.todayBtn} onClick={() => setShowClientDetail(true)}>
              <IconTabStats size={12} />
              Détail client
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className={styles.filterChips}>
          <button
            className={`${styles.filterChip} ${clientFilter === null ? styles.filterChipActive : ''}`}
            onClick={() => setClientFilter(null)}
          >
            Tous
          </button>
          {clients.map((c) => (
            <button
              key={c.id}
              className={`${styles.filterChip} ${clientFilter === c.id ? styles.filterChipActive : ''}`}
              onClick={() => setClientFilter(clientFilter === c.id ? null : c.id)}
            >
              <span className={styles.dotSm} style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className={styles.entries}>
        {loading ? null : groups.length === 0 ? (
          <EmptyState icon={<IconClipboard size={32} />} message="Aucune entrée pour cette période" />
        ) : (
          groups.map((group) => (
            <div key={group.date} className={styles.dayGroup}>
              <div className={styles.dayHeader}>
                <span className={styles.dayLabel}>{formatDayLabel(group.date)}</span>
                <div className={styles.dayMeta}>
                  <span className={styles.badge}>{formatDuration(group.totalMinutes)}</span>
                  <span className={styles.dayDays}>{formatDays(group.totalMinutes)}</span>
                </div>
              </div>
              {group.entries.map((entry) => (
                <div key={entry.id} className={styles.entryRow}>
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
              ))}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className={styles.fab} onClick={() => setShowModal(true)} title="Ajouter une entrée">
        <IconFabPlus size={18} />
      </button>

      {/* Modal */}
      {showModal && (
        <TimeEntryModal
          date={editingEntry?.date ?? start}
          entry={editingEntry}
          onSave={async (input) => {
            if (editingEntry) {
              await update(editingEntry.id, input);
            } else {
              await create(input);
            }
            handleModalClose();
          }}
          onClose={handleModalClose}
        />
      )}

      {/* Client detail modal */}
      {showClientDetail && clientFilter != null && (() => {
        const client = clients.find((c) => c.id === clientFilter);
        if (!client) return null;
        return (
          <ClientDetailModal
            clientId={client.id}
            clientName={client.name}
            clientColor={client.color}
            dailyRate={client.daily_rate}
            startDate={start}
            endDate={end}
            periodLabel={formatPeriodLabel(currentDate, period)}
            onClose={() => setShowClientDetail(false)}
          />
        );
      })()}
    </div>
  );
}

function formatPeriodLabel(date: Date, period: Period): string {
  switch (period) {
    case 'day':
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    case 'week': {
      const { start, end } = getDateRange(date, 'week');
      const s = new Date(start + 'T00:00:00');
      const e = new Date(end + 'T00:00:00');
      return `${s.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${e.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
    }
    case 'month':
      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    case 'year':
      return date.getFullYear().toString();
  }
}
