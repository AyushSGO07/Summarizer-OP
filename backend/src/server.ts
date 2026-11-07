import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and tools
      if (!origin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
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
    service: "SUMMARIZER OP Backend (Node.js/Express)",
    timestamp: new Date().toISOString()
  });
});

// API Routes mounted on both /api and / to support path-stripped and prefixed rewrites
app.use("/api", routes);
app.use("/", routes);

// Centralized Error Handling
app.use(errorHandler);

// Start Server when not running in test mode
if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(`🚀 SUMMARIZER OP Backend running on port ${config.port}`);
    console.log(`🔗 Connected AI Microservice at: ${config.aiServiceUrl}`);
    console.log(`=================================================`);
  });
}

export default app;
