import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { availableCoupons, validateCouponOnline } from "../data/couponsData";
import {
  ShoppingBag,
  X,
  Trash2,
  Truck,
  ArrowRight,
  Sparkles,
  Percent,
  Plus,
  Minus,
} from "lucide-react";

export default function CartDrawer({
  isOpen: propIsOpen,
  onClose: propOnClose,
  cart: propCart,
  onRemoveFromCart: propRemoveFromCart,
  onClearCart: propClearCart,
  onCheckout: propCheckout,
  onExploreCourses,
  appliedCoupon: propAppliedCoupon,
  onApplyCoupon: propApplyCoupon,
  onRemoveCoupon: propRemoveCoupon,
}) {
  const navigate = useNavigate();
  const cartContext = useCart();

  // Prefer context states with prop fallbacks
  const isOpen = propIsOpen !== undefined ? propIsOpen : cartContext.isCartOpen;
  const onClose = propOnClose || cartContext.closeCart;
  const cart = propCart !== undefined ? propCart : cartContext.cart;
  const onRemoveFromCart = propRemoveFromCart || cartContext.removeFromCart;
  const onClearCart = propClearCart || cartContext.clearCart;
  const appliedCoupon = propAppliedCoupon !== undefined ? propAppliedCoupon : cartContext.appliedCoupon;
  const onApplyCoupon = propApplyCoupon || cartContext.applyCoupon;
  const onRemoveCoupon = propRemoveCoupon || cartContext.removeCoupon;
  const updateQuantity = cartContext.updateQuantity;

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);

  if (!isOpen) return null;

  // Financial calculations from context or derived
  const totalPrice = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const totalOriginal = cart.reduce(
    (sum, item) =>
      sum +
      (Number(item.originalPrice) || Number(item.price) || 0) *
        (Number(item.quantity) || 1),
    0
  );
  const totalSavings = totalOriginal > totalPrice ? totalOriginal - totalPrice : 0;
  const couponDiscount = cartContext.couponDiscount || 0;
  const finalGrandTotal = Math.max(0, totalPrice - couponDiscount);

  const freeShippingThreshold = 2500;
  const freeShippingProgress = Math.min(100, (totalPrice / freeShippingThreshold) * 100);
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - totalPrice);

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    setCouponError("");

    if (!couponInput.trim()) {
      setCouponError("Please type a promo code.");
      return;
    }

    const result = await validateCouponOnline(couponInput, totalPrice);
    if (result.isValid && onApplyCoupon) {
      onApplyCoupon(result.coupon);
      setCouponInput("");
      setCouponError("");
    } else {
      setCouponError(result.message);
    }
  };

  const handleQuickApply = async (code) => {
    const result = await validateCouponOnline(code, totalPrice);
    if (result.isValid && onApplyCoupon) {
      onApplyCoupon(result.coupon);
      setCouponError("");
      setShowAvailableCoupons(false);
    } else {
      setCouponError(result.message);
    }
  };

  const handleProceedToCheckout = () => {
    onClose();
    if (propCheckout) {
      propCheckout();
    } else {
      navigate("/checkout");
    }
  };

  const handleBrowseCatalog = () => {
    onClose();
    if (onExploreCourses) {
      onExploreCourses();
    } else {
      navigate("/products");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#060a16] border-l border-white/[0.1] shadow-2xl flex flex-col h-full h-[100dvh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#080d1c] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white font-['Outfit'] leading-tight">
                  Shopping Cart
                </h2>
                <p className="text-xs text-slate-400">
                  {cart.length} {cart.length === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition cursor-pointer text-sm"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {cart.length > 0 && (
            <div className="px-5 py-3 bg-[#090f20] border-b border-white/[0.06] text-xs">
              <div className="flex items-center justify-between mb-1.5 font-medium">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  {amountNeededForFreeShipping === 0 ? (
                    <span className="text-emerald-400 font-bold">🎉 FREE Express Delivery Unlocked!</span>
                  ) : (
                    <span>Add <strong className="text-cyan-400 font-mono">৳{amountNeededForFreeShipping.toLocaleString()}</strong> for Free Delivery</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4 text-slate-400 shadow-inner">
                  <ShoppingBag className="w-8 h-8 text-cyan-400/60" />
                </div>
                <h3 className="text-base font-bold text-white font-['Outfit'] mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
                  Discover genuine flagship gadgets, tech accessories, and lifestyle essentials to add them to your cart.
                </p>
                <button
                  type="button"
                  onClick={handleBrowseCatalog}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Browse Store Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemImg =
                  item.directImage ||
                  item.image ||
                  item.thumbnail ||
                  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";

                const itemQty = Number(item.quantity) || 1;
                const itemStock = item.stock !== undefined ? Number(item.stock) : 99;
                const itemTotalBDT = (Number(item.price) || 0) * itemQty;
                const isMaxStock = itemQty >= itemStock;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#090e1c] border border-white/[0.08] hover:border-cyan-500/30 flex gap-3.5 transition-all shadow-sm"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-[#030610] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 p-1">
                      <img
                        src={itemImg}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white line-clamp-1 font-['Outfit']">
                            {item.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.id)}
                            className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-0.5"
                            title="Remove from cart"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 capitalize">
                            {item.category || "Official Brand"}
                          </span>
                          {itemStock <= 5 && itemStock > 0 && (
                            <span className="text-[9px] text-amber-400 font-semibold">
                              Only {itemStock} left
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls & Price */}
                      <div className="flex items-center justify-between pt-2">
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5 bg-[#040711] rounded-lg border border-white/10 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity && updateQuantity(item.id, itemQty - 1)}
                            className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center transition cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-mono font-bold text-white">
                            {itemQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity && updateQuantity(item.id, itemQty + 1)}
                            disabled={isMaxStock}
                            className="w-5 h-5 rounded bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition cursor-pointer"
                            aria-label="Increase quantity"
                            title={isMaxStock ? `Maximum available stock is ${itemStock}` : "Increase"}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Item Total Price */}
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-cyan-400 font-mono block">
                            ৳{itemTotalBDT.toLocaleString()}
                          </span>
                          {itemQty > 1 && (
                            <span className="text-[9px] text-slate-500 font-mono block">
                              ৳{Number(item.price).toLocaleString()} each
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#080d1c] space-y-4 shrink-0 shadow-2xl">
              {/* Promo Coupon Module */}
              <div className="space-y-2">
                {appliedCoupon ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold font-mono text-emerald-400 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] text-slate-300 block">
                          Voucher Applied (-৳{couponDiscount.toLocaleString()})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Promo code (e.g. STORE20)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#030610] border border-white/10 focus:border-cyan-400 text-xs text-white placeholder-slate-500 uppercase font-mono tracking-wider outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && (
                  <p className="text-[11px] text-rose-400 pl-1">{couponError}</p>
                )}

                {/* Quick Toggle Available Vouchers */}
                {!appliedCoupon && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAvailableCoupons((prev) => !prev)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{showAvailableCoupons ? "Hide available vouchers" : "View available vouchers"}</span>
                    </button>

                    {showAvailableCoupons && (
                      <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto p-1 bg-black/30 rounded-xl">
                        {availableCoupons.map((c) => (
                          <div
                            key={c.code}
                            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-cyan-400 text-[11px]">{c.code}</span>
                              <span className="text-[10px] text-slate-400 block line-clamp-1">{c.description}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickApply(c.code)}
                              className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500/30 transition cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-white/[0.08] text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">৳{totalPrice.toLocaleString()}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Savings</span>
                    <span className="font-mono">-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                {totalSavings > 0 && !couponDiscount && (
                  <div className="flex justify-between text-slate-400">
                    <span>Direct Store Savings</span>
                    <span className="font-mono text-emerald-400">-৳{totalSavings.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-white/[0.08]">
                  <span className="text-sm font-bold text-white font-['Outfit']">Grand Total</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">
                    ৳{finalGrandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Action CTA */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-xl shadow-cyan-950/60 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                >
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="hover:text-rose-400 transition cursor-pointer"
                  >
                    Clear Cart
                  </button>
                  <span>🛡️ 256-Bit SSL Encrypted</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
