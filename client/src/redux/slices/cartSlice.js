import { createSlice } from "@reduxjs/toolkit";
import { validateAndCalculateCoupon } from "../../data/couponsData.js";

/**
 * Normalizes IDs to prevent format mismatch (e.g. "prod-8" vs 8)
 */
const normalizeId = (id) => String(id ?? "").replace(/^prod-/, "");

/**
 * Safe local storage loaders
 */
const loadInitialCart = () => {
  try {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.warn("Could not read cart from localStorage:", e);
    return [];
  }
};

const loadInitialCoupon = () => {
  try {
    const saved = localStorage.getItem("appliedCoupon");
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.warn("Could not read appliedCoupon from localStorage:", e);
    return null;
  }
};

const persistCart = (items) => {
  try {
    localStorage.setItem("cart", JSON.stringify(items));
  } catch (e) {
    console.warn("Could not persist cart to localStorage:", e);
  }
};

const persistCoupon = (coupon) => {
  try {
    if (coupon) {
      localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
    } else {
      localStorage.removeItem("appliedCoupon");
    }
  } catch (e) {
    console.warn("Could not persist coupon to localStorage:", e);
  }
};

const initialState = {
  items: loadInitialCart(),
  appliedCoupon: loadInitialCoupon(),
  isCartOpen: false,
  toastMessage: null,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /**
     * Add an item to cart or increment quantity if existing, with stock checks
     */
    addToCart: (state, action) => {
      const payload = action.payload?.product || action.payload;
      const quantityToAdd = Math.max(1, Number(action.payload?.quantity || 1));

      if (!payload || payload.id === undefined || payload.id === null) return;

      const cleanId = normalizeId(payload.id);
      const rawStock = payload.stock !== undefined ? Number(payload.stock) : 99;
      const stock = isNaN(rawStock) ? 99 : Math.max(0, rawStock);

      if (stock <= 0) {
        state.toastMessage = `"${payload.title || "Product"}" is currently out of stock.`;
        return;
      }

      const existingIndex = state.items.findIndex(
        (item) => item.id === payload.id || normalizeId(item.id) === cleanId
      );

      if (existingIndex > -1) {
        const existingItem = state.items[existingIndex];
        const currentQty = Number(existingItem.quantity) || 1;
        const itemStock = existingItem.stock !== undefined ? Number(existingItem.stock) : stock;

        if (currentQty >= itemStock) {
          state.toastMessage = `Stock limit reached! Only ${itemStock} unit${itemStock > 1 ? "s" : ""} available.`;
          return;
        }

        const newQty = Math.min(itemStock, currentQty + quantityToAdd);
        const actualAdded = newQty - currentQty;

        existingItem.quantity = newQty;
        existingItem.stock = itemStock;

        if (actualAdded < quantityToAdd) {
          state.toastMessage = `Added ${actualAdded} unit(s). Maximum stock (${itemStock}) reached in cart.`;
        } else {
          state.toastMessage = `Updated "${payload.title || existingItem.title}" quantity to ${newQty}.`;
        }
      } else {
        const initialQty = Math.min(stock, quantityToAdd);
        const newItem = {
          id: payload.id,
          title: payload.title || "Product",
          price: Number(payload.price) || 0,
          originalPrice: Number(payload.originalPrice) || Number(payload.price) || 0,
          displayPriceUSD: payload.displayPriceUSD || "",
          image: payload.image || payload.thumbnail || payload.directImage || "",
          directImage: payload.directImage || payload.image || payload.thumbnail || "",
          thumbnail: payload.thumbnail || payload.image || "",
          category: payload.category || "Official Brand",
          brand: payload.brand || "Official Store",
          stock: stock,
          quantity: initialQty,
        };

        state.items.push(newItem);

        if (initialQty < quantityToAdd) {
          state.toastMessage = `Added ${initialQty} unit(s). Max available stock is ${stock}.`;
        } else {
          state.toastMessage = `Added "${payload.title}" to cart!`;
        }
      }

      persistCart(state.items);
    },

    /**
     * Remove item completely from cart
     */
    removeFromCart: (state, action) => {
      const rawId = action.payload?.id !== undefined ? action.payload.id : action.payload;
      const cleanId = normalizeId(rawId);

      const itemToRemove = state.items.find(
        (c) => c.id === rawId || normalizeId(c.id) === cleanId
      );

      state.items = state.items.filter(
        (c) => c.id !== rawId && normalizeId(c.id) !== cleanId
      );

      if (itemToRemove) {
        state.toastMessage = `Removed "${itemToRemove.title}" from cart.`;
      }

      persistCart(state.items);
    },

    /**
     * Update quantity of an item with stock clamping
     */
    updateQuantity: (state, action) => {
      const rawId = action.payload?.id !== undefined ? action.payload.id : action.payload?.productId;
      const cleanId = normalizeId(rawId);
      const targetQty = Number(action.payload?.quantity);

      if (isNaN(targetQty) || targetQty <= 0) {
        // Remove item if target quantity is 0 or negative
        const itemToRemove = state.items.find(
          (c) => c.id === rawId || normalizeId(c.id) === cleanId
        );
        state.items = state.items.filter(
          (c) => c.id !== rawId && normalizeId(c.id) !== cleanId
        );
        if (itemToRemove) {
          state.toastMessage = `Removed "${itemToRemove.title}" from cart.`;
        }
        persistCart(state.items);
        return;
      }

      const item = state.items.find(
        (c) => c.id === rawId || normalizeId(c.id) === cleanId
      );

      if (!item) return;

      const stock = item.stock !== undefined ? Number(item.stock) : 99;

      if (targetQty > stock) {
        item.quantity = stock;
        state.toastMessage = `Cannot exceed available stock (${stock} units).`;
      } else {
        item.quantity = targetQty;
      }

      persistCart(state.items);
    },

    /**
     * Clear all items and coupon after order completion
     */
    clearCart: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.toastMessage = "Shopping cart cleared.";
      try {
        localStorage.removeItem("cart");
        localStorage.removeItem("appliedCoupon");
      } catch (e) {
        console.warn(e);
      }
    },

    /**
     * Apply coupon
     */
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
      state.toastMessage = `Coupon "${action.payload?.code || ""}" applied successfully!`;
      persistCoupon(action.payload);
    },

    /**
     * Remove applied coupon
     */
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.toastMessage = "Coupon removed.";
      persistCoupon(null);
    },

    /**
     * Drawer controls & toast helpers
     */
    openCart: (state) => {
      state.isCartOpen = true;
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    setIsCartOpen: (state, action) => {
      state.isCartOpen = Boolean(action.payload);
    },
    showToast: (state, action) => {
      state.toastMessage = action.payload;
    },
    clearToast: (state) => {
      state.toastMessage = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCoupon,
  removeCoupon,
  openCart,
  closeCart,
  toggleCart,
  setIsCartOpen,
  showToast,
  clearToast,
} = cartSlice.actions;

/**
 * Memoized Selectors for Redux State
 */
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
export const selectDistinctCount = (state) => state.cart.items.length;
export const selectAppliedCoupon = (state) => state.cart.appliedCoupon;
export const selectIsCartOpen = (state) => state.cart.isCartOpen;
export const selectToastMessage = (state) => state.cart.toastMessage;

export const selectSubtotal = (state) =>
  state.cart.items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

export const selectTotalOriginal = (state) =>
  state.cart.items.reduce(
    (sum, item) =>
      sum +
      (Number(item.originalPrice) || Number(item.price) || 0) *
        (Number(item.quantity) || 1),
    0
  );

export const selectTotalSavings = (state) => {
  const orig = selectTotalOriginal(state);
  const sub = selectSubtotal(state);
  return orig > sub ? orig - sub : 0;
};

export const selectCouponDiscount = (state) => {
  const coupon = state.cart.appliedCoupon;
  if (!coupon) return 0;
  const subtotal = selectSubtotal(state);
  const calc = validateAndCalculateCoupon(coupon.code, subtotal);
  return calc.isValid ? calc.discount : 0;
};

export const selectGrandTotal = (state) => {
  const subtotal = selectSubtotal(state);
  const discount = selectCouponDiscount(state);
  return Math.max(0, subtotal - discount);
};

export const selectIsInCart = (productId) => (state) => {
  const cleanId = normalizeId(productId);
  return state.cart.items.some(
    (item) => item.id === productId || normalizeId(item.id) === cleanId
  );
};

export const selectItemQuantity = (productId) => (state) => {
  const cleanId = normalizeId(productId);
  const item = state.cart.items.find(
    (c) => c.id === productId || normalizeId(c.id) === cleanId
  );
  return item ? Number(item.quantity) || 1 : 0;
};

export default cartSlice.reducer;
