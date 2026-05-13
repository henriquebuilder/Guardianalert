import { useState, useEffect, createContext, useContext, type ReactNode } from "react";

/** Preferências persistidas em `localStorage` para gravação e contagem regressiva do alerta. */
interface Settings {
  audioRecordingEnabled: boolean;
  countdownSeconds: number;
  audioDurationSeconds: number; // 30, 60, 120, 300 (5min), 0 = until manual stop
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  audioRecordingEnabled: true,
  countdownSeconds: 0, // No countdown by default
  audioDurationSeconds: 60, // 1 minute default
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Fornece estado de configurações da app (áudio, countdown) com persistência em `localStorage`.
 *
 * @param props.children - Árvore React a envolver.
 * @returns Provider de contexto.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem("guardian-alert-settings");
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem("guardian-alert-settings", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Acede a {@link Settings} e a `updateSettings` dentro de um `SettingsProvider`.
 *
 * @returns Contexto de configurações.
 * @throws Se usado fora de `SettingsProvider`.
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
