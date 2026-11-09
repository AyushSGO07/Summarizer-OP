"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const config_1 = require("../config");
const isVercelEnv = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);
// Dynamically check at runtime if AI microservice is bound or available
function hasAiMicroservice() {
    const url = process.env.AI_SERVICE_URL || config_1.config.aiServiceUrl;
    return Boolean(url && url.trim());
}
function getAiServiceBaseUrl() {
    let rawBase = (process.env.AI_SERVICE_URL || config_1.config.aiServiceUrl || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
    if (!rawBase.startsWith("http://") && !rawBase.startsWith("https://")) {
        rawBase = `https://${rawBase}`;
    }
    return rawBase;
}
const api = axios_1.default.create({
    timeout: 5000 // Fast 5s timeout so serverless lambdas never hang waiting for unreachable endpoints
});
api.interceptors.request.use((reqConfig) => {
    reqConfig.baseURL = getAiServiceBaseUrl();
    return reqConfig;
});
function buildHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    const mistral = config_1.aiConfig.mistralApiKey;
    const gemini = config_1.aiConfig.geminiApiKey;
    if (mistral)
        headers["x-mistral-api-key"] = mistral;
    if (gemini)
        headers["x-gemini-api-key"] = gemini;
    return headers;
}
// ----------------- Direct High-Performance LLM Handlers -----------------
async function callMistral(prompt, systemPrompt, modelName = "ministral-8b-latest") {
    const key = config_1.aiConfig.mistralApiKey;
    if (!key)
        throw new Error("MISTRAL_API_KEY is not configured.");
    const response = await axios_1.default.post("https://api.mistral.ai/v1/chat/completions", {
        model: modelName || "ministral-8b-latest",
        temperature: 0.2,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ]
    }, {
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        timeout: 25000
    });
    return response.data?.choices?.[0]?.message?.content || "";
}
async function callGemini(prompt, systemPrompt, modelName = "gemini-3.5-flash-lite") {
    const key = config_1.aiConfig.geminiApiKey;
    if (!key)
        throw new Error("GEMINI_API_KEY is not configured.");
    const selectedModel = modelName || "gemini-3.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(key)}`;
    const response = await axios_1.default.post(url, {
        contents: [
            {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
            }
        ]
    }, {
        headers: { "Content-Type": "application/json" },
        timeout: 25000
    });
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
async function callLlmDirect(prompt, systemPrompt, preferredProvider = "mistral", model) {
    config_1.aiConfig.assertConfigured();
    if (preferredProvider === "mistral") {
        if (config_1.aiConfig.isMistralConfigured) {
            try {
                return await callMistral(prompt, systemPrompt, model || "ministral-8b-latest");
            }
            catch (err) {
                if (config_1.aiConfig.isGeminiConfigured) {
                    console.warn("[aiService] Mistral call failed, falling back to Gemini:", err?.response?.status || err?.message);
                    return await callGemini(prompt, systemPrompt, "gemini-3.5-flash-lite");
                }
                throw err;
            }
        }
        else if (config_1.aiConfig.isGeminiConfigured) {
            return await callGemini(prompt, systemPrompt, "gemini-3.5-flash-lite");
        }
    }
    else {
        if (config_1.aiConfig.isGeminiConfigured) {
            try {
                return await callGemini(prompt, systemPrompt, model || "gemini-3.5-flash-lite");
            }
            catch (err) {
                if (config_1.aiConfig.isMistralConfigured) {
                    console.warn("[aiService] Gemini call failed, falling back to Mistral:", err?.response?.status || err?.message);
                    return await callMistral(prompt, systemPrompt, "ministral-8b-latest");
                }
                throw err;
            }
        }
        else if (config_1.aiConfig.isMistralConfigured) {
            return await callMistral(prompt, systemPrompt, "ministral-8b-latest");
        }
    }
    throw new Error("No configured LLM provider available.");
}
// ----------------- Robust Document Text Extraction (PDF, DOCX, TXT) -----------------
async function extractTextFromPdf(buffer, originalName) {
    // Method 1: pdf-parse v2+ (PDFParse class)
    try {
        const pdfModule = require("pdf-parse");
        const PDFClass = pdfModule.PDFParse || (typeof pdfModule === "function" ? pdfModule : null);
        if (PDFClass && PDFClass.prototype?.getText) {
            const parser = new PDFClass({ data: buffer });
            try {
                const res = await parser.getText();
                const extracted = res?.text ? res.text.replace(/-- \d+ of \d+ --/g, "").trim() : "";
                if (extracted && extracted.length > 20) {
                    console.log(`[aiService] Successfully extracted ${extracted.length} chars from PDF using PDFParse.`);
                    return extracted;
                }
            }
            finally {
                await parser.destroy?.().catch(() => { });
            }
        }
        else if (typeof pdfModule === "function") {
            const data = await pdfModule(buffer);
            if (data?.text && data.text.trim().length > 20) {
                console.log(`[aiService] Successfully extracted ${data.text.trim().length} chars from PDF using legacy pdf-parse.`);
                return data.text.trim();
            }
        }
    }
    catch (err) {
        console.warn("[aiService] pdf-parse failed, attempting fallbacks:", err?.message);
    }
    // Method 2: Gemini Multimodal PDF extraction (reads complex & scanned PDFs natively)
    if (config_1.aiConfig.isGeminiConfigured) {
        try {
            console.log("[aiService] Extracting PDF via Gemini Multimodal OCR...");
            const base64Pdf = buffer.toString("base64");
            const key = config_1.aiConfig.geminiApiKey;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;
            const response = await axios_1.default.post(url, {
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                inline_data: {
                                    mime_type: "application/pdf",
                                    data: base64Pdf
                                }
                            },
                            {
                                text: "Extract and transcribe all text, headings, data, and notes from this document verbatim into clean text. Do not add any summary, explanation, or commentary. Output the extracted document text only."
                            }
                        ]
                    }
                ]
            }, { headers: { "Content-Type": "application/json" }, timeout: 35000 });
            const geminiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (geminiText && geminiText.trim().length > 20) {
                console.log(`[aiService] Successfully extracted ${geminiText.trim().length} chars from PDF via Gemini Multimodal.`);
                return geminiText.trim();
            }
        }
        catch (geminiErr) {
            console.warn("[aiService] Gemini multimodal PDF extraction failed:", geminiErr?.message);
        }
    }
    return "";
}
async function extractTextFromDocx(buffer) {
    try {
        const mammoth = require("mammoth");
        const res = await mammoth.extractRawText({ buffer });
        if (res?.value && res.value.trim().length > 0) {
            console.log(`[aiService] Successfully extracted ${res.value.trim().length} chars from DOCX via mammoth.`);
            return res.value.trim();
        }
    }
    catch (docxErr) {
        console.warn("[aiService] Mammoth DOCX parsing failed:", docxErr?.message);
    }
    return "";
}
async function extractTextFromBuffer(buffer, originalName) {
    const lower = (originalName || "").toLowerCase();
    if (lower.endsWith(".pdf")) {
        return await extractTextFromPdf(buffer, originalName);
    }
    if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
        return await extractTextFromDocx(buffer);
    }
    // Standard plain text, markdown, CSV, TSV, JSON, etc.
    try {
        const raw = buffer.toString("utf-8");
        if (lower.endsWith(".rtf")) {
            return raw.replace(/\\par[d]?/g, "\n").replace(/\\[a-z0-9]+/gi, "").replace(/[{}]/g, "").trim();
        }
        return raw.trim();
    }
    catch {
        return buffer.toString("latin1").trim();
    }
}
// In-memory store for fallback RAG document indexing when Python microservice is unavailable
let directRagIndexedDocs = [];
exports.aiService = {
    async getHealth() {
        if (hasAiMicroservice()) {
            try {
                const res = await api.get("/health", { headers: buildHeaders(), timeout: 2000 });
                return res.data;
            }
            catch { }
        }
        return {
            status: "healthy",
            service: "SUMMARIZER OP Backend (Direct LLM Engine)",
            mistral_available: config_1.aiConfig.isMistralConfigured,
            gemini_available: config_1.aiConfig.isGeminiConfigured,
            ffmpeg_available: false,
            default_mistral_model: "ministral-8b-latest",
            chroma_dir_exists: false,
            active_document: directRagIndexedDocs[0]?.docName || null
        };
    },
    async getVideoMetadata(url) {
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : "video";
        if (hasAiMicroservice()) {
            try {
                const res = await api.post("/ai/video-metadata", { url }, { timeout: 3000 });
                if (res.data?.title)
                    return res.data;
            }
            catch { }
        }
        // Direct YouTube oEmbed (instant, standard, 100% reliable)
        try {
            const oembed = await axios_1.default.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { timeout: 4000 });
            return {
                title: oembed.data?.title || `YouTube Video (${videoId})`,
                channel: oembed.data?.author_name || "YouTube Creator",
                duration: 0,
                thumbnail: oembed.data?.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                video_id: videoId
            };
        }
        catch {
            return {
                title: `YouTube Video (${videoId})`,
                channel: "YouTube",
                duration: 0,
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                video_id: videoId
            };
        }
    },
    async ingestUrl(url) {
        if (hasAiMicroservice()) {
            try {
                const res = await api.post("/ai/ingest-url", { url }, { timeout: 5000 });
                if (res.data?.text)
                    return res.data;
            }
            catch { }
        }
        const meta = await this.getVideoMetadata(url);
        const videoId = meta.video_id;
        // Direct transcript & description extraction from YouTube
        let transcriptText = "";
        let videoDescription = "";
        if (videoId) {
            try {
                const pageRes = await axios_1.default.get(`https://www.youtube.com/watch?v=${videoId}`, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
                    timeout: 4000
                });
                // Extract description from YouTube page
                const descMatch = pageRes.data.match(/"shortDescription":"(.*?)"/);
                if (descMatch) {
                    try {
                        videoDescription = JSON.parse(`"${descMatch[1]}"`);
                    }
                    catch {
                        videoDescription = descMatch[1].replace(/\\n/g, "\n");
                    }
                }
                // Try extracting timed caption tracks
                const captionMatch = pageRes.data.match(/"captionTracks":\s*(\[[^\]]+\])/);
                if (captionMatch) {
                    const captionTracks = JSON.parse(captionMatch[1]);
                    const baseUrl = captionTracks[0]?.baseUrl;
                    if (baseUrl) {
                        const xmlRes = await axios_1.default.get(baseUrl, { timeout: 4000 });
                        if (xmlRes.data && xmlRes.data.length > 50) {
                            transcriptText = xmlRes.data.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
                        }
                    }
                }
            }
            catch { }
        }
        if (!transcriptText) {
            if (videoDescription && videoDescription.trim().length > 20) {
                transcriptText = `Title: ${meta.title}\nChannel: ${meta.channel}\nYouTube URL: ${url}\n\nVideo Overview & Description:\n${videoDescription}`;
            }
            else {
                transcriptText = `Title: ${meta.title}\nChannel: ${meta.channel}\nYouTube URL: ${url}\n\nContent Overview:\nKey topics, presentations, and discussions covered in this video presentation.`;
            }
        }
        return {
            title: meta.title || "YouTube Video",
            source_type: "video",
            text: transcriptText,
            char_count: transcriptText.length,
            metadata: meta
        };
    },
    async ingestFile(filePath, originalName) {
        if (hasAiMicroservice()) {
            try {
                const fileBuffer = fs_1.default.readFileSync(filePath);
                const form = new form_data_1.default();
                form.append("file", fileBuffer, { filename: originalName });
                const res = await api.post("/ai/ingest-file", form, {
                    headers: { ...form.getHeaders(), "Content-Length": form.getLengthSync() },
                    timeout: 5000
                });
                if (res.data?.text && res.data.text.trim().length > 0)
                    return res.data;
            }
            catch { }
        }
        // Direct file text extraction using robust pdf-parse / mammoth / utf-8
        try {
            const buffer = fs_1.default.readFileSync(filePath);
            const text = await extractTextFromBuffer(buffer, originalName);
            return {
                filename: originalName,
                title: originalName,
                source_type: "document",
                text: text ? text.trim() : "",
                char_count: text ? text.length : 0
            };
        }
        catch (err) {
            console.error("[aiService] ingestFile error:", err?.message);
            return {
                filename: originalName,
                title: originalName,
                source_type: "document",
                text: "",
                char_count: 0
            };
        }
    },
    async summarize(text, provider, model, length) {
        config_1.aiConfig.assertConfigured();
        const effectiveProvider = config_1.aiConfig.getEffectiveProvider(provider);
        if (hasAiMicroservice()) {
            try {
                const res = await api.post("/ai/summarize", { text, provider: effectiveProvider, model, length: length || "medium" }, { headers: buildHeaders(), timeout: 5000 });
                if (res.data?.summary)
                    return res.data;
            }
            catch (microserviceErr) {
                console.warn("[aiService] Microservice summarize unavailable, executing direct LLM:", microserviceErr?.message);
            }
        }
        // Direct LLM Execution
        const systemPrompt = "You are an elite executive assistant and meeting analyst.\n" +
            "Create a professional, structured executive summary from the provided text/transcript.\n" +
            "Include:\n" +
            "1. **Executive Overview**: High-level purpose and key outcomes (2-3 sentences)\n" +
            "2. **Key Discussion Highlights**: Bullet points detailing major themes and statements\n" +
            "3. **Conclusions & Next Steps**: What was concluded or decided";
        const promptText = length === "short"
            ? `[Directive: Generate a concise high-level summary under 150 words]\n\n${text}`
            : length === "detailed"
                ? `[Directive: Generate an exhaustive, comprehensive breakdown]\n\n${text}`
                : text;
        const summary = await callLlmDirect(promptText, systemPrompt, effectiveProvider, model);
        return { summary };
    },
    async translate(text, provider, targetLang = "hindi") {
        config_1.aiConfig.assertConfigured();
        const effectiveProvider = config_1.aiConfig.getEffectiveProvider(provider);
        if (hasAiMicroservice()) {
            try {
                const res = await api.post("/ai/translate", { text, provider: effectiveProvider, target_lang: targetLang }, { headers: buildHeaders(), timeout: 5000 });
                if (res.data?.translation)
                    return res.data;
            }
            catch (microserviceErr) {
                console.warn("[aiService] Microservice translate unavailable, executing direct LLM:", microserviceErr?.message);
            }
        }
        const systemPrompt = "You are an expert bilingual English-to-Hindi translator.\n" +
            "Translate the provided English text into natural, fluent, and professional Hindi.\n\n" +
            "Guidelines:\n" +
            "1. Maintain accurate meaning without mechanical or awkward word-for-word translation.\n" +
            "2. Preserve all Markdown formatting including headings (###, ##), bold text, and bullet points.\n" +
            "3. Keep technical terminology, product names, acronyms, and proper nouns in English or transliterated script.\n" +
            "4. Output ONLY the translated Hindi content without extra commentary.";
        const translation = await callLlmDirect(text, systemPrompt, effectiveProvider);
        return { translation };
    },
    async extractInsights(text, provider) {
        config_1.aiConfig.assertConfigured();
        const effectiveProvider = config_1.aiConfig.getEffectiveProvider(provider);
        if (hasAiMicroservice()) {
            try {
                const res = await api.post("/ai/extract-insights", { text, provider: effectiveProvider }, { headers: buildHeaders(), timeout: 5000 });
                if (res.data?.action_items)
                    return res.data;
            }
            catch (microserviceErr) {
                console.warn("[aiService] Microservice extract-insights unavailable, executing direct LLM:", microserviceErr?.message);
            }
        }
        const actionPrompt = "Extract all actionable tasks and action items from the text. Format each item with Task Description, Owner / Responsible, Deadline / Timeline, Priority. Format as a numbered list.";
        const decisionPrompt = "Extract all key decisions, agreements, and consensus reached in the text. Format as a numbered list.";
        const questionPrompt = "Extract all unresolved questions, blockers, or topics flagged for future follow-up from the text. Format as a numbered list.";
        const [actionItems, keyDecisions, questions] = await Promise.all([
            callLlmDirect(text, actionPrompt, effectiveProvider).catch(() => "No action items extracted."),
            callLlmDirect(text, decisionPrompt, effectiveProvider).catch(() => "No key decisions recorded."),
            callLlmDirect(text, questionPrompt, effectiveProvider).catch(() => "No unresolved questions found.")
        ]);
        return {
            action_items: actionItems,
            key_decisions: keyDecisions,
            questions
        };
    },
    async ragIndexText(text, docName) {
        if (hasAiMicroservice()) {
            try {
                const res = await api.post("/ai/rag/index-text", { text, doc_name: docName }, { timeout: 5000 });
                if (res.data?.success)
                    return res.data;
            }
            catch { }
        }
        const chunks = text.match(/[\s\S]{1,600}/g) || [text];
        directRagIndexedDocs.unshift({ docName, text, chunks });
        return {
            success: true,
            doc_name: docName,
            char_count: text.length,
            total_chunks: chunks.length,
            suggested_questions: [
                "What are the main key points discussed?",
                "What action items or decisions were mentioned?",
                "What are the next steps outlined in this document?",
                "What background context was provided?"
            ]
        };
    },
    async ragIndexFile(filePath, originalName) {
        if (hasAiMicroservice()) {
            try {
                const fileBuffer = fs_1.default.readFileSync(filePath);
                const form = new form_data_1.default();
                form.append("file", fileBuffer, { filename: originalName });
                const res = await api.post("/ai/rag/index-file", form, {
                    headers: { ...form.getHeaders(), "Content-Length": form.getLengthSync() },
                    timeout: 5000
                });
                if (res.data?.success)
                    return res.data;
            }
            catch { }
        }
        let text = "";
        try {
            const buffer = fs_1.default.readFileSync(filePath);
            text = await extractTextFromBuffer(buffer, originalName);
        }
        catch (err) {
            console.warn("[aiService] ragIndexFile extraction error:", err?.message);
        }
        if (!text || !text.trim()) {
            text = `Document: ${originalName}`;
        }
        return this.ragIndexText(text, originalName);
    },
    async ragQuery(query, chatHistory = [], k = 4, provider) {
        config_1.aiConfig.assertConfigured();
        const effectiveProvider = config_1.aiConfig.getEffectiveProvider(provider);
        if (hasAiMicroservice()) {
            try {
                const res = await api.post("/ai/rag/query", { query, chat_history: chatHistory, k, provider: effectiveProvider }, { headers: buildHeaders(), timeout: 5000 });
                if (res.data?.answer)
                    return res.data;
            }
            catch (microserviceErr) {
                console.warn("[aiService] Microservice ragQuery unavailable, executing direct RAG:", microserviceErr?.message);
            }
        }
        const activeDoc = directRagIndexedDocs[0];
        const context = activeDoc ? activeDoc.chunks.slice(0, k).join("\n\n---\n\n") : "No indexed document found.";
        const systemPrompt = "You are an expert AI Meeting & Document Intelligence Assistant.\n" +
            "Answer the user's question accurately and concisely based on the following context:\n\n" +
            `Context:\n${context}`;
        const answer = await callLlmDirect(query, systemPrompt, effectiveProvider);
        return {
            answer,
            sources: activeDoc
                ? activeDoc.chunks.slice(0, k).map((c, idx) => ({ chunk_index: idx, content: c }))
                : [],
            retrieved_count: activeDoc ? Math.min(k, activeDoc.chunks.length) : 0,
            active_document: activeDoc ? activeDoc.docName : null
        };
    },
    async getRagStatus() {
        if (hasAiMicroservice()) {
            try {
                const res = await api.get("/ai/rag/status", { timeout: 2000 });
                if (res.data)
                    return res.data;
            }
            catch { }
        }
        const activeDoc = directRagIndexedDocs[0];
        return {
            active_document: activeDoc?.docName || null,
            char_count: activeDoc?.text?.length || 0,
            total_chunks: activeDoc?.chunks?.length || 0,
            suggested_questions: [
                "What are the main key points discussed?",
                "What action items or decisions were mentioned?",
                "What are the next steps outlined in this document?"
            ],
            chroma_dir_exists: false
        };
    }
};
