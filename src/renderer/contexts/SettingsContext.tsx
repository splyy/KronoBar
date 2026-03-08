import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Settings } from '../../shared/types';

const defaultSettings: Settings = {
  time_format: 'hhmm',
  hours_per_day: 7,
  currency: 'EUR',
  launch_at_login: false,
};

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<string | null>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await window.kronobar.settings.getAll();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]): Promise<string | null> => {
    const result = await window.kronobar.settings.set(key, value);
    if (!result.success) {
      // Setting was rejected (e.g. login item failed) — don't update local state
      return result.error ?? 'Erreur inconnue';
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    return null;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return ctx;
}
