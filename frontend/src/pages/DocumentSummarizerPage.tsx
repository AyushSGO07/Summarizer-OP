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

      setResult(res);
      showToast("Document analyzed & summary generated successfully!", "success");
    } catch (err: any) {
      let backendDetail = "Failed to process document";
      if (err.response?.data?.error) {
        backendDetail = err.response.data.error;
      } else if (err.response?.data?.detail) {
        backendDetail =
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail);
      } else if (err.message) {
        backendDetail = err.message;
      }

      setErrorMessage(backendDetail);
      showToast(backendDetail, "error");
    } finally {
      setLoading(false);
      setProcessingStage("");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <Navbar
        title="Document Summarizer"
        badge="Multi-format File Pipeline"
        subtitle="Upload PDF, DOCX, TXT, or CSV files to extract executive takeaways, Hindi translations, and action items."
      />

      {/* Upload & Options Form */}
      <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-5 sm:space-y-6 bg-white">
        <form onSubmit={handleSummarize} className="space-y-5 sm:space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl sm:rounded-2xl p-5 sm:p-8 text-center transition-all ${
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
              <div className="flex items-center justify-between max-w-full sm:max-w-md mx-auto p-3 sm:p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm">
                <div className="flex items-center gap-2.5 sm:gap-3 text-left overflow-hidden">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{file.name}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to process
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-2 shrink-0 cursor-pointer"
                  title="Remove File"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    Drop your document here, or <span className="text-purple-600 underline">browse files</span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                    Supports PDF, DOCX, TXT, CSV, JSON, Markdown, and Audio files
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {["PDF", "DOCX", "TXT", "CSV", "Audio"].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                    >
                      .{fmt.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-purple-600" /> Language Output
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-800 text-xs font-medium focus:outline-none shadow-sm cursor-pointer"
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
                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-slate-800 text-xs font-medium focus:outline-none shadow-sm cursor-pointer"
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
            className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="p-4 sm:p-5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3 sm:space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900">
              <span className="flex items-center gap-2 truncate pr-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
                <span className="truncate">{processingStage || "Extracting document content..."}</span>
              </span>
              <span className="text-purple-600 shrink-0">Please wait</span>
            </div>

            {/* Step Progress Tracker */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
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

            <p className="text-[10px] sm:text-[11px] text-slate-500 text-center">
              Parsing file, processing text embeddings, running AI pipelines, and generating Hindi translations.
            </p>
          </div>
        )}

        {/* Visible Error Card */}
        {errorMessage && !loading && (
          <div className="p-3.5 sm:p-5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 animate-fadeIn">
            <div className="flex items-start gap-2.5 sm:gap-3">
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
                className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
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
