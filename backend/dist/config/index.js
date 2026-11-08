"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.aiConfig = void 0;
exports.getEnvKey = getEnvKey;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const dotenv_1 = __importDefault(require("dotenv"));
// Safely load local .env in development without relying on CommonJS __dirname
try {
    const cwd = process.cwd();
    dotenv_1.default.config({ path: path_1.default.resolve(cwd, ".env") });
    dotenv_1.default.config({ path: path_1.default.resolve(cwd, "../.env") });
    dotenv_1.default.config({ path: path_1.default.resolve(cwd, "../../.env") });
    dotenv_1.default.config();
}
catch {
    // In serverless deployment, environment variables are injected directly by the platform
}
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);
/**
 * Case-insensitively resolves environment variables with optional aliases.
 */
function getEnvKey(...names) {
    for (const name of names) {
        // 1. Direct property access
        const direct = process.env[name] || process.env[name.toUpperCase()] || process.env[name.toLowerCase()];
        if (direct && typeof direct === "string" && direct.trim()) {
            return direct.trim();
        }
        // 2. Case-insensitive search across process.env keys
        const lowerName = name.toLowerCase();
        for (const [k, v] of Object.entries(process.env)) {
            if (k.toLowerCase() === lowerName && v && typeof v === "string" && v.trim()) {
                return v.trim();
            }
        }
    }
    return undefined;
}
/**
 * Centralized server-side AI configuration module.
 * Reads server environment variables at runtime, validates availability,
 * and ensures secrets never leak to the client.
 */
exports.aiConfig = {
    get mistralApiKey() {
        return ((process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.trim()) ||
            (process.env.MISTRALAI_API_KEY && process.env.MISTRALAI_API_KEY.trim()) ||
            getEnvKey("MISTRAL_API_KEY", "MISTRALAI_API_KEY", "MISTRAL_KEY"));
    },
    get geminiApiKey() {
        return ((process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) ||
            (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) ||
            (process.env.GOOGLE_GENAI_API_KEY && process.env.GOOGLE_GENAI_API_KEY.trim()) ||
            getEnvKey("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY", "GEMINI_KEY"));
    },
    get isMistralConfigured() {
        return Boolean(this.mistralApiKey);
    },
    get isGeminiConfigured() {
        return Boolean(this.geminiApiKey);
    },
    get hasAnyProvider() {
        return this.isMistralConfigured || this.isGeminiConfigured;
    },
    /**
     * Resolves the effective provider.
     * If the preferred provider is configured, uses it.
     * Otherwise falls back gracefully to whichever provider has a configured key.
     */
    getEffectiveProvider(preferredProvider = "mistral") {
        if (preferredProvider === "mistral") {
            if (this.isMistralConfigured)
                return "mistral";
            if (this.isGeminiConfigured)
                return "gemini";
            return "mistral";
        }
        else {
            if (this.isGeminiConfigured)
                return "gemini";
            if (this.isMistralConfigured)
                return "mistral";
            return "gemini";
        }
    },
    /**
     * Validates that at least one provider has credentials configured in the environment.
     */
    assertConfigured() {
        if (!this.hasAnyProvider) {
            const err = new Error("No AI API key found. Please configure MISTRAL_API_KEY or GEMINI_API_KEY in your server environment variables.");
            err.statusCode = 503;
            throw err;
        }
    }
};
exports.config = {
    isVercel,
    port: parseInt(process.env.PORT || "5000", 10),
    get aiServiceUrl() {
        return (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").trim();
    },
    get dataDir() {
        return isVercel
            ? path_1.default.join(os_1.default.tmpdir(), "summarizer_op_data")
            : path_1.default.resolve(process.cwd(), "backend/data");
    },
    get uploadDir() {
        return isVercel
            ? path_1.default.join(os_1.default.tmpdir(), "summarizer_op_uploads")
            : path_1.default.resolve(process.cwd(), "backend/uploads");
    },
    corsOrigins: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
};
