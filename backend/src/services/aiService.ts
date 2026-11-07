import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { config } from "../config";

const api = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: 180000 // 3 minutes timeout for long video transcription
});

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
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), originalName);

    const res = await api.post("/ai/ingest-file", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return res.data;
  },

  async summarize(text: string, provider?: string, model?: string, length?: string) {
    const res = await api.post("/ai/summarize", {
      text,
      provider,
      model,
      length: length || "medium"
    });
    return res.data;
  },

  async translate(text: string, provider?: string, targetLang: string = "hindi") {
    const res = await api.post("/ai/translate", {
      text,
      provider,
      target_lang: targetLang
    });
    return res.data;
  },

  async extractInsights(text: string, provider?: string) {
    const res = await api.post("/ai/extract-insights", {
      text,
      provider
    });
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
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), originalName);

    const res = await api.post("/ai/rag/index-file", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return res.data;
  },

  async ragQuery(query: string, chatHistory: any[] = [], k: number = 4, provider?: string) {
    const res = await api.post("/ai/rag/query", {
      query,
      chat_history: chatHistory,
      k,
      provider
    });
    return res.data;
  },

  async getRagStatus() {
    const res = await api.get("/ai/rag/status");
    return res.data;
  }
};
