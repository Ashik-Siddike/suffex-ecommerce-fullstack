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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center select-none text-slate-900">
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center shadow-md">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-cyan-700 font-mono text-xs uppercase tracking-widest font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Security Handshake</span>
        </div>
        <p className="text-slate-600 text-sm mt-1">Verifying administrator credentials...</p>
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
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-amber-500/5 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5 text-amber-600 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
              Role Access Restricted
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Administrator Privileges Required
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md">
              The Suffex Control Hub requires verified system administrator privileges to access orders, stock, and store management.
            </p>
          </div>

          {/* Current Account Card */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Currently Authenticated As</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{user?.name || "Customer"}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold bg-slate-100 text-slate-700 border border-slate-300">
                Role: {user?.role || "customer"}
              </span>
            </div>
          </div>

          {refreshMessage && (
            <div className="mt-4 p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{refreshMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleRefreshPrivileges}
              disabled={isRefreshing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50 cursor-pointer"
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
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-medium text-sm border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign In with Different Admin Account</span>
            </button>

            <Link
              to="/"
              className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-900 text-xs flex items-center justify-center gap-1.5 transition-colors"
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-cyan-500/5 via-blue-500/5 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl">
        {/* Portal Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute -inset-2 rounded-2xl bg-cyan-500/10 blur-md" />
            <div className="relative w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Suffex Core Console</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administrator Portal</h1>
          <p className="text-xs text-slate-600 mt-1.5">
            Sign in with administrative credentials to access store controls.
          </p>
        </div>

        {/* Quick-Fill Demo Helper */}
        <div className="mt-5 p-3 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-semibold text-cyan-800">Quick Demo Access</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">admin@suffex.com / admin123</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2.5 py-1 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-800 border border-cyan-300 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
          >
            Auto-Fill
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@suffex.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20 disabled:opacity-50 mt-2 cursor-pointer"
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
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
