import { useState, useMemo } from "react";
import { useProduct } from "../hooks/useProduct";
import { useCart } from "../context/CartContext";
import { createProductPriceCalculator } from "../helpers/priceCalculator";
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export default function ProductModal({
  productId,
  onClose,
  isInCart: propIsInCart,
  onAddToCart,
  onRemoveFromCart,
}) {
  const { product, loading, error, refetch } = useProduct(productId);
  const { isInCart: ctxIsInCart, addToCart: ctxAddToCart, removeFromCart: ctxRemoveFromCart, showToast } = useCart();
  const [quantity, setQuantity] = useState(1);

  const modalId = productId ? `prod-${productId}` : "";
  const isInCart = propIsInCart !== undefined ? propIsInCart : (ctxIsInCart ? ctxIsInCart(modalId) : false);

  // Reset quantity to 1 during render when selected product ID changes
  const [prevProductId, setPrevProductId] = useState(productId);
  if (prevProductId !== productId) {
    setPrevProductId(productId);
    setQuantity(1);
  }

  /**
   * Price calculator function using a JavaScript Closure.
   * `createProductPriceCalculator` encapsulates private state (quantity, vatRate, exchangeRate)
   * in its lexical scope.
   */
  const calculator = useMemo(() => {
    return createProductPriceCalculator(product, {
      vatRate: 0.05, // 5% VAT
      exchangeRate: 120, // 1 USD = 120 BDT
      currencySymbol: "৳",
    });
  }, [product]);

  const pricing = useMemo(() => {
    return calculator.calculate(quantity);
  }, [calculator, quantity]);

  const availableStock = product?.stock !== undefined ? Number(product.stock) : 99;

  const handleIncreaseQuantity = () => {
    if (quantity >= availableStock) {
      showToast(`Stock limit reached! Only ${availableStock} unit${availableStock > 1 ? "s" : ""} available.`);
      return;
    }
    calculator.setQuantity(quantity);
    calculator.increaseQuantity();
    setQuantity(calculator.getQuantity());
  };

  const handleDecreaseQuantity = () => {
    calculator.setQuantity(quantity);
    calculator.decreaseQuantity();
    setQuantity(calculator.getQuantity());
  };

  if (!productId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#060a16] border border-white/[0.12] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#080d1c] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              Product Overview &amp; Pricing Closure
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center border border-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading product details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-400">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        {product && !loading && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Product Gallery & Stock Status */}
              <div className="space-y-3">
                <div className="aspect-square rounded-2xl bg-[#030610] border border-white/10 flex items-center justify-center p-6 overflow-hidden relative">
                  {product.discountPercentage > 0 && (
                    <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md">
                      -{Math.round(product.discountPercentage)}% OFF
                    </span>
                  )}

                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";
                    }}
                  />
                </div>

                {/* Stock & Availability Pill */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-400">Inventory Status:</span>
                  {availableStock > 0 ? (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>In Stock ({availableStock} available)</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Specs */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-md border border-cyan-500/30">
                      {product.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Brand: <strong className="text-white">{product.brand || "Official Store"}</strong>
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-white font-['Outfit'] mt-2 leading-tight">
                    {product.title}
                  </h2>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="font-mono text-[11px]">SKU: {product.sku || "N/A"}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{Number(product.rating || 4.5).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Price & Discount */}
                  <div className="flex items-baseline gap-2.5 mt-3 flex-wrap">
                    <span className="text-2xl font-black font-mono text-white">
                      ৳{pricing.totalBDT.toLocaleString()}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      (${pricing.totalUSD.toFixed(2)} USD)
                    </span>
                    {Number(product.discountPercentage) > 0 && (
                      <span className="text-xs font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-md border border-violet-500/30">
                        -{Math.round(Number(product.discountPercentage))}% OFF
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Interactive Quantity Selector & Closure Price Breakdown */}
                <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/[0.08] space-y-3 mt-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-300 font-semibold font-['Outfit'] block">Quantity Selection</span>
                      <span className="text-[10px] text-slate-400 font-mono">Max: {availableStock} units</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#040711] rounded-xl border border-white/10 p-1">
                      <button
                        type="button"
                        onClick={handleDecreaseQuantity}
                        disabled={quantity <= 1}
                        className="w-6 h-6 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-mono font-bold text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncreaseQuantity}
                        disabled={quantity >= availableStock}
                        className="w-6 h-6 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-30 text-white flex items-center justify-center transition cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Closure Calculated Breakdown */}
                  <div className="space-y-1.5 pt-2.5 border-t border-white/[0.08] text-[11px] text-slate-400">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-mono font-semibold">
                        ⚡ JS Closure Engine
                      </span>
                      <span>5% VAT: ${pricing.vatAmountUSD}</span>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-slate-300 font-medium">Grand Total ({quantity} {quantity === 1 ? "unit" : "units"}):</span>
                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-cyan-400">
                          ৳{pricing.totalBDT.toLocaleString()}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block">
                          (${pricing.totalUSD.toFixed(2)} USD)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cart Action Button */}
                <div className="pt-3 border-t border-white/[0.08] flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isInCart) {
                        if (onRemoveFromCart) onRemoveFromCart(modalId);
                        else ctxRemoveFromCart(modalId);
                      } else {
                        const unitBDT = Math.round(pricing.totalBDT / pricing.quantity);
                        const itemData = {
                          id: modalId,
                          title: product.title,
                          price: unitBDT,
                          originalPrice: Math.round(Number(product.price) >= 1000 ? Number(product.price) : Number(product.price) * 120),
                          displayPriceUSD: `$${pricing.totalUSD.toFixed(2)}`,
                          quantity: pricing.quantity,
                          stock: availableStock,
                          image: product.thumbnail,
                          directImage: product.thumbnail,
                          category: product.category,
                          brand: product.brand || "Official Store",
                        };

                        if (onAddToCart) onAddToCart(itemData);
                        else ctxAddToCart(itemData, pricing.quantity);
                      }
                    }}
                    disabled={availableStock <= 0}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isInCart
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-cyan-950/40"
                    }`}
                  >
                    {availableStock <= 0 ? (
                      <span>Currently Out of Stock</span>
                    ) : isInCart ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>In Your Cart (Click to Remove)</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add {quantity} to Cart (৳{pricing.totalBDT.toLocaleString()})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Specifications Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/[0.08] text-xs">
              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-white/[0.06] flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Warranty</span>
                  <span className="font-semibold text-white">{product.warrantyInformation || "1 Year Official"}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-white/[0.06] flex items-center gap-3">
                <Truck className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Shipping</span>
                  <span className="font-semibold text-white">{product.shippingInformation || "Ships in 2-3 Days"}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#090e1c] border border-white/[0.06] flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Return Policy</span>
                  <span className="font-semibold text-white">{product.returnPolicy || "7 Days Return"}</span>
                </div>
              </div>
            </div>

            {/* Customer Reviews */}
            {product.reviews?.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-['Outfit']">
                  Customer Feedback ({product.reviews.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.reviews.slice(0, 2).map((rev, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-[#090e1c] border border-white/[0.06] text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-white">{rev.reviewerName}</span>
                        <div className="flex items-center gap-1 text-amber-400 font-mono text-xs">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{rev.rating}</span>
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs italic">&ldquo;{rev.comment}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
