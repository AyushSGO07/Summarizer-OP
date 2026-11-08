import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { config, aiConfig } from "../config";

const api = axios.create({
  timeout: 180000 // 3 minutes timeout for long video transcription and AI pipelines
});

// Dynamically resolve AI_SERVICE_URL at runtime on every request to support Vercel service bindings
api.interceptors.request.use((reqConfig) => {
  let rawBase = (process.env.AI_SERVICE_URL || config.aiServiceUrl || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");
  if (!rawBase.startsWith("http://") && !rawBase.startsWith("https://")) {
    rawBase = `https://${rawBase}`;
  }
  reqConfig.baseURL = rawBase;
  return reqConfig;
});

/**
 * Attaches verified server-side environment variables to internal server-to-server requests.
 * Never uses or forwards client-provided secrets.
 */
function buildHeaders(extraHeaders: Record<string, any> = {}) {
  const headers: Record<string, any> = { ...extraHeaders };
  const mistral = aiConfig.mistralApiKey;
  const gemini = aiConfig.geminiApiKey;

  if (mistral) headers["x-mistral-api-key"] = mistral;
  if (gemini) headers["x-gemini-api-key"] = gemini;
  return headers;
}

// ----------------- Direct LLM Fallback Handlers -----------------

async function callMistral(prompt: string, systemPrompt: string, modelName: string = "ministral-8b-latest"): Promise<string> {
  const key = aiConfig.mistralApiKey;
  if (!key) throw new Error("MISTRAL_API_KEY is not configured.");

  const response = await axios.post(
    "https://api.mistral.ai/v1/chat/completions",
    {
      model: modelName || "ministral-8b-latest",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      timeout: 60000
    }
  );

  return response.data?.choices?.[0]?.message?.content || "";
}

async function callGemini(prompt: string, systemPrompt: string, modelName: string = "gemini-3.5-flash-lite"): Promise<string> {
  const key = aiConfig.geminiApiKey;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");

  const selectedModel = modelName || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(key)}`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }
      ]
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 60000
    }
  );

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callLlmDirect(
  prompt: string,
  systemPrompt: string,
  preferredProvider: "mistral" | "gemini" = "mistral",
  model?: string
): Promise<string> {
  aiConfig.assertConfigured();

  if (preferredProvider === "mistral") {
    if (aiConfig.isMistralConfigured) {
      try {
        return await callMistral(prompt, systemPrompt, model || "ministral-8b-latest");
      } catch (err: any) {
        if (aiConfig.isGeminiConfigured) {
          console.warn("[aiService] Mistral direct call failed, falling back to Gemini:", err?.message);
          return await callGemini(prompt, systemPrompt, "gemini-3.5-flash-lite");
        }
        throw err;
      }
    } else if (aiConfig.isGeminiConfigured) {
      return await callGemini(prompt, systemPrompt, "gemini-3.5-flash-lite");
    }
  } else {
    if (aiConfig.isGeminiConfigured) {
      try {
        return await callGemini(prompt, systemPrompt, model || "gemini-3.5-flash-lite");
      } catch (err: any) {
        if (aiConfig.isMistralConfigured) {
          console.warn("[aiService] Gemini direct call failed, falling back to Mistral:", err?.message);
          return await callMistral(prompt, systemPrompt, "ministral-8b-latest");
        }
        throw err;
      }
    } else if (aiConfig.isMistralConfigured) {
      return await callMistral(prompt, systemPrompt, "ministral-8b-latest");
    }
  }

  throw new Error("No configured LLM provider available.");
}

// In-memory store for fallback RAG document indexing when Python microservice is unavailable
let directRagIndexedDocs: { docName: string; text: string; chunks: string[] }[] = [];

export const aiService = {
  async getHealth() {
    try {
      const res = await api.get("/health", { headers: buildHeaders(), timeout: 4000 });
      return res.data;
    } catch {
      return {
        status: "operational",
        service: "SUMMARIZER OP Backend (Direct LLM Engine)",
        mistral_available: aiConfig.isMistralConfigured,
        gemini_available: aiConfig.isGeminiConfigured,
        ffmpeg_available: false,
        default_mistral_model: "ministral-8b-latest",
        chroma_dir_exists: false,
        active_document: directRagIndexedDocs[0]?.docName || null
      };
    }
  },

  async getVideoMetadata(url: string) {
    try {
      const res = await api.post("/ai/video-metadata", { url }, { timeout: 8000 });
      return res.data;
    } catch {
      // Fallback: extract YouTube metadata via oEmbed
      const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : "video";
      try {
        const oembed = await axios.get(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { timeout: 5000 });
        return {
          title: oembed.data?.title || `YouTube Video (${videoId})`,
          channel: oembed.data?.author_name || "YouTube Creator",
          duration: 0,
          thumbnail: oembed.data?.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          video_id: videoId
        };
      } catch {
        return {
          title: `YouTube Video (${videoId})`,
          channel: "YouTube",
          duration: 0,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          video_id: videoId
        };
      }
    }
  },

  async ingestUrl(url: string) {
    try {
      const res = await api.post("/ai/ingest-url", { url });
      return res.data;
    } catch (e) {
      // Fallback: attempt to fetch page or oEmbed info
      const meta = await this.getVideoMetadata(url);
      return {
        title: meta.title || "YouTube Video",
        source_type: "video",
        text: `YouTube Video: ${meta.title}\nChannel: ${meta.channel}\nURL: ${url}`,
        char_count: meta.title?.length || 0,
        metadata: meta
      };
    }
  },

  async ingestFile(filePath: string, originalName: string) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const form = new FormData();
      form.append("file", fileBuffer, { filename: originalName });

      const formHeaders = form.getHeaders();
      const headers = {
        ...formHeaders,
        "Content-Length": form.getLengthSync()
      };

      const res = await api.post("/ai/ingest-file", form, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000
      });
      return res.data;
    } catch {
      // Fallback: parse plain text / markdown / csv file directly
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        return {
          filename: originalName,
          title: originalName,
          source_type: "document",
          text: content,
          char_count: content.length
        };
      } catch {
        return {
          filename: originalName,
          title: originalName,
          source_type: "document",
          text: `Document Content from ${originalName}`,
          char_count: originalName.length
        };
      }
    }
  },

  async summarize(text: string, provider?: string, model?: string, length?: string) {
    aiConfig.assertConfigured();
    const effectiveProvider = aiConfig.getEffectiveProvider(provider as any);

    try {
      const res = await api.post(
        "/ai/summarize",
        {
          text,
          provider: effectiveProvider,
          model,
          length: length || "medium"
        },
        {
          headers: buildHeaders(),
          timeout: 60000
        }
      );
      if (res.data?.summary) return res.data;
    } catch (microserviceErr: any) {
      console.warn("[aiService] Microservice summarize unavailable, executing direct LLM:", microserviceErr?.message);
    }

    // Direct LLM Execution
    const systemPrompt =
      "You are an elite executive assistant and meeting analyst.\n" +
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

  async translate(text: string, provider?: string, targetLang: string = "hindi") {
    aiConfig.assertConfigured();
    const effectiveProvider = aiConfig.getEffectiveProvider(provider as any);

    try {
      const res = await api.post(
        "/ai/translate",
        {
          text,
          provider: effectiveProvider,
          target_lang: targetLang
        },
        {
          headers: buildHeaders(),
          timeout: 45000
        }
      );
      if (res.data?.translation) return res.data;
    } catch (microserviceErr: any) {
      console.warn("[aiService] Microservice translate unavailable, executing direct LLM:", microserviceErr?.message);
    }

    const systemPrompt =
      "You are an expert bilingual English-to-Hindi translator.\n" +
      "Translate the provided English text into natural, fluent, and professional Hindi.\n\n" +
      "Guidelines:\n" +
      "1. Maintain accurate meaning without mechanical or awkward word-for-word translation.\n" +
      "2. Preserve all Markdown formatting including headings (###, ##), bold text, and bullet points.\n" +
      "3. Keep technical terminology, product names, acronyms, and proper nouns in English or transliterated script.\n" +
      "4. Output ONLY the translated Hindi content without extra commentary.";

    const translation = await callLlmDirect(text, systemPrompt, effectiveProvider);
    return { translation };
  },

  async extractInsights(text: string, provider?: string) {
    aiConfig.assertConfigured();
    const effectiveProvider = aiConfig.getEffectiveProvider(provider as any);

    try {
      const res = await api.post(
        "/ai/extract-insights",
        {
          text,
          provider: effectiveProvider
        },
        {
          headers: buildHeaders(),
          timeout: 45000
        }
      );
      if (res.data) return res.data;
    } catch (microserviceErr: any) {
      console.warn("[aiService] Microservice extract-insights unavailable, executing direct LLM:", microserviceErr?.message);
    }

    const actionPrompt =
      "Extract all actionable tasks and action items from the text. Format each item with Task Description, Owner / Responsible, Deadline / Timeline, Priority. Format as a numbered list.";
    const decisionPrompt =
      "Extract all key decisions, agreements, and consensus reached in the text. Format as a numbered list.";
    const questionPrompt =
      "Extract all unresolved questions, blockers, or topics flagged for future follow-up from the text. Format as a numbered list.";

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

  async ragIndexText(text: string, docName: string) {
    try {
      const res = await api.post("/ai/rag/index-text", { text, doc_name: docName }, { timeout: 15000 });
      return res.data;
    } catch {
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
    }
  },

  async ragIndexFile(filePath: string, originalName: string) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const form = new FormData();
      form.append("file", fileBuffer, { filename: originalName });

      const formHeaders = form.getHeaders();
      const headers = {
        ...formHeaders,
        "Content-Length": form.getLengthSync()
      };

      const res = await api.post("/ai/rag/index-file", form, {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000
      });
      return res.data;
    } catch {
      let text = originalName;
      try {
        text = fs.readFileSync(filePath, "utf-8");
      } catch {}
      return this.ragIndexText(text, originalName);
    }
  },

  async ragQuery(query: string, chatHistory: any[] = [], k: number = 4, provider?: string) {
    aiConfig.assertConfigured();
    const effectiveProvider = aiConfig.getEffectiveProvider(provider as any);

    try {
      const res = await api.post(
        "/ai/rag/query",
        {
          query,
          chat_history: chatHistory,
          k,
          provider: effectiveProvider
        },
        {
          headers: buildHeaders(),
          timeout: 45000
        }
      );
      if (res.data?.answer) return res.data;
    } catch (microserviceErr: any) {
      console.warn("[aiService] Microservice ragQuery unavailable, executing direct RAG:", microserviceErr?.message);
    }

    // Direct RAG fallback
    const activeDoc = directRagIndexedDocs[0];
    const context = activeDoc ? activeDoc.chunks.slice(0, k).join("\n\n---\n\n") : "No indexed document found.";

    const systemPrompt =
      "You are an expert AI Meeting & Document Intelligence Assistant.\n" +
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
    try {
      const res = await api.get("/ai/rag/status", { timeout: 4000 });
      return res.data;
    } catch {
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
  }
};
