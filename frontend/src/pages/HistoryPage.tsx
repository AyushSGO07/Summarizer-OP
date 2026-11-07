import React, { useEffect, useState } from "react";
import {
  Clock,
  Trash2,
  Copy,
  Check,
  Download,
  Search,
  Video,
  FileText
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SummaryViewer } from "../components/SummaryViewer";
import { historyApi } from "../services/api";
import { SummaryRecord } from "../types";
import { useApp } from "../context/AppContext";

export const HistoryPage: React.FC = () => {
  const { showToast } = useApp();
  const [history, setHistory] = useState<SummaryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "video" | "document">("all");
  const [selectedRecord, setSelectedRecord] = useState<SummaryRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const data = await historyApi.getAll();
      setHistory(data);
    } catch {
      showToast("Failed to load summary history", "error");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await historyApi.delete(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
      showToast("Summary deleted from history", "success");
    } catch {
      showToast("Failed to delete summary", "error");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to permanently clear all summary history?")) return;
    try {
      await historyApi.clear();
      setHistory([]);
      setSelectedRecord(null);
      showToast("All history cleared", "info");
    } catch {
      showToast("Failed to clear history", "error");
    }
  };

  const handleCopySummary = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Summary copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportAll = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "summarizer_op_history.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported all summaries as JSON", "info");
  };

  const filtered = history.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.englishSummary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = sourceFilter === "all" || item.sourceType === sourceFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <Navbar
        title="Summary History"
        badge="Persistent Archive"
        subtitle="Search, review, export, and manage past summaries and Hindi translations."
      />

      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 bg-white shadow-card">
        <div className="flex flex-1 items-center gap-3 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past summaries by title or content..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-sm"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-[#CBD5E1] focus:border-purple-600 rounded-xl text-xs text-slate-800 font-medium focus:outline-none shadow-sm"
          >
            <option value="all">All Sources</option>
            <option value="video">Videos Only</option>
            <option value="document">Documents Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          {history.length > 0 && (
            <>
              <button
                onClick={handleExportAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-xs font-semibold text-slate-600 hover:text-rose-600 shadow-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      {selectedRecord ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSelectedRecord(null)}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1.5"
            >
              &larr; Back to all summaries
            </button>
          </div>
          <SummaryViewer
            title={selectedRecord.title}
            englishSummary={selectedRecord.englishSummary}
            hindiSummary={selectedRecord.hindiSummary}
            actionItems={selectedRecord.actionItems}
            keyDecisions={selectedRecord.keyDecisions}
            questions={selectedRecord.questions}
            transcript={selectedRecord.transcript}
            sourceType={selectedRecord.sourceType}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-[#E2E8F0] text-center space-y-3 bg-white shadow-card">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-[#0F172A]">No Summaries Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? "No records matched your search query."
              : "Generate summaries from videos or documents, and they will persist here automatically."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedRecord(item)}
              className="glass-panel glass-panel-hover p-5 rounded-2xl border border-[#E2E8F0] cursor-pointer flex flex-col justify-between gap-4 group bg-white shadow-card"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.sourceType === "video"
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    }`}
                  >
                    {item.sourceType === "video" ? (
                      <Video className="w-3 h-3" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    {item.sourceType}
                  </span>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-[#0F172A] group-hover:text-purple-700 transition-colors line-clamp-1">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {item.englishSummary.substring(0, 180)}...
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 font-mono font-medium">
                  {item.provider.toUpperCase()} &bull; {item.model}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleCopySummary(item.englishSummary, item.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Copy Summary"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                    title="Delete Summary"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
