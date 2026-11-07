import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  FileText,
  MessageSquare,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Cpu,
  Database
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { settings, activeRagDoc } = useApp();

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/video", label: "Video Summarizer", icon: Video },
    { to: "/document", label: "Document Summarizer", icon: FileText },
    { to: "/rag", label: "Ask Your Documents", icon: MessageSquare },
    { to: "/history", label: "Summary History", icon: Clock },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const activeModel =
    settings.provider === "mistral" ? settings.mistralModel : settings.geminiModel;

  return (
    <aside
      className={`relative flex flex-col border-r border-[#E2E8F0] bg-[#FFFFFF] transition-all duration-300 z-30 shadow-sm ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-glow shrink-0 text-white">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight gradient-text leading-tight">
                SUMMARIZER OP
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Enterprise AI Suite
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-purple-50 text-purple-700 border border-purple-200/80 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110 text-purple-600" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Health & Model Info */}
      <div className="p-3 border-t border-[#E2E8F0]">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold uppercase text-[10px] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-600" /> AI Provider
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                {settings.provider}
              </span>
            </div>
            <div className="text-slate-800 font-mono text-[11px] truncate font-medium" title={activeModel}>
              {activeModel}
            </div>

            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" /> ChromaDB
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active
              </span>
            </div>

            {activeRagDoc && (
              <div className="text-[10px] text-slate-500 truncate pt-1">
                Target: <span className="text-slate-900 font-semibold">{activeRagDoc}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-2" title={`${settings.provider.toUpperCase()}: ${activeModel}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
