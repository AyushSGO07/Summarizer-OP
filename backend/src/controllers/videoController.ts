import { Request, Response, NextFunction } from "express";
import { aiService } from "../services/aiService";
import { historyService } from "../services/historyService";
import { settingsService } from "../services/settingsService";

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

      const settings = settingsService.getSettings();
      const provider = reqProvider || settings.provider;
      const model = provider === "mistral" ? settings.mistralModel : settings.geminiModel;

      // Step 1: Ingest Video (captions or audio download + Whisper)
      console.log(`[Video Controller] Ingesting video: ${url}`);
      const ingested = await aiService.ingestUrl(url);
      const transcript = ingested.text;

      if (!transcript || !transcript.trim()) {
        return res.status(400).json({ success: false, error: "No transcript or audible speech found in video." });
      }

      // Step 2: Generate English Executive Summary
      console.log(`[Video Controller] Summarizing with ${provider} (${summaryLength})...`);
      const sumRes = await aiService.summarize(transcript, provider, model, summaryLength);
      const englishSummary = sumRes.summary;

      // Step 3: Hindi Translation
      let hindiSummary = "";
      if (language === "hindi" || language === "both") {
        console.log(`[Video Controller] Translating summary to Hindi...`);
        const transRes = await aiService.translate(englishSummary, provider);
        hindiSummary = transRes.translation;
      }

      // Step 4: Extract Insights (Actions & Decisions)
      console.log(`[Video Controller] Extracting action items and key decisions...`);
      const insights = await aiService.extractInsights(transcript, provider);

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
