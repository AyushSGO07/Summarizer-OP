import { Request, Response, NextFunction } from "express";
import { settingsService } from "../services/settingsService";
import { aiService, getEnvKey } from "../services/aiService";

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
      const updated = settingsService.updateSettings(req.body);
      res.json({ success: true, data: updated, message: "Settings saved successfully" });
    } catch (err) {
      next(err);
    }
  },

  async getSystemHealth(_req: Request, res: Response, next: NextFunction) {
    try {
      const aiHealth = await aiService.getHealth().catch(() => ({}));
      const settings = settingsService.getSettings();

      const nodeMistral = Boolean(getEnvKey("MISTRAL_API_KEY", "MISTRALAI_API_KEY", "MISTRAL_KEY"));
      const nodeGemini = Boolean(getEnvKey("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY", "GEMINI_KEY"));

      res.json({
        success: true,
        data: {
          nodeBackend: "healthy",
          aiService: {
            ...aiHealth,
            mistral_available: Boolean(aiHealth?.mistral_available || nodeMistral),
            gemini_available: Boolean(aiHealth?.gemini_available || nodeGemini)
          },
          currentSettings: settings
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
