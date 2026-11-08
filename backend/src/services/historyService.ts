import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

export interface SummaryRecord {
  id: string;
  title: string;
  sourceType: "video" | "document" | "web" | "text";
  sourceUrl?: string;
  filename?: string;
  charCount: number;
  provider: string;
  model: string;
  englishSummary: string;
  hindiSummary: string;
  actionItems?: string;
  keyDecisions?: string;
  questions?: string;
  transcript?: string;
  metadata?: any;
  createdAt: string;
}

let inMemoryHistory: SummaryRecord[] = [];

function getHistoryFilePath(): string {
  return path.join(config.dataDir, "history.json");
}

function ensureDataFile() {
  try {
    const dir = config.dataDir;
    const filePath = getHistoryFilePath();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
    }
  } catch {
    // In serverless readonly environments, fallback gracefully to in-memory state
  }
}

export const historyService = {
  getAll(): SummaryRecord[] {
    ensureDataFile();
    try {
      const data = fs.readFileSync(getHistoryFilePath(), "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        inMemoryHistory = parsed;
      }
      return inMemoryHistory;
    } catch {
      return inMemoryHistory;
    }
  },

  getById(id: string): SummaryRecord | null {
    const list = this.getAll();
    return list.find((item) => item.id === id) || null;
  },

  create(record: Omit<SummaryRecord, "id" | "createdAt">): SummaryRecord {
    const list = this.getAll();
    const newRecord: SummaryRecord = {
      ...record,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    list.unshift(newRecord);
    inMemoryHistory = list;

    try {
      ensureDataFile();
      fs.writeFileSync(getHistoryFilePath(), JSON.stringify(list, null, 2), "utf-8");
    } catch {
      // Retained in inMemoryHistory
    }
    return newRecord;
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length !== list.length) {
      inMemoryHistory = filtered;
      try {
        ensureDataFile();
        fs.writeFileSync(getHistoryFilePath(), JSON.stringify(filtered, null, 2), "utf-8");
      } catch {}
      return true;
    }
    return false;
  },

  clear(): void {
    inMemoryHistory = [];
    try {
      ensureDataFile();
      fs.writeFileSync(getHistoryFilePath(), JSON.stringify([], null, 2), "utf-8");
    } catch {}
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
