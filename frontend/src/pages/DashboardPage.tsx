import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  FileText,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Cpu,
  Database,
  FileCheck2,
  Sparkles
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useApp } from "../context/AppContext";
import { historyApi, ragApi } from "../services/api";
import { SummaryRecord, RAGStatus } from "../types";

export const DashboardPage: React.FC = () => {
  const { settings } = useApp();
  const [stats, setStats] = useState<{
    totalSummaries: number;
    videoCount: number;
    documentCount: number;
  }>({ totalSummaries: 0, videoCount: 0, documentCount: 0 });

  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null);
  const [recentSummaries, setRecentSummaries] = useState<SummaryRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statData, summaries, ragData] = await Promise.all([
          historyApi.getStats(),
          historyApi.getAll(),
          ragApi.getStatus()
        ]);
        setStats(statData);
        setRecentSummaries(summaries.slice(0, 5));
        setRagStatus(ragData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }
    loadData();
  }, []);

  const activeModel =
    settings.provider === "mistral" ? settings.mistralModel : settings.geminiModel;

  return (
    <div className="space-y-8 animate-fadeIn">
      <Navbar
        title="Dashboard"
        badge="SUMMARIZER OP v2.0"
        subtitle="AI-powered meeting & document intelligence, multilingual translations, and grounded RAG."
      />

      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-purple-200/80 bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white shadow-card">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-400/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 border border-purple-200 text-purple-700">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Intelligent Knowledge Processing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Your knowledge, <span className="gradient-text">simplified.</span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Transform lengthy YouTube videos, meeting records, and complex documents into structured executive summaries,
            fluent Hindi translations, and grounded conversational knowledge bases.
          </p>
        </div>
      </div>

      {/* Real Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 bg-white shadow-card">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0F172A]">{stats.totalSummaries}</div>
            <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total Summaries</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 bg-white shadow-card">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#0F172A] capitalize">{settings.provider}</div>
            <div className="text-xs text-purple-700 font-mono truncate max-w-[120px] font-semibold" title={activeModel}>
              {activeModel}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active LLM</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 bg-white shadow-card">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0F172A]">{ragStatus?.total_chunks || 0}</div>
            <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Indexed Chunks</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-[#E2E8F0] flex items-center gap-4 bg-white shadow-card">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#0F172A] truncate max-w-[140px]" title={ragStatus?.active_document || "None"}>
              {ragStatus?.active_document || "None"}
            </div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active RAG Doc</div>
          </div>
        </div>
      </div>

      {/* Quick Action Feature Cards */}
      <div>
        <h3 className="text-lg font-bold text-[#0F172A] mb-4">Core Workflows</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Action 1: Video */}
          <Link
            to="/video"
            className="glass-panel glass-panel-hover p-6 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between group bg-white shadow-card"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#0F172A] mb-2 group-hover:text-purple-600 transition-colors">
                Summarize a Video
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Paste any YouTube URL to extract transcripts, produce executive summaries, and generate Hindi translations.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 group-hover:gap-3 transition-all">
              <span>Start Video Processing</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Action 2: Document */}
          <Link
            to="/document"
            className="glass-panel glass-panel-hover p-6 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between group bg-white shadow-card"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#0F172A] mb-2 group-hover:text-indigo-600 transition-colors">
                Summarize a Document
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Upload PDF, DOCX, TXT, or CSV files to extract action items, key decisions, and bilingual summaries.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 group-hover:gap-3 transition-all">
              <span>Upload Document</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Action 3: Ask Documents */}
          <Link
            to="/rag"
            className="glass-panel glass-panel-hover p-6 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between group bg-white shadow-card"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#0F172A] mb-2 group-hover:text-emerald-600 transition-colors">
                Ask Your Documents
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Conversational RAG interface powered by ChromaDB. Ask questions and inspect exact chunk citations.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 group-hover:gap-3 transition-all">
              <span>Open Document Chat</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recently Generated Summaries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0F172A]">Recent Summaries</h3>
          {recentSummaries.length > 0 && (
            <Link to="/history" className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentSummaries.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-[#E2E8F0] text-center text-slate-500 text-sm bg-white shadow-card">
            No summaries generated yet. Try summarizing a YouTube video or uploading a document above!
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden bg-white shadow-card">
            {recentSummaries.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                      {item.sourceType}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-[#0F172A] truncate">{item.title}</h5>
                  <p className="text-xs text-slate-600 line-clamp-1">{item.englishSummary.substring(0, 140)}...</p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/history"
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
