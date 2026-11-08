"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
let inMemoryHistory = [];
function getHistoryFilePath() {
    return path_1.default.join(config_1.config.dataDir, "history.json");
}
function ensureDataFile() {
    try {
        const dir = config_1.config.dataDir;
        const filePath = getHistoryFilePath();
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
        }
    }
    catch {
        // In serverless readonly environments, fallback gracefully to in-memory state
    }
}
exports.historyService = {
    getAll() {
        ensureDataFile();
        try {
            const data = fs_1.default.readFileSync(getHistoryFilePath(), "utf-8");
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                inMemoryHistory = parsed;
            }
            return inMemoryHistory;
        }
        catch {
            return inMemoryHistory;
        }
    },
    getById(id) {
        const list = this.getAll();
        return list.find((item) => item.id === id) || null;
    },
    create(record) {
        const list = this.getAll();
        const newRecord = {
            ...record,
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString()
        };
        list.unshift(newRecord);
        inMemoryHistory = list;
        try {
            ensureDataFile();
            fs_1.default.writeFileSync(getHistoryFilePath(), JSON.stringify(list, null, 2), "utf-8");
        }
        catch {
            // Retained in inMemoryHistory
        }
        return newRecord;
    },
    delete(id) {
        const list = this.getAll();
        const filtered = list.filter((item) => item.id !== id);
        if (filtered.length !== list.length) {
            inMemoryHistory = filtered;
            try {
                ensureDataFile();
                fs_1.default.writeFileSync(getHistoryFilePath(), JSON.stringify(filtered, null, 2), "utf-8");
            }
            catch { }
            return true;
        }
        return false;
    },
    clear() {
        inMemoryHistory = [];
        try {
            ensureDataFile();
            fs_1.default.writeFileSync(getHistoryFilePath(), JSON.stringify([], null, 2), "utf-8");
        }
        catch { }
    },
    getStats() {
        const list = this.getAll();
        const videos = list.filter((i) => i.sourceType === "video").length;
        const documents = list.filter((i) => i.sourceType === "document").length;
        const latest = list[0] || null;
        return {
            totalSummaries: list.length,
            videoCount: videos,
            documentCount: documents,
            latestSummaryTitle: latest ? latest.title : null,
            latestSummaryDate: latest ? latest.createdAt : null
        };
    }
};
