import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "An unexpected error occurred in this view.";

      return (
        <div className="p-6 sm:p-8 max-w-2xl mx-auto my-8 rounded-2xl border border-rose-200 bg-white shadow-card space-y-6 animate-fadeIn text-[#0F172A]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {this.props.fallbackTitle || "Something went wrong in this section"}
              </h3>
              <p className="text-xs text-slate-500">
                The application encountered an issue while rendering this component. Your data is safe.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-xs font-mono text-rose-900 break-words leading-relaxed">
            {errorMessage}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
