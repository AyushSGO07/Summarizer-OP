import { Request, Response, NextFunction } from "express";
import { aiService } from "../services/aiService";
import { historyService } from "../services/historyService";
import { settingsService } from "../services/settingsService";
import { aiConfig } from "../config";

export const videoController = {
  async getMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: "URL is required" });
      }
      const metadata = await aiService.getVideoMetadata(url);
      res.json({ success: true, data: metadata });
    } catch (err) {
      next(err);
    }
  },

  async summarize(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, language = "both", summaryLength = "medium", provider: reqProvider } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: "URL is required" });
      }

      // Assert server-side API keys exist before running operations
      aiConfig.assertConfigured();

      const settings = settingsService.getSettings();
      const preferredProvider = reqProvider || settings.provider;
      const provider = aiConfig.getEffectiveProvider(preferredProvider);
      const model = provider === "mistral" ? settings.mistralModel : settings.geminiModel;

      // Step 1: Ingest Video (captions or audio download + Whisper)
      console.log(`[Video Controller] Ingesting video: ${url}`);
      const ingested = await aiService.ingestUrl(url);
      const transcript = ingested.text;

      if (!transcript || !transcript.trim()) {
        return res.status(400).json({ success: false, error: "No transcript or audible speech found in video." });
      }

      // Step 2: Generate English Executive Summary using centralized server-side configuration
      console.log(`[Video Controller] Summarizing with ${provider} (${summaryLength})...`);
      const sumRes = await aiService.summarize(transcript, provider, model, summaryLength);
      const englishSummary = sumRes.summary || "";

      // Step 3 & 4: In Parallel - Hindi Translation & Insights Extraction
      const translatePromise = (language === "hindi" || language === "both")
        ? aiService.translate(englishSummary, provider, "hindi").catch((e) => {
            console.warn("[Video Controller] Hindi translation warning:", e.message);
            return { translation: "" };
          })
        : Promise.resolve({ translation: "" });

      const insightsPromise = aiService.extractInsights(transcript, provider).catch((e) => {
        console.warn("[Video Controller] Insight extraction warning:", e.message);
        return { action_items: "", key_decisions: "", questions: "" };
      });

      const [transRes, insights] = await Promise.all([translatePromise, insightsPromise]);
      const hindiSummary = transRes?.translation || "";

      // Step 5: Save Record to Persistent History
      const historyItem = historyService.create({
        title: ingested.title || `YouTube Video (${ingested.metadata?.video_id || "Video"})`,
        sourceType: "video",
        sourceUrl: url,
        charCount: transcript.length,
        provider,
        model,
        englishSummary,
        hindiSummary,
        actionItems: insights.action_items,
        keyDecisions: insights.key_decisions,
        questions: insights.questions,
        transcript,
        metadata: ingested.metadata
      });

      res.json({
        success: true,
        data: {
          id: historyItem.id,
          title: historyItem.title,
          url,
          transcript,
          text: transcript,
          englishSummary,
          hindiSummary,
          actionItems: insights.action_items,
          keyDecisions: insights.key_decisions,
          questions: insights.questions,
          metadata: ingested.metadata,
          charCount: transcript.length,
          provider,
          model,
          createdAt: historyItem.createdAt
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
