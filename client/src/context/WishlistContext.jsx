import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useCart } from "./CartContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { addToCart, showToast } = useCart();

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("suffex_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("suffex_wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.warn("Could not save wishlist to localStorage:", e);
    }
  }, [wishlist]);

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      const cleanId = String(productId).replace(/^prod-/, "");
      return wishlist.some(
        (item) => String(item.id).replace(/^prod-/, "") === cleanId
      );
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (product) => {
      if (!product) return;
      const cleanId = String(product.id).replace(/^prod-/, "");
      setWishlist((prev) => {
        const exists = prev.some(
          (item) => String(item.id).replace(/^prod-/, "") === cleanId
        );
        if (exists) {
          if (showToast) showToast(`"${product.title}" removed from your wishlist.`);
          return prev.filter(
            (item) => String(item.id).replace(/^prod-/, "") !== cleanId
          );
        } else {
          if (showToast) showToast(`"${product.title}" saved to your wishlist.`);
          return [...prev, product];
        }
      });
    },
    [showToast]
  );

  const removeFromWishlist = useCallback(
    (productId) => {
      const cleanId = String(productId).replace(/^prod-/, "");
      setWishlist((prev) =>
        prev.filter((item) => String(item.id).replace(/^prod-/, "") !== cleanId)
      );
    },
    []
  );

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    if (showToast) showToast("Wishlist has been cleared.");
  }, [showToast]);

  const moveToCart = useCallback(
    (product) => {
      if (!product) return;
      const numPrice = Number(product.price) || 0;
      const isDirectBDT = numPrice >= 1000;
      const bdtPrice = isDirectBDT ? Math.round(numPrice) : Math.round(numPrice * 120);

      addToCart(
        {
          id: `prod-${product.id}`,
          title: product.title,
          price: bdtPrice,
          originalPrice: product.originalPrice || bdtPrice,
          image: product.thumbnail || product.image_url,
          directImage: product.thumbnail || product.image_url,
          category: product.category,
          brand: product.brand || "Official Store",
          stock: product.stock !== undefined ? Number(product.stock) : 99,
          quantity: 1,
        },
        1
      );
      removeFromWishlist(product.id);
      if (showToast) showToast(`Moved "${product.title}" directly to your cart.`);
    },
    [addToCart, removeFromWishlist, showToast]
  );

  const value = {
    wishlist,
    wishlistCount: wishlist.length,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    moveToCart,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

export default WishlistContext;
