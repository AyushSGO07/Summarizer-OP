import React, { useEffect, useState, useRef } from "react";
import {
  Clock,
  Trash2,
  Copy,
  Check,
  Download,
  Search,
  Video,
  FileText,
  ArrowUp,
  ChevronDown
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
  const previewRef = useRef<HTMLDivElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const data = await historyApi.getAll();
      setHistory(Array.isArray(data) ? data : []);
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
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast("Summary copied to clipboard", "success");
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const handleExportAll = () => {
    try {
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
    } catch {
      showToast("Failed to export history", "error");
    }
  };

  const handleSelectRecord = (record: SummaryRecord) => {
    setSelectedRecord(record);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const filtered = history.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return sourceFilter === "all" || item.sourceType === sourceFilter;
    }
    const titleMatch = (item.title || "").toLowerCase().includes(term);
    const summaryMatch = (item.englishSummary || "").toLowerCase().includes(term);
    const hindiMatch = (item.hindiSummary || "").toLowerCase().includes(term);
    const matchesSearch = titleMatch || summaryMatch || hindiMatch;
    const matchesFilter = sourceFilter === "all" || item.sourceType === sourceFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div ref={listTopRef} className="space-y-6 sm:space-y-8 animate-fadeIn">
      <Navbar
        title="Summary History"
        badge="Persistent Archive"
        subtitle="Search, review, export, and manage past summaries and Hindi translations."
      />

      {/* Controls Bar */}
      <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 bg-white shadow-card">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search summaries by keyword..."
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
          />
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setSourceFilter("all")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sourceFilter === "all" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("video")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sourceFilter === "video" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Videos
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("document")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                sourceFilter === "document" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Docs
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAll}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              title="Export all records as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span> JSON
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              title="Delete all records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: List on Left, Active Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left List Column */}
        <div className="lg:col-span-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-[#E2E8F0] text-center space-y-3 bg-white shadow-card">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No summaries found</div>
              <p className="text-xs text-slate-500">
                {searchTerm
                  ? "No records match your search criteria."
                  : "Generate your first summary using Video or Document Summarizer."}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedRecord?.id === item.id;
              const isVideo = item.sourceType === "video";

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectRecord(item)}
                  className={`glass-panel p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer group shadow-card ${
                    isSelected
                      ? "border-purple-600 bg-purple-50/50 shadow-glow ring-1 ring-purple-300"
                      : "border-[#E2E8F0] bg-white hover:border-purple-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isVideo
                            ? "bg-purple-100 text-purple-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {isVideo ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xs text-[#0F172A] truncate group-hover:text-purple-600 transition-colors">
                          {item.title}
                        </h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{item.provider}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopySummary(item.englishSummary || item.hindiSummary || "", item.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Copy Summary"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                    {item.englishSummary ? item.englishSummary.replace(/[#*`]/g, "") : "No preview text"}
                  </p>

                  {/* Mobile tap prompt */}
                  <div className="lg:hidden flex items-center justify-between text-[10px] text-purple-600 font-semibold pt-2 mt-2 border-t border-slate-100">
                    <span>{isSelected ? "Currently viewing below" : "Tap to inspect details"}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSelected ? "rotate-180" : ""}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Preview Column */}
        <div ref={previewRef} className="lg:col-span-7">
          {selectedRecord ? (
            <div className="space-y-3">
              {/* Mobile Back-to-Top Button */}
              <div className="lg:hidden flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Summary Details
                </span>
                <button
                  type="button"
                  onClick={() => listTopRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-800 font-semibold cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Back to List</span>
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
          ) : (
            <div className="glass-panel p-8 sm:p-12 rounded-2xl border border-[#E2E8F0] text-center space-y-3 bg-white shadow-card">
              <Clock className="w-10 h-10 text-purple-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Select a summary to inspect</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click on any summary card on the left to read its full executive overview, Hindi translation, action items, and export files.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
