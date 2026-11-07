import { Request, Response, NextFunction } from "express";
import { settingsService } from "../services/settingsService";
import { aiService } from "../services/aiService";

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
      const aiHealth = await aiService.getHealth();
      const settings = settingsService.getSettings();

      res.json({
        success: true,
        data: {
          nodeBackend: "healthy",
          aiService: aiHealth,
          currentSettings: settings
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
