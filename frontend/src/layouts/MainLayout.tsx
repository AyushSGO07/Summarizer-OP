import React from "react";
import { Outlet } from "react-router-dom";
import { Zap, Menu, X, Cpu } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { ToastContainer } from "../components/Toast";
import { useApp } from "../context/AppContext";

export const MainLayout: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen, settings } = useApp();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#F8FAFC] overflow-hidden text-[#0F172A]">
      {/* Mobile Top Header (visible on < md screens) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E2E8F0] shadow-sm z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-glow shrink-0 text-white">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight gradient-text leading-tight">
              SUMMARIZER OP
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5 text-purple-600" /> {settings.provider}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-purple-700" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar (desktop sticky left sidebar + mobile off-canvas drawer) */}
      <Sidebar />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto ambient-glow p-3.5 sm:p-6 lg:p-8 w-full">
        <div className="max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
