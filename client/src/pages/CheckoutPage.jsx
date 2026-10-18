import useDocumentTitle from "../hooks/useDocumentTitle";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import useApiCall from "../hooks/useApiCall";
import { availableCoupons, validateAndCalculateCoupon, validateCouponOnline } from "../data/couponsData";
import { CheckCircle2, ArrowRight, Printer, ShoppingBag } from "lucide-react";

export default function CheckoutPage({
  cart: propCart,
  onRemoveFromCart: propRemoveFromCart,
  onClearCart: propClearCart,
  onNavigate,
  onShowToast: propShowToast,
  appliedCoupon: propAppliedCoupon,
  onApplyCoupon: propApplyCoupon,
  onRemoveCoupon: propRemoveCoupon,
}) {
  useDocumentTitle("Checkout");

  const navigate = useNavigate();
  const cartContext = useCart();
  const { user } = useAuth();

  const cart = propCart !== undefined ? propCart : cartContext.cart;
  const onRemoveFromCart = propRemoveFromCart || cartContext.removeFromCart;
  const onClearCart = propClearCart || cartContext.clearCart;
  const appliedCoupon = propAppliedCoupon !== undefined ? propAppliedCoupon : cartContext.appliedCoupon;
  const onApplyCoupon = propApplyCoupon || cartContext.applyCoupon;
  const onRemoveCoupon = propRemoveCoupon || cartContext.removeCoupon;
  const onShowToast = propShowToast || cartContext.showToast;

  const handleNavigation = (dest) => {
    if (onNavigate) {
      onNavigate(dest);
    } else {
      if (dest === "orders" || dest === "/my-orders") navigate("/my-orders");
      else if (dest === "products" || dest === "/products") navigate("/products");
      else if (dest === "home" || dest === "/") navigate("/");
      else navigate("/" + dest);
    }
  };
  // Order submission API call hook
  const orderApi = useApiCall();

  // All store products are physical items requiring address
  const hasPhysicalProducts = true;

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    division: "Dhaka",
    orderNotes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Auto-fill logged-in customer credentials
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  // Payment method selection: "bkash" | "nagad" | "card" | "cod"
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [paymentDetails, setPaymentDetails] = useState({
    senderNumber: "",
    trxId: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);

  // Completed order invoice state
  const [orderPlaced, setOrderPlaced] = useState(null);

  // Fallback image helper to prevent broken images
  const getItemImage = (item) => {
    if (item?.directImage && typeof item.directImage === "string" && item.directImage.startsWith("http")) {
      return item.directImage;
    }
    if (
      item?.image &&
      typeof item.image === "string" &&
      item.image.startsWith("http") &&
      !item.image.includes("PASTE_YOUR")
    ) {
      return item.image;
    }
    if (item?.thumbnail && typeof item.thumbnail === "string" && item.thumbnail.startsWith("http")) {
      return item.thumbnail;
    }
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop";
  };

  // Cart financial calculations
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalOriginal = cart.reduce(
    (sum, item) => sum + (Number(item.originalPrice) || Number(item.price) || 0),
    0
  );
  const originalSavings = totalOriginal > subtotal ? totalOriginal - subtotal : 0;

  // Free Express shipping for orders of ৳2,500 or more
  const shippingFee = subtotal >= 2500 ? 0 : 80;

  // Coupon discount calculation using centralized validation engine
  let couponDiscount = 0;
  if (appliedCoupon) {
    const calc = validateAndCalculateCoupon(appliedCoupon.code, subtotal);
    if (calc.isValid) {
      couponDiscount = calc.discount;
    }
  }

  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Payment details input change handler
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Apply promo coupon
  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    setCouponError("");
    const cleanedCode = couponInput.trim();

    if (!cleanedCode) {
      setCouponError("Please enter a valid coupon code.");
      return;
    }

    const result = await validateCouponOnline(cleanedCode, subtotal);
    if (result.isValid && onApplyCoupon) {
      onApplyCoupon(result.coupon);
      setCouponInput("");
      setCouponError("");
      if (onShowToast) onShowToast(result.message);
    } else {
      setCouponError(result.message);
    }
  };

  // Quick apply from list
  const handleQuickCoupon = async (code) => {
    const result = await validateCouponOnline(code, subtotal);
    if (result.isValid && onApplyCoupon) {
      onApplyCoupon(result.coupon);
      setCouponError("");
      if (onShowToast) onShowToast(`Applied ${code}: ${result.message}`);
    } else {
      setCouponError(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    if (onRemoveCoupon) onRemoveCoupon();
    setCouponError("");
    if (onShowToast) onShowToast("Coupon removed.");
  };

  // Form validation before order placement
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required.";
    if (!formData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^01[3-9]\d{8}$/.test(formData.phone.replace(/[\s-]/g, ""))) {
      errors.phone = "Enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).";
    }

    if (hasPhysicalProducts && !formData.address.trim()) {
      errors.address = "Delivery address is required for nationwide delivery.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle order submission using production useApiCall hook
  // Handle order submission using custom Express & PostgreSQL API
  const handleSubmitOrder = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      if (onShowToast) onShowToast("Please fill in all required customer details.");
      return;
    }

    // Auto-generate TrxID if Cash on Delivery
    const generatedTrxId =
      paymentMethod === "cod"
        ? `COD-${Math.floor(100000 + Math.random() * 900000)}`
        : paymentDetails.trxId || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Construct order payload matching PostgreSQL schema & Express API
    const orderPayload = {
      customer_name: formData.fullName,
      customer_phone: formData.phone,
      customer_email: formData.email,
      delivery_address: formData.address,
      district: formData.division,
      payment_method: paymentMethod,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      coupon_discount: Number(couponDiscount) || 0,
      items: cart.map((i) => ({
        id: i.id,
        title: i.title,
        price: Number(i.price),
        quantity: Number(i.quantity) || 1,
        image: getItemImage(i),
      })),
      total_amount: grandTotal,
    };

    // Send POST request to backend orders endpoint
    orderApi.apiFetcher({
      options: {
        method: "POST",
        url: "/orders", // Relative to axiosClient baseURL http://localhost:5000/api
        data: orderPayload,
      },
      callback: (response) => {
        // Extract real database order ID from server response
        const serverOrder = response?.order || response?.data?.order;
        const realOrderId = serverOrder?.id ? `SFX-${serverOrder.id}` : `SFX-${Math.floor(100000 + Math.random() * 900000)}`;

        // Generate customer invoice data
        const invoiceData = {
          orderId: realOrderId,
          orderDate: new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          customer: { ...formData },
          items: [...cart],
          paymentMethod,
          trxId: generatedTrxId,
          subtotal,
          couponDiscount,
          shippingFee,
          grandTotal,
        };

        setOrderPlaced(invoiceData);

        // Save order to localStorage for customer order tracking
        try {
          const prevOrders = JSON.parse(localStorage.getItem("orderHistory") || "[]");
          localStorage.setItem("orderHistory", JSON.stringify([invoiceData, ...prevOrders]));
        } catch (err) {
          console.warn("Could not save to localStorage:", err);
        }

        if (onClearCart) onClearCart();
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (onShowToast) onShowToast("Order confirmed & saved to database successfully!");
      },
    });
  };

  // 1. RENDER: If Order has been placed successfully -> Show Receipt / Invoice Screen
  if (orderPlaced) {
    return (
      <div className="w-full min-h-screen bg-[#030712] text-slate-200 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success Banner */}
          <div className="text-center space-y-3 bg-gradient-to-b from-[#0a1226] to-[#050914] p-8 rounded-3xl border border-emerald-500/30 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Order Confirmed &amp; Placed!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Thank you, <span className="text-white font-semibold">{orderPlaced.customer.fullName}</span>! Your store order has been received and is being prepared for fast delivery.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono font-semibold">
              <span>Order Reference: {orderPlaced.orderId}</span>
            </div>
          </div>

          {/* Printable Invoice Card */}
          <div className="bg-[#070b14] rounded-3xl border border-cyan-500/20 p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/[0.08]">
              <div>
                <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider font-mono">Official Invoice</span>
                <h2 className="text-xl font-bold text-white font-['Outfit']">Suffex Store BD</h2>
                <p className="text-xs text-slate-400 mt-0.5">Order Date: {orderPlaced.orderDate}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 block">Payment Method</span>
                <span className="text-sm font-semibold text-white uppercase">{orderPlaced.paymentMethod}</span>
                <span className="text-[11px] font-mono text-cyan-400/90 block">TrxID: {orderPlaced.trxId}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#030712] border border-white/[0.06] text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Billed To:</span>
                <span className="font-semibold text-white text-sm block">{orderPlaced.customer.fullName}</span>
                <span className="text-slate-300 block">{orderPlaced.customer.email}</span>
                <span className="text-slate-300 block">{orderPlaced.customer.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Delivery / Region:</span>
                <span className="text-slate-300 block">{orderPlaced.customer.division} Division, Bangladesh</span>
                {orderPlaced.customer.address && (
                  <span className="text-slate-400 block mt-0.5">{orderPlaced.customer.address}</span>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-['Outfit']">Purchased Items</h3>
              <div className="divide-y divide-white/[0.06] border-y border-white/[0.08]">
                {orderPlaced.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#030712] overflow-hidden shrink-0 border border-white/10 flex items-center justify-center p-1">
                        <img
                          src={getItemImage(item)}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{item.title}</span>
                        <span className="text-[11px] text-cyan-400 font-mono">
                          {item.category ? item.category.toUpperCase() : "STORE ITEM"}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-white">
                      ৳{Number(item.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Financial Summary */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-white">৳{orderPlaced.subtotal.toLocaleString()}</span>
              </div>
              {orderPlaced.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Special Promo Discount</span>
                  <span className="font-mono">-৳{orderPlaced.couponDiscount.toLocaleString()}</span>
                </div>
              )}
              {orderPlaced.shippingFee > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Standard Shipping</span>
                  <span className="font-mono text-white">৳{orderPlaced.shippingFee}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm sm:text-base font-bold text-white pt-3 border-t border-white/[0.08]">
                <span>Grand Total Paid</span>
                <span className="font-mono text-xl text-cyan-400">৳{orderPlaced.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleNavigation("orders")}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-500/25"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Go to My Orders &amp; Tracking</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigation("products")}
                className="py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <span>Shop More</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. RENDER: If Cart is empty -> Prompt user to add products
  if (cart.length === 0) {
    return (
      <div className="w-full min-h-[70vh] bg-[#030712] flex items-center justify-center py-16 px-4 font-sans text-center">
        <div className="max-w-md w-full bg-[#070b14] p-8 rounded-3xl border border-white/[0.08] shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Outfit']">Your Cart is Currently Empty</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please select at least one product from our store to proceed to the checkout page.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => handleNavigation("products")}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 text-white text-xs font-semibold cursor-pointer transition shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. RENDER: Standard 2-Column Checkout Form
  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-200 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Checkout Header Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#080e1e] via-[#050914] to-[#080e1e] p-6 sm:p-8 border border-white/[0.08] shadow-xl overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Secure SSL 256-Bit Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">Checkout</span> &amp; Delivery
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Provide your delivery address and confirm your payment method below.
            </p>
          </div>
        </div>

        {/* Form & Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Billing Info & Payment Selection */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Customer & Delivery Information */}
              <div className="bg-[#070b14] p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-lg space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                    1
                  </div>
                  <h2 className="text-base font-bold text-white font-['Outfit']">
                    Customer &amp; Delivery Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Ashik Siddike"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#030712] border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition ${formErrors.fullName ? "border-rose-500" : "border-white/10 focus:border-cyan-500"
                        }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-[11px] text-rose-400 mt-0.5">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="shopper@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#030712] border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition ${formErrors.email ? "border-rose-500" : "border-white/10 focus:border-cyan-500"
                        }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-rose-400 mt-0.5">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Phone Number (WhatsApp) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="017XXXXXXXX"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#030712] border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition ${formErrors.phone ? "border-rose-500" : "border-white/10 focus:border-cyan-500"
                        }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-rose-400 mt-0.5">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Division */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Division</label>
                    <select
                      name="division"
                      value={formData.division}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#030712] border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Barisal">Barisal</option>
                      <option value="Rangpur">Rangpur</option>
                      <option value="Mymensingh">Mymensingh</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Delivery Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Road / House / Area details"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#030712] border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition ${formErrors.address ? "border-rose-500" : "border-white/10 focus:border-cyan-500"
                        }`}
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-rose-400 mt-0.5">{formErrors.address}</p>
                    )}
                  </div>

                  {/* Order notes */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-300">Order Notes (Optional)</label>
                    <textarea
                      name="orderNotes"
                      rows="2"
                      value={formData.orderNotes}
                      onChange={handleInputChange}
                      placeholder="Special delivery instructions or landmark..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#030712] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="bg-[#070b14] p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-lg space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                    2
                  </div>
                  <h2 className="text-base font-bold text-white font-['Outfit']">
                    Select Payment Method
                  </h2>
                </div>

                {/* Radio selection options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* bKash */}
                  <div
                    onClick={() => setPaymentMethod("bkash")}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${paymentMethod === "bkash"
                        ? "bg-[#e2136e]/15 border-[#e2136e] shadow-lg shadow-[#e2136e]/15"
                        : "bg-[#030712] border-white/10 hover:border-white/20"
                      }`}
                  >
                    <span className="font-bold text-sm text-[#e2136e]">bKash</span>
                    <span className="text-[10px] text-slate-400">Mobile Banking</span>
                  </div>

                  {/* Nagad */}
                  <div
                    onClick={() => setPaymentMethod("nagad")}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${paymentMethod === "nagad"
                        ? "bg-[#f7941d]/15 border-[#f7941d] shadow-lg shadow-[#f7941d]/15"
                        : "bg-[#030712] border-white/10 hover:border-white/20"
                      }`}
                  >
                    <span className="font-bold text-sm text-[#f7941d]">Nagad</span>
                    <span className="text-[10px] text-slate-400">Fast &amp; Secure</span>
                  </div>

                  {/* Credit / Debit Card */}
                  <div
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${paymentMethod === "card"
                        ? "bg-cyan-500/15 border-cyan-500 shadow-lg shadow-cyan-500/15"
                        : "bg-[#030712] border-white/10 hover:border-white/20"
                      }`}
                  >
                    <span className="font-bold text-sm text-cyan-400">Card</span>
                    <span className="text-[10px] text-slate-400">Visa / Mastercard</span>
                  </div>

                  {/* Cash On Delivery / In-Person */}
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${paymentMethod === "cod"
                        ? "bg-emerald-500/15 border-emerald-500 shadow-lg shadow-emerald-500/15"
                        : "bg-[#030712] border-white/10 hover:border-white/20"
                      }`}
                  >
                    <span className="font-bold text-sm text-emerald-400">Cash On Delivery</span>
                    <span className="text-[10px] text-slate-400">Pay on Hand</span>
                  </div>
                </div>

                {/* Sub-form based on selected payment method */}
                {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                  <div className="p-4 rounded-2xl bg-[#030712] border border-white/10 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Merchant / Send-Money No:</span>
                      <span className="font-mono font-bold text-white">01712-345678 (Personal)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Please send <strong className="text-white">৳{grandTotal.toLocaleString()}</strong> to the above {paymentMethod.toUpperCase()} number and enter your Transaction ID below:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Your Sender Mobile No.</label>
                        <input
                          type="text"
                          name="senderNumber"
                          value={paymentDetails.senderNumber}
                          onChange={handlePaymentChange}
                          placeholder="e.g. 018XXXXXXXX"
                          className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Transaction ID (TrxID)</label>
                        <input
                          type="text"
                          name="trxId"
                          value={paymentDetails.trxId}
                          onChange={handlePaymentChange}
                          placeholder="e.g. 9J4K2L8A"
                          className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="p-4 rounded-2xl bg-[#030712] border border-white/10 space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentDetails.cardNumber}
                        onChange={handlePaymentChange}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400">Expiry Date</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          value={paymentDetails.cardExpiry}
                          onChange={handlePaymentChange}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400">CVC / CVV</label>
                        <input
                          type="text"
                          name="cardCvc"
                          value={paymentDetails.cardCvc}
                          onChange={handlePaymentChange}
                          placeholder="123"
                          className="w-full px-3 py-2 rounded-xl bg-[#070b14] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "cod" && (
                  <div className="p-4 rounded-2xl bg-[#030712] border border-white/10 text-xs text-slate-300 leading-relaxed">
                    You can pay <strong className="text-white">৳{grandTotal.toLocaleString()}</strong> in cash directly to the courier delivery agent upon receiving your packaged parcel.
                  </div>
                )}

                {/* API Error alert if any */}
                {orderApi.isError && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                    {orderApi.isError}
                  </div>
                )}

                {/* Submit button inside form */}
                <button
                  type="submit"
                  disabled={orderApi.isLoading}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 shadow-xl shadow-cyan-500/25 transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {orderApi.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Placing Store Order via API...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Order &amp; Pay</span>
                      <span>(৳{grandTotal.toLocaleString()})</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column (5 cols): Order Summary & Interactive Coupon */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#070b14] p-6 rounded-3xl border border-white/[0.08] shadow-lg space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="text-base font-bold text-white font-['Outfit']">Order Summary</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {cart.length} {cart.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Items in Cart */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#030712] border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#070b14] overflow-hidden shrink-0 border border-white/10 flex items-center justify-center p-1">
                        <img
                          src={getItemImage(item)}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white truncate text-xs">{item.title}</h4>
                        <span className="text-[11px] text-cyan-400 font-mono">
                          {item.category ? item.category.toUpperCase() : "STORE ITEM"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-white text-xs">
                        ৳{Number(item.price).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-400 transition cursor-pointer text-xs p-1"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="pt-2 border-t border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Have a Promo Coupon?
                  </label>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer transition"
                      title="Clear applied coupon"
                    >
                      <span>✕ Clear Coupon</span>
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs shadow-inner">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                        <span className="text-emerald-300 font-bold font-mono text-sm tracking-wide">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                          -৳{couponDiscount.toLocaleString()} Saved
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 pl-7 leading-relaxed">
                        {appliedCoupon.description || appliedCoupon.desc || "Promo discount applied"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 hover:text-rose-200 text-[11px] font-semibold cursor-pointer transition shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter Code (e.g. SAVE500)"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-[#030712] border border-white/10 text-xs text-white placeholder-slate-500 uppercase font-mono focus:outline-none focus:border-cyan-500 transition"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-semibold text-cyan-400 transition cursor-pointer shadow-sm active:scale-95"
                      >
                        Apply
                      </button>
                    </form>

                    {couponError && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1">
                        <span>⚠</span>
                        <span>{couponError}</span>
                      </p>
                    )}

                    {/* Quick Coupon Badges & Toggle */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1 text-cyan-400 font-medium">
                          <span>🎁 Available Promo Codes</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAvailableCoupons((prev) => !prev)}
                          className="text-slate-400 hover:text-white underline cursor-pointer text-[10px]"
                        >
                          {showAvailableCoupons ? "Hide" : "Show All"}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {availableCoupons.slice(0, 2).map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleQuickCoupon(c.code)}
                            className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 cursor-pointer transition text-[10px] font-mono font-bold flex items-center gap-1 active:scale-95"
                          >
                            <span>{c.code}</span>
                            <span className="text-[9px] text-cyan-200/80 font-sans font-normal">
                              ({c.type === "percentage" ? `${c.value}% Off` : `৳${c.value} Off`})
                            </span>
                          </button>
                        ))}
                      </div>

                      {showAvailableCoupons && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {availableCoupons.map((c) => (
                            <div
                              key={c.code}
                              className="p-2 rounded-xl bg-[#030712] border border-white/10 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-white text-[11px]">
                                    {c.code}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                                    {c.badge}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {c.description}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuickCoupon(c.code)}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-[10px] font-semibold cursor-pointer shrink-0 transition"
                              >
                                Apply
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Cart Subtotal</span>
                  <span className="font-mono text-white">৳{subtotal.toLocaleString()}</span>
                </div>

                {originalSavings > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Store Catalog Savings</span>
                    <span className="font-mono text-emerald-400">-৳{originalSavings.toLocaleString()}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promo Coupon Discount</span>
                    <span className="font-mono font-bold">-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Processing / Shipping</span>
                  <span className="font-mono text-white">
                    {shippingFee === 0 ? "FREE" : `৳${shippingFee}`}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-white block font-['Outfit']">Grand Total</span>
                    <span className="text-[10px] text-slate-400">Includes all applicable fees</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 text-xs">✓</span>
                  <span>Fast Doorstep Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 text-xs">✓</span>
                  <span>7-Day Return Policy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 text-xs">✓</span>
                  <span>100% Genuine Products</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 text-xs">✓</span>
                  <span>24/7 Dedicated Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
