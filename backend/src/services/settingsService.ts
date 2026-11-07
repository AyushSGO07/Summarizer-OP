import fs from "fs";
import path from "path";
import { config } from "../config";

export interface AppSettings {
  provider: "mistral" | "gemini";
  mistralModel: string;
  geminiModel: string;
  ragTopK: number;
  summaryLength: "short" | "medium" | "detailed";
  targetLanguage: "english" | "hindi" | "both";
  theme: "dark" | "system";
}

const defaultSettings: AppSettings = {
  provider: "mistral",
  mistralModel: process.env.MISTRAL_MODEL || "ministral-8b-latest",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  ragTopK: 4,
  summaryLength: "medium",
  targetLanguage: "both",
  theme: "dark"
};

const settingsFilePath = path.join(config.dataDir, "settings.json");

function ensureSettingsFile() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  if (!fs.existsSync(settingsFilePath)) {
    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), "utf-8");
  }
}

export const settingsService = {
  getSettings(): AppSettings {
    ensureSettingsFile();
    try {
      const data = fs.readFileSync(settingsFilePath, "utf-8");
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch {
      return defaultSettings;
    }
  },

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    ensureSettingsFile();
    const current = this.getSettings();
    const updated: AppSettings = { ...current, ...partial };
    fs.writeFileSync(settingsFilePath, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  }
};
