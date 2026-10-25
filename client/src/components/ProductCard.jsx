import { useNavigate } from "react-router-dom";
import { ShoppingCart, Check, Star, Heart, Eye, ArrowUpRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, removeFromCart, selectIsInCart } from "../redux/slices/cartSlice";
import { useWishlist } from "../context/WishlistContext";

export default function ProductCard({
  product,
  isInCart: propIsInCart,
  onAddToCart,
  onRemoveFromCart,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const cardId = `prod-${product.id}`;
  const reduxIsInCart = useSelector(selectIsInCart(cardId));
  const isInCart = propIsInCart !== undefined ? propIsInCart : reduxIsInCart;
  const isWishlisted = isInWishlist(product.id);

  const numPrice = Number(product.price) || 0;
  const discountPercent = Number(product.discountPercentage) || 0;

  // Determine if price is in BDT (>= 1000) or USD (< 1000)
  const isDirectBDT = numPrice >= 1000;
  const bdtPrice = isDirectBDT ? Math.round(numPrice) : Math.round(numPrice * 120);
  const usdPrice = isDirectBDT ? (numPrice / 120).toFixed(2) : numPrice.toFixed(2);

  // Calculate original price before discount
  const originalPrice = discountPercent > 0
    ? (numPrice / (1 - discountPercent / 100))
    : null;

  const bdtOriginalPrice = originalPrice
    ? (isDirectBDT ? Math.round(originalPrice) : Math.round(originalPrice * 120))
    : bdtPrice;

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (isInCart) {
      if (onRemoveFromCart) onRemoveFromCart(cardId);
      else dispatch(removeFromCart(cardId));
    } else {
      const itemData = {
        id: cardId,
        title: product.title,
        price: bdtPrice,
        originalPrice: bdtOriginalPrice,
        displayPriceUSD: `$${usdPrice}`,
        image: product.thumbnail || product.image_url,
        directImage: product.thumbnail || product.image_url,
        category: product.category,
        brand: product.brand || "Official Store",
        stock: product.stock !== undefined ? Number(product.stock) : 99,
        quantity: 1,
      };

      if (onAddToCart) onAddToCart(itemData);
      else dispatch(addToCart(itemData));
    }
  };

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    navigate(`/products/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-2xl bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-cyan-500/40 p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/80 cursor-pointer flex flex-col justify-between"
    >
      {/* Product Image Area (.products-thumb) */}
      <div className="relative aspect-square rounded-xl bg-slate-50 border border-slate-100 p-3 mb-3 flex items-center justify-center overflow-hidden">
        
        {/* Top-Left Labels / Badges (.product-lable) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start pointer-events-none">
          {discountPercent > 0 ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white bg-gradient-to-r from-rose-500 to-pink-600 shadow-sm tracking-wider">
              -{Math.round(discountPercent)}%
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 backdrop-blur-md">
              HOT
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-white/95 text-slate-700 border border-slate-200 backdrop-blur-md shadow-xs">
            {product.category}
          </span>
        </div>

        {/* Top-Right Floating Action Button Stack (.product-button) - Binomo Signature Hover Effect */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-2 items-center">
          {/* 1. Wishlist Heart Button */}
          <div className="group/btn relative transform translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-[0ms]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90 ${
                isWishlisted
                  ? "bg-rose-50 border-rose-300 text-rose-500"
                  : "bg-white/95 hover:bg-rose-500 hover:border-rose-400 border-slate-200 text-slate-600 hover:text-white"
              }`}
              aria-label="Wishlist"
            >
              <Heart
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                  isWishlisted ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
            </button>
            {/* Tooltip */}
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white text-[10px] font-medium tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity duration-200 shadow-xl hidden sm:block">
              {isWishlisted ? "In Wishlist" : "Wishlist"}
            </span>
          </div>

          {/* 2. Quick View Button */}
          <div className="group/btn relative transform translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-[75ms]">
            <button
              type="button"
              onClick={handleQuickView}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/95 hover:bg-cyan-600 border border-slate-200 hover:border-cyan-500 text-slate-600 hover:text-white shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90"
              aria-label="Quick View"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            {/* Tooltip */}
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white text-[10px] font-medium tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity duration-200 shadow-xl hidden sm:block">
              Quick View
            </span>
          </div>

          {/* 3. Quick Cart Button */}
          <div className="group/btn relative transform translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-[150ms]">
            <button
              type="button"
              onClick={handleCartClick}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90 ${
                isInCart
                  ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                  : "bg-white/95 hover:bg-cyan-600 hover:border-cyan-500 border-slate-200 text-slate-600 hover:text-white"
              }`}
              aria-label="Add to Cart"
            >
              {isInCart ? (
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
            {/* Tooltip */}
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white text-[10px] font-medium tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity duration-200 shadow-xl hidden sm:block">
              {isInCart ? "Remove Cart" : "Add to Cart"}
            </span>
          </div>
        </div>

        {/* Product Image with Binomo smooth scale on hover */}
        <img
          src={product.thumbnail || product.image_url}
          alt={product.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain transform transition-transform duration-700 ease-out group-hover:scale-110"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";
          }}
        />

        {/* Binomo Quick View Slide-up banner at bottom of image on hover (Desktop) */}
        <div className="absolute inset-x-2 bottom-2 z-10 transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none hidden sm:flex justify-center">
          <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 text-slate-900 text-[11px] font-bold flex items-center gap-1.5 shadow-md">
            <span>Explore Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-600" />
          </div>
        </div>
      </div>

      {/* Card Content Block (.products-content) */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Brand & Star Rating */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[100px] sm:max-w-[130px]">
              {product.brand || "Official Store"}
            </span>

            <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px] sm:text-xs shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span>{Number(product.rating || 4.8).toFixed(1)}</span>
            </div>
          </div>

          {/* Title with hover color transition */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition-colors duration-200 line-clamp-2 font-['Outfit'] leading-snug">
            {product.title}
          </h3>
        </div>

        {/* Pricing & Full Cart Button Bar (.product-button-flex) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-black text-slate-900 font-['Outfit']">
                ৳{bdtPrice.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through font-mono">
                  ৳{bdtOriginalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 block font-mono">
              ${usdPrice} USD
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleCartClick}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              isInCart
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                : "bg-slate-100 hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-600 hover:text-white text-slate-800 border border-slate-200 hover:border-transparent"
            }`}
            title={isInCart ? "Remove from cart" : "Add to cart"}
          >
            {isInCart ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 text-cyan-600 group-hover:text-white transition-colors" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
