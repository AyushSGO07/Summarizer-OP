"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const defaultSettings = {
    provider: "mistral",
    mistralModel: process.env.MISTRAL_MODEL || "ministral-8b-latest",
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    ragTopK: 4,
    summaryLength: "medium",
    targetLanguage: "both",
    theme: "dark"
};
let inMemorySettings = { ...defaultSettings };
function getSettingsFilePath() {
    return path_1.default.join(config_1.config.dataDir, "settings.json");
}
function ensureSettingsFile() {
    try {
        const dir = config_1.config.dataDir;
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        const filePath = getSettingsFilePath();
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.writeFileSync(filePath, JSON.stringify(defaultSettings, null, 2), "utf-8");
        }
    }
    catch (err) {
        // In serverless read-only filesystems, fallback gracefully to in-memory state
    }
}
exports.settingsService = {
    getSettings() {
        ensureSettingsFile();
        try {
            const data = fs_1.default.readFileSync(getSettingsFilePath(), "utf-8");
            inMemorySettings = { ...defaultSettings, ...JSON.parse(data) };
            return inMemorySettings;
        }
        catch {
            return inMemorySettings;
        }
    },
    updateSettings(partial) {
        const current = this.getSettings();
        const updated = { ...current, ...partial };
        inMemorySettings = updated;
        try {
            ensureSettingsFile();
            fs_1.default.writeFileSync(getSettingsFilePath(), JSON.stringify(updated, null, 2), "utf-8");
        }
        catch {
            // In serverless readonly environments, in-memory state retains the updated settings
        }
        return updated;
    }
};
