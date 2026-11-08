import React, { useState, useEffect } from "react";
import {
  Cpu,
  Database,
  ShieldCheck,
  Check,
  Lock,
  Server,
  Zap,
  CheckCircle2,
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshHealth();
  }, []);

  useEffect(() => {
    setProvider(settings.provider);
    setMistralModel(settings.mistralModel);
    setGeminiModel(settings.geminiModel);
    setRagTopK(settings.ragTopK);
    setSummaryLength(settings.summaryLength);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings({
        provider,
        mistralModel,
        geminiModel,
        ragTopK,
        summaryLength
      });
      await refreshHealth();
      showToast("Settings saved successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save settings", "error");
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

  const serverMistralConfigured = Boolean(
    systemHealth?.engine?.mistralConfigured ?? systemHealth?.aiService?.mistral_available
  );
  const serverGeminiConfigured = Boolean(
    systemHealth?.engine?.geminiConfigured ?? systemHealth?.aiService?.gemini_available
  );
  const isBackendHealthy = Boolean(
    systemHealth?.nodeBackend === "healthy" &&
      (systemHealth?.aiServiceConnected ||
        systemHealth?.engine?.connectionStatus === "connected" ||
        systemHealth?.aiService?.status === "healthy" ||
        systemHealth?.aiService?.status === "operational")
  );

  const activeModelName = provider === "mistral" ? mistralModel : geminiModel;

  return (
    <div className="space-y-8 animate-fadeIn">
      <Navbar
        title="Settings"
        badge="Engine & Knowledge Config"
        subtitle="Manage AI engine provider preferences, active models, RAG vector retrieval depth, and inspect server health."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. AI Engine Configuration */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-6 bg-white">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">AI Engine Configuration</h3>
              <p className="text-xs text-slate-500">
                Configure primary and fallback AI engines, model selection, and backend availability
              </p>
            </div>
          </div>

          {/* Secure Environment Notice */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center gap-3.5 text-xs text-purple-950 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-purple-900 block">Managed Environment Variables</span>
              <p className="text-slate-600 text-xs">
                AI credentials are securely managed through server-side environment variables in your deployment settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Active Provider Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Active Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Mistral Provider Card */}
                <button
                  type="button"
                  onClick={() => setProvider("mistral")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    provider === "mistral"
                      ? "bg-purple-50 border-purple-500 text-purple-950 shadow-sm ring-2 ring-purple-200"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm">Mistral AI</span>
                    {serverMistralConfigured ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Configured
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Not configured
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-purple-700 font-semibold mt-2">Primary Provider</span>
                </button>

                {/* Gemini Provider Card */}
                <button
                  type="button"
                  onClick={() => setProvider("gemini")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    provider === "gemini"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm ring-2 ring-indigo-200"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm">Google Gemini</span>
                    {serverGeminiConfigured ? (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Configured
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Not configured
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-indigo-700 font-semibold mt-2">Fallback Provider</span>
                </button>
              </div>
            </div>

            {/* Active Model Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Active Model Name ({provider.toUpperCase()})
              </label>
              {provider === "mistral" ? (
                <select
                  value={mistralModel}
                  onChange={(e) => setMistralModel(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none shadow-sm cursor-pointer"
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
                  className="w-full px-3.5 py-3 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none shadow-sm cursor-pointer"
                >
                  {geminiModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-slate-500 mt-2">
                Selected model will be invoked for all summarization, translation, and RAG operations.
              </p>
            </div>
          </div>

          {/* Engine & Backend Connection Status Overview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-500 font-medium block">Active Provider</span>
              <span className="font-bold text-slate-900 capitalize text-sm mt-0.5 block">
                {provider === "mistral" ? "Mistral AI" : "Google Gemini"}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Active Model Name</span>
              <span className="font-mono font-bold text-purple-700 text-sm mt-0.5 block truncate" title={activeModelName}>
                {activeModelName}
              </span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Backend Connection Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
                <span className={`font-bold text-sm ${isBackendHealthy ? "text-emerald-700" : "text-amber-700"}`}>
                  {isBackendHealthy ? "Connected & Operational" : "Backend Standby"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RAG & ChromaDB Configuration */}
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

        {/* 3. System Health & Deployment Status */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-4 bg-white">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">System Health & Deployment Status</h3>
              <p className="text-xs text-slate-500">Verified status of local and upstream deployment services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Mistral AI Provider:</span>
              <div
                className={`mt-1 font-bold flex items-center gap-1.5 ${
                  serverMistralConfigured ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    serverMistralConfigured ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                ></span>
                {serverMistralConfigured ? "Configured in Environment" : "Not configured"}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Role: Primary Engine</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Google Gemini Provider:</span>
              <div
                className={`mt-1 font-bold flex items-center gap-1.5 ${
                  serverGeminiConfigured ? "text-indigo-700" : "text-slate-500"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    serverGeminiConfigured ? "bg-indigo-500" : "bg-slate-400"
                  }`}
                ></span>
                {serverGeminiConfigured ? "Configured in Environment" : "Not configured"}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Role: Fallback Provider</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Backend & AI Service:</span>
              <div className="mt-1 font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {isBackendHealthy ? "Connected & Operational" : "Standby Mode"}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Runtime: Node Express + Python</span>
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
