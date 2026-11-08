"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const settingsService_1 = require("./services/settingsService");
// Prevent unhandled process crashes from silently exiting without diagnostics
process.on("uncaughtException", (err) => {
    console.error("[Backend Uncaught Exception]:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
    console.error("[Backend Unhandled Rejection]:", reason);
});
const app = (0, express_1.default)();
exports.app = app;
// Middlewares
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow all origins for API calls
        callback(null, true);
    },
    credentials: true
}));
app.use(express_1.default.json({ limit: "60mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "60mb" }));
// Basic Request Logger
app.use((req, _res, next) => {
    console.log(`[HTTP ${req.method}] ${req.url} - ${new Date().toISOString()}`);
    next();
});
// Health check endpoint (support both /health and /api/health)
app.get(["/health", "/api/health"], (_req, res) => {
    res.json({
        status: "ok",
        backend: "operational",
        service: "SUMMARIZER OP Backend (Node.js/Express)",
        timestamp: new Date().toISOString()
    });
});
// Safe Diagnostic Endpoint (dynamically determined, never leaks secrets)
app.get(["/diagnostics", "/api/diagnostics"], (_req, res) => {
    try {
        const settings = settingsService_1.settingsService.getSettings();
        const effectiveProvider = config_1.aiConfig.getEffectiveProvider(settings.provider);
        res.json({
            backend: "operational",
            mistralConfigured: config_1.aiConfig.isMistralConfigured,
            geminiConfigured: config_1.aiConfig.isGeminiConfigured,
            activeProvider: effectiveProvider,
            configurationValid: Boolean(config_1.aiConfig.isMistralConfigured || config_1.aiConfig.isGeminiConfigured)
        });
    }
    catch (err) {
        res.status(500).json({
            backend: "operational",
            mistralConfigured: config_1.aiConfig.isMistralConfigured,
            geminiConfigured: config_1.aiConfig.isGeminiConfigured,
            activeProvider: "mistral",
            configurationValid: Boolean(config_1.aiConfig.isMistralConfigured || config_1.aiConfig.isGeminiConfigured),
            error: err?.message || "Diagnostics error"
        });
    }
});
// API Routes mounted on both /api and / to support path-stripped and prefixed rewrites
app.use("/api", routes_1.default);
app.use("/", routes_1.default);
// Centralized Error Handling
app.use(errorHandler_1.errorHandler);
// Start Server listening on assigned PORT (ensures server process stays alive on Vercel)
const PORT = process.env.PORT || config_1.config.port || 5000;
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`=================================================`);
        console.log(`🚀 SUMMARIZER OP Backend listening on port ${PORT}`);
        console.log(`🔗 Connected AI Microservice at: ${config_1.config.aiServiceUrl}`);
        console.log(`=================================================`);
    });
}
// Ensure both named and default exports resolve to the callable Express app
app.default = app;
app.app = app;
exports.default = app;
