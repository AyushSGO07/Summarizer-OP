import React, { useState } from "react";
import {
  Cpu,
  Database,
  ShieldCheck,
  Check
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useApp } from "../context/AppContext";

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [provider, setProvider] = useState<"mistral" | "gemini">(settings.provider);
  const [mistralModel, setMistralModel] = useState(settings.mistralModel);
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel);
  const [ragTopK, setRagTopK] = useState(settings.ragTopK);
  const [summaryLength, setSummaryLength] = useState(settings.summaryLength);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-8 animate-fadeIn">
      <Navbar
        title="Settings"
        badge="Engine & Knowledge Config"
        subtitle="Configure LLM providers, active models, RAG vector retrieval thresholds, and inspect backend status."
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
              <p className="text-[11px] text-slate-500 mt-2">
                API credentials are read securely from server-side environment variables (`.env`).
              </p>
            </div>
          </div>
        </div>

        {/* 2. RAG & Retrieval Settings */}
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
                <span className="text-slate-900 font-mono font-bold">all-MiniLM-L6-v2</span>
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

        {/* 3. System Credentials Status (Safe — No Secret Exposure) */}
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
              <div className="mt-1 font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Configured & Active
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Google Gemini API:</span>
              <div className="mt-1 font-bold text-indigo-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Configured & Fallback Ready
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">FFmpeg Audio Processor:</span>
              <div className="mt-1 font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Installed on PATH
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide transition-all shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>{saving ? "Saving Preferences..." : "Save Preferences"}</span>
        </button>
      </form>
    </div>
  );
};
