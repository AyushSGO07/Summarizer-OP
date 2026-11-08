"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = void 0;
const settingsService_1 = require("../services/settingsService");
const aiService_1 = require("../services/aiService");
const config_1 = require("../config");
exports.settingsController = {
    getSettings(_req, res, next) {
        try {
            const settings = settingsService_1.settingsService.getSettings();
            res.json({ success: true, data: settings });
        }
        catch (err) {
            next(err);
        }
    },
    updateSettings(req, res, next) {
        try {
            // Whitelist only safe non-credential settings
            const { provider, mistralModel, geminiModel, ragTopK, summaryLength, targetLanguage, theme } = req.body;
            const safePartial = {};
            if (provider !== undefined)
                safePartial.provider = provider;
            if (mistralModel !== undefined)
                safePartial.mistralModel = mistralModel;
            if (geminiModel !== undefined)
                safePartial.geminiModel = geminiModel;
            if (ragTopK !== undefined)
                safePartial.ragTopK = ragTopK;
            if (summaryLength !== undefined)
                safePartial.summaryLength = summaryLength;
            if (targetLanguage !== undefined)
                safePartial.targetLanguage = targetLanguage;
            if (theme !== undefined)
                safePartial.theme = theme;
            const updated = settingsService_1.settingsService.updateSettings(safePartial);
            res.json({ success: true, data: updated, message: "Settings saved successfully" });
        }
        catch (err) {
            next(err);
        }
    },
    async getSystemHealth(_req, res, next) {
        try {
            const aiHealth = await aiService_1.aiService.getHealth().catch(() => ({}));
            const settings = settingsService_1.settingsService.getSettings();
            const mistralConfigured = Boolean(config_1.aiConfig.isMistralConfigured || aiHealth?.mistral_available);
            const geminiConfigured = Boolean(config_1.aiConfig.isGeminiConfigured || aiHealth?.gemini_available);
            const effectiveProvider = config_1.aiConfig.getEffectiveProvider(settings.provider);
            const activeModel = effectiveProvider === "mistral" ? settings.mistralModel : settings.geminiModel;
            // Check whether the selected provider is initialized correctly with credentials
            const selectedProviderConfigured = settings.provider === "mistral" ? mistralConfigured : geminiConfigured;
            const isInitialized = selectedProviderConfigured || (mistralConfigured || geminiConfigured);
            const isAiConnected = Boolean(aiHealth?.status === "healthy" ||
                aiHealth?.status === "operational" ||
                config_1.aiConfig.hasAnyProvider);
            res.json({
                success: true,
                data: {
                    nodeBackend: "healthy",
                    backendStatus: "healthy",
                    aiServiceConnected: isAiConnected,
                    engine: {
                        activeProvider: settings.provider,
                        effectiveProvider,
                        activeModel,
                        isConfigured: mistralConfigured || geminiConfigured,
                        mistralConfigured,
                        geminiConfigured,
                        isInitialized,
                        connectionStatus: isAiConnected ? "connected" : "disconnected"
                    },
                    aiService: {
                        status: aiHealth?.status || "disconnected",
                        service: aiHealth?.service || "SUMMARIZER OP — AI Service",
                        mistral_available: mistralConfigured,
                        gemini_available: geminiConfigured,
                        ffmpeg_available: Boolean(aiHealth?.ffmpeg_available),
                        default_mistral_model: aiHealth?.default_mistral_model || settings.mistralModel,
                        chroma_dir_exists: Boolean(aiHealth?.chroma_dir_exists),
                        active_document: aiHealth?.active_document || null
                    },
                    currentSettings: settings
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
};
