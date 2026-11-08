import { Request, Response, NextFunction } from "express";
import { settingsService } from "../services/settingsService";
import { aiService } from "../services/aiService";
import { aiConfig } from "../config";

export const settingsController = {
  getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = settingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // Whitelist only safe non-credential settings
      const {
        provider,
        mistralModel,
        geminiModel,
        ragTopK,
        summaryLength,
        targetLanguage,
        theme
      } = req.body;

      const safePartial: Record<string, any> = {};
      if (provider !== undefined) safePartial.provider = provider;
      if (mistralModel !== undefined) safePartial.mistralModel = mistralModel;
      if (geminiModel !== undefined) safePartial.geminiModel = geminiModel;
      if (ragTopK !== undefined) safePartial.ragTopK = ragTopK;
      if (summaryLength !== undefined) safePartial.summaryLength = summaryLength;
      if (targetLanguage !== undefined) safePartial.targetLanguage = targetLanguage;
      if (theme !== undefined) safePartial.theme = theme;

      const updated = settingsService.updateSettings(safePartial);
      res.json({ success: true, data: updated, message: "Settings saved successfully" });
    } catch (err) {
      next(err);
    }
  },

  async getSystemHealth(_req: Request, res: Response, next: NextFunction) {
    try {
      const aiHealth = await aiService.getHealth().catch(() => ({}));
      const settings = settingsService.getSettings();

      const mistralConfigured = Boolean(aiConfig.isMistralConfigured || aiHealth?.mistral_available);
      const geminiConfigured = Boolean(aiConfig.isGeminiConfigured || aiHealth?.gemini_available);

      const effectiveProvider = aiConfig.getEffectiveProvider(settings.provider);
      const activeModel = effectiveProvider === "mistral" ? settings.mistralModel : settings.geminiModel;

      // Check whether the selected provider is initialized correctly with credentials
      const selectedProviderConfigured = settings.provider === "mistral" ? mistralConfigured : geminiConfigured;
      const isInitialized = selectedProviderConfigured || (mistralConfigured || geminiConfigured);
      const isAiConnected = Boolean(
        aiHealth?.status === "healthy" ||
        aiHealth?.status === "operational" ||
        aiConfig.hasAnyProvider
      );

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
    } catch (err) {
      next(err);
    }
  }
};
