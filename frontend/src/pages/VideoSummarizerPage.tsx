import React, { useState } from "react";
import {
  Sparkles,
  Link as LinkIcon,
  Clock,
  User,
  Loader2,
  Languages,
  Sliders,
  AlertCircle,
  RefreshCw,
  X
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SummaryViewer } from "../components/SummaryViewer";
import { videoApi } from "../services/api";
import { VideoMetadata, SummaryRecord } from "../types";
import { useApp } from "../context/AppContext";

export const VideoSummarizerPage: React.FC = () => {
  const { settings, showToast } = useApp();
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<"english" | "hindi" | "both">("both");
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "detailed">("medium");
  const [result, setResult] = useState<SummaryRecord | null>(null);

  const steps = [
    "Step 1/4: Ingesting video metadata & transcript...",
    "Step 2/4: Chunking audio & speech processing...",
    "Step 3/4: Generating executive intelligence summary...",
    "Step 4/4: Performing Hindi translation & extracting decisions..."
  ];

  const handleUrlBlur = async () => {
    const trimmed = url.trim();
    if (!trimmed || !trimmed.startsWith("http")) return;

    try {
      setFetchingMeta(true);
      const meta = await videoApi.getMetadata(trimmed);
      if (meta) {
        setMetadata(meta);
      }
    } catch {
      // Ignored: full validation happens during submit
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleSummarize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      showToast("Please enter a valid YouTube or video URL.", "error");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setResult(null);

      setCurrentStep(0);
      setProcessingStage(steps[0]);
      showToast("Starting video transcription & intelligence pipeline...", "info");

      // Progressively advance stage messages while awaiting backend pipeline
      const timer1 = setTimeout(() => {
        setCurrentStep(1);
        setProcessingStage(steps[1]);
      }, 5000);

      const timer2 = setTimeout(() => {
        setCurrentStep(2);
        setProcessingStage(steps[2]);
      }, 12000);

      const timer3 = setTimeout(() => {
        setCurrentStep(3);
        setProcessingStage(steps[3]);
      }, 20000);

      const res = await videoApi.summarize({
        url: cleanUrl,
        language,
        summaryLength,
        provider: settings.provider
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!res || (!res.englishSummary && !res.hindiSummary)) {
        throw new Error("Backend completed without returning a valid summary structure.");
      }

      setResult(res);
      showToast("Video summarized successfully!", "success");
    } catch (err: any) {
      let msg = "Failed to process video.";
      if (err.response?.data?.error) {
        msg = typeof err.response.data.error === "object"
          ? JSON.stringify(err.response.data.error)
          : String(err.response.data.error);
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
      setProcessingStage("");
      setCurrentStep(0);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <Navbar
        title="Video Summarization"
        badge="YouTube & Media Pipeline"
        subtitle="Extract video transcripts, generate structured executive summaries, and translate into Hindi."
      />

      {/* Input Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-6 bg-white">
        <form onSubmit={handleSummarize} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              YouTube or Video Link
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                onBlur={handleUrlBlur}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
                disabled={loading}
                required
              />
              {fetchingMeta && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Video Metadata Preview */}
          {metadata && (
            <div className="p-4 rounded-xl bg-slate-50 border border-purple-200/80 flex flex-col sm:flex-row gap-4 items-center animate-fadeIn shadow-sm">
              {metadata.thumbnail && (
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  className="w-full sm:w-44 h-24 object-cover rounded-lg border border-slate-200 shrink-0"
                />
              )}
              <div className="flex-1 space-y-1 w-full text-center sm:text-left">
                <h4 className="font-bold text-sm text-[#0F172A] line-clamp-2">{metadata.title}</h4>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    {metadata.channel || "YouTube Channel"}
                  </span>
                  {metadata.duration > 0 && (
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {Math.round(metadata.duration / 60)} mins
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Captions / Audio Ready
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Options Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-purple-600" /> Language Output
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-800 text-xs font-medium focus:outline-none shadow-sm"
                disabled={loading}
              >
                <option value="both">English + Hindi Translation (Recommended)</option>
                <option value="english">English Only</option>
                <option value="hindi">Hindi Translation Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Summary Length
              </label>
              <select
                value={summaryLength}
                onChange={(e) => setSummaryLength(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-800 text-xs font-medium focus:outline-none shadow-sm"
                disabled={loading}
              >
                <option value="medium">Standard Executive Summary</option>
                <option value="short">Short / High-Level (Quick Read)</option>
                <option value="detailed">Exhaustive & Detailed Breakdown</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide transition-all shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Video Intelligence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Video Summary</span>
              </>
            )}
          </button>
        </form>

        {/* Processing Indicator */}
        {loading && (
          <div className="p-5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                {processingStage || "Processing content..."}
              </span>
              <span className="text-purple-600">Please wait</span>
            </div>

            {/* Step Progress Tracker */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx <= currentStep
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600"
                      : "bg-purple-200"
                  }`}
                  title={st}
                />
              ))}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Extracting captions, transcribing audio with Whisper, running Mistral LCEL chains, and translating.
            </p>
          </div>
        )}

        {/* Visible Error Card */}
        {errorMessage && !loading && (
          <div className="p-4 sm:p-5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start justify-between gap-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  Summarization Failed
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleSummarize()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                title="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Display */}
      {result && (
        <SummaryViewer
          title={result.title}
          englishSummary={result.englishSummary}
          hindiSummary={result.hindiSummary}
          actionItems={result.actionItems}
          keyDecisions={result.keyDecisions}
          questions={result.questions}
          transcript={result.transcript}
          sourceType="video"
        />
      )}
    </div>
  );
};
