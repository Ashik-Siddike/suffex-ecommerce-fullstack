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
      <div className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-10 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold">
            <Package className="w-3.5 h-3.5" />
            <span>ORDER TRACKING &amp; CUSTOMER PORTAL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            Orders &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">
              Live Tracking
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
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
          <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg font-['Outfit'] shadow-md shadow-cyan-600/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 font-['Outfit']">{user?.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Account</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{user?.email}</span>
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
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
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 ${isLoadingOrders ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
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
                <div key={k} className="p-6 rounded-3xl bg-white border border-slate-200 animate-pulse space-y-4 shadow-sm">
                  <div className="h-5 bg-slate-200 rounded w-1/4" />
                  <div className="h-16 bg-slate-100 rounded-2xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : ordersError ? (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{ordersError}</span>
            </div>
          ) : serverOrders.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto text-cyan-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">No orders linked yet</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You haven't placed any orders with this account yet. Browse our smartphones, laptops, and audio gear!
              </p>
              <button
                type="button"
                onClick={handleNavToProducts}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Total Orders on File: <strong className="text-slate-900 font-mono">{serverOrders.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleNavToProducts}
                  className="text-cyan-600 hover:text-cyan-700 font-semibold cursor-pointer inline-flex items-center gap-1 text-xs"
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
                    className="bg-white border border-slate-200 hover:border-cyan-500/40 rounded-3xl p-5 sm:p-7 space-y-5 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-sm font-bold text-slate-900">
                            Order #{ord.orderId}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{ord.status}</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block font-mono">
                          Placed On: {ord.orderDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xl font-black text-cyan-700">
                          ৳{ord.grandTotal.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(ord)}
                          className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                        >
                          <span>View Invoice</span>
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">Order Verified</span>
                            <span className="text-[10px] text-slate-500">Database Confirmed</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-cyan-700 block text-xs">Processing &amp; Dispatch</span>
                            <span className="text-[10px] text-slate-500">Steadfast / Pathao</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 opacity-60">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 block text-xs">Delivered</span>
                            <span className="text-[10px] text-slate-400">Destination Hub</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-['Outfit']">
                        Purchased Items ({ord.items?.length || 0})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ord.items?.map((item, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-500/30 flex items-center gap-3 transition"
                          >
                            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={getItemImage(item)}
                                alt={item.title}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-semibold text-slate-900 truncate font-['Outfit']">
                                {item.title}
                              </h5>
                              <span className="text-xs font-extrabold text-cyan-700 font-mono block mt-0.5">
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
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[11px] font-bold">
                  <Search className="w-3.5 h-3.5" />
                  <span>SECURE GUEST ORDER LOOKUP</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Outfit']">
                  Track Your Specific Order
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For customer privacy, guest lookup requires both your <strong>Order ID</strong> (from SMS / checkout invoice) and your <strong>contact phone number</strong>.
                </p>
              </div>

              {/* Guest Lookup Form */}
              <form onSubmit={handleGuestTrack} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-['Outfit']">
                      Order ID <span className="text-cyan-600">*</span>
                    </label>
                    <div className="relative">
                      <Package className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. SFX-5 or 5"
                        value={guestOrderId}
                        onChange={(e) => setGuestOrderId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-['Outfit']">
                      Phone Number <span className="text-cyan-600">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. 01712345678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                {guestTrackingError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{guestTrackingError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={guestTrackingLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
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
                <div className="pt-4 border-t border-slate-200 space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          Order #{trackedOrder.id || trackedOrder.orderId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                          {trackedOrder.status || "Verified"}
                        </span>
                      </div>
                      <span className="font-mono text-base font-extrabold text-cyan-700">
                        ৳{Number(trackedOrder.total_amount || trackedOrder.grandTotal || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      <div>
                        <span className="text-slate-500">Customer: </span>
                        <strong>{trackedOrder.customer_name || trackedOrder.customer?.fullName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Shipping To: </span>
                        <span>{trackedOrder.delivery_address || trackedOrder.customer?.address} ({trackedOrder.district || trackedOrder.customer?.division})</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Items: {trackedOrder.items?.length || 1} product(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(normalizeOrder(trackedOrder))}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-xs"
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
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                  <Lock className="w-3.5 h-3.5 text-cyan-600" />
                  <span>CUSTOMER ACCOUNT</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">
                  Unlock Full Order History
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log in or create a quick account to automatically view all your orders without entering order IDs every time.
                </p>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    setAuthFormError(null);
                  }}
                  className={`py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 ${
                    authTab === "login"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold"
                      : "text-slate-600 hover:text-slate-900"
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
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold"
                      : "text-slate-600 hover:text-slate-900"
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {authFormError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{authFormError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authFormLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ashikur Rahman"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="017XXXXXXXX"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Password (min 6 chars)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {authFormError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{authFormError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authFormLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                    Orders Placed on this Device ({localOrders.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
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
                      className="bg-white border border-slate-200 hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              Order #{normalized.orderId}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200">
                              Local Snapshot
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {normalized.orderDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-extrabold text-cyan-700">
                            ৳{normalized.grandTotal.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(normalized)}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-cyan-50 hover:border-cyan-200 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                          >
                            <span>Invoice</span>
                            <ExternalLink className="w-3.5 h-3.5 text-cyan-600" />
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="flex items-center gap-3 overflow-x-auto py-1">
                        {normalized.items?.map((item, i) => (
                          <div
                            key={i}
                            className="shrink-0 flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200"
                          >
                            <img
                              src={getItemImage(item)}
                              alt={item.title}
                              className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-slate-200"
                            />
                            <div className="text-left">
                              <span className="text-[11px] font-medium text-slate-800 block truncate max-w-[140px]">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-cyan-700 font-mono font-bold">
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
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-xs space-y-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center font-bold font-['Outfit']">
                  S
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                    Official Tax Invoice
                  </h3>
                  <span className="font-mono text-slate-500 text-[11px]">
                    Invoice #{selectedInvoice.orderId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Customer Name</span>
                <span className="text-xs font-bold text-slate-900 block">{selectedInvoice.customer?.fullName || "Valued Shopper"}</span>
                <span className="text-slate-600 block mt-0.5">{selectedInvoice.customer?.phone}</span>
                {selectedInvoice.customer?.email && (
                  <span className="text-slate-500 block text-[10px] truncate">{selectedInvoice.customer?.email}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Shipping Destination</span>
                <span className="text-xs font-medium text-slate-700 block">{selectedInvoice.customer?.address || "Address on File"}</span>
                <span className="text-slate-500 block mt-0.5">{selectedInvoice.customer?.division || "Bangladesh"}</span>
              </div>
            </div>

            {/* Item Breakdown */}
            <div className="divide-y divide-slate-100 border-y border-slate-200">
              {selectedInvoice.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getItemImage(item)}
                      alt={item.title}
                      className="w-9 h-9 rounded-lg object-contain bg-slate-50 p-1 border border-slate-200"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block">{item.title}</span>
                      <span className="text-[10px] text-slate-500">Qty: {item.quantity || 1}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ৳{Number(item.price || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Financial Summary */}
            <div className="space-y-1.5 pt-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono text-slate-900">৳{selectedInvoice.subtotal?.toLocaleString()}</span>
              </div>
              {selectedInvoice.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Savings {selectedInvoice.couponCode ? `(${selectedInvoice.couponCode})` : ""}</span>
                  <span className="font-mono">-৳{selectedInvoice.couponDiscount.toLocaleString()}</span>
                </div>
              )}
              {selectedInvoice.shippingFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Express Shipping</span>
                  <span className="font-mono text-slate-900">৳{selectedInvoice.shippingFee}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                <span className="font-['Outfit']">Grand Total Paid</span>
                <span className="font-mono text-lg text-cyan-700">৳{selectedInvoice.grandTotal?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

