import useDocumentTitle from "../hooks/useDocumentTitle";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Boxes,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  ExternalLink,
  PlusCircle,
  Percent,
  Calendar,
  Hash,
  Sparkles,
  ChevronRight,
  X,
  Loader2,
  Layers
} from "lucide-react";

/**
 * Status Color & Style Dictionary
 */
const STATUS_STYLES = {
  Pending: {
    bg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  Confirmed: {
    bg: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
  },
  Processing: {
    bg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    dot: "bg-indigo-400",
  },
  Shipped: {
    bg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    dot: "bg-cyan-400",
  },
  Delivered: {
    bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  Cancelled: {
    bg: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
  },
};

const ORDER_STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminDashboardPage() {
  useDocumentTitle("Admin Dashboard");

  const { user } = useAuth();

  // Active Tab: 'overview' | 'products' | 'orders' | 'coupons'
  const [activeTab, setActiveTab] = useState("overview");

  // Loading & Global States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Data States
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Product Modals & Filters
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    title: "",
    category: "Smartphones",
    price: "",
    stock: "",
    image_url: "",
    description: "",
    is_active: true,
    attributesList: [{ key: "", value: "" }],
  });
  const [productFormSubmitting, setProductFormSubmitting] = useState(false);

  // Order Filters & Modals
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [statusUpdateLoadingId, setStatusUpdateLoadingId] = useState(null);

  // Coupon Modals & Filters
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponFormData, setCouponFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "0",
    max_discount: "",
    usage_limit: "1000",
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    badge: "PROMO",
    description: "",
  });
  const [couponFormSubmitting, setCouponFormSubmitting] = useState(false);

  // Show Toast Helper
  const showToast = useCallback((msg, type = "success") => {
    setToast({ text: msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Fetch All Dashboard Data
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, productsRes, ordersRes, couponsRes] = await Promise.all([
        axiosClient.get("/admin/stats"),
        axiosClient.get("/admin/products"),
        axiosClient.get("/admin/orders"),
        axiosClient.get("/admin/coupons"),
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (productsRes.data?.products) setProducts(productsRes.data.products);
      if (ordersRes.data?.orders) setOrders(ordersRes.data.orders);
      if (couponsRes.data?.coupons) setCoupons(couponsRes.data.coupons);

      if (isRefresh) showToast("Admin dashboard updated with latest live data.");
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      showToast(err.message || "Failed to fetch admin data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ==========================================
  // PRODUCT HANDLERS & DYNAMIC JSONB BUILDER
  // ==========================================
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductFormData({
      title: "",
      category: "Smartphones",
      price: "",
      stock: "10",
      image_url: "",
      description: "",
      is_active: true,
      attributesList: [
        { key: "Processor", value: "" },
        { key: "RAM", value: "" },
        { key: "Storage", value: "" },
        { key: "Warranty", value: "1 Year Official" },
      ],
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    const attrList = [];
    if (prod.attributes && typeof prod.attributes === "object") {
      Object.entries(prod.attributes).forEach(([k, v]) => {
        attrList.push({ key: k, value: String(v) });
      });
    }
    if (attrList.length === 0) {
      attrList.push({ key: "", value: "" });
    }

    setProductFormData({
      title: prod.title || "",
      category: prod.category || "Smartphones",
      price: String(prod.price || ""),
      stock: String(prod.stock ?? 0),
      image_url: prod.image_url || "",
      description: prod.description || "",
      is_active: prod.is_active !== false,
      attributesList: attrList,
    });
    setIsProductModalOpen(true);
  };

  const handleAttributeChange = (index, field, val) => {
    setProductFormData((prev) => {
      const nextList = [...prev.attributesList];
      nextList[index][field] = val;
      return { ...prev, attributesList: nextList };
    });
  };

  const handleAddAttributeRow = () => {
    setProductFormData((prev) => ({
      ...prev,
      attributesList: [...prev.attributesList, { key: "", value: "" }],
    }));
  };

  const handleRemoveAttributeRow = (index) => {
    setProductFormData((prev) => {
      const nextList = prev.attributesList.filter((_, i) => i !== index);
      return {
        ...prev,
        attributesList: nextList.length > 0 ? nextList : [{ key: "", value: "" }],
      };
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productFormData.title.trim()) {
      showToast("Product title is required.", "error");
      return;
    }
    if (!productFormData.price || Number(productFormData.price) <= 0) {
      showToast("Please enter a valid positive price.", "error");
      return;
    }

    setProductFormSubmitting(true);
    try {
      // Assemble dynamic JSONB attributes object
      const jsonbAttributes = {};
      productFormData.attributesList.forEach((item) => {
        const k = item.key.trim();
        const v = item.value.trim();
        if (k) jsonbAttributes[k] = v;
      });

      const payload = {
        title: productFormData.title.trim(),
        category: productFormData.category.trim(),
        price: Number(productFormData.price),
        stock: parseInt(productFormData.stock, 10) || 0,
        image_url: productFormData.image_url.trim(),
        description: productFormData.description.trim(),
        is_active: productFormData.is_active,
        attributes: jsonbAttributes,
      };

      if (editingProduct) {
        // Update product
        const res = await axiosClient.put(`/admin/products/${editingProduct.id}`, payload);
        showToast(res.data?.message || "Product updated successfully!");
      } else {
        // Create product
        const res = await axiosClient.post("/admin/products", payload);
        showToast(res.data?.message || "Product created successfully!");
      }

      setIsProductModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error("Save product error:", err);
      showToast(err.message || "Failed to save product.", "error");
    } finally {
      setProductFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    const confirmMsg = `Are you sure you want to delete "${prod.title}"?\n\n(Note: If this product is referenced in past order records, the system will securely soft-deactivate it to preserve financial history).`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await axiosClient.delete(`/admin/products/${prod.id}`);
      showToast(res.data?.message || "Product removed.");
      fetchDashboardData();
    } catch (err) {
      console.error("Delete product error:", err);
      showToast(err.message || "Failed to delete product.", "error");
    }
  };

  // ==========================================
  // ORDER STATUS UPDATE (ACID & INVENTORY RESTORE)
  // ==========================================
  const handleOrderStatusChange = async (orderId, newStatus) => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder || currentOrder.status === newStatus) return;

    if (newStatus === "Cancelled") {
      const proceed = window.confirm(
        `Are you sure you want to transition Order #${orderId} to "Cancelled"?\n\nCRITICAL: This will automatically execute an ACID PostgreSQL transaction to restore purchased item quantities back into product stock inventory.`
      );
      if (!proceed) return;
    }

    setStatusUpdateLoadingId(orderId);
    try {
      const res = await axiosClient.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });

      showToast(res.data?.message || `Order #${orderId} updated to ${newStatus}.`);

      // Update in local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // Refresh overview stats & product stocks
      const [statsRes, productsRes] = await Promise.all([
        axiosClient.get("/admin/stats"),
        axiosClient.get("/admin/products"),
      ]);
      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (productsRes.data?.products) setProducts(productsRes.data.products);
    } catch (err) {
      console.error("Update order status error:", err);
      showToast(err.message || "Failed to update order status.", "error");
    } finally {
      setStatusUpdateLoadingId(null);
    }
  };

  // ==========================================
  // COUPON HANDLERS
  // ==========================================
  const handleToggleCouponActive = async (coupon) => {
    const nextState = !coupon.is_active;
    try {
      await axiosClient.patch(`/admin/coupons/${coupon.id}`, {
        is_active: nextState,
      });
      showToast(
        `Coupon "${coupon.code}" is now ${nextState ? "ACTIVE" : "PAUSED"}.`
      );
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: nextState } : c))
      );
    } catch (err) {
      console.error("Toggle coupon error:", err);
      showToast(err.message || "Failed to toggle coupon status.", "error");
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) {
      return;
    }
    try {
      const res = await axiosClient.delete(`/admin/coupons/${coupon.id}`);
      showToast(res.data?.message || "Coupon deleted.");
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    } catch (err) {
      console.error("Delete coupon error:", err);
      showToast(err.message || "Failed to delete coupon.", "error");
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponFormData.code.trim()) {
      showToast("Coupon promo code is required.", "error");
      return;
    }
    if (!couponFormData.discount_value || Number(couponFormData.discount_value) <= 0) {
      showToast("Please enter a valid discount value.", "error");
      return;
    }
    if (!couponFormData.expiry_date) {
      showToast("Please select an expiration date.", "error");
      return;
    }

    setCouponFormSubmitting(true);
    try {
      const payload = {
        code: couponFormData.code.trim().toUpperCase(),
        discount_type: couponFormData.discount_type,
        discount_value: Number(couponFormData.discount_value),
        min_order_amount: Number(couponFormData.min_order_amount) || 0,
        max_discount: couponFormData.max_discount
          ? Number(couponFormData.max_discount)
          : null,
        usage_limit: couponFormData.usage_limit
          ? parseInt(couponFormData.usage_limit, 10)
          : 1000,
        expiry_date: couponFormData.expiry_date,
        badge: couponFormData.badge.trim() || "PROMO",
        description: couponFormData.description.trim(),
      };

      const res = await axiosClient.post("/admin/coupons", payload);
      showToast(res.data?.message || `Coupon "${payload.code}" created!`);
      setIsCouponModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error("Create coupon error:", err);
      showToast(err.message || "Failed to create coupon.", "error");
    } finally {
      setCouponFormSubmitting(false);
    }
  };

  // ==========================================
  // FILTERED DATA MEMOS
  // ==========================================
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesCat =
        productCategoryFilter === "All" || p.category === productCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, productCategoryFilter]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus =
        orderStatusFilter === "All" || o.status === orderStatusFilter;
      const query = orderSearch.toLowerCase();
      const matchesQuery =
        String(o.id).includes(query) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
        (o.phone && o.phone.includes(query)) ||
        (o.email && o.email.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Loading Screen
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
          <span>Suffex Admin Core</span>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Loading system telemetry and inventory records...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-24 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border text-xs font-semibold flex items-center gap-3 transition-all animate-bounce max-w-md ${
            toast.type === "error"
              ? "bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-950/50"
              : "bg-[#070b14]/95 text-cyan-200 border-cyan-500/50 shadow-cyan-950/50"
          }`}
        >
          {toast.type === "error" ? (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Ambient Light Glow */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-cyan-600/10 via-indigo-600/5 to-transparent blur-3xl" />

      {/* Admin Dashboard Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header HUD Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0f1d]/90 backdrop-blur-2xl p-6 rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/50">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Control Engine
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">
                Admin: <strong className="text-white">{user?.name || "Administrator"}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1.5 font-['Outfit']">
              Suffex Store{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                Admin Dashboard
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Real-time enterprise metrics, inventory management, order execution & campaigns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/20 transition cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Storefront</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Analytics", icon: LayoutDashboard },
            { id: "products", label: "Products Catalog", icon: Package, badge: products.length },
            { id: "orders", label: "Customer Orders", icon: ShoppingCart, badge: orders.length },
            { id: "coupons", label: "Coupons & Promos", icon: Tag, badge: coupons.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-950/30"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? "bg-cyan-500 text-black"
                        : "bg-white/[0.08] text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & BENTO GRID KPI ANALYTICS                 */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Bento Grid 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Total Revenue */}
              <div className="relative group bg-[#0a0f1d]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/[0.08] hover:border-emerald-500/40 transition duration-300 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Total Revenue
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
                    ৳{(stats?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Non-cancelled confirmed orders</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Orders */}
              <div className="relative group bg-[#0a0f1d]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/[0.08] hover:border-cyan-500/40 transition duration-300 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Total Orders
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
                    {stats?.totalOrders || 0}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Active in-flight & delivered</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Active Products */}
              <div className="relative group bg-[#0a0f1d]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/[0.08] hover:border-blue-500/40 transition duration-300 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Catalog Products
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                    <Boxes className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
                    {stats?.totalProducts || 0}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-400 font-medium">
                    <Package className="w-3.5 h-3.5" />
                    <span>Across all active categories</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Low Stock Alerts */}
              <div
                className={`relative group bg-[#0a0f1d]/90 backdrop-blur-xl p-6 rounded-3xl border transition duration-300 shadow-xl overflow-hidden ${
                  (stats?.lowStockCount || 0) > 0
                    ? "border-amber-500/50 bg-amber-950/10"
                    : "border-white/[0.08]"
                }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Low Stock Alerts
                  </span>
                  <div
                    className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-inner ${
                      (stats?.lowStockCount || 0) > 0
                        ? "bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse"
                        : "bg-white/[0.05] border-white/10 text-slate-400"
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-white font-['Outfit'] tracking-tight flex items-center gap-2">
                    {stats?.lowStockCount || 0}
                    {(stats?.lowStockCount || 0) > 0 && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Action Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400 font-medium">
                    <span>Products with stock &le; 5 units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Warning Banner if any */}
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-500/40 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Critical Inventory Warning
                      </h3>
                      <p className="text-xs text-amber-300/80">
                        The following items are running out of stock. Consider restocking promptly.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("products")}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Manage Inventory &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stats.lowStockProducts.map((lp) => (
                    <div
                      key={lp.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#090e1c] border border-amber-500/30 text-xs"
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold text-white truncate">{lp.title}</p>
                        <p className="text-slate-400 text-[11px]">{lp.category}</p>
                      </div>
                      <div className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                        Stock: {lp.stock}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders Overview Table */}
            <div className="bg-[#0a0f1d]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-white font-['Outfit']">
                    Recent Customer Orders
                  </h2>
                  <p className="text-xs text-slate-400">
                    Latest 5 transactions recorded across the storefront.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                >
                  <span>View All Orders</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pl-2">Order ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Items</th>
                      <th className="pb-3">Total Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(stats?.recentOrders || []).map((ord) => {
                      const stStyle = STATUS_STYLES[ord.status] || STATUS_STYLES.Pending;
                      return (
                        <tr key={ord.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 pl-2 font-mono font-bold text-cyan-400">
                            #{ord.id}
                          </td>
                          <td className="py-3.5">
                            <div className="font-semibold text-white">{ord.customer_name}</div>
                            <div className="text-[11px] text-slate-400">{ord.phone}</div>
                          </td>
                          <td className="py-3.5 text-slate-300">
                            {Array.isArray(ord.items) ? ord.items.length : 1} item(s)
                          </td>
                          <td className="py-3.5 font-bold text-white font-mono">
                            ৳{Number(ord.total_amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${stStyle.bg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${stStyle.dot}`} />
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 text-right pr-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderDetails(ord);
                                setActiveTab("orders");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-cyan-400 text-xs font-semibold border border-white/10 transition cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PRODUCTS CATALOG & JSONB ATTRIBUTES BUILDER        */}
        {/* ========================================================= */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Products Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0a0f1d]/90 backdrop-blur-xl p-5 rounded-3xl border border-white/[0.08]">
              
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by title or category..."
                    className="w-full bg-[#050811] text-white text-xs rounded-2xl pl-10 pr-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none transition"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="bg-[#050811] text-slate-300 text-xs rounded-2xl px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Product Button */}
              <button
                type="button"
                onClick={openAddProductModal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/25 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-[#0a0f1d]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-6 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pl-2">Product</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Stock</th>
                      <th className="pb-3">Specs (JSONB)</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredProducts.map((p) => {
                      const isLowStock = p.stock <= 5;
                      const hasAttrs =
                        p.attributes &&
                        typeof p.attributes === "object" &&
                        Object.keys(p.attributes).length > 0;

                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100"}
                                alt={p.title}
                                className="w-12 h-12 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0"
                              />
                              <div className="max-w-xs">
                                <p className="font-bold text-white leading-tight">{p.title}</p>
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {p.description || "No description provided."}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-slate-300 font-medium">
                            <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-white font-mono text-sm">
                            ৳{Number(p.price || 0).toLocaleString()}
                          </td>
                          <td className="py-4 font-mono">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                p.stock === 0
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  : isLowStock
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              }`}
                            >
                              {p.stock} units
                            </span>
                          </td>
                          <td className="py-4 max-w-xs">
                            {hasAttrs ? (
                              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                                {Object.entries(p.attributes).slice(0, 3).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 rounded-md bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono"
                                  >
                                    <strong>{k}:</strong> {String(v)}
                                  </span>
                                ))}
                                {Object.keys(p.attributes).length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    +{Object.keys(p.attributes).length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">
                                Standard specs
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                                p.is_active !== false
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                              }`}
                            >
                              {p.is_active !== false ? "Active" : "Archived"}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditProductModal(p)}
                                className="p-2 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 transition cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                className="p-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 transition cursor-pointer"
                                title="Delete / Soft-Deactivate Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CUSTOMER ORDERS MANAGEMENT & ACID STATUS LIFECYCLE */}
        {/* ========================================================= */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Orders Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0a0f1d]/90 backdrop-blur-xl p-5 rounded-3xl border border-white/[0.08]">
              
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {["All", ...ORDER_STATUS_OPTIONS].map((st) => {
                  const isSel = orderStatusFilter === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                        isSel
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950/40"
                          : "text-slate-400 hover:text-white bg-white/[0.04]"
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              {/* Order Search */}
              <div className="relative max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by ID, name, phone..."
                  className="w-full bg-[#050811] text-white text-xs rounded-2xl pl-10 pr-4 py-2 border border-white/10 focus:border-cyan-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Orders List Table */}
            <div className="bg-[#0a0f1d]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-6 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pl-2">Order</th>
                      <th className="pb-3">Customer Info</th>
                      <th className="pb-3">Delivery Address</th>
                      <th className="pb-3">Items Purchased</th>
                      <th className="pb-3">Total (BDT)</th>
                      <th className="pb-3">Live Status Dropdown</th>
                      <th className="pb-3 text-right pr-2">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredOrders.map((ord) => {
                      const stStyle = STATUS_STYLES[ord.status] || STATUS_STYLES.Pending;
                      const isUpdating = statusUpdateLoadingId === ord.id;
                      const parsedItems = Array.isArray(ord.items)
                        ? ord.items
                        : typeof ord.items === "string"
                        ? JSON.parse(ord.items || "[]")
                        : [];

                      return (
                        <tr key={ord.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-4 pl-2 font-mono font-bold text-cyan-400">
                            <div>#{ord.id}</div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              {new Date(ord.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="font-bold text-white">{ord.customer_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{ord.phone}</div>
                            {ord.email && (
                              <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                {ord.email}
                              </div>
                            )}
                          </td>
                          <td className="py-4 max-w-xs text-slate-300">
                            <p className="line-clamp-2 text-[11px]">
                              {ord.delivery_address || "No address specified."}
                            </p>
                            <span className="text-[10px] text-slate-500 uppercase font-mono">
                              Pay: {ord.payment_method || "COD"}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="space-y-1">
                              {parsedItems.slice(0, 2).map((it, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] text-slate-300 flex items-center gap-1.5"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                  <span className="font-medium truncate max-w-[130px]">
                                    {it.title || it.name || "Item"}
                                  </span>
                                  <span className="text-slate-500 font-mono">
                                    &times; {it.quantity || 1}
                                  </span>
                                </div>
                              ))}
                              {parsedItems.length > 2 && (
                                <span className="text-[10px] text-slate-500 italic block">
                                  +{parsedItems.length - 2} more items
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 font-mono">
                            <div className="font-bold text-white text-sm">
                              ৳{Number(ord.total_amount || 0).toLocaleString()}
                            </div>
                            {Number(ord.coupon_discount) > 0 && (
                              <div className="text-[10px] text-emerald-400">
                                Coupon: -৳{Number(ord.coupon_discount).toLocaleString()}
                              </div>
                            )}
                          </td>
                          
                          {/* Live Status Dropdown with ACID Inventory Restoration */}
                          <td className="py-4">
                            <div className="relative inline-block">
                              <select
                                value={ord.status}
                                disabled={isUpdating}
                                onChange={(e) =>
                                  handleOrderStatusChange(ord.id, e.target.value)
                                }
                                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border appearance-none pr-8 cursor-pointer transition focus:outline-none ${
                                  stStyle.bg
                                } ${isUpdating ? "opacity-50" : ""}`}
                              >
                                {ORDER_STATUS_OPTIONS.map((opt) => (
                                  <option
                                    key={opt}
                                    value={opt}
                                    className="bg-[#090e1c] text-white font-sans py-1"
                                  >
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-current rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                              )}
                            </div>
                          </td>

                          <td className="py-4 text-right pr-2">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-cyan-400 text-xs font-semibold border border-white/10 transition cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: COUPONS & PROMOTIONAL CAMPAIGNS                    */}
        {/* ========================================================= */}
        {activeTab === "coupons" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Coupons Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0a0f1d]/90 backdrop-blur-xl p-5 rounded-3xl border border-white/[0.08]">
              <div>
                <h2 className="text-base font-bold text-white font-['Outfit']">
                  Promotional Coupons & Campaigns
                </h2>
                <p className="text-xs text-slate-400">
                  Configure discount promo codes, usage limits, and active storefront states.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCouponModalOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/25 transition cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-[#0a0f1d]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-6 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pl-2">Promo Code</th>
                      <th className="pb-3">Type & Value</th>
                      <th className="pb-3">Min Order</th>
                      <th className="pb-3">Usage Progress</th>
                      <th className="pb-3">Expiration</th>
                      <th className="pb-3">Live Status</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {coupons.map((c) => {
                      const isExpired = new Date(c.expiry_date) < new Date();
                      return (
                        <tr key={c.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-4 pl-2 font-mono font-bold">
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 text-sm">{c.code}</span>
                              {c.badge && (
                                <span className="text-[9px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                  {c.badge}
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                                {c.description}
                              </p>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="text-white font-bold font-mono">
                              {c.discount_type === "percentage"
                                ? `${c.discount_value}% OFF`
                                : `৳${c.discount_value.toLocaleString()} FLAT OFF`}
                            </span>
                            {c.max_discount && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Max ৳{c.max_discount.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-slate-300 font-mono">
                            ৳{(c.min_order_amount || 0).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <div className="space-y-1 max-w-[130px]">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Used: {c.used_count || 0}</span>
                                <span>Limit: {c.usage_limit || "∞"}</span>
                              </div>
                              <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-cyan-400 h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ((c.used_count || 0) / (c.usage_limit || 100)) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 font-mono text-[11px]">
                            <span
                              className={
                                isExpired ? "text-rose-400 font-bold" : "text-slate-300"
                              }
                            >
                              {new Date(c.expiry_date).toLocaleDateString()}
                            </span>
                            {isExpired && (
                              <span className="text-[9px] block text-rose-400 font-sans font-bold">
                                Expired
                              </span>
                            )}
                          </td>
                          
                          {/* Active Toggle Switch */}
                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() => handleToggleCouponActive(c)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                c.is_active ? "bg-cyan-500" : "bg-white/[0.1]"
                              }`}
                              title={c.is_active ? "Click to deactivate" : "Click to activate"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  c.is_active ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </td>

                          <td className="py-4 text-right pr-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(c)}
                              className="p-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT WITH DYNAMIC JSONB BUILDER      */}
      {/* ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#090e1c] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white font-['Outfit']">
                  {editingProduct ? "Edit Product Details" : "Add New Storefront Product"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure pricing, inventory, and dynamic JSONB specifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productFormData.title}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, title: e.target.value })
                    }
                    placeholder="e.g. Apple iPhone 15 Pro Max 256GB"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category *</label>
                  <input
                    type="text"
                    required
                    value={productFormData.category}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, category: e.target.value })
                    }
                    placeholder="e.g. Smartphones, Laptops, Audio"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Price (BDT ৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productFormData.price}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, price: e.target.value })
                    }
                    placeholder="e.g. 159999"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Inventory Stock *</label>
                  <input
                    type="number"
                    required
                    value={productFormData.stock}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, stock: e.target.value })
                    }
                    placeholder="e.g. 25"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Image URL</label>
                  <input
                    type="url"
                    value={productFormData.image_url}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, image_url: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <textarea
                    rows={3}
                    value={productFormData.description}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, description: e.target.value })
                    }
                    placeholder="Key highlights and product overview..."
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* DYNAMIC JSONB ATTRIBUTES BUILDER */}
              <div className="bg-[#050811] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Dynamic Specifications (JSONB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAttributeRow}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold border border-cyan-500/30 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {productFormData.attributesList.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) => handleAttributeChange(idx, "key", e.target.value)}
                        placeholder="Spec Key (e.g. RAM, GPU)"
                        className="flex-1 bg-[#090e1c] text-white text-xs rounded-xl px-3 py-2 border border-white/10 focus:border-cyan-500 focus:outline-none font-mono"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => handleAttributeChange(idx, "value", e.target.value)}
                        placeholder="Value (e.g. 16GB, RTX 4080)"
                        className="flex-1 bg-[#090e1c] text-white text-xs rounded-xl px-3 py-2 border border-white/10 focus:border-cyan-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttributeRow(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productFormSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/25 transition cursor-pointer disabled:opacity-50"
                >
                  {productFormSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingProduct ? "Save Changes" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE DISCOUNT COUPON                             */}
      {/* ========================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#090e1c] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white font-['Outfit']">
                  Create Promotional Coupon
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Launch a new discount campaign for customers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Coupon Code */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={couponFormData.code}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. FLASH50"
                    className="w-full bg-[#050811] text-cyan-400 font-mono font-bold text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none uppercase tracking-wider"
                  />
                </div>

                {/* Discount Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Discount Type *</label>
                  <select
                    value={couponFormData.discount_type}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        discount_type: e.target.value,
                      })
                    }
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-3 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (৳)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Discount Value {couponFormData.discount_type === "percentage" ? "(%)" : "(৳)"} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={couponFormData.discount_value}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        discount_value: e.target.value,
                      })
                    }
                    placeholder="e.g. 20"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Min Order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Min Order (৳)</label>
                  <input
                    type="number"
                    value={couponFormData.min_order_amount}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        min_order_amount: e.target.value,
                      })
                    }
                    placeholder="e.g. 1000"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Max Discount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Max Cap (৳)</label>
                  <input
                    type="number"
                    value={couponFormData.max_discount}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        max_discount: e.target.value,
                      })
                    }
                    placeholder="e.g. 5000"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Usage Limit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Usage Limit</label>
                  <input
                    type="number"
                    value={couponFormData.usage_limit}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        usage_limit: e.target.value,
                      })
                    }
                    placeholder="e.g. 1000"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={couponFormData.expiry_date}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        expiry_date: e.target.value,
                      })
                    }
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Badge text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Badge Label</label>
                  <input
                    type="text"
                    value={couponFormData.badge}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        badge: e.target.value,
                      })
                    }
                    placeholder="HOT, PROMO, SUMMER"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none uppercase"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <input
                    type="text"
                    value={couponFormData.description}
                    onChange={(e) =>
                      setCouponFormData({
                        ...couponFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="e.g. 20% OFF on all flagship smartphones"
                    className="w-full bg-[#050811] text-white text-xs rounded-xl px-4 py-2.5 border border-white/10 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={couponFormSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/25 transition cursor-pointer disabled:opacity-50"
                >
                  {couponFormSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ORDER DETAILS INSPECTOR DRAWER                     */}
      {/* ========================================================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#090e1c] border border-white/10 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-white font-mono">
                    Order #{selectedOrderDetails.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      (STATUS_STYLES[selectedOrderDetails.status] || STATUS_STYLES.Pending).bg
                    }`}
                  >
                    {selectedOrderDetails.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed on {new Date(selectedOrderDetails.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-[#050811] p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-bold text-white">{selectedOrderDetails.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-cyan-400">{selectedOrderDetails.phone}</span>
              </div>
              {selectedOrderDetails.email && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-200">{selectedOrderDetails.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Payment:</span>
                <span className="uppercase font-mono text-slate-300">
                  {selectedOrderDetails.payment_method || "Cash On Delivery"}
                </span>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-slate-400 block mb-1">Delivery Address:</span>
                <span className="text-white leading-relaxed">
                  {selectedOrderDetails.delivery_address}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Order Items
              </h4>
              <div className="space-y-2">
                {(Array.isArray(selectedOrderDetails.items)
                  ? selectedOrderDetails.items
                  : JSON.parse(selectedOrderDetails.items || "[]")
                ).map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#050811] border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={it.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100"}
                        alt={it.title || it.name}
                        className="w-10 h-10 rounded-lg object-cover bg-black/50 border border-white/10"
                      />
                      <div>
                        <p className="font-semibold text-white">{it.title || it.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          ৳{Number(it.price || 0).toLocaleString()} &times; {it.quantity || 1}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-white font-mono">
                      ৳{(Number(it.price || 0) * (it.quantity || 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#050811] p-4 rounded-2xl border border-white/10 space-y-2 text-xs font-mono">
              {Number(selectedOrderDetails.coupon_discount) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount:</span>
                  <span>-৳{Number(selectedOrderDetails.coupon_discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/[0.08]">
                <span>Total Amount:</span>
                <span className="text-cyan-400">
                  ৳{Number(selectedOrderDetails.total_amount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-6 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
