import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatDuration, useFormatDays } from '../../hooks/useFormatDuration';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { getCurrencySymbol } from '../../../shared/utils/currency';
import { IconX, IconClipboard } from '../common/Icons';
import type { TrackingEntryWithDetails } from '../../../shared/types';
import styles from './ClientDetailModal.module.css';

interface ProjectDetail {
  projectId: number;
  projectName: string;
  totalMinutes: number;
  entries: { date: string; description: string | null; duration: number }[];
}

interface ClientDetailModalProps {
  clientId: number;
  clientName: string;
  clientColor: string;
  dailyRate: number | null;
  startDate: string;
  endDate: string;
  periodLabel: string;
  onClose: () => void;
}

export function ClientDetailModal({
  clientId,
  clientName,
  clientColor,
  dailyRate,
  startDate,
  endDate,
  periodLabel,
  onClose,
}: ClientDetailModalProps) {
  const [entries, setEntries] = useState<TrackingEntryWithDetails[]>([]);
  const formatDuration = useFormatDuration();
  const formatDays = useFormatDays();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const currencySymbol = getCurrencySymbol(settings.currency);

  const fetchEntries = useCallback(async () => {
    const data = await window.kronobar.tracking.listByRange(startDate, endDate, clientId);
    setEntries(data);
  }, [startDate, endDate, clientId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const projects = useMemo<ProjectDetail[]>(() => {
    const map = new Map<number, ProjectDetail>();
    for (const e of entries) {
      let p = map.get(e.project_id);
      if (!p) {
        p = { projectId: e.project_id, projectName: e.project_name, totalMinutes: 0, entries: [] };
        map.set(e.project_id, p);
      }
      p.totalMinutes += e.duration;
      p.entries.push({ date: e.date, description: e.description, duration: e.duration });
    }
    // Sort entries by date within each project
    for (const p of map.values()) {
      p.entries.sort((a, b) => a.date.localeCompare(b.date));
    }
    return Array.from(map.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [entries]);

  const totalMinutes = projects.reduce((sum, p) => sum + p.totalMinutes, 0);

  const revenue = useMemo(() => {
    if (dailyRate == null) return null;
    return (totalMinutes / (settings.hours_per_day * 60)) * dailyRate;
  }, [totalMinutes, dailyRate, settings.hours_per_day]);

  const handleCopy = () => {
    const lines: string[] = [];
    lines.push(`${clientName} — ${periodLabel}`);
    lines.push('');
    for (const p of projects) {
      lines.push(`${p.projectName} — ${formatDuration(p.totalMinutes)} (${formatDays(p.totalMinutes)}j)`);
      const descs = p.entries.filter((e) => e.description);
      if (descs.length > 0) {
        for (const e of descs) {
          const d = new Date(e.date + 'T00:00:00');
          const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          lines.push(`  ${dateLabel} : ${e.description}`);
        }
      }
      lines.push('');
    }
    lines.push(`Total : ${formatDuration(totalMinutes)} (${formatDays(totalMinutes)}j)`);
    if (revenue != null) {
      lines.push(`Revenu : ${Math.round(revenue)}${currencySymbol}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('Copié dans le presse-papier');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.headerLeft}>
              <span className={styles.dot} style={{ backgroundColor: clientColor }} />
              <span className={styles.modalTitle}>{clientName}</span>
            </div>
            <div className={styles.modalSub}>{periodLabel}</div>
          </div>
          <button className={styles.btnClose} onClick={onClose}>
            <IconX size={16} />
          </button>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Heures</span>
            <span className={styles.summaryValue}>{formatDuration(totalMinutes)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Jours</span>
            <span className={styles.summaryValue}>{formatDays(totalMinutes)}j</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Projets</span>
            <span className={styles.summaryValue}>{projects.length}</span>
          </div>
          {revenue != null && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Revenu</span>
              <span className={styles.summaryValue}>{Math.round(revenue)}{currencySymbol}</span>
            </div>
          )}
        </div>

        {/* Projects detail */}
        <div className={styles.content}>
          {projects.map((p) => (
            <div key={p.projectId} className={styles.projectSection}>
              <div className={styles.projectHeader}>
                <span className={styles.projectName}>{p.projectName}</span>
                <span className={styles.projectTime}>{formatDuration(p.totalMinutes)}</span>
              </div>
              {p.entries.some((e) => e.description) ? (
                <div className={styles.descriptions}>
                  {p.entries
                    .filter((e) => e.description)
                    .map((e, i) => (
                      <div key={i} className={styles.descItem}>
                        <span className={styles.descDate}>{formatDate(e.date)}</span>
                        <span className={styles.descText}>{e.description}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className={styles.noDesc}>Aucune description</div>
              )}
            </div>
          ))}
        </div>

        {/* Copy for invoice */}
        <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
          <button className={styles.copyBtn} onClick={handleCopy}>
            <IconClipboard size={14} />
            Copier pour la facturation
          </button>
        </div>
      </div>
    </div>
  );
}
