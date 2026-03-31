import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatDuration, useFormatDays } from '../../hooks/useFormatDuration';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { getCurrencySymbol } from '../../../shared/utils/currency';
import { IconX, IconClipboard } from '../common/Icons';
import type { TrackingEntryWithDetails } from '../../../shared/types';
import styles from './ClientDetailModal.module.css';

interface EntryDetail {
  date: string;
  description: string | null;
  duration: number;
}

interface TitleGroup {
  title: string | null;
  totalMinutes: number;
  entries: EntryDetail[];
}

interface ProjectGroup {
  projectId: number;
  projectName: string;
  totalMinutes: number;
  titleGroups: TitleGroup[];
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

  const projects = useMemo<ProjectGroup[]>(() => {
    const projectMap = new Map<number, ProjectGroup>();
    for (const e of entries) {
      let proj = projectMap.get(e.project_id);
      if (!proj) {
        proj = { projectId: e.project_id, projectName: e.project_name, totalMinutes: 0, titleGroups: [] };
        projectMap.set(e.project_id, proj);
      }
      proj.totalMinutes += e.duration;

      const titleKey = e.title ?? '';
      let tg = proj.titleGroups.find((t) => (t.title ?? '') === titleKey);
      if (!tg) {
        tg = { title: e.title, totalMinutes: 0, entries: [] };
        proj.titleGroups.push(tg);
      }
      tg.totalMinutes += e.duration;
      tg.entries.push({ date: e.date, description: e.description, duration: e.duration });
    }
    for (const proj of projectMap.values()) {
      proj.titleGroups.sort((a, b) => b.totalMinutes - a.totalMinutes);
      for (const tg of proj.titleGroups) {
        tg.entries.sort((a, b) => a.date.localeCompare(b.date));
      }
    }
    return Array.from(projectMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
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
    for (const proj of projects) {
      lines.push(`${proj.projectName} — ${formatDuration(proj.totalMinutes)} (${formatDays(proj.totalMinutes)})`);
      for (const tg of proj.titleGroups) {
        if (tg.title) {
          lines.push(`  ${tg.title} — ${formatDuration(tg.totalMinutes)}`);
        }
        for (const e of tg.entries) {
          const d = new Date(e.date + 'T00:00:00');
          const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          const desc = e.description ? ` — ${e.description}` : '';
          const indent = tg.title ? '    ' : '  ';
          lines.push(`${indent}${dateLabel} : ${formatDuration(e.duration)}${desc}`);
        }
      }
      lines.push('');
    }
    lines.push(`Total : ${formatDuration(totalMinutes)} (${formatDays(totalMinutes)})`);
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
            <span className={styles.summaryValue}>{formatDays(totalMinutes)}</span>
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

        {/* Projects → title groups → entries */}
        <div className={styles.content}>
          {projects.map((proj) => (
            <div key={proj.projectId} className={styles.projectSection}>
              <div className={styles.projectHeader}>
                <span className={styles.projectName}>{proj.projectName}</span>
                <span className={styles.projectTime}>{formatDuration(proj.totalMinutes)}</span>
              </div>
              {proj.titleGroups.map((tg, idx) => (
                <div key={idx} className={styles.titleGroup}>
                  {tg.title && (
                    <div className={styles.titleHeader}>
                      <span className={styles.titleName}>{tg.title}</span>
                      <span className={styles.titleTime}>{formatDuration(tg.totalMinutes)}</span>
                    </div>
                  )}
                  <div className={styles.descriptions}>
                    {tg.entries.map((e, i) => (
                      <div key={i} className={styles.descItem}>
                        <span className={styles.descDate}>{formatDate(e.date)}</span>
                        <span className={styles.descDuration}>{formatDuration(e.duration)}</span>
                        {e.description && <span className={styles.descText}>{e.description}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
