import useDocumentTitle from "../hooks/useDocumentTitle";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  X,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  Search,
  Lock,
  User,
  Mail,
  Phone,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function MyOrdersPage({ onNavigate }) {
  useDocumentTitle("My Orders & Tracking");

  const navigate = useNavigate();
  const { user, isAuthenticated, login, register, logout } = useAuth();

  const handleNavToProducts = () => {
    if (onNavigate) onNavigate("products");
    else navigate("/products");
  };

  // State
  const [serverOrders, setServerOrders] = useState([]);
  const [localOrders, setLocalOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Guest Order Tracking State
  const [guestOrderId, setGuestOrderId] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestTrackingLoading, setGuestTrackingLoading] = useState(false);
  const [guestTrackingError, setGuestTrackingError] = useState(null);
  const [trackedOrder, setTrackedOrder] = useState(null);

  // Auth Card Tab (login / register)
  const [authTab, setAuthTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [authFormLoading, setAuthFormLoading] = useState(false);
  const [authFormError, setAuthFormError] = useState(null);

  // Selected invoice for modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Load orders stored in this device's localStorage
  const loadLocalOrders = useCallback(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("orderHistory") || "[]");
      setLocalOrders(Array.isArray(saved) ? saved : []);
    } catch (e) {
      setLocalOrders([]);
    }
  }, []);

  // Fetch orders from server for authenticated user
  const fetchUserOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const response = await axiosClient.get("/orders");
      const fetched = response.data?.orders || [];
      setServerOrders(fetched);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setOrdersError(err.message || "Failed to load orders from server.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadLocalOrders();
  }, [loadLocalOrders]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserOrders();
    } else {
      setServerOrders([]);
    }
  }, [isAuthenticated, fetchUserOrders]);

  // Handle Guest Tracking
  const handleGuestTrack = async (e) => {
    e.preventDefault();
    setGuestTrackingError(null);
    setTrackedOrder(null);

    const cleanId = guestOrderId.trim();
    const cleanPhone = guestPhone.trim();

    if (!cleanId) {
      setGuestTrackingError("Please enter your Order ID (e.g. SFX-1005 or 5).");
      return;
    }
    if (!cleanPhone) {
      setGuestTrackingError("Please enter the contact phone number used during checkout.");
      return;
    }

    setGuestTrackingLoading(true);

    try {
      const response = await axiosClient.get("/orders", {
        params: {
          order_id: cleanId,
          phone: cleanPhone,
        },
      });

      const matchedOrders = response.data?.orders || [];
      if (matchedOrders.length > 0) {
        setTrackedOrder(matchedOrders[0]);
      } else {
        setGuestTrackingError("No order found matching this Order ID and Phone number.");
      }
    } catch (err) {
      setGuestTrackingError(err.message || "Order not found. Please verify your credentials.");
    } finally {
      setGuestTrackingLoading(false);
    }
  };

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthFormError(null);
    if (!loginForm.email || !loginForm.password) {
      setAuthFormError("Please enter both email and password.");
      return;
    }

    setAuthFormLoading(true);
    const res = await login(loginForm.email, loginForm.password);
    setAuthFormLoading(false);

    if (!res.success) {
      setAuthFormError(res.error);
    } else {
      setLoginForm({ email: "", password: "" });
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthFormError(null);

    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setAuthFormError("Name, email, and password (at least 6 chars) are required.");
      return;
    }

    setAuthFormLoading(true);
    const res = await register(registerForm);
    setAuthFormLoading(false);

    if (!res.success) {
      setAuthFormError(res.error);
    } else {
      setRegisterForm({ name: "", email: "", phone: "", password: "" });
    }
  };

  // Standardize order object for invoice modal and display
  const normalizeOrder = (ord) => {
    const rawId = ord.id || ord.orderId;
    const formattedId = typeof rawId === "number" ? `SFX-${rawId}` : String(rawId || "SFX-000");

    let items = [];
    if (Array.isArray(ord.items)) {
      items = ord.items;
    } else if (typeof ord.items === "string") {
      try {
        items = JSON.parse(ord.items);
      } catch (e) {
        items = [];
      }
    }

    const orderDate = ord.orderDate || (ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) : "Recent");

    const grandTotal = Number(ord.grandTotal ?? ord.total_amount) || 0;
    const couponDiscount = Number(ord.couponDiscount ?? ord.coupon_discount) || 0;
    const shippingFee = Number(ord.shippingFee) || (grandTotal >= 2500 ? 0 : 60);
    const subtotal = Number(ord.subtotal) || Math.max(0, grandTotal + couponDiscount - shippingFee);

    return {
      orderId: formattedId,
      rawId: ord.id,
      orderDate,
      status: ord.status || "Pending",
      customer: ord.customer || {
        fullName: ord.customer_name || "Valued Customer",
        phone: ord.customer_phone || "",
        email: ord.customer_email || "",
        address: ord.delivery_address || "",
        division: ord.district || "Bangladesh",
      },
      items,
      paymentMethod: ord.payment_method || "Cash on Delivery",
      couponCode: ord.coupon_code || ord.couponCode,
      couponDiscount,
      shippingFee,
      subtotal,
      grandTotal,
    };
  };

  const getItemImage = (item) => {
    if (item?.image && typeof item.image === "string" && item.image.startsWith("http")) return item.image;
    if (item?.directImage && typeof item.directImage === "string" && item.directImage.startsWith("http")) return item.directImage;
    if (item?.thumbnail && typeof item.thumbnail === "string" && item.thumbnail.startsWith("http")) return item.thumbnail;
    return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";
  };

  return (
    <div className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 animate-fadeIn font-sans">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#091124] via-[#0d1734] to-[#060b18] p-6 sm:p-10 border border-cyan-500/20 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Package className="w-3.5 h-3.5" />
            <span>ORDER TRACKING &amp; CUSTOMER PORTAL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Outfit'] tracking-tight">
            Orders &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Live Tracking
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Track real-time shipment status across Bangladesh, download official tax invoices, or sign in to seamlessly sync your purchase history.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CASE 1: LOGGED-IN USER VIEW                                    */}
      {/* ============================================================== */}
      {isAuthenticated ? (
        <div className="space-y-6">
          {/* Account Profile Bar */}
          <div className="rounded-2xl bg-[#070b16] border border-cyan-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg font-['Outfit'] shadow-md shadow-cyan-900/40">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-['Outfit']">{user?.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Account</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{user?.email}</span>
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{user?.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={fetchUserOrders}
                disabled={isLoadingOrders}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingOrders ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Orders Loading / Error States */}
          {isLoadingOrders ? (
            <div className="space-y-4">
              {[1, 2].map((k) => (
                <div key={k} className="p-6 rounded-3xl bg-[#070b14] border border-white/[0.08] animate-pulse space-y-4">
                  <div className="h-5 bg-white/10 rounded w-1/4" />
                  <div className="h-16 bg-white/5 rounded-2xl" />
                  <div className="h-12 bg-white/5 rounded-xl" />
                </div>
              ))}
            </div>
          ) : ordersError ? (
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{ordersError}</span>
            </div>
          ) : serverOrders.length === 0 ? (
            <div className="rounded-3xl bg-[#090e1c] border border-white/[0.08] p-12 text-center max-w-md mx-auto space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">No orders linked yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You haven't placed any orders with this account yet. Browse our smartphones, laptops, and audio gear!
              </p>
              <button
                type="button"
                onClick={handleNavToProducts}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-lg shadow-cyan-950/50 inline-flex items-center gap-2"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  Total Orders on File: <strong className="text-white font-mono">{serverOrders.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleNavToProducts}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer inline-flex items-center gap-1 text-xs"
                >
                  <span>Shop More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {serverOrders.map((rawOrd, idx) => {
                const ord = normalizeOrder(rawOrd);
                return (
                  <div
                    key={ord.rawId || idx}
                    className="bg-[#070b14] border border-white/[0.08] hover:border-cyan-500/30 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-white/[0.08]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-sm font-bold text-white">
                            Order #{ord.orderId}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{ord.status}</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          Placed On: {ord.orderDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xl font-black text-cyan-400">
                          ৳{ord.grandTotal.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(ord)}
                          className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-200 border border-white/10 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                        >
                          <span>View Invoice</span>
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block text-xs">Order Verified</span>
                            <span className="text-[10px] text-slate-400">Database Confirmed</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-cyan-400 block text-xs">Processing &amp; Dispatch</span>
                            <span className="text-[10px] text-slate-400">Steadfast / Pathao</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 opacity-60">
                          <div className="w-7 h-7 rounded-full bg-white/[0.05] text-slate-400 border border-white/10 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-300 block text-xs">Delivered</span>
                            <span className="text-[10px] text-slate-500">Destination Hub</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-['Outfit']">
                        Purchased Items ({ord.items?.length || 0})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ord.items?.map((item, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/20 flex items-center gap-3 transition"
                          >
                            <div className="w-12 h-12 rounded-lg bg-[#030712] border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={getItemImage(item)}
                                alt={item.title}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-semibold text-white truncate font-['Outfit']">
                                {item.title}
                              </h5>
                              <span className="text-xs font-extrabold text-cyan-400 font-mono block mt-0.5">
                                ৳{Number(item.price || 0).toLocaleString()} {item.quantity > 1 && `× ${item.quantity}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* CASE 2: GUEST / UNAUTHENTICATED VIEW                           */
        /* ============================================================== */
        <div className="space-y-10">
          {/* Dual Panel: Guest Order Tracker & Quick Account Portal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Guest Order Tracking Card */}
            <div className="lg:col-span-7 bg-[#070b16] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold">
                  <Search className="w-3.5 h-3.5" />
                  <span>SECURE GUEST ORDER LOOKUP</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Outfit']">
                  Track Your Specific Order
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  For customer privacy, guest lookup requires both your <strong>Order ID</strong> (from SMS / checkout invoice) and your <strong>contact phone number</strong>.
                </p>
              </div>

              {/* Guest Lookup Form */}
              <form onSubmit={handleGuestTrack} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-['Outfit']">
                      Order ID <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Package className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. SFX-5 or 5"
                        value={guestOrderId}
                        onChange={(e) => setGuestOrderId(e.target.value)}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-['Outfit']">
                      Phone Number <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. 01712345678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                {guestTrackingError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-shake">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{guestTrackingError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={guestTrackingLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {guestTrackingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Track Order Status</span>
                    </>
                  )}
                </button>
              </form>

              {/* Verified Tracked Order Results */}
              {trackedOrder && (
                <div className="pt-4 border-t border-white/[0.08] space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          Order #{trackedOrder.id || trackedOrder.orderId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          {trackedOrder.status || "Verified"}
                        </span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-cyan-400">
                        ৳{Number(trackedOrder.total_amount || trackedOrder.grandTotal || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div>
                        <span className="text-slate-400">Customer: </span>
                        <strong>{trackedOrder.customer_name || trackedOrder.customer?.fullName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Shipping To: </span>
                        <span>{trackedOrder.delivery_address || trackedOrder.customer?.address} ({trackedOrder.district || trackedOrder.customer?.division})</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Items: {trackedOrder.items?.length || 1} product(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(normalizeOrder(trackedOrder))}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                      >
                        <span>View Invoice</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Quick Customer Portal (Sign In / Register) */}
            <div className="lg:col-span-5 bg-[#070b16] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 text-[11px] font-bold">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CUSTOMER ACCOUNT</span>
                </div>
                <h3 className="text-xl font-bold text-white font-['Outfit']">
                  Unlock Full Order History
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Log in or create a quick account to automatically view all your orders without entering order IDs every time.
                </p>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#030712] border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    setAuthFormError(null);
                  }}
                  className={`py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 ${
                    authTab === "login"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("register");
                    setAuthFormError(null);
                  }}
                  className={`py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 ${
                    authTab === "register"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              {/* Login Form */}
              {authTab === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  {authFormError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{authFormError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authFormLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {authFormLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>Sign In to Customer Hub</span>
                  </button>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Ashikur Rahman"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="017XXXXXXXX"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password (min 6 chars)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full bg-[#030712] border border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  {authFormError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{authFormError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authFormLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {authFormLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>Create Free Account</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Local Device Orders (If any placed recently in this browser) */}
          {localOrders.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    Orders Placed on this Device ({localOrders.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Saved locally in this browser. Sign in or register above to link them across all your devices.
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {localOrders.map((ord, idx) => {
                  const normalized = normalizeOrder(ord);
                  return (
                    <div
                      key={idx}
                      className="bg-[#070b14] border border-white/[0.08] hover:border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-lg transition"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-white/[0.06]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">
                              Order #{normalized.orderId}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-[10px] font-mono">
                              Local Snapshot
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {normalized.orderDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-extrabold text-cyan-400">
                            ৳{normalized.grandTotal.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(normalized)}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-200 border border-white/10 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                          >
                            <span>Invoice</span>
                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="flex items-center gap-3 overflow-x-auto py-1">
                        {normalized.items?.map((item, i) => (
                          <div
                            key={i}
                            className="shrink-0 flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                          >
                            <img
                              src={getItemImage(item)}
                              alt={item.title}
                              className="w-8 h-8 rounded-lg object-contain bg-[#030712] p-1 border border-white/10"
                            />
                            <div className="text-left">
                              <span className="text-[11px] font-medium text-white block truncate max-w-[140px]">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-cyan-400 font-mono font-bold">
                                ৳{Number(item.price || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* INVOICE MODAL OVERLAY                                          */}
      {/* ============================================================== */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#060a16] border border-cyan-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-xs space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold font-['Outfit'] shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                  S
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white font-['Outfit']">
                    Official Tax Invoice
                  </h3>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Invoice #{selectedInvoice.orderId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#030712] border border-white/[0.06]">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Customer Name</span>
                <span className="text-xs font-bold text-white block">{selectedInvoice.customer?.fullName || "Valued Shopper"}</span>
                <span className="text-slate-400 block mt-0.5">{selectedInvoice.customer?.phone}</span>
                {selectedInvoice.customer?.email && (
                  <span className="text-slate-500 block text-[10px] truncate">{selectedInvoice.customer?.email}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Shipping Destination</span>
                <span className="text-xs font-medium text-slate-300 block">{selectedInvoice.customer?.address || "Address on File"}</span>
                <span className="text-slate-400 block mt-0.5">{selectedInvoice.customer?.division || "Bangladesh"}</span>
              </div>
            </div>

            {/* Item Breakdown */}
            <div className="divide-y divide-white/[0.06] border-y border-white/[0.08]">
              {selectedInvoice.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getItemImage(item)}
                      alt={item.title}
                      className="w-9 h-9 rounded-lg object-contain bg-[#030712] p-1 border border-white/10"
                    />
                    <div>
                      <span className="font-semibold text-white block">{item.title}</span>
                      <span className="text-[10px] text-slate-400">Qty: {item.quantity || 1}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-white">
                    ৳{Number(item.price || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Financial Summary */}
            <div className="space-y-1.5 pt-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-white">৳{selectedInvoice.subtotal?.toLocaleString()}</span>
              </div>
              {selectedInvoice.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Savings {selectedInvoice.couponCode ? `(${selectedInvoice.couponCode})` : ""}</span>
                  <span className="font-mono">-৳{selectedInvoice.couponDiscount.toLocaleString()}</span>
                </div>
              )}
              {selectedInvoice.shippingFee > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Express Shipping</span>
                  <span className="font-mono text-white">৳{selectedInvoice.shippingFee}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold text-white pt-3 border-t border-white/[0.08]">
                <span className="font-['Outfit']">Grand Total Paid</span>
                <span className="font-mono text-lg text-cyan-400">৳{selectedInvoice.grandTotal?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
