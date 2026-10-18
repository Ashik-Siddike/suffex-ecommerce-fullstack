import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { validateAndCalculateCoupon } from "../data/couponsData";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Persisted shopping cart items
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Failed to parse cart from localStorage:", e);
      return [];
    }
  });

  // Persisted applied coupon
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem("appliedCoupon");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn("Failed to parse coupon from localStorage:", e);
      return null;
    }
  });

  // Drawer & toast UI states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Auto-sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      console.warn("Failed to save cart to localStorage:", e);
    }
  }, [cart]);

  // Auto-sync appliedCoupon to localStorage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem("appliedCoupon");
      }
    } catch (e) {
      console.warn("Failed to save coupon to localStorage:", e);
    }
  }, [appliedCoupon]);

  // Transient toast notification helper
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage("");
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  // Helper to normalize product IDs (e.g., "prod-12" -> "12")
  const normalizeId = useCallback((id) => String(id ?? "").replace(/^prod-/, ""), []);

  // Check if a product is in cart
  const isInCart = useCallback(
    (productId) => {
      const cleanId = normalizeId(productId);
      return cart.some((item) => item.id === productId || normalizeId(item.id) === cleanId);
    },
    [cart, normalizeId]
  );

  // Get current cart quantity for a specific product
  const getItemQuantity = useCallback(
    (productId) => {
      const cleanId = normalizeId(productId);
      const item = cart.find((c) => c.id === productId || normalizeId(c.id) === cleanId);
      return item ? Number(item.quantity) || 1 : 0;
    },
    [cart, normalizeId]
  );

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(
    (productId) => {
      const cleanId = normalizeId(productId);
      setCart((prevCart) => {
        const itemToRemove = prevCart.find(
          (c) => c.id === productId || normalizeId(c.id) === cleanId
        );
        const filtered = prevCart.filter(
          (c) => c.id !== productId && normalizeId(c.id) !== cleanId
        );
        if (itemToRemove) {
          showToast(`Removed "${itemToRemove.title}" from cart.`);
        }
        return filtered;
      });
    },
    [normalizeId, showToast]
  );

  /**
   * Update quantity of a cart item with stock guard
   * @param {string|number} productId
   * @param {number} newQuantity
   */
  const updateQuantity = useCallback(
    (productId, newQuantity) => {
      const cleanId = normalizeId(productId);
      const targetQty = Number(newQuantity);

      if (targetQty <= 0) {
        removeFromCart(productId);
        return;
      }

      setCart((prevCart) => {
        const index = prevCart.findIndex(
          (c) => c.id === productId || normalizeId(c.id) === cleanId
        );
        if (index === -1) return prevCart;

        const item = prevCart[index];
        const stock = item.stock !== undefined ? Number(item.stock) : 99;

        if (targetQty > stock) {
          showToast(`Cannot exceed available stock (${stock} units).`);
          const updated = [...prevCart];
          updated[index] = { ...item, quantity: stock };
          return updated;
        }

        const updated = [...prevCart];
        updated[index] = { ...item, quantity: targetQty };
        return updated;
      });
    },
    [normalizeId, removeFromCart, showToast]
  );

  /**
   * Add item to cart with stock guard
   * @param {Object} product - Product details
   * @param {number} quantityToAdd - Units to add (default 1)
   */
  const addToCart = useCallback(
    (product, quantityToAdd = 1) => {
      if (!product || !product.id) return false;

      const cleanId = normalizeId(product.id);
      const addQty = Math.max(1, Number(quantityToAdd) || 1);

      // Determine available stock (default to 99 if missing or untracked)
      const rawStock = product.stock !== undefined ? Number(product.stock) : 99;
      const stock = isNaN(rawStock) ? 99 : Math.max(0, rawStock);

      if (stock <= 0) {
        showToast(`"${product.title || "Product"}" is currently out of stock.`);
        return false;
      }

      let wasAdded = false;

      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex(
          (c) => c.id === product.id || normalizeId(c.id) === cleanId
        );

        if (existingIndex > -1) {
          const existingItem = prevCart[existingIndex];
          const currentQty = Number(existingItem.quantity) || 1;
          const itemStock = existingItem.stock !== undefined ? Number(existingItem.stock) : stock;

          if (currentQty >= itemStock) {
            showToast(`Stock limit reached! Only ${itemStock} unit${itemStock > 1 ? "s" : ""} available.`);
            wasAdded = false;
            return prevCart;
          }

          const newQty = Math.min(itemStock, currentQty + addQty);
          const actualAdded = newQty - currentQty;

          if (actualAdded < addQty) {
            showToast(`Added ${actualAdded} unit(s). Maximum stock (${itemStock}) reached in cart.`);
          } else {
            showToast(`Updated "${product.title || existingItem.title}" quantity to ${newQty}.`);
          }

          const updated = [...prevCart];
          updated[existingIndex] = {
            ...existingItem,
            quantity: newQty,
            stock: itemStock,
          };
          wasAdded = true;
          return updated;
        } else {
          // New cart entry
          const initialQty = Math.min(stock, addQty);
          if (initialQty < addQty) {
            showToast(`Added ${initialQty} unit(s). Max available stock is ${stock}.`);
          } else {
            showToast(`Added "${product.title}" to cart!`);
          }

          const newItem = {
            id: product.id,
            title: product.title,
            price: Number(product.price) || 0,
            originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
            displayPriceUSD: product.displayPriceUSD || "",
            image: product.image || product.thumbnail || product.directImage || "",
            directImage: product.directImage || product.image || product.thumbnail || "",
            thumbnail: product.thumbnail || product.image || "",
            category: product.category || "Official Brand",
            brand: product.brand || "Official Store",
            stock: stock,
            quantity: initialQty,
          };

          wasAdded = true;
          return [...prevCart, newItem];
        }
      });

      return wasAdded;
    },
    [normalizeId, showToast]
  );

  /**
   * Clear all items in cart and coupon
   */
  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem("cart");
      localStorage.removeItem("appliedCoupon");
    } catch (e) {
      console.warn(e);
    }
    showToast("Shopping cart cleared.");
  }, [showToast]);

  /**
   * Apply coupon
   */
  const applyCoupon = useCallback(
    (coupon) => {
      setAppliedCoupon(coupon);
      showToast(`Coupon "${coupon.code}" applied successfully!`);
    },
    [showToast]
  );

  /**
   * Remove applied coupon
   */
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    showToast("Coupon removed.");
  }, [showToast]);

  // Cart financial totals
  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }, [cart]);

  const totalOriginal = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        (Number(item.originalPrice) || Number(item.price) || 0) *
          (Number(item.quantity) || 1),
      0
    );
  }, [cart]);

  const totalSavings = totalOriginal > subtotal ? totalOriginal - subtotal : 0;

  // Coupon discount calculation
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const calc = validateAndCalculateCoupon(appliedCoupon.code, subtotal);
    return calc.isValid ? calc.discount : 0;
  }, [appliedCoupon, subtotal]);

  const grandTotal = Math.max(0, subtotal - couponDiscount);
  const totalUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [cart]);

  const value = {
    cart,
    cartCount: totalUnits, // Total units in cart
    distinctCount: cart.length, // Distinct items
    appliedCoupon,
    isCartOpen,
    setIsCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    toastMessage,
    showToast,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    isInCart,
    getItemQuantity,
    subtotal,
    totalPrice: subtotal,
    totalOriginal,
    totalSavings,
    couponDiscount,
    grandTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export default CartContext;
