import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Copy,
  Check,
  Download,
  MessageSquare,
  Sparkles,
  ListTodo,
  FileText,
  Languages,
  AlertCircle
} from "lucide-react";
import { ragApi } from "../services/api";
import { useApp } from "../context/AppContext";

interface SummaryViewerProps {
  title?: string;
  englishSummary?: string;
  hindiSummary?: string;
  actionItems?: string;
  keyDecisions?: string;
  questions?: string;
  transcript?: string;
  sourceType?: string;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  title = "Generated Summary",
  englishSummary = "",
  hindiSummary,
  actionItems,
  keyDecisions,
  questions,
  transcript,
  sourceType = "document"
}) => {
  const [activeTab, setActiveTab] = useState<"english" | "hindi" | "insights" | "transcript">(
    englishSummary ? "english" : (hindiSummary ? "hindi" : "insights")
  );
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [indexingRAG, setIndexingRAG] = useState(false);
  const { showToast, setActiveRagDoc } = useApp();
  const navigate = useNavigate();

  const handleCopy = async (text: string, tabName: string) => {
    if (!text) {
      showToast("No content to copy.", "info");
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedTab(tabName);
      showToast(`${tabName} copied to clipboard!`, "success");
      setTimeout(() => setCopiedTab(null), 2500);
    } catch {
      showToast("Failed to copy to clipboard", "error");
    }
  };

  const handleDownload = (text: string, filename: string) => {
    if (!text) {
      showToast("No content to download.", "info");
      return;
    }
    try {
      const element = document.createElement("a");
      const file = new Blob([text], { type: "text/markdown;charset=utf-8" });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast(`Downloaded ${filename}`, "info");
    } catch {
      showToast("Download failed", "error");
    }
  };

  const handleSendToRAG = async () => {
    const textToIndex = transcript || englishSummary || hindiSummary;
    if (!textToIndex) {
      showToast("No content available to index for RAG.", "error");
      return;
    }

    try {
      setIndexingRAG(true);
      showToast("Indexing content into ChromaDB vector store...", "info");
      await ragApi.indexText({
        text: textToIndex,
        docName: title
      });
      setActiveRagDoc(title);
      showToast(`Indexed "${title}" into ChromaDB! Opening chat...`, "success");
      navigate("/rag");
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to index into ChromaDB";
      showToast(msg, "error");
    } finally {
      setIndexingRAG(false);
    }
  };

  const safeSourceType = (sourceType || "document").toUpperCase();

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-[#E2E8F0] shadow-card space-y-5 bg-white">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
            {safeSourceType} SUMMARY
          </span>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">{title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSendToRAG}
            disabled={indexingRAG}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{indexingRAG ? "Indexing into ChromaDB..." : "Chat with this in RAG"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-3">
        {englishSummary && (
          <button
            type="button"
            onClick={() => setActiveTab("english")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "english"
                ? "bg-purple-100 text-purple-800 border border-purple-300 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>English Summary</span>
          </button>
        )}

        {hindiSummary && (
          <button
            type="button"
            onClick={() => setActiveTab("hindi")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "hindi"
                ? "bg-purple-100 text-purple-800 border border-purple-300 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>Hindi Translation (हिंदी)</span>
          </button>
        )}

        {(actionItems || keyDecisions || questions) && (
          <button
            type="button"
            onClick={() => setActiveTab("insights")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "insights"
                ? "bg-purple-100 text-purple-800 border border-purple-300 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Action Items & Decisions</span>
          </button>
        )}

        {transcript && (
          <button
            type="button"
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "transcript"
                ? "bg-purple-100 text-purple-800 border border-purple-300 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Full Transcript</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="relative pt-2">
        {/* English Summary Tab */}
        {activeTab === "english" && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleCopy(englishSummary, "English Summary")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
              >
                {copiedTab === "English Summary" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleDownload(englishSummary, `${title}_english.md`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MD</span>
              </button>
            </div>
            {englishSummary ? (
              <div className="prose prose-purple max-w-none text-slate-800 text-sm leading-relaxed space-y-3">
                <ReactMarkdown>{englishSummary}</ReactMarkdown>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No English summary generated for this content.
              </div>
            )}
          </div>
        )}

        {/* Hindi Translation Tab */}
        {activeTab === "hindi" && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleCopy(hindiSummary || "", "Hindi Summary")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
              >
                {copiedTab === "Hindi Summary" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Hindi</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleDownload(hindiSummary || "", `${title}_hindi.md`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Hindi MD</span>
              </button>
            </div>
            {hindiSummary ? (
              <div className="prose prose-purple max-w-none text-slate-800 text-sm leading-relaxed space-y-3 font-sans">
                <ReactMarkdown>{hindiSummary}</ReactMarkdown>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No Hindi translation generated for this content.
              </div>
            )}
          </div>
        )}

        {/* Action Items & Decisions Tab */}
        {activeTab === "insights" && (
          <div className="space-y-6">
            {actionItems && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-purple-600" /> Assigned Tasks & Action Items
                </h3>
                <div className="prose prose-purple text-xs text-slate-700">
                  <ReactMarkdown>{actionItems}</ReactMarkdown>
                </div>
              </div>
            )}

            {keyDecisions && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Key Decisions Reached
                </h3>
                <div className="prose prose-indigo text-xs text-slate-700">
                  <ReactMarkdown>{keyDecisions}</ReactMarkdown>
                </div>
              </div>
            )}

            {questions && (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" /> Open Questions & Follow-ups
                </h3>
                <div className="prose prose-amber text-xs text-slate-700">
                  <ReactMarkdown>{questions}</ReactMarkdown>
                </div>
              </div>
            )}

            {!actionItems && !keyDecisions && !questions && (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-slate-300" />
                <span>No meeting action items or decisions were extracted.</span>
              </div>
            )}
          </div>
        )}

        {/* Full Transcript Tab */}
        {activeTab === "transcript" && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleCopy(transcript || "", "Transcript")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Transcript</span>
              </button>
            </div>
            {transcript ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-96 overflow-y-auto text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                {transcript}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No raw transcript available for this content.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
