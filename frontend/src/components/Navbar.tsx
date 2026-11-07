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
    <header className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E2E8F0]">
      <div>
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80 mb-2">
            <Sparkles className="w-3 h-3 text-purple-600" />
            {badge}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600 mt-1 max-w-2xl">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-500 font-medium">Backend:</span>
          <span className="text-emerald-700 font-bold">Operational</span>
        </div>

        <Link
          to="/settings"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-purple-300 text-xs font-semibold text-slate-700 hover:text-purple-700 transition-all shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
          <span>Engine: {settings.provider.toUpperCase()}</span>
        </Link>
      </div>
    </header>
  );
};
