"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentController = void 0;
const fs_1 = __importDefault(require("fs"));
const aiService_1 = require("../services/aiService");
const historyService_1 = require("../services/historyService");
const settingsService_1 = require("../services/settingsService");
const config_1 = require("../config");
exports.documentController = {
    async summarizeFile(req, res, next) {
        let filePath = null;
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: "No document file uploaded" });
            }
            // Assert server-side API keys exist before running operations
            config_1.aiConfig.assertConfigured();
            filePath = req.file.path;
            const originalName = req.file.originalname;
            const { language = "both", summaryLength = "medium", provider: reqProvider } = req.body;
            const settings = settingsService_1.settingsService.getSettings();
            const preferredProvider = reqProvider || settings.provider;
            const provider = config_1.aiConfig.getEffectiveProvider(preferredProvider);
            const model = provider === "mistral" ? settings.mistralModel : settings.geminiModel;
            console.log(`[Document Controller] Ingesting document: ${originalName}`);
            const ingested = await aiService_1.aiService.ingestFile(filePath, originalName);
            const text = ingested.text;
            if (!text || !text.trim()) {
                return res.status(400).json({ success: false, error: "Could not extract readable text from uploaded file." });
            }
            console.log(`[Document Controller] Generating summary (${text.length} chars) with ${provider}...`);
            const sumRes = await aiService_1.aiService.summarize(text, provider, model, summaryLength);
            const englishSummary = sumRes.summary || "";
            // Run Hindi translation and Insights extraction concurrently to minimize latency
            const translatePromise = (language === "hindi" || language === "both")
                ? aiService_1.aiService.translate(englishSummary, provider, "hindi").catch((e) => {
                    console.warn("[Document Controller] Hindi translation warning:", e.message);
                    return { translation: "" };
                })
                : Promise.resolve({ translation: "" });
            const insightsPromise = aiService_1.aiService.extractInsights(text, provider).catch((e) => {
                console.warn("[Document Controller] Insight extraction warning:", e.message);
                return { action_items: "", key_decisions: "", questions: "" };
            });
            const [transRes, insights] = await Promise.all([translatePromise, insightsPromise]);
            const hindiSummary = transRes?.translation || "";
            const historyItem = historyService_1.historyService.create({
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
        }
        catch (err) {
            next(err);
        }
        finally {
            if (filePath && fs_1.default.existsSync(filePath)) {
                try {
                    fs_1.default.unlinkSync(filePath);
                }
                catch { }
            }
        }
    }
};
