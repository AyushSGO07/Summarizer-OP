import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 flex flex-col gap-2.5 max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const messageText =
            typeof toast.message === "string" ? toast.message : JSON.stringify(toast.message);

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className={`pointer-events-auto flex items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all ${
                toast.type === "success"
                  ? "bg-white border-emerald-300 text-emerald-950"
                  : toast.type === "error"
                  ? "bg-white border-rose-300 text-rose-950"
                  : "bg-white border-purple-300 text-purple-950"
              }`}
            >
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              )}

              <p className="text-xs sm:text-sm font-semibold flex-1 leading-snug break-words">{messageText}</p>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100 cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
