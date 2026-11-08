import express from "express";
import cors from "cors";
import { config, aiConfig } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { settingsService } from "./services/settingsService";

// Prevent unhandled process crashes from silently exiting without diagnostics
process.on("uncaughtException", (err) => {
  console.error("[Backend Uncaught Exception]:", err?.message || err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Backend Unhandled Rejection]:", reason);
});

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins for API calls
      callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ extended: true, limit: "60mb" }));

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
    const settings = settingsService.getSettings();
    const effectiveProvider = aiConfig.getEffectiveProvider(settings.provider);
    res.json({
      backend: "operational",
      mistralConfigured: aiConfig.isMistralConfigured,
      geminiConfigured: aiConfig.isGeminiConfigured,
      activeProvider: effectiveProvider,
      configurationValid: Boolean(aiConfig.isMistralConfigured || aiConfig.isGeminiConfigured)
    });
  } catch (err: any) {
    res.status(500).json({
      backend: "operational",
      mistralConfigured: aiConfig.isMistralConfigured,
      geminiConfigured: aiConfig.isGeminiConfigured,
      activeProvider: "mistral",
      configurationValid: Boolean(aiConfig.isMistralConfigured || aiConfig.isGeminiConfigured),
      error: err?.message || "Diagnostics error"
    });
  }
});

// API Routes mounted on both /api and / to support path-stripped and prefixed rewrites
app.use("/api", routes);
app.use("/", routes);

// Centralized Error Handling
app.use(errorHandler);

// Start Server when running locally (not in serverless or test)
if (!process.env.VERCEL && !process.env.NOW_REGION && process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(`🚀 SUMMARIZER OP Backend running on port ${config.port}`);
    console.log(`🔗 Connected AI Microservice at: ${config.aiServiceUrl}`);
    console.log(`=================================================`);
  });
}

// Ensure both named and default exports resolve to the callable Express app
(app as any).default = app;
(app as any).app = app;

export = app;
