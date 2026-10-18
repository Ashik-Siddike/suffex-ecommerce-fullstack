import { useNavigate } from "react-router-dom";
import { ShoppingCart, Check, Eye, Star, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function ProductCard({
  product,
  isInCart: propIsInCart,
  onAddToCart,
  onRemoveFromCart,
  onViewDetails,
}) {
  const navigate = useNavigate();
  const { isInCart: ctxIsInCart, addToCart: ctxAddToCart, removeFromCart: ctxRemoveFromCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  if (!product) return null;

  const cardId = `prod-${product.id}`;
  const isInCart = propIsInCart !== undefined ? propIsInCart : (ctxIsInCart ? ctxIsInCart(cardId) : false);
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
      else ctxRemoveFromCart(cardId);
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
      else ctxAddToCart(itemData, 1);
    }
  };

  const handleQuickViewClick = (e) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      navigate(`/products/${product.id}`);
    }
  };

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#0a0f1d] to-[#050813] border border-white/[0.08] hover:border-cyan-500/40 p-2.5 sm:p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-950/30 cursor-pointer flex flex-col justify-between"
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl bg-[#030610] overflow-hidden flex items-center justify-center p-2 sm:p-3 mb-2 sm:mb-3 border border-white/[0.04]">
        
        {/* Category Badge & Discount */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#080d1a]/90 text-cyan-400 border border-cyan-500/30 backdrop-blur-md">
            {product.category}
          </span>
          {discountPercent > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-sm">
              -{Math.round(discountPercent)}%
            </span>
          )}
        </div>

        {/* Wishlist Heart Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className="absolute top-2 right-2 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 transition-all duration-200 cursor-pointer shadow-md hover:scale-110 active:scale-90"
          title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          aria-label="Wishlist toggle"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isWishlisted
                ? "fill-rose-500 text-rose-500"
                : "text-white/70 hover:text-white"
            }`}
          />
        </button>

        <img
          src={product.thumbnail || product.image_url}
          alt={product.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-500"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400&auto=format&fit=crop";
          }}
        />

        {/* Quick View Hover Pill */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <button
            type="button"
            onClick={handleQuickViewClick}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#090e1c]/95 hover:bg-cyan-500/20 text-white hover:text-cyan-300 text-[11px] sm:text-xs font-semibold border border-white/20 hover:border-cyan-500/40 shadow-xl flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Brand & Star Rating */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[80px] sm:max-w-[120px]">
              {product.brand || "Official Store"}
            </span>

            <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px] sm:text-xs shrink-0">
              <Star className="w-3 h-3 fill-current" />
              <span>{Number(product.rating || 4.5).toFixed(1)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 font-['Outfit'] leading-snug">
            {product.title}
          </h3>
        </div>

        {/* Pricing & Cart Action */}
        <div className="pt-1.5 sm:pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5 sm:gap-2">
          <div>
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-sm sm:text-lg font-black text-white font-mono">
                ৳{bdtPrice.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-[10px] sm:text-xs text-slate-500 line-through font-mono">
                  ৳{bdtOriginalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 block font-mono">
              ${usdPrice} USD
            </span>
          </div>

          {/* Add / In Cart Button */}
          <button
            type="button"
            onClick={handleCartClick}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-md active:scale-90 shrink-0 ${
              isInCart
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/40"
                : "bg-white/[0.08] hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 text-white hover:shadow-cyan-950/50"
            }`}
            title={isInCart ? "Remove from cart" : "Add to cart"}
          >
            {isInCart ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:text-white" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
