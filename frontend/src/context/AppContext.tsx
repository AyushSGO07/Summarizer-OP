import React, { createContext, useContext, useState, useEffect } from "react";
import { AppSettings, SystemHealth } from "../types";
import { settingsApi } from "../services/api";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextType {
  settings: AppSettings;
  systemHealth: SystemHealth | null;
  activeRagDoc: string | null;
  setActiveRagDoc: (doc: string | null) => void;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  refreshHealth: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

const defaultSettings: AppSettings = {
  provider: "mistral",
  mistralModel: "ministral-8b-latest",
  geminiModel: "gemini-3.5-flash-lite",
  ragTopK: 4,
  summaryLength: "medium",
  targetLanguage: "both",
  theme: "dark"
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activeRagDoc, setActiveRagDoc] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshHealth = async () => {
    try {
      const data = await settingsApi.getHealth();
      setSystemHealth(data);
      if (data.currentSettings) {
        setSettings(data.currentSettings);
      }
      if (data.aiService?.active_document) {
        setActiveRagDoc(data.aiService.active_document);
      }
    } catch (err) {
      console.error("Failed to fetch system health:", err);
    }
  };

  const updateSettings = async (partial: Partial<AppSettings>) => {
    try {
      const updated = await settingsApi.updateSettings(partial);
      setSettings(updated);
      showToast("Settings updated successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update settings", "error");
    }
  };

  useEffect(() => {
    refreshHealth();
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        systemHealth,
        activeRagDoc,
        setActiveRagDoc,
        updateSettings,
        refreshHealth,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
