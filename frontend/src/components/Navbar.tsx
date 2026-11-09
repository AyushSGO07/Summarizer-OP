import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";

interface NavbarProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, badge }) => {
  const { settings } = useApp();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 mb-4 sm:pb-6 sm:mb-6 border-b border-[#E2E8F0]">
      <div>
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80 mb-1.5 sm:mb-2">
            <Sparkles className="w-3 h-3 text-purple-600" />
            {badge}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-500 font-medium">Backend:</span>
          <span className="text-emerald-700 font-bold">Operational</span>
        </div>

        <Link
          to="/settings"
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-purple-300 text-xs font-semibold text-slate-700 hover:text-purple-700 transition-all shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-[11px] sm:text-xs">Engine: {settings.provider.toUpperCase()}</span>
        </Link>
      </div>
    </header>
  );
};
