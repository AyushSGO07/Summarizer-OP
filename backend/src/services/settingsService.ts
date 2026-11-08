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

let inMemorySettings: AppSettings = { ...defaultSettings };

function getSettingsFilePath(): string {
  return path.join(config.dataDir, "settings.json");
}

function ensureSettingsFile() {
  try {
    const dir = config.dataDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = getSettingsFilePath();
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultSettings, null, 2), "utf-8");
    }
  } catch (err) {
    // In serverless read-only filesystems, fallback gracefully to in-memory state
  }
}

export const settingsService = {
  getSettings(): AppSettings {
    ensureSettingsFile();
    try {
      const data = fs.readFileSync(getSettingsFilePath(), "utf-8");
      inMemorySettings = { ...defaultSettings, ...JSON.parse(data) };
      return inMemorySettings;
    } catch {
      return inMemorySettings;
    }
  },

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated: AppSettings = { ...current, ...partial };
    inMemorySettings = updated;

    try {
      ensureSettingsFile();
      fs.writeFileSync(getSettingsFilePath(), JSON.stringify(updated, null, 2), "utf-8");
    } catch {
      // In serverless readonly environments, in-memory state retains the updated settings
    }
    return updated;
  }
};
