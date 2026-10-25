import useDocumentTitle from "../hooks/useDocumentTitle";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  selectAppliedCoupon,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  showToast,
} from "../redux/slices/cartSlice";
import useApiCall from "../hooks/useApiCall";
import { availableCoupons, validateAndCalculateCoupon, validateCouponOnline } from "../data/couponsData";
import { CheckCircle2, ArrowRight, Printer, ShoppingBag, Tag, X, ShieldCheck, Truck, CreditCard } from "lucide-react";

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
  const dispatch = useDispatch();
  const { user } = useAuth();

  const reduxCart = useSelector(selectCartItems);
  const reduxAppliedCoupon = useSelector(selectAppliedCoupon);

  const cart = propCart !== undefined ? propCart : reduxCart;
  const onRemoveFromCart = propRemoveFromCart || ((id) => dispatch(removeFromCart(id)));
  const onClearCart = propClearCart || (() => dispatch(clearCart()));
  const appliedCoupon = propAppliedCoupon !== undefined ? propAppliedCoupon : reduxAppliedCoupon;
  const onApplyCoupon = propApplyCoupon || ((coupon) => dispatch(applyCoupon(coupon)));
  const onRemoveCoupon = propRemoveCoupon || (() => dispatch(removeCoupon()));
  const onShowToast = propShowToast || ((msg) => dispatch(showToast(msg)));

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
      <div className="w-full min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Success Banner */}
          <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-emerald-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
              Order Confirmed &amp; Placed!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Thank you, <span className="text-slate-900 font-semibold">{orderPlaced.customer.fullName}</span>! Your store order has been received and is being prepared for fast delivery.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
              <span>Order Reference: {orderPlaced.orderId}</span>
            </div>
          </div>

          {/* Printable Invoice Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs text-cyan-700 font-semibold uppercase tracking-wider font-mono">Official Invoice</span>
                <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">Suffex Store BD</h2>
                <p className="text-xs text-slate-500 mt-0.5">Order Date: {orderPlaced.orderDate}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 block">Payment Method</span>
                <span className="text-sm font-semibold text-slate-900 uppercase">{orderPlaced.paymentMethod}</span>
                <span className="text-[11px] font-mono text-cyan-700 block">TrxID: {orderPlaced.trxId}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Billed To:</span>
                <span className="font-semibold text-slate-900 text-sm block">{orderPlaced.customer.fullName}</span>
                <span className="text-slate-700 block">{orderPlaced.customer.email}</span>
                <span className="text-slate-700 block">{orderPlaced.customer.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Delivery / Region:</span>
                <span className="text-slate-700 block">{orderPlaced.customer.division} Division, Bangladesh</span>
                {orderPlaced.customer.address && (
                  <span className="text-slate-500 block mt-0.5">{orderPlaced.customer.address}</span>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-['Outfit']">Purchased Items</h3>
              <div className="divide-y divide-slate-100 border-y border-slate-200">
                {orderPlaced.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-1">
                        <img
                          src={getItemImage(item)}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">{item.title}</span>
                        <span className="text-[11px] text-cyan-700 font-mono">
                          {item.category ? item.category.toUpperCase() : "STORE ITEM"}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ৳{Number(item.price).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Financial Summary */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono text-slate-900">৳{orderPlaced.subtotal.toLocaleString()}</span>
              </div>
              {orderPlaced.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Special Promo Discount</span>
                  <span className="font-mono font-semibold">-৳{orderPlaced.couponDiscount.toLocaleString()}</span>
                </div>
              )}
              {orderPlaced.shippingFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Standard Shipping</span>
                  <span className="font-mono text-slate-900">৳{orderPlaced.shippingFee}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm sm:text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                <span>Grand Total Paid</span>
                <span className="font-mono text-xl text-cyan-700">৳{orderPlaced.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleNavigation("orders")}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:brightness-110 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-cyan-600/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Go to My Orders &amp; Tracking</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigation("products")}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
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
      <div className="w-full min-h-[70vh] bg-[#f8fafc] flex items-center justify-center py-16 px-4 font-sans text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto text-cyan-600 shadow-sm">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">Your Cart is Currently Empty</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please select at least one product from our store to proceed to the checkout page.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => handleNavigation("products")}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:brightness-110 text-white text-xs font-semibold cursor-pointer transition shadow-md shadow-cyan-600/20 flex items-center gap-2"
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
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Checkout Header Banner */}
        <div className="relative rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Secure SSL 256-Bit Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
              Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">Checkout</span> &amp; Delivery
            </h1>
            <p className="text-xs text-slate-600 mt-1">
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
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center text-xs font-bold shadow-xs">
                    1
                  </div>
                  <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                    Customer &amp; Delivery Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Ashik Siddike"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-xs ${formErrors.fullName ? "border-rose-500" : "border-slate-300 focus:border-cyan-500"
                        }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="shopper@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-xs ${formErrors.email ? "border-rose-500" : "border-slate-300 focus:border-cyan-500"
                        }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="017XXXXXXXX"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-xs ${formErrors.phone ? "border-rose-500" : "border-slate-300 focus:border-cyan-500"
                        }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Division */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Division</label>
                    <select
                      name="division"
                      value={formData.division}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-cyan-500 transition cursor-pointer shadow-xs"
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
                    <label className="text-xs font-medium text-slate-700">
                      Delivery Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Road / House / Area details"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-xs ${formErrors.address ? "border-rose-500" : "border-slate-300 focus:border-cyan-500"
                        }`}
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-rose-500 mt-0.5">{formErrors.address}</p>
                    )}
                  </div>

                  {/* Order notes */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-700">Order Notes (Optional)</label>
                    <textarea
                      name="orderNotes"
                      rows="2"
                      value={formData.orderNotes}
                      onChange={handleInputChange}
                      placeholder="Special delivery instructions or landmark..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center text-xs font-bold shadow-xs">
                    2
                  </div>
                  <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                    Select Payment Method
                  </h2>
                </div>

                {/* Radio selection options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* bKash */}
                  <div
                    onClick={() => setPaymentMethod("bkash")}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${paymentMethod === "bkash"
                        ? "bg-[#e2136e]/10 border-[#e2136e] shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <span className="font-bold text-sm text-[#e2136e]">bKash</span>
                    <span className="text-[10px] text-slate-500">Mobile Banking</span>
                  </div>

                  {/* Nagad */}
                  <div
                    onClick={() => setPaymentMethod("nagad")}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${paymentMethod === "nagad"
                        ? "bg-[#f7941d]/10 border-[#f7941d] shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <span className="font-bold text-sm text-[#f7941d]">Nagad</span>
                    <span className="text-[10px] text-slate-500">Fast &amp; Secure</span>
                  </div>

                  {/* Credit / Debit Card */}
                  <div
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${paymentMethod === "card"
                        ? "bg-cyan-50 border-cyan-500 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <span className="font-bold text-sm text-cyan-700">Card</span>
                    <span className="text-[10px] text-slate-500">Visa / Mastercard</span>
                  </div>

                  {/* Cash On Delivery / In-Person */}
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-3.5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${paymentMethod === "cod"
                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <span className="font-bold text-sm text-emerald-700">Cash On Delivery</span>
                    <span className="text-[10px] text-slate-500">Pay on Hand</span>
                  </div>
                </div>

                {/* Sub-form based on selected payment method */}
                {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>Merchant / Send-Money No:</span>
                      <span className="font-mono font-bold text-slate-900">01712-345678 (Personal)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Please send <strong className="text-slate-900">৳{grandTotal.toLocaleString()}</strong> to the above {paymentMethod.toUpperCase()} number and enter your Transaction ID below:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1">Your Sender Mobile No.</label>
                        <input
                          type="text"
                          name="senderNumber"
                          value={paymentDetails.senderNumber}
                          onChange={handlePaymentChange}
                          placeholder="e.g. 018XXXXXXXX"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 block mb-1">Transaction ID (TrxID)</label>
                        <input
                          type="text"
                          name="trxId"
                          value={paymentDetails.trxId}
                          onChange={handlePaymentChange}
                          placeholder="e.g. 9J4K2L8A"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono uppercase shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-600">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentDetails.cardNumber}
                        onChange={handlePaymentChange}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono shadow-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-600">Expiry Date</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          value={paymentDetails.cardExpiry}
                          onChange={handlePaymentChange}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600">CVC / CVV</label>
                        <input
                          type="text"
                          name="cardCvc"
                          value={paymentDetails.cardCvc}
                          onChange={handlePaymentChange}
                          placeholder="123"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "cod" && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    You can pay <strong className="text-slate-900">৳{grandTotal.toLocaleString()}</strong> in cash directly to the courier delivery agent upon receiving your packaged parcel.
                  </div>
                )}

                {/* API Error alert if any */}
                {orderApi.isError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {orderApi.isError}
                  </div>
                )}

                {/* Submit button inside form */}
                <button
                  type="submit"
                  disabled={orderApi.isLoading}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:brightness-110 shadow-md shadow-cyan-600/20 transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">Order Summary</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {cart.length} {cart.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Items in Cart */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center p-1">
                        <img
                          src={getItemImage(item)}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate text-xs">{item.title}</h4>
                        <span className="text-[11px] text-cyan-700 font-mono">
                          {item.category ? item.category.toUpperCase() : "STORE ITEM"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        ৳{Number(item.price).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer text-xs p-1"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Have a Promo Coupon?
                  </label>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer transition"
                      title="Clear applied coupon"
                    >
                      <span className="inline-flex items-center gap-1"><X className="w-3.5 h-3.5" /> Clear Coupon</span>
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs shadow-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                        <span className="text-emerald-700 font-bold font-mono text-sm tracking-wide">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          -৳{couponDiscount.toLocaleString()} Saved
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-7 leading-relaxed">
                        {appliedCoupon.description || appliedCoupon.desc || "Promo discount applied"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-semibold cursor-pointer transition shrink-0 ml-2 shadow-xs"
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
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 uppercase font-mono focus:outline-none focus:border-cyan-500 transition shadow-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-xs font-semibold text-cyan-700 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        Apply
                      </button>
                    </form>

                    {couponError && (
                      <p className="text-[11px] text-rose-500 flex items-center gap-1">
                        <span>⚠</span>
                        <span>{couponError}</span>
                      </p>
                    )}

                    {/* Quick Coupon Badges & Toggle */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1 text-cyan-700 font-medium">
                          <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-cyan-600" /> Available Promo Codes</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAvailableCoupons((prev) => !prev)}
                          className="text-slate-500 hover:text-slate-800 underline cursor-pointer text-[10px]"
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
                            className="px-2 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 cursor-pointer transition text-[10px] font-mono font-bold flex items-center gap-1 active:scale-95 shadow-xs"
                          >
                            <span>{c.code}</span>
                            <span className="text-[9px] text-cyan-600 font-sans font-normal">
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
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                   <span className="font-mono font-bold text-slate-900 text-[11px]">
                                    {c.code}
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                                    {c.badge}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {c.description}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuickCoupon(c.code)}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white text-[10px] font-semibold cursor-pointer shrink-0 transition shadow-xs"
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
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Cart Subtotal</span>
                  <span className="font-mono text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>

                {originalSavings > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Store Catalog Savings</span>
                    <span className="font-mono text-emerald-600">-৳{originalSavings.toLocaleString()}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Promo Coupon Discount</span>
                    <span className="font-mono font-bold">-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Processing / Shipping</span>
                  <span className="font-mono text-slate-900">
                    {shippingFee === 0 ? "FREE" : `৳${shippingFee}`}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block font-['Outfit']">Grand Total</span>
                    <span className="text-[10px] text-slate-500">Includes all applicable fees</span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-cyan-700">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 text-xs">✓</span>
                  <span>Fast Doorstep Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 text-xs">✓</span>
                  <span>7-Day Return Policy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 text-xs">✓</span>
                  <span>100% Genuine Products</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 text-xs">✓</span>
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
