"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyController = void 0;
const historyService_1 = require("../services/historyService");
exports.historyController = {
    getAll(_req, res, next) {
        try {
            const records = historyService_1.historyService.getAll();
            res.json({ success: true, data: records });
        }
        catch (err) {
            next(err);
        }
    },
    getById(req, res, next) {
        try {
            const record = historyService_1.historyService.getById(req.params.id);
            if (!record) {
                return res.status(404).json({ success: false, error: "Summary record not found" });
            }
            res.json({ success: true, data: record });
        }
        catch (err) {
            next(err);
        }
    },
    delete(req, res, next) {
        try {
            const deleted = historyService_1.historyService.delete(req.params.id);
            if (!deleted) {
                return res.status(404).json({ success: false, error: "Summary record not found" });
            }
            res.json({ success: true, message: "Summary deleted successfully" });
        }
        catch (err) {
            next(err);
        }
    },
    clear(_req, res, next) {
        try {
            historyService_1.historyService.clear();
            res.json({ success: true, message: "History cleared successfully" });
        }
        catch (err) {
            next(err);
        }
    },
    getStats(_req, res, next) {
        try {
            const stats = historyService_1.historyService.getStats();
            res.json({ success: true, data: stats });
        }
        catch (err) {
            next(err);
        }
    }
};
