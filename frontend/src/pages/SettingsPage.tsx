import React, { useState, useEffect } from "react";
import {
  Cpu,
  Database,
  ShieldCheck,
  Check,
  Key,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useApp } from "../context/AppContext";

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, systemHealth, showToast, refreshHealth } = useApp();
  const [provider, setProvider] = useState<"mistral" | "gemini">(settings.provider);
  const [mistralModel, setMistralModel] = useState(settings.mistralModel);
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel);
  const [ragTopK, setRagTopK] = useState(settings.ragTopK);
  const [summaryLength, setSummaryLength] = useState(settings.summaryLength);

  // Client-provided API Keys
  const [mistralKey, setMistralKey] = useState(() => {
    try {
      return localStorage.getItem("mistral_api_key") || "";
    } catch {
      return "";
    }
  });
  const [geminiKey, setGeminiKey] = useState(() => {
    try {
      return localStorage.getItem("gemini_api_key") || "";
    } catch {
      return "";
    }
  });
  const [showMistralKey, setShowMistralKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshHealth();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Persist API keys to browser storage
      try {
        if (mistralKey.trim()) {
          localStorage.setItem("mistral_api_key", mistralKey.trim());
        } else {
          localStorage.removeItem("mistral_api_key");
        }

        if (geminiKey.trim()) {
          localStorage.setItem("gemini_api_key", geminiKey.trim());
        } else {
          localStorage.removeItem("gemini_api_key");
        }
      } catch (err) {
        console.warn("Could not save keys to localStorage", err);
      }

      await updateSettings({
        provider,
        mistralModel,
        geminiModel,
        ragTopK,
        summaryLength
      });

      await refreshHealth();

      showToast("Settings and API keys saved successfully!", "success");
    } finally {
      setSaving(false);
    }
  };

  const mistralModels = [
    "ministral-8b-latest",
    "ministral-3b-latest",
    "codestral-latest",
    "mistral-small-latest"
  ];

  const geminiModels = [
    "gemini-3.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-pro"
  ];

  const serverMistralConfigured = Boolean(systemHealth?.aiService?.mistral_available);
  const serverGeminiConfigured = Boolean(systemHealth?.aiService?.gemini_available);

  return (
    <div className="space-y-8 animate-fadeIn">
      <Navbar
        title="Settings"
        badge="Engine & Knowledge Config"
        subtitle="Configure LLM providers, active models, API credentials, RAG vector retrieval thresholds, and inspect backend status."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. API Keys Management */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-6 bg-white">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">AI API Credentials</h3>
              <p className="text-xs text-slate-500">
                Enter your API keys below or configure them in your Vercel Project Settings (Settings → Environment Variables)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Mistral API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mistral AI API Key
                </label>
                {serverMistralConfigured ? (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ● Active on Server
                  </span>
                ) : mistralKey ? (
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    ● Client Key Provided
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Missing
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showMistralKey ? "text" : "password"}
                  value={mistralKey}
                  onChange={(e) => setMistralKey(e.target.value)}
                  placeholder={serverMistralConfigured ? "Configured on server (or override here)" : "Paste your Mistral API key (e.g. mis_...)"}
                  className="w-full pl-3.5 pr-10 py-3 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowMistralKey(!showMistralKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showMistralKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Get an API key from <a href="https://console.mistral.ai/" target="_blank" rel="noreferrer" className="text-purple-600 underline font-semibold">console.mistral.ai</a>
              </p>
            </div>

            {/* Gemini API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Google Gemini API Key
                </label>
                {serverGeminiConfigured ? (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ● Active on Server
                  </span>
                ) : geminiKey ? (
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    ● Client Key Provided
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Optional Fallback
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder={serverGeminiConfigured ? "Configured on server (or override here)" : "Paste your Gemini API key (e.g. AIzaSy...)"}
                  className="w-full pl-3.5 pr-10 py-3 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Get an API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">aistudio.google.com</a>
              </p>
            </div>
          </div>

          {!serverMistralConfigured && !serverGeminiConfigured && !mistralKey && !geminiKey && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">No API keys found:</span> Paste your Mistral or Gemini API key above and click <strong>Save Preferences</strong> to enable instant AI summarization without needing to redeploy!
              </div>
            </div>
          )}
        </div>

        {/* 2. AI Engine Configuration */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-6 bg-white">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">AI Engine Configuration</h3>
              <p className="text-xs text-slate-500">Choose your primary LLM provider and default model</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary LLM Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider("mistral")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    provider === "mistral"
                      ? "bg-purple-50 border-purple-500 text-purple-950 shadow-sm ring-2 ring-purple-200"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="font-bold text-sm">Mistral AI</span>
                  <span className="text-[11px] text-purple-700 font-semibold mt-1">Primary Engine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("gemini")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    provider === "gemini"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm ring-2 ring-indigo-200"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="font-bold text-sm">Google Gemini</span>
                  <span className="text-[11px] text-indigo-700 font-semibold mt-1">Fallback Provider</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Active Model ({provider.toUpperCase()})
              </label>
              {provider === "mistral" ? (
                <select
                  value={mistralModel}
                  onChange={(e) => setMistralModel(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none shadow-sm"
                >
                  {mistralModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none shadow-sm"
                >
                  {geminiModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* 3. RAG & Retrieval Settings */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-6 bg-white">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">RAG & ChromaDB Configuration</h3>
              <p className="text-xs text-slate-500">Control vector search depth and grounding precision</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Top-K Retrieved Chunks: <span className="text-purple-700 font-extrabold">{ragTopK}</span>
                </label>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={ragTopK}
                onChange={(e) => setRagTopK(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Higher values provide broader context; lower values increase precision and speed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Embedding Model:</span>
                <span className="text-slate-900 font-mono font-bold">all-MiniLM-L6-v2 (or Gemini)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Vector Store:</span>
                <span className="text-emerald-700 font-bold">ChromaDB (Persistent)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Collection Name:</span>
                <span className="text-purple-700 font-mono font-semibold">meeting_transcript</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. System Credentials Status */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-4 bg-white">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">System Credentials & Health</h3>
              <p className="text-xs text-slate-500">Verified status of local and upstream services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Mistral AI API:</span>
              <div className={`mt-1 font-bold flex items-center gap-1.5 ${serverMistralConfigured || mistralKey ? "text-emerald-700" : "text-amber-700"}`}>
                <span className={`w-2 h-2 rounded-full ${serverMistralConfigured || mistralKey ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                {serverMistralConfigured ? "Configured on Server" : mistralKey ? "Provided via Client" : "Missing"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Google Gemini API:</span>
              <div className={`mt-1 font-bold flex items-center gap-1.5 ${serverGeminiConfigured || geminiKey ? "text-indigo-700" : "text-slate-500"}`}>
                <span className={`w-2 h-2 rounded-full ${serverGeminiConfigured || geminiKey ? "bg-indigo-500" : "bg-slate-400"}`}></span>
                {serverGeminiConfigured ? "Configured on Server" : geminiKey ? "Provided via Client" : "Optional"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">FFmpeg Audio Processor:</span>
              <div className="mt-1 font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {systemHealth?.aiService?.ffmpeg_available ? "Installed on PATH" : "Serverless Mode"}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide transition-all shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? "Saving Preferences..." : "Save Preferences"}</span>
        </button>
      </form>
    </div>
  );
};
