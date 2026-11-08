"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragController = void 0;
const fs_1 = __importDefault(require("fs"));
const aiService_1 = require("../services/aiService");
const settingsService_1 = require("../services/settingsService");
const config_1 = require("../config");
exports.ragController = {
    async indexFile(req, res, next) {
        let filePath = null;
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: "No document uploaded for RAG indexing." });
            }
            filePath = req.file.path;
            const originalName = req.file.originalname;
            console.log(`[RAG Controller] Indexing file: ${originalName} into ChromaDB...`);
            const result = await aiService_1.aiService.ragIndexFile(filePath, originalName);
            res.json({
                success: true,
                data: result
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
    },
    async indexText(req, res, next) {
        try {
            const { text, docName } = req.body;
            if (!text || !docName) {
                return res.status(400).json({ success: false, error: "Text and docName are required." });
            }
            console.log(`[RAG Controller] Indexing text: '${docName}' (${text.length} chars) into ChromaDB...`);
            const result = await aiService_1.aiService.ragIndexText(text, docName);
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    },
    async query(req, res, next) {
        try {
            const { query, chatHistory = [], k: reqK, provider: reqProvider } = req.body;
            if (!query) {
                return res.status(400).json({ success: false, error: "Query is required." });
            }
            // Assert server-side API keys exist before running RAG inference
            config_1.aiConfig.assertConfigured();
            const settings = settingsService_1.settingsService.getSettings();
            const preferredProvider = reqProvider || settings.provider;
            const provider = config_1.aiConfig.getEffectiveProvider(preferredProvider);
            const k = reqK || settings.ragTopK || 4;
            console.log(`[RAG Controller] Querying ChromaDB with k=${k}, provider=${provider}: '${query}'`);
            const result = await aiService_1.aiService.ragQuery(query, chatHistory, k, provider);
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    },
    async getStatus(_req, res, next) {
        try {
            const status = await aiService_1.aiService.getRagStatus();
            res.json({
                success: true,
                data: status
            });
        }
        catch (err) {
            next(err);
        }
    }
};
