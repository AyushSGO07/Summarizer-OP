"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    // Safe server-side error logging (never logs credential secrets)
    const sanitizedMessage = String(err?.message || err).replace(/([a-zA-Z0-9_\-]{20,})/g, "[REDACTED]");
    console.error(`[Backend Error Handler] Status: ${err.status || err.statusCode || err.response?.status || 500} -`, sanitizedMessage);
    let status = err.status || err.statusCode || err.response?.status || 500;
    let classification = "INTERNAL_SERVER_ERROR";
    let message = "An internal server error occurred.";
    const rawMsg = String(err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "");
    const lowerRaw = rawMsg.toLowerCase();
    // 1. Missing Environment Variable
    if (lowerRaw.includes("no ai api key found") ||
        lowerRaw.includes("environment variable") ||
        lowerRaw.includes("please configure mistral_api_key")) {
        status = 503;
        classification = "MISSING_ENVIRONMENT_VARIABLE";
        message = "Configuration Error: Neither MISTRAL_API_KEY nor GEMINI_API_KEY is configured in server environment variables.";
    }
    // 2. Invalid API Key (401/403)
    else if (status === 401 ||
        status === 403 ||
        lowerRaw.includes("invalid api key") ||
        lowerRaw.includes("unauthorized") ||
        lowerRaw.includes("permission denied") ||
        lowerRaw.includes("api_key_invalid") ||
        lowerRaw.includes("authentication error")) {
        status = 401;
        classification = "AUTHENTICATION_ERROR";
        message = "Authentication Error: The provided AI API key is invalid or unauthorized (401/403). Please verify your API key in Vercel Project Settings.";
    }
    // 3. Provider Rate Limit (429)
    else if (status === 429 ||
        lowerRaw.includes("rate limit") ||
        lowerRaw.includes("quota exceeded") ||
        lowerRaw.includes("resource_exhausted")) {
        status = 429;
        classification = "RATE_LIMIT_ERROR";
        message = "Rate Limit Error: Upstream AI provider rate limit reached (429). Please retry in a few moments.";
    }
    // 4. Invalid Model Name
    else if (lowerRaw.includes("model not found") ||
        lowerRaw.includes("invalid model") ||
        lowerRaw.includes("unsupported model")) {
        status = 400;
        classification = "INVALID_MODEL_NAME";
        message = "Model Error: The requested AI model name is invalid or unsupported by the active provider.";
    }
    // 5. Provider Timeout
    else if (status === 504 ||
        lowerRaw.includes("timeout") ||
        lowerRaw.includes("etimedout") ||
        lowerRaw.includes("econnaborted")) {
        status = 504;
        classification = "PROVIDER_TIMEOUT";
        message = "Gateway Timeout: Upstream AI request timed out. Please try with a shorter text or document.";
    }
    // 6. Malformed API Request
    else if (status === 400 ||
        lowerRaw.includes("bad request") ||
        lowerRaw.includes("validation error")) {
        status = 400;
        classification = "MALFORMED_REQUEST";
        message = rawMsg || "Invalid Request: The request payload was malformed or missing required fields.";
    }
    // 7. Internal / Upstream connection error
    else {
        if (lowerRaw.includes("econnrefused") || lowerRaw.includes("enotfound")) {
            message = "Service Unavailable: The AI execution service is currently unreachable.";
        }
        else if (rawMsg) {
            message = rawMsg;
        }
    }
    res.status(status).json({
        success: false,
        error: message,
        classification,
        statusCode: status,
        timestamp: new Date().toISOString()
    });
}
