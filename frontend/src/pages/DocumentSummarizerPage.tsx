import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileCheck,
  Loader2,
  Sparkles,
  Languages,
  Sliders,
  AlertCircle,
  RefreshCw,
  X
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SummaryViewer } from "../components/SummaryViewer";
import { documentApi } from "../services/api";
import { SummaryRecord } from "../types";
import { useApp } from "../context/AppContext";

export const DocumentSummarizerPage: React.FC = () => {
  const { settings, showToast } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<"english" | "hindi" | "both">("both");
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "detailed">("medium");
  const [result, setResult] = useState<SummaryRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Step 1/4: Uploading & extracting document text...",
    "Step 2/4: Chunking content & building semantic context...",
    "Step 3/4: Generating executive intelligence summary...",
    "Step 4/4: Performing Hindi translation & extracting decisions..."
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (errorMessage) setErrorMessage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (errorMessage) setErrorMessage(null);
    }
  };

  const handleSummarize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file) {
      showToast("Please select or drop a document first.", "error");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setResult(null);

      setCurrentStep(0);
      setProcessingStage(steps[0]);
      showToast(`Uploading and analyzing ${file.name}...`, "info");

      const timer1 = setTimeout(() => {
        setCurrentStep(1);
        setProcessingStage(steps[1]);
      }, 4000);

      const timer2 = setTimeout(() => {
        setCurrentStep(2);
        setProcessingStage(steps[2]);
      }, 10000);

      const timer3 = setTimeout(() => {
        setCurrentStep(3);
        setProcessingStage(steps[3]);
      }, 18000);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);
      formData.append("summaryLength", summaryLength);
      formData.append("provider", settings.provider);

      const res = await documentApi.summarize(formData);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!res || (!res.englishSummary && !res.hindiSummary)) {
        throw new Error("Backend completed without returning a valid summary structure.");
      }

      setResult(res);
      showToast("Document summarized successfully!", "success");
    } catch (err: any) {
      let msg = "Failed to process document.";
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
        title="Document Summarization"
        badge="Multi-Format Parser"
        subtitle="Upload PDF, Word, Markdown, or text files to extract intelligence, key decisions, and Hindi translations."
      />

      {/* Upload & Options Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-6 bg-white">
        <form onSubmit={handleSummarize} className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging
                ? "border-purple-600 bg-purple-50 scale-[1.01]"
                : file
                ? "border-emerald-400 bg-emerald-50/40"
                : "border-slate-300 hover:border-purple-400 bg-slate-50/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.wav,.mp3,.mp4"
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-between max-w-md mx-auto p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm">
                <div className="flex items-center gap-3 text-left overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-bold text-slate-900 truncate">{file.name}</div>
                    <div className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for analysis
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setResult(null);
                    setErrorMessage(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF, DOCX, TXT, MD, CSV, JSON, and media files (up to 80MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            disabled={loading || !file}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide transition-all shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Document Intelligence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Summarize Document</span>
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
                {processingStage || "Extracting document content..."}
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
              Parsing file, processing text embeddings, invoking Mistral AI pipelines, and generating Hindi translations.
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
                  Processing Failed
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
          sourceType="document"
        />
      )}
    </div>
  );
};
