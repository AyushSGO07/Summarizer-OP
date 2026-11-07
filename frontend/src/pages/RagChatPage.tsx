import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  UploadCloud,
  Trash2,
  Loader2,
  Sparkles,
  Bot,
  User,
  Database
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SourceCards } from "../components/SourceCards";
import { ragApi } from "../services/api";
import { RAGStatus, SourceChunk } from "../types";
import { useApp } from "../context/AppContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
}

export const RagChatPage: React.FC = () => {
  const { settings, activeRagDoc, setActiveRagDoc, showToast } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    try {
      const data = await ragApi.getStatus();
      setRagStatus(data);
      if (data.active_document) {
        setActiveRagDoc(data.active_document);
      }
      if (data.suggested_questions && data.suggested_questions.length > 0) {
        setSuggestedQuestions(data.suggested_questions);
      }
    } catch (err) {
      console.error("Failed to fetch RAG status:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Welcome to **Ask Your Documents**! Upload a PDF, document, or meeting record, and I will index it into **ChromaDB** using **HuggingFace embeddings**. You can then ask questions, and I'll generate grounded answers with exact source chunk citations."
      }
    ]);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      setIndexing(true);
      showToast(`Indexing ${file.name} into ChromaDB...`, "info");

      const formData = new FormData();
      formData.append("file", file);

      const res = await ragApi.indexFile(formData);
      setActiveRagDoc(res.doc_name);
      setSuggestedQuestions(res.suggested_questions || []);
      await fetchStatus();

      showToast(`Indexed ${res.total_chunks} chunks from "${res.doc_name}"!`, "success");

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: `✅ Successfully indexed **${res.doc_name}** (${res.total_chunks} chunks). Ask me anything about its content below!`
        }
      ]);
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || "Indexing failed", "error");
    } finally {
      setIndexing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const query = (queryText || inputQuery).trim();
    if (!query) return;

    if (!ragStatus?.active_document && !activeRagDoc) {
      showToast("Please upload or index a document first.", "error");
      return;
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await ragApi.query({
        query,
        chatHistory: historyPayload,
        k: settings.ragTopK,
        provider: settings.provider
      });

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: res.answer,
        sources: res.sources
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Failed to retrieve grounded answer";
      showToast(errMsg, "error");
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: `⚠️ **Error**: ${errMsg}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat history cleared. What would you like to know about your indexed document?"
      }
    ]);
    showToast("Chat cleared", "info");
  };

  return (
    <div className="space-y-6 animate-fadeIn flex flex-col h-[calc(100vh-6rem)]">
      <Navbar
        title="Ask Your Documents"
        badge="Conversational RAG"
        subtitle="Query uploaded files using ChromaDB vector retrieval, grounded citations, and conversational memory."
      />

      {/* Active Knowledge Base Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 bg-white shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              Active Knowledge Base
            </div>
            <div className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <span>{activeRagDoc || ragStatus?.active_document || "No document loaded"}</span>
              {(activeRagDoc || ragStatus?.active_document) && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {ragStatus?.total_chunks || 0} Chunks Indexed
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={indexing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-all disabled:opacity-50"
          >
            {indexing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                <span>Indexing Document...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                <span>Upload New Document</span>
              </>
            )}
          </button>

          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 shadow-sm transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto glass-panel p-5 rounded-2xl border border-[#E2E8F0] space-y-4 shadow-card bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-glow font-medium"
                  : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
              }`}
            >
              <div className="prose prose-purple max-w-none text-xs sm:text-sm">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {msg.sources && msg.sources.length > 0 && <SourceCards sources={msg.sources} />}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3.5 justify-start animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-600 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>Retrieving relevant chunks & synthesizing grounded answer...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Follow-up Questions Prompt Chips */}
      {suggestedQuestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Suggested:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 transition-all text-left truncate max-w-xs shadow-sm disabled:opacity-50"
            >
              👉 {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-3"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a question about your indexed document..."
            disabled={loading}
            className="w-full pl-4 pr-12 py-3.5 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
