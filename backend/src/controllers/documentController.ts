import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { aiService } from "../services/aiService";
import { historyService } from "../services/historyService";
import { settingsService } from "../services/settingsService";

export const documentController = {
  async summarizeFile(req: Request, res: Response, next: NextFunction) {
    let filePath: string | null = null;
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No document file uploaded" });
      }

      filePath = req.file.path;
      const originalName = req.file.originalname;
      const { language = "both", summaryLength = "medium", provider: reqProvider } = req.body;

      const settings = settingsService.getSettings();
      const provider = reqProvider || settings.provider;
      const model = provider === "mistral" ? settings.mistralModel : settings.geminiModel;

      console.log(`[Document Controller] Ingesting document: ${originalName}`);
      const ingested = await aiService.ingestFile(filePath, originalName);
      const text = ingested.text;

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: "Could not extract readable text from uploaded file." });
      }

      console.log(`[Document Controller] Generating summary (${text.length} chars) with ${provider}...`);
      const sumRes = await aiService.summarize(text, provider, model, summaryLength);
      const englishSummary = sumRes.summary || "";

      // Run Hindi translation and Insights extraction concurrently to minimize latency
      const translatePromise = (language === "hindi" || language === "both")
        ? aiService.translate(englishSummary, provider).catch((e) => {
            console.warn("[Document Controller] Hindi translation warning:", e.message);
            return { translation: "" };
          })
        : Promise.resolve({ translation: "" });

      const insightsPromise = aiService.extractInsights(text, provider).catch((e) => {
        console.warn("[Document Controller] Insight extraction warning:", e.message);
        return { action_items: "", key_decisions: "", questions: "" };
      });

      const [transRes, insights] = await Promise.all([translatePromise, insightsPromise]);
      const hindiSummary = transRes?.translation || "";

      const historyItem = historyService.create({
        title: originalName,
        sourceType: "document",
        filename: originalName,
        charCount: text.length,
        provider,
        model,
        englishSummary,
        hindiSummary,
        actionItems: insights.action_items,
        keyDecisions: insights.key_decisions,
        questions: insights.questions,
        transcript: text
      });

      res.json({
        success: true,
        data: {
          id: historyItem.id,
          title: originalName,
          filename: originalName,
          text,
          transcript: text,
          englishSummary,
          hindiSummary,
          actionItems: insights.action_items,
          keyDecisions: insights.key_decisions,
          questions: insights.questions,
          charCount: text.length,
          provider,
          model,
          createdAt: historyItem.createdAt
        }
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
  }
};
