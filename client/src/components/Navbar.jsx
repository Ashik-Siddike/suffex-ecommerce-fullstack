import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import {
  ShoppingBag,
  Sparkles,
  Menu,
  X,
  Flame,
  ArrowRight,
  User,
  ShieldCheck,
  Heart,
  Home,
  Package,
  HelpCircle,
  LogOut,
  LogIn,
} from "lucide-react";

/**
 * Navbar Component
 * Fully responsive navigation bar with optimized compact mobile height (h-14),
 * zero horizontal overflow, and dedicated mobile drawer with account controls.
 */
export default function Navbar({
  cartCount: propCartCount,
  onOpenCart: propOnOpenCart,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Consume cart, wishlist & auth contexts
  const cartContext = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const effectiveCount = propCartCount !== undefined ? propCartCount : cartContext.cartCount;
  const handleOpenCart = propOnOpenCart || cartContext.openCart;

  const isAdmin = Boolean(isAuthenticated && user?.role === "admin");

  const navItems = [
    { path: "/", label: "Home", icon: Home, badge: null },
    { path: "/products", label: "Shop Products", icon: Sparkles, badge: "HOT" },
    { path: "/wishlist", label: "Wishlist", icon: Heart, badge: wishlistCount > 0 ? String(wishlistCount) : null },
    { path: "/my-orders", label: "My Orders", icon: Package, badge: null },
    { path: "/contact", label: "Support & FAQ", icon: HelpCircle, badge: null },
    ...(isAdmin ? [{ path: "/admin", label: "Admin Panel", icon: ShieldCheck, badge: "ADMIN" }] : []),
  ];

  return (
    <>
      {/* Top Ambient Announcement Ticker - Slim on mobile (h-7 sm:h-8) */}
      <div className="bg-gradient-to-r from-[#040814] via-[#091124] to-[#040814] border-b border-white/[0.06] text-xs py-1 px-3 sm:px-4 text-slate-300 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 animate-pulse" />
              Flash Deal
            </span>
            <span className="text-slate-300 text-xs hidden sm:inline truncate">
              Apply coupon <strong className="text-cyan-400 font-mono font-bold tracking-wider">STORE20</strong> for 20% OFF on all flagship tech &amp; authentic gear!
            </span>
            <span className="text-slate-300 text-[10px] sm:hidden truncate">
              Use code <strong className="text-cyan-400 font-mono font-bold">STORE20</strong> for 20% OFF!
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-400 shrink-0">
            <span>Fast Nationwide Delivery</span>
            <span className="text-slate-600">•</span>
            <span>100% Genuine Warranty</span>
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Sticky Header - Responsive Height: h-14 on mobile, h-16 sm, h-18 md */}
      <header className="sticky top-0 z-40 w-full bg-[#030712]/92 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo - Compact on mobile */}
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 opacity-40 blur-sm group-hover:opacity-80 transition duration-300" />
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-[#090e1c] border border-cyan-500/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>

            <div className="leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white font-['Outfit']">
                  Suffex
                </span>
                <span className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 font-['Outfit']">
                  Store
                </span>
              </div>
              <span className="hidden sm:block text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-widest uppercase -mt-0.5">
                Next-Gen Commerce
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#0a0f1d]/90 p-1.5 rounded-2xl border border-white/[0.08] shadow-inner">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/50"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`
                }
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full tracking-tight font-mono ${
                      item.badge === "ADMIN"
                        ? "bg-amber-400 text-black shadow-sm"
                        : item.label === "Wishlist"
                        ? "bg-rose-500 text-white"
                        : "bg-cyan-400 text-black"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Desktop Actions (Hidden on Mobile to eliminate clutter) */}
            <div className="hidden md:flex items-center gap-2">
              {/* Admin Quick Button (Desktop) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-xs font-semibold cursor-pointer shadow-sm active:scale-95"
                  title="Enter Admin Control Center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin</span>
                </Link>
              )}

              {/* Wishlist Quick Button (Desktop) */}
              <Link
                to="/wishlist"
                className="relative p-2.5 rounded-xl bg-[#0a0f1d] hover:bg-rose-950/30 text-white border border-white/[0.1] hover:border-rose-500/40 transition-all duration-200 cursor-pointer shadow-md active:scale-95 flex items-center justify-center"
                title="View Saved Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-md animate-pulse">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Desktop User Profile / Sign In Quick Pill */}
              {isAuthenticated ? (
                <Link
                  to="/my-orders"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition text-xs font-semibold cursor-pointer shadow-sm"
                  title={`Logged in as ${user?.name}`}
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold text-[10px]">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden xl:inline truncate max-w-[90px]">{user?.name}</span>
                </Link>
              ) : (
                <Link
                  to="/my-orders"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition text-xs font-semibold cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Account</span>
                </Link>
              )}

              {/* Desktop Cart Button */}
              <button
                type="button"
                onClick={handleOpenCart}
                className="group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#0a0f1d] hover:bg-cyan-950/30 text-white border border-white/[0.1] hover:border-cyan-500/40 transition-all duration-200 cursor-pointer text-xs font-semibold shadow-md active:scale-95"
                aria-label="Open shopping cart"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
                  {effectiveCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
                <span className="font-['Outfit'] font-bold tracking-wide">Cart</span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                    effectiveCount > 0
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm"
                      : "bg-white/[0.06] text-slate-400"
                  }`}
                >
                  {effectiveCount}
                </span>
              </button>
            </div>

            {/* Mobile-Only Clean Actions (Super compact, never overflows!) */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* Quick Admin Icon if admin (Mobile) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center transition active:scale-90"
                  title="Admin Dashboard"
                >
                  <ShieldCheck className="w-4 h-4" />
                </Link>
              )}

              {/* Quick Profile Icon (Mobile) */}
              <Link
                to="/my-orders"
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center transition active:scale-90 text-xs font-bold font-mono"
                title={isAuthenticated ? user?.name : "Sign In / Orders"}
              >
                {isAuthenticated && user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Link>

              {/* Mobile Hamburger Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.1] flex items-center justify-center transition active:scale-90 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? (
                  <X className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#070b16]/98 backdrop-blur-2xl border-b border-white/[0.08] px-4 pt-3 pb-5 space-y-2.5 animate-fadeIn shadow-2xl">
            {/* User Account Quick Card inside Mobile Menu */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                  {isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate font-['Outfit']">
                    {isAuthenticated ? user?.name : "Guest Visitor"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {isAuthenticated ? user?.email : "Sign in to track orders & perks"}
                  </p>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-medium flex items-center gap-1 transition shrink-0"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit</span>
                </button>
              ) : (
                <Link
                  to="/my-orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[10px] font-medium flex items-center gap-1 transition shrink-0"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                        isActive
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                          : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className="w-4 h-4 text-cyan-400" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            item.badge === "ADMIN"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono"
                              : item.label === "Wishlist"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30 font-mono"
                              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-mono"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </NavLink>
                );
              })}
            </div>

            {/* Mobile Bottom Quick Support Note */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500">
              <span>Official Warranty Support</span>
              <span className="text-cyan-400 font-mono">100% Authentic</span>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
