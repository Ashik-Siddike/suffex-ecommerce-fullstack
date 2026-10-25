import { useState, useMemo } from "react";
import { useProduct } from "../hooks/useProduct";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, removeFromCart, selectIsInCart, showToast } from "../redux/slices/cartSlice";
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
  const dispatch = useDispatch();
  const { product, loading, error, refetch } = useProduct(productId);
  const [quantity, setQuantity] = useState(1);

  const modalId = productId ? `prod-${productId}` : "";
  const reduxIsInCart = useSelector(selectIsInCart(modalId));
  const isInCart = propIsInCart !== undefined ? propIsInCart : reduxIsInCart;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-700 uppercase">
              Product Overview &amp; Pricing Closure
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border border-slate-200 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            <p className="text-xs text-slate-500">Loading product details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer border border-slate-200"
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
                <div className="aspect-square rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-6 overflow-hidden relative">
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
                  <span className="text-slate-500">Inventory Status:</span>
                  {availableStock > 0 ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>In Stock ({availableStock} available)</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Specs */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                      {product.category}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Brand: <strong className="text-slate-900">{product.brand || "Official Store"}</strong>
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-['Outfit'] mt-2 leading-tight">
                    {product.title}
                  </h2>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="font-mono text-[11px]">SKU: {product.sku || "N/A"}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{Number(product.rating || 4.5).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Price & Discount */}
                  <div className="flex items-baseline gap-2.5 mt-3 flex-wrap">
                    <span className="text-2xl font-black font-mono text-slate-900">
                      ৳{pricing.totalBDT.toLocaleString()}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      (${pricing.totalUSD.toFixed(2)} USD)
                    </span>
                    {Number(product.discountPercentage) > 0 && (
                      <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                        -{Math.round(Number(product.discountPercentage))}% OFF
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Interactive Quantity Selector & Closure Price Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 mt-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-800 font-semibold font-['Outfit'] block">Quantity Selection</span>
                      <span className="text-[10px] text-slate-500 font-mono">Max: {availableStock} units</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-300 p-1 shadow-xs">
                      <button
                        type="button"
                        onClick={handleDecreaseQuantity}
                        disabled={quantity <= 1}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center transition cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-mono font-bold text-slate-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncreaseQuantity}
                        disabled={quantity >= availableStock}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center transition cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Closure Calculated Breakdown */}
                  <div className="space-y-1.5 pt-2.5 border-t border-slate-200 text-[11px] text-slate-500">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-semibold">
                        Dynamic Price Engine
                      </span>
                      <span>5% VAT: ${pricing.vatAmountUSD}</span>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-slate-700 font-medium">Grand Total ({quantity} {quantity === 1 ? "unit" : "units"}):</span>
                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-cyan-700">
                          ৳{pricing.totalBDT.toLocaleString()}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block">
                          (${pricing.totalUSD.toFixed(2)} USD)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cart Action Button */}
                <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isInCart) {
                        if (onRemoveFromCart) onRemoveFromCart(modalId);
                        else dispatch(removeFromCart(modalId));
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
                        else dispatch(addToCart(itemData));
                      }
                    }}
                    disabled={availableStock <= 0}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isInCart
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-cyan-600/20"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Warranty</span>
                  <span className="font-semibold text-slate-900">{product.warrantyInformation || "1 Year Official"}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Truck className="w-5 h-5 text-cyan-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Shipping</span>
                  <span className="font-semibold text-slate-900">{product.shippingInformation || "Ships in 2-3 Days"}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Return Policy</span>
                  <span className="font-semibold text-slate-900">{product.returnPolicy || "7 Days Return"}</span>
                </div>
              </div>
            </div>

            {/* Customer Reviews */}
            {product.reviews?.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-['Outfit']">
                  Customer Feedback ({product.reviews.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.reviews.slice(0, 2).map((rev, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-900">{rev.reviewerName}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-mono text-xs">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{rev.rating}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs italic">&ldquo;{rev.comment}&rdquo;</p>
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
