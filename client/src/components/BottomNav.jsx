import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCartCount, openCart } from "../redux/slices/cartSlice";
import { useWishlist } from "../context/WishlistContext";
import { Home, Sparkles, PackageCheck, Heart, ShoppingCart } from "lucide-react";

export default function BottomNav({
  cartCount: propCartCount,
  onOpenCart: propOnOpenCart,
}) {
  const dispatch = useDispatch();
  const reduxCartCount = useSelector(selectCartCount);
  const { wishlistCount } = useWishlist();
  const effectiveCount = propCartCount !== undefined ? propCartCount : reduxCartCount;
  const handleOpenCart = propOnOpenCart || (() => dispatch(openCart()));

  return (
    <nav
      className="md:hidden fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 px-2 py-1.5 flex items-center justify-around select-none"
      aria-label="Mobile Navigation"
    >
      {/* Home */}
      <NavLink
        to="/"
        end
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={({ isActive }) =>
          `relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
            isActive ? "text-cyan-600 font-bold" : "text-slate-500 hover:text-slate-900"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Home className={`w-4.5 h-4.5 transition-transform ${isActive ? "scale-110" : ""}`} />
            <span className="text-[10px] mt-0.5 font-['Outfit']">Home</span>
            {isActive && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
            )}
          </>
        )}
      </NavLink>

      {/* Store Products */}
      <NavLink
        to="/products"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={({ isActive }) =>
          `relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
            isActive ? "text-cyan-600 font-bold" : "text-slate-500 hover:text-slate-900"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative">
              <Sparkles className={`w-4.5 h-4.5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="absolute -top-1.5 -right-2 text-[8px] font-black font-mono bg-cyan-600 text-white px-1 py-0 rounded-full scale-90">
                HOT
              </span>
            </div>
            <span className="text-[10px] mt-0.5 font-['Outfit']">Store</span>
            {isActive && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
            )}
          </>
        )}
      </NavLink>

      {/* Center Floating Cart Button */}
      <button
        type="button"
        onClick={handleOpenCart}
        className="relative -mt-5 flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-900/30 border border-white/50 active:scale-90 transition-transform cursor-pointer"
        aria-label="Open Shopping Cart"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5 text-white" />
          {effectiveCount > 0 && (
            <span className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-white text-blue-700 text-[10px] font-black font-mono flex items-center justify-center shadow-md animate-pulse">
              {effectiveCount}
            </span>
          )}
        </div>
      </button>

      {/* Wishlist */}
      <NavLink
        to="/wishlist"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={({ isActive }) =>
          `relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
            isActive ? "text-rose-600 font-bold" : "text-slate-500 hover:text-slate-900"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative">
              <Heart className={`w-4.5 h-4.5 transition-transform ${isActive ? "scale-110 fill-current" : ""}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[8px] font-bold font-mono bg-rose-500 text-white px-1 py-0 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-['Outfit']">Wishlist</span>
            {isActive && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            )}
          </>
        )}
      </NavLink>

      {/* Orders */}
      <NavLink
        to="/my-orders"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={({ isActive }) =>
          `relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
            isActive ? "text-cyan-600 font-bold" : "text-slate-500 hover:text-slate-900"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <PackageCheck className={`w-4.5 h-4.5 transition-transform ${isActive ? "scale-110" : ""}`} />
            <span className="text-[10px] mt-0.5 font-['Outfit']">Orders</span>
            {isActive && (
              <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
            )}
          </>
        )}
      </NavLink>
    </nav>
  );
}
