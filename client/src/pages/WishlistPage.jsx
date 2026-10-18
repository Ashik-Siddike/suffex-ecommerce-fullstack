import useDocumentTitle from "../hooks/useDocumentTitle";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ExternalLink,
  Package,
  Sparkles,
  ShieldCheck,
  Check
} from "lucide-react";
import { useCart } from "../context/CartContext";

export default function WishlistPage() {
  useDocumentTitle("My Wishlist");

  const { wishlist, removeFromWishlist, clearWishlist, moveToCart } = useWishlist();
  const { isInCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-20 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Ambient Glow */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-rose-600/10 via-pink-600/5 to-transparent blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-cyan-400 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-white font-medium">My Wishlist</span>
        </nav>

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1d]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Heart className="w-4 h-4 fill-current" />
              <span>Personal Collections</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 font-['Outfit']">
              Saved{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-indigo-400">
                Wishlist Items
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Your hand-picked flagship gadgets and premium electronics saved for later.
            </p>
          </div>

          {wishlist.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={clearWishlist}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>

              <Link
                to="/products"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-500/25 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          )}
        </div>

        {/* Wishlist Items Content */}
        {wishlist.length === 0 ? (
          /* Empty State */
          <div className="bg-[#0a0f1d]/60 backdrop-blur-xl rounded-3xl border border-white/[0.08] p-12 text-center max-w-xl mx-auto space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute -inset-2 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-3xl bg-[#090e1c] border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-2xl">
                <Heart className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-['Outfit']">
                Your Wishlist is Empty
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                Explore our flagship storefront and tap the heart icon on any device to save it here for instant checkout.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-xl shadow-cyan-950/60 hover:shadow-cyan-500/30 transition cursor-pointer"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const numPrice = Number(item.price) || 0;
              const isDirectBDT = numPrice >= 1000;
              const bdtPrice = isDirectBDT ? Math.round(numPrice) : Math.round(numPrice * 120);
              const cardId = `prod-${item.id}`;
              const alreadyInCart = isInCart(cardId);

              return (
                <div
                  key={item.id}
                  className="group relative rounded-3xl bg-[#0a0f1d]/90 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-950/30 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-[4/3] rounded-2xl bg-[#050811] overflow-hidden flex items-center justify-center p-3 mb-3 border border-white/[0.04]">
                      <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#080d1a]/90 text-cyan-400 border border-cyan-500/30 backdrop-blur-md">
                        {item.category || "Tech"}
                      </span>

                      {/* Remove from Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        className="absolute top-2.5 right-2.5 z-10 p-2 rounded-xl bg-black/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 backdrop-blur-md transition cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <img
                        src={item.thumbnail || item.image_url}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=400";
                        }}
                      />
                    </div>

                    {/* Title & Category */}
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-400">
                        {item.brand || "Official Store"}
                      </p>
                      <h3
                        onClick={() => navigate(`/products/${item.id}`)}
                        className="text-sm font-bold text-white hover:text-cyan-300 transition-colors line-clamp-2 font-['Outfit'] cursor-pointer"
                      >
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Pricing & Move to Cart Button */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-extrabold text-white font-mono">
                        ৳{bdtPrice.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {item.stock !== 0 ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => moveToCart(item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                        alreadyInCart
                          ? "bg-emerald-600 text-white"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/50"
                      }`}
                    >
                      {alreadyInCart ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>In Cart</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Move to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
