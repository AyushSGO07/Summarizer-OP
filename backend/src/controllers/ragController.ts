import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { aiService } from "../services/aiService";
import { settingsService } from "../services/settingsService";
import { aiConfig } from "../config";

export const ragController = {
  async indexFile(req: Request, res: Response, next: NextFunction) {
    let filePath: string | null = null;
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No document uploaded for RAG indexing." });
      }

      filePath = req.file.path;
      const originalName = req.file.originalname;

      console.log(`[RAG Controller] Indexing file: ${originalName} into ChromaDB...`);
      const result = await aiService.ragIndexFile(filePath, originalName);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
    }
  },

  async indexText(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, docName } = req.body;
      if (!text || !docName) {
        return res.status(400).json({ success: false, error: "Text and docName are required." });
      }

      console.log(`[RAG Controller] Indexing text: '${docName}' (${text.length} chars) into ChromaDB...`);
      const result = await aiService.ragIndexText(text, docName);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async query(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, chatHistory = [], k: reqK, provider: reqProvider } = req.body;
      if (!query) {
        return res.status(400).json({ success: false, error: "Query is required." });
      }

      // Assert server-side API keys exist before running RAG inference
      aiConfig.assertConfigured();

      const settings = settingsService.getSettings();
      const preferredProvider = reqProvider || settings.provider;
      const provider = aiConfig.getEffectiveProvider(preferredProvider);
      const k = reqK || settings.ragTopK || 4;

      console.log(`[RAG Controller] Querying ChromaDB with k=${k}, provider=${provider}: '${query}'`);
      const result = await aiService.ragQuery(query, chatHistory, k, provider);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const status = await aiService.getRagStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  }
};
