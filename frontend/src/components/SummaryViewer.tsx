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
      showToast(`Exported ${filename}`, "info");
    } catch {
      showToast("Failed to download markdown file", "error");
    }
  };

  const handleSendToRAG = async () => {
    const contentToIndex =
      transcript ||
      [
        englishSummary ? `# Summary: ${title}\n\n${englishSummary}` : "",
        hindiSummary ? `## Hindi Translation\n\n${hindiSummary}` : "",
        actionItems ? `## Action Items\n\n${actionItems}` : "",
        keyDecisions ? `## Key Decisions\n\n${keyDecisions}` : "",
        questions ? `## Open Questions\n\n${questions}` : ""
      ]
        .filter(Boolean)
        .join("\n\n---\n\n");

    if (!contentToIndex) {
      showToast("No content available to index for RAG chat.", "error");
      return;
    }

    try {
      setIndexingRAG(true);
      showToast("Preparing and indexing document chunks into ChromaDB...", "info");

      const res = await ragApi.indexText({
        text: contentToIndex,
        docName: `${title} (${sourceType})`
      });

      setActiveRagDoc(res.doc_name);
      showToast(`Indexed ${res.total_chunks} chunks into ChromaDB! Navigating to RAG...`, "success");
      setTimeout(() => {
        navigate("/rag");
      }, 800);
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || "Failed to index into RAG", "error");
    } finally {
      setIndexingRAG(false);
    }
  };

  const safeSourceType = (sourceType || "DOCUMENT").toUpperCase();

  return (
    <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-card space-y-5 bg-white">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#E2E8F0] pb-4">
        <div className="space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-600">
            {safeSourceType} SUMMARY
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">{title}</h2>
        </div>

        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSendToRAG}
            disabled={indexingRAG}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>{indexingRAG ? "Indexing into ChromaDB..." : "Chat with this in RAG"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher (horizontal scroll on mobile) */}
      <div className="flex gap-1.5 sm:gap-2 border-b border-[#E2E8F0] pb-3 overflow-x-auto scrollbar-none sm:flex-wrap">
        {englishSummary && (
          <button
            type="button"
            onClick={() => setActiveTab("english")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all cursor-pointer ${
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
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => handleCopy(englishSummary, "English Summary")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MD</span>
              </button>
            </div>
            {englishSummary ? (
              <div className="prose prose-purple max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed space-y-3 break-words overflow-x-auto">
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
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => handleCopy(hindiSummary || "", "Hindi Summary")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Hindi MD</span>
              </button>
            </div>
            {hindiSummary ? (
              <div className="prose prose-purple max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed space-y-3 font-sans break-words overflow-x-auto">
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
          <div className="space-y-4 sm:space-y-6">
            {actionItems && (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs sm:text-sm font-bold text-purple-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-purple-600 shrink-0" /> Assigned Tasks & Action Items
                </h3>
                <div className="prose prose-purple text-xs text-slate-700 break-words overflow-x-auto">
                  <ReactMarkdown>{actionItems}</ReactMarkdown>
                </div>
              </div>
            )}

            {keyDecisions && (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs sm:text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" /> Key Decisions Reached
                </h3>
                <div className="prose prose-indigo text-xs text-slate-700 break-words overflow-x-auto">
                  <ReactMarkdown>{keyDecisions}</ReactMarkdown>
                </div>
              </div>
            )}

            {questions && (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" /> Open Questions & Follow-ups
                </h3>
                <div className="prose prose-amber text-xs text-slate-700 break-words overflow-x-auto">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Transcript</span>
              </button>
            </div>
            {transcript ? (
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-96 overflow-y-auto text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed break-words">
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
