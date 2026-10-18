import React from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert, Bug, ChevronDown } from "lucide-react";

/**
 * Global ErrorBoundary Component
 * Catches unhandled JavaScript runtime exceptions anywhere in the component tree,
 * preventing a blank white screen and providing a sleek, self-healing recovery UI.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log exception context for telemetry & debugging
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  handleClearCacheAndRestart = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message || "An unexpected application error occurred.";

      return (
        <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
          {/* Ambient Cyberpunk Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-rose-500/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 blur-[110px] rounded-full pointer-events-none" />

          <div className="relative w-full max-w-lg bg-[#090e1c]/95 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-2xl shadow-rose-950/20 text-center">
            {/* Header Icon */}
            <div className="relative inline-block mb-5">
              <div className="absolute -inset-2 rounded-2xl bg-rose-500/20 blur-md animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>

            {/* Badge */}
            <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 w-fit mx-auto mb-3">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Fault Isolation Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Outfit']">
              Something Went Wrong
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              The application encountered an unexpected runtime state. Don&apos;t worry, your cart and session data remain intact.
            </p>

            {/* Error Message Card */}
            <div className="mt-5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left">
              <p className="text-[11px] font-mono text-rose-400 break-words leading-relaxed font-semibold">
                {errorMessage}
              </p>
            </div>

            {/* Collapsible Technical Details for Engineers */}
            {this.state.errorInfo && (
              <details className="mt-3 text-left group">
                <summary className="text-[11px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer flex items-center justify-between py-1 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Bug className="w-3 h-3" />
                    <span>Technical Stack Trace</span>
                  </span>
                  <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 p-3 rounded-xl bg-black/60 border border-white/5 max-h-40 overflow-y-auto text-[10px] font-mono text-slate-400 whitespace-pre-wrap select-text">
                  {this.state.errorInfo?.componentStack || "No stack trace available"}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white font-medium text-xs border border-white/[0.08] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Storefront</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleClearCacheAndRestart}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-medium text-xs border border-white/[0.08] hover:border-rose-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Clears corrupted session tokens and resets"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
