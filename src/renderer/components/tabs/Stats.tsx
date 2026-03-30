import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatDuration, useFormatDays } from '../../hooks/useFormatDuration';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { getCurrencySymbol } from '../../../shared/utils/currency';
import { IconChevronLeft, IconChevronRight, IconDownloadStroke } from '../common/Icons';
import { ClientDetailModal } from './ClientDetailModal';
import type { StatEntry } from '../../../shared/types';
import styles from './Stats.module.css';

interface ClientStats {
  clientId: number;
  clientName: string;
  clientColor: string;
  dailyRate: number | null;
  totalMinutes: number;
  revenue: number | null;
  projectCount: number;
}

export function Stats() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { settings } = useSettings();
  const { showToast } = useToast();
  const formatDuration = useFormatDuration();
  const formatDays = useFormatDays();
  const currencySymbol = getCurrencySymbol(settings.currency);

  const start = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return d.toLocaleDateString('en-CA');
  }, [currentDate]);

  const end = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return d.toLocaleDateString('en-CA');
  }, [currentDate]);

  const periodLabel = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const today = new Date();
  const isCurrentMonth =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth();

  const [selectedClient, setSelectedClient] = useState<ClientStats | null>(null);

  const [stats, setStats] = useState<StatEntry[]>([]);
  const fetchStats = useCallback(async () => {
    const data = await window.kronobar.tracking.getStats(start, end);
    setStats(data);
  }, [start, end]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const clientStats = useMemo<ClientStats[]>(() => {
    const map = new Map<number, ClientStats>();
    for (const s of stats) {
      let cs = map.get(s.client_id);
      if (!cs) {
        cs = {
          clientId: s.client_id,
          clientName: s.client_name,
          clientColor: s.client_color,
          dailyRate: s.daily_rate,
          totalMinutes: 0,
          revenue: null,
          projectCount: 0,
        };
        map.set(s.client_id, cs);
      }
      cs.totalMinutes += s.total_minutes;
      cs.projectCount++;
    }
    for (const cs of map.values()) {
      if (cs.dailyRate != null) {
        cs.revenue = (cs.totalMinutes / (settings.hours_per_day * 60)) * cs.dailyRate;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [stats, settings.hours_per_day]);

  const totalMinutes = clientStats.reduce((sum, c) => sum + c.totalMinutes, 0);
  const maxClientMinutes = Math.max(...clientStats.map((c) => c.totalMinutes), 1);

  // Total monthly revenue: sum of (days worked × daily_rate) per client
  const totalRevenue = useMemo(() => {
    let total = 0;
    for (const cs of clientStats) {
      if (cs.revenue != null) {
        total += cs.revenue;
      }
    }
    return total;
  }, [clientStats]);

  const handleExport = async () => {
    try {
      const result = await window.kronobar.tracking.export(start, end);
      if (result.success) {
        showToast('Export CSV réussi');
      }
    } catch {
      showToast('Erreur lors de l\'export', 'error');
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.period}>{periodLabel}</div>
          <div className={styles.sub}>{isCurrentMonth ? 'Période en cours' : 'Période passée'}</div>
        </div>
        <div className={styles.monthNav}>
          <button
            className={styles.monthNavBtn}
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
          >
            <IconChevronLeft size={14} />
          </button>
          <button
            className={styles.monthNavBtn}
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            style={isCurrentMonth ? { opacity: 0.3, cursor: 'default' } : undefined}
            disabled={isCurrentMonth}
          >
            <IconChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Heures</div>
          <div className={styles.kpiValue} style={{ color: 'var(--accent-color)' }}>
            {formatDuration(totalMinutes)}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Jours</div>
          <div className={styles.kpiValue} style={{ color: 'var(--success-color)' }}>
            {formatDays(totalMinutes)}
          </div>
          <div className={styles.kpiSub}>base {settings.hours_per_day}h/jour</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Revenu brut du mois</div>
          <div className={styles.kpiValue} style={{ color: 'var(--blue-color)' }}>
            {totalRevenue > 0 ? `${Math.round(totalRevenue)}${currencySymbol}` : '—'}
          </div>
          <div className={styles.kpiSub}>basé sur les TJM</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Revenu net du mois</div>
          <div className={styles.kpiValue} style={{ color: 'var(--purple-color)' }}>
            {totalRevenue > 0 && settings.charge_rate > 0
              ? `${Math.round(totalRevenue * (1 - settings.charge_rate / 100))}${currencySymbol}`
              : '—'}
          </div>
          <div className={styles.kpiSub}>
            {settings.charge_rate > 0 ? `après ${settings.charge_rate}% de charges` : 'configurer le taux dans Réglages'}
          </div>
        </div>
      </div>

      {/* Client bars */}
      {clientStats.length > 0 && (
        <div className={styles.clientBars}>
          <div className={styles.sectionLabel}>Répartition par client</div>
          {clientStats.map((cs) => {
            const pct = Math.round((cs.totalMinutes / totalMinutes) * 100);
            return (
              <div key={cs.clientId} className={styles.clientBar} onClick={() => setSelectedClient(cs)} style={{ cursor: 'pointer' }}>
                <div className={styles.clientBarHeader}>
                  <div className={styles.clientBarName}>
                    <span className={styles.dot} style={{ backgroundColor: cs.clientColor }} />
                    {cs.clientName}
                  </div>
                  <div className={styles.clientBarStats}>
                    <span className={styles.clientBarTime}>{formatDuration(cs.totalMinutes)}</span>
                    <span className={styles.clientBarPct}>{pct}%</span>
                  </div>
                </div>
                <div className={styles.clientBarTrack}>
                  <div
                    className={styles.clientBarFill}
                    style={{
                      width: `${(cs.totalMinutes / maxClientMinutes) * 100}%`,
                      backgroundColor: cs.clientColor,
                    }}
                  />
                </div>
                {cs.dailyRate != null && (
                  <div className={styles.clientBarRevenue}>
                    <span>TJM : {cs.dailyRate}{currencySymbol}</span>
                    {cs.revenue != null && (
                      <span>Brut : {Math.round(cs.revenue)}{currencySymbol}</span>
                    )}
                    {cs.revenue != null && settings.charge_rate > 0 && (
                      <span>Net : {Math.round(cs.revenue * (1 - settings.charge_rate / 100))}{currencySymbol}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Export */}
      <div className={styles.statsExport}>
        <button className={styles.btnExportFull} onClick={handleExport}>
          <IconDownloadStroke size={14} />
          Exporter {periodLabel} en CSV
        </button>
      </div>

      {/* Client detail modal */}
      {selectedClient && (
        <ClientDetailModal
          clientId={selectedClient.clientId}
          clientName={selectedClient.clientName}
          clientColor={selectedClient.clientColor}
          dailyRate={selectedClient.dailyRate}
          startDate={start}
          endDate={end}
          periodLabel={periodLabel}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
