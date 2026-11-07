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

function getHistoryFilePath(): string {
  return path.join(config.dataDir, "history.json");
}

function ensureDataFile() {
  const dir = config.dataDir;
  const filePath = getHistoryFilePath();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
  }
}

export const historyService = {
  getAll(): SummaryRecord[] {
    ensureDataFile();
    try {
      const data = fs.readFileSync(getHistoryFilePath(), "utf-8");
      return JSON.parse(data) || [];
    } catch {
      return [];
    }
  },

  getById(id: string): SummaryRecord | null {
    const list = this.getAll();
    return list.find((item) => item.id === id) || null;
  },

  create(record: Omit<SummaryRecord, "id" | "createdAt">): SummaryRecord {
    ensureDataFile();
    const list = this.getAll();
    const newRecord: SummaryRecord = {
      ...record,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    list.unshift(newRecord);
    fs.writeFileSync(getHistoryFilePath(), JSON.stringify(list, null, 2), "utf-8");
    return newRecord;
  },

  delete(id: string): boolean {
    ensureDataFile();
    const list = this.getAll();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length !== list.length) {
      fs.writeFileSync(getHistoryFilePath(), JSON.stringify(filtered, null, 2), "utf-8");
      return true;
    }
    return false;
  },

  clear(): void {
    ensureDataFile();
    fs.writeFileSync(getHistoryFilePath(), JSON.stringify([], null, 2), "utf-8");
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
