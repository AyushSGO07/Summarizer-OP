import path from "path";
import os from "os";
import dotenv from "dotenv";

// Safely load local .env in development without relying on CommonJS __dirname
try {
  const cwd = process.cwd();
  dotenv.config({ path: path.resolve(cwd, ".env") });
  dotenv.config({ path: path.resolve(cwd, "../.env") });
  dotenv.config({ path: path.resolve(cwd, "../../.env") });
  dotenv.config();
} catch {
  // In serverless deployment, environment variables are injected directly by the platform
}

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);

/**
 * Case-insensitively resolves environment variables with optional aliases.
 */
export function getEnvKey(...names: string[]): string | undefined {
  for (const name of names) {
    for (const [k, v] of Object.entries(process.env)) {
      if (k.toLowerCase() === name.toLowerCase() && v && v.trim()) {
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
export const aiConfig = {
  get mistralApiKey(): string | undefined {
    return getEnvKey("MISTRAL_API_KEY", "MISTRALAI_API_KEY", "MISTRAL_KEY");
  },

  get geminiApiKey(): string | undefined {
    return getEnvKey("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY", "GEMINI_KEY");
  },

  get isMistralConfigured(): boolean {
    return Boolean(this.mistralApiKey);
  },

  get isGeminiConfigured(): boolean {
    return Boolean(this.geminiApiKey);
  },

  get hasAnyProvider(): boolean {
    return this.isMistralConfigured || this.isGeminiConfigured;
  },

  /**
   * Resolves the effective provider.
   * If the preferred provider is configured, uses it.
   * Otherwise falls back gracefully to whichever provider has a configured key.
   */
  getEffectiveProvider(preferredProvider: "mistral" | "gemini" = "mistral"): "mistral" | "gemini" {
    if (preferredProvider === "mistral") {
      if (this.isMistralConfigured) return "mistral";
      if (this.isGeminiConfigured) return "gemini";
      return "mistral";
    } else {
      if (this.isGeminiConfigured) return "gemini";
      if (this.isMistralConfigured) return "mistral";
      return "gemini";
    }
  },

  /**
   * Validates that at least one provider has credentials configured in the environment.
   */
  assertConfigured(): void {
    if (!this.hasAnyProvider) {
      const err = new Error(
        "No AI API key found. Please configure MISTRAL_API_KEY or GEMINI_API_KEY in your server environment variables."
      );
      (err as any).statusCode = 503;
      throw err;
    }
  }
};

export const config = {
  isVercel,
  port: parseInt(process.env.PORT || "5000", 10),
  get aiServiceUrl(): string {
    return (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").trim();
  },
  get dataDir(): string {
    return isVercel
      ? path.join(os.tmpdir(), "summarizer_op_data")
      : path.resolve(process.cwd(), "backend/data");
  },
  get uploadDir(): string {
    return isVercel
      ? path.join(os.tmpdir(), "summarizer_op_uploads")
      : path.resolve(process.cwd(), "backend/uploads");
  },
  corsOrigins: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
};
