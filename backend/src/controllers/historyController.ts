import { Request, Response, NextFunction } from "express";
import { historyService } from "../services/historyService";

export const historyController = {
  getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const records = historyService.getAll();
      res.json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  },

  getById(req: Request, res: Response, next: NextFunction) {
    try {
      const record = historyService.getById(req.params.id);
      if (!record) {
        return res.status(404).json({ success: false, error: "Summary record not found" });
      }
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },

  delete(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = historyService.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Summary record not found" });
      }
      res.json({ success: true, message: "Summary deleted successfully" });
    } catch (err) {
      next(err);
    }
  },

  clear(_req: Request, res: Response, next: NextFunction) {
    try {
      historyService.clear();
      res.json({ success: true, message: "History cleared successfully" });
    } catch (err) {
      next(err);
    }
  },

  getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = historyService.getStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
};
