import axios from "axios";
import { VideoMetadata, SummaryRecord, RAGQueryResult, RAGStatus, AppSettings, SystemHealth } from "../types";

const api = axios.create({
  baseURL: "/api",
  timeout: 180000 // 3 minutes timeout for long video processing
});

// Automatically inject client-provided API keys (if set by user in Settings)
api.interceptors.request.use((reqConfig) => {
  try {
    const mistralKey = localStorage.getItem("mistral_api_key");
    const geminiKey = localStorage.getItem("gemini_api_key");
    if (mistralKey) {
      reqConfig.headers["x-mistral-api-key"] = mistralKey.trim();
    }
    if (geminiKey) {
      reqConfig.headers["x-gemini-api-key"] = geminiKey.trim();
    }
  } catch {}
  return reqConfig;
});

export const videoApi = {
  async getMetadata(url: string): Promise<VideoMetadata> {
    const res = await api.post("/video/metadata", { url });
    return res.data.data;
  },

  async summarize(params: {
    url: string;
    language?: "english" | "hindi" | "both";
    summaryLength?: "short" | "medium" | "detailed";
    provider?: string;
  }): Promise<SummaryRecord> {
    const res = await api.post("/video/summarize", params);
    return res.data.data;
  }
};

export const documentApi = {
  async summarize(formData: FormData): Promise<SummaryRecord> {
    // Note: Do NOT set Content-Type header manually for FormData in Axios/browser;
    // the browser automatically sets multipart/form-data with the correct boundary parameter.
    const res = await api.post("/document/summarize", formData);
    return res.data.data;
  }
};

export const ragApi = {
  async indexFile(formData: FormData): Promise<{
    doc_name: string;
    char_count: number;
    total_chunks: number;
    suggested_questions: string[];
  }> {
    const res = await api.post("/rag/index-file", formData);
    return res.data.data;
  },

  async indexText(params: { text: string; docName: string }) {
    const res = await api.post("/rag/index-text", params);
    return res.data.data;
  },

  async query(params: {
    query: string;
    chatHistory?: { role: string; content: string }[];
    k?: number;
    provider?: string;
  }): Promise<RAGQueryResult> {
    const res = await api.post("/rag/query", params);
    return res.data.data;
  },

  async getStatus(): Promise<RAGStatus> {
    const res = await api.get("/rag/status");
    return res.data.data;
  }
};

export const historyApi = {
  async getAll(): Promise<SummaryRecord[]> {
    const res = await api.get("/history");
    return res.data.data;
  },

  async getById(id: string): Promise<SummaryRecord> {
    const res = await api.get(`/history/${id}`);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/history/${id}`);
  },

  async clear(): Promise<void> {
    await api.delete("/history/clear");
  },

  async getStats(): Promise<{
    totalSummaries: number;
    videoCount: number;
    documentCount: number;
    latestSummaryTitle: string | null;
    latestSummaryDate: string | null;
  }> {
    const res = await api.get("/history/stats");
    return res.data.data;
  }
};

export const settingsApi = {
  async getSettings(): Promise<AppSettings> {
    const res = await api.get("/settings");
    return res.data.data;
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await api.put("/settings", settings);
    return res.data.data;
  },

  async getHealth(): Promise<SystemHealth> {
    const res = await api.get("/settings/health");
    return res.data.data;
  }
};
