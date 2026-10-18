import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Key,
  ArrowRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  LogOut,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

/**
 * AdminRoute Component
 * Role-Based Access Control (RBAC) Route Guard with In-Place Admin Authentication Portal.
 * Never bounces users away with sudden redirects! If unauthenticated or non-admin,
 * renders an interactive, secure admin gateway with direct login & privilege re-sync.
 */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading, login, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Local state for inline admin login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);

  // 1. Session verification in-progress
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#090e1c] border border-cyan-500/30 flex items-center justify-center shadow-2xl">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Security Handshake</span>
        </div>
        <p className="text-slate-400 text-sm mt-1">Verifying administrator credentials...</p>
      </div>
    );
  }

  // 2. Authenticated Administrator -> Grant Immediate Access
  if (isAuthenticated && user?.role === "admin") {
    return children;
  }

  // Handler for quick-filling demo admin credentials
  const handleQuickFill = () => {
    setEmail("admin@suffex.com");
    setPassword("admin123");
    setErrorMessage(null);
  };

  // Handler for in-place admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || "Invalid credentials. Please verify your admin account.");
      return;
    }

    if (result.user?.role !== "admin") {
      setErrorMessage(
        `Signed in as ${result.user?.name || "User"}, but this account role is "${result.user?.role}". Administrator privileges are required.`
      );
    }
  };

  // Handler for refreshing user privileges from DB
  const handleRefreshPrivileges = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    const res = await refreshUser();
    setIsRefreshing(false);

    if (res.success && res.user?.role === "admin") {
      setRefreshMessage("Privileges upgraded! Administrator access granted.");
    } else if (res.success) {
      setRefreshMessage(`Account active as "${res.user?.role}". Still awaiting admin role in DB.`);
    } else {
      setRefreshMessage("Could not refresh session. Please sign in again.");
    }
  };

  // 3. User is logged in, but not an admin (Role !== 'admin')
  if (isAuthenticated && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-lg bg-[#090e1c]/90 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-400 shadow-lg shadow-amber-500/5">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              Role Access Restricted
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              Administrator Privileges Required
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-md">
              The Suffex Control Hub requires verified system administrator privileges to access orders, stock, and store management.
            </p>
          </div>

          {/* Current Account Card */}
          <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Currently Authenticated As</p>
              <p className="text-sm font-semibold text-white mt-0.5">{user?.name || "Customer"}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Role: {user?.role || "customer"}
              </span>
            </div>
          </div>

          {refreshMessage && (
            <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{refreshMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleRefreshPrivileges}
              disabled={isRefreshing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Database Permissions...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Admin Permissions</span>
                </>
              )}
            </button>

            <button
              onClick={() => logout()}
              className="w-full py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white font-medium text-sm border border-white/[0.08] flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign In with Different Admin Account</span>
            </button>

            <Link
              to="/"
              className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. User is NOT authenticated -> Render Direct Admin Login Gate
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-cyan-500/10 via-blue-500/15 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#090e1c]/90 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl">
        {/* Portal Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute -inset-2 rounded-2xl bg-cyan-500/20 blur-md" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0c1427] to-[#080d19] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl">
              <Lock className="w-7 h-7" />
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Suffex Core Console</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">Administrator Portal</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Sign in with administrative credentials to access store controls.
          </p>
        </div>

        {/* Quick-Fill Demo Helper */}
        <div className="mt-5 p-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-semibold text-cyan-300">Quick Demo Access</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">admin@suffex.com / admin123</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition-colors shrink-0"
          >
            Auto-Fill
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@suffex.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Console Access...</span>
              </>
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
