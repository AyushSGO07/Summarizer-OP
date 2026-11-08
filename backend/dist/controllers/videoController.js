"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoController = void 0;
const aiService_1 = require("../services/aiService");
const historyService_1 = require("../services/historyService");
const settingsService_1 = require("../services/settingsService");
const config_1 = require("../config");
exports.videoController = {
    async getMetadata(req, res, next) {
        try {
            const { url } = req.body;
            if (!url) {
                return res.status(400).json({ success: false, error: "URL is required" });
            }
            const metadata = await aiService_1.aiService.getVideoMetadata(url);
            res.json({ success: true, data: metadata });
        }
        catch (err) {
            next(err);
        }
    },
    async summarize(req, res, next) {
        try {
            const { url, language = "both", summaryLength = "medium", provider: reqProvider } = req.body;
            if (!url) {
                return res.status(400).json({ success: false, error: "URL is required" });
            }
            // Assert server-side API keys exist before running operations
            config_1.aiConfig.assertConfigured();
            const settings = settingsService_1.settingsService.getSettings();
            const preferredProvider = reqProvider || settings.provider;
            const provider = config_1.aiConfig.getEffectiveProvider(preferredProvider);
            const model = provider === "mistral" ? settings.mistralModel : settings.geminiModel;
            // Step 1: Ingest Video (captions or audio download + Whisper)
            console.log(`[Video Controller] Ingesting video: ${url}`);
            const ingested = await aiService_1.aiService.ingestUrl(url);
            const transcript = ingested.text;
            if (!transcript || !transcript.trim()) {
                return res.status(400).json({ success: false, error: "No transcript or audible speech found in video." });
            }
            // Step 2: Generate English Executive Summary using centralized server-side configuration
            console.log(`[Video Controller] Summarizing with ${provider} (${summaryLength})...`);
            const sumRes = await aiService_1.aiService.summarize(transcript, provider, model, summaryLength);
            const englishSummary = sumRes.summary || "";
            // Step 3 & 4: In Parallel - Hindi Translation & Insights Extraction
            const translatePromise = (language === "hindi" || language === "both")
                ? aiService_1.aiService.translate(englishSummary, provider, "hindi").catch((e) => {
                    console.warn("[Video Controller] Hindi translation warning:", e.message);
                    return { translation: "" };
                })
                : Promise.resolve({ translation: "" });
            const insightsPromise = aiService_1.aiService.extractInsights(transcript, provider).catch((e) => {
                console.warn("[Video Controller] Insight extraction warning:", e.message);
                return { action_items: "", key_decisions: "", questions: "" };
            });
            const [transRes, insights] = await Promise.all([translatePromise, insightsPromise]);
            const hindiSummary = transRes?.translation || "";
            // Step 5: Save Record to Persistent History
            const historyItem = historyService_1.historyService.create({
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
        }
        catch (err) {
            next(err);
        }
    }
};
