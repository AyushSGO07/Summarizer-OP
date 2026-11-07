import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { config } from "../config";

const api = axios.create({
  timeout: 180000 // 3 minutes timeout for long video transcription
});

// Dynamically resolve AI_SERVICE_URL at runtime on every request to support Vercel service bindings
api.interceptors.request.use((reqConfig) => {
  let rawBase = (process.env.AI_SERVICE_URL || config.aiServiceUrl || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
  if (!rawBase.startsWith("http://") && !rawBase.startsWith("https://")) {
    rawBase = `https://${rawBase}`;
  }
  reqConfig.baseURL = rawBase;
  return reqConfig;
});

export interface ApiKeys {
  mistralApiKey?: string;
  geminiApiKey?: string;
}

function buildHeaders(extraHeaders: Record<string, any> = {}, keys?: ApiKeys) {
  const headers = { ...extraHeaders };
  if (keys?.mistralApiKey) {
    headers["x-mistral-api-key"] = keys.mistralApiKey;
  }
  if (keys?.geminiApiKey) {
    headers["x-gemini-api-key"] = keys.geminiApiKey;
  }
  return headers;
}

export const aiService = {
  async getHealth() {
    const res = await api.get("/health");
    return res.data;
  },

  async getVideoMetadata(url: string) {
    const res = await api.post("/ai/video-metadata", { url });
    return res.data;
  },

  async ingestUrl(url: string) {
    const res = await api.post("/ai/ingest-url", { url });
    return res.data;
  },

  async ingestFile(filePath: string, originalName: string) {
    const fileBuffer = fs.readFileSync(filePath);
    const form = new FormData();
    form.append("file", fileBuffer, { filename: originalName });

    const formHeaders = form.getHeaders();
    const headers = {
      ...formHeaders,
      "Content-Length": form.getLengthSync()
    };

    const res = await api.post("/ai/ingest-file", form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return res.data;
  },

  async summarize(text: string, provider?: string, model?: string, length?: string, keys?: ApiKeys) {
    const res = await api.post(
      "/ai/summarize",
      {
        text,
        provider,
        model,
        length: length || "medium",
        mistral_api_key: keys?.mistralApiKey,
        gemini_api_key: keys?.geminiApiKey
      },
      {
        headers: buildHeaders({}, keys)
      }
    );
    return res.data;
  },

  async translate(text: string, provider?: string, targetLang: string = "hindi", keys?: ApiKeys) {
    const res = await api.post(
      "/ai/translate",
      {
        text,
        provider,
        target_lang: targetLang,
        mistral_api_key: keys?.mistralApiKey,
        gemini_api_key: keys?.geminiApiKey
      },
      {
        headers: buildHeaders({}, keys)
      }
    );
    return res.data;
  },

  async extractInsights(text: string, provider?: string, keys?: ApiKeys) {
    const res = await api.post(
      "/ai/extract-insights",
      {
        text,
        provider,
        mistral_api_key: keys?.mistralApiKey,
        gemini_api_key: keys?.geminiApiKey
      },
      {
        headers: buildHeaders({}, keys)
      }
    );
    return res.data;
  },

  async ragIndexText(text: string, docName: string) {
    const res = await api.post("/ai/rag/index-text", {
      text,
      doc_name: docName
    });
    return res.data;
  },

  async ragIndexFile(filePath: string, originalName: string) {
    const fileBuffer = fs.readFileSync(filePath);
    const form = new FormData();
    form.append("file", fileBuffer, { filename: originalName });

    const formHeaders = form.getHeaders();
    const headers = {
      ...formHeaders,
      "Content-Length": form.getLengthSync()
    };

    const res = await api.post("/ai/rag/index-file", form, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return res.data;
  },

  async ragQuery(query: string, chatHistory: any[] = [], k: number = 4, provider?: string, keys?: ApiKeys) {
    const res = await api.post(
      "/ai/rag/query",
      {
        query,
        chat_history: chatHistory,
        k,
        provider,
        mistral_api_key: keys?.mistralApiKey,
        gemini_api_key: keys?.geminiApiKey
      },
      {
        headers: buildHeaders({}, keys)
      }
    );
    return res.data;
  },

  async getRagStatus() {
    const res = await api.get("/ai/rag/status");
    return res.data;
  }
};
