import { createContext, useContext, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCartItems,
  selectCartCount,
  selectDistinctCount,
  selectAppliedCoupon,
  selectIsCartOpen,
  selectToastMessage,
  selectSubtotal,
  selectTotalOriginal,
  selectTotalSavings,
  selectCouponDiscount,
  selectGrandTotal,
  addToCart as rtkAddToCart,
  removeFromCart as rtkRemoveFromCart,
  updateQuantity as rtkUpdateQuantity,
  clearCart as rtkClearCart,
  applyCoupon as rtkApplyCoupon,
  removeCoupon as rtkRemoveCoupon,
  openCart as rtkOpenCart,
  closeCart as rtkCloseCart,
  setIsCartOpen as rtkSetIsCartOpen,
  showToast as rtkShowToast,
  clearToast as rtkClearToast,
} from "../redux/slices/cartSlice";

const CartContext = createContext(null);

/**
 * Normalizes IDs to prevent format mismatch (e.g. "prod-8" vs 8)
 */
const normalizeId = (id) => String(id ?? "").replace(/^prod-/, "");

/**
 * CartProvider Adapter
 * Seamlessly exposes the Redux Toolkit shopping cart store via the standard
 * CartContext interface for full backward compatibility and zero regressions.
 */
export function CartProvider({ children }) {
  const dispatch = useDispatch();

  const cart = useSelector(selectCartItems);
  const cartCount = useSelector(selectCartCount);
  const distinctCount = useSelector(selectDistinctCount);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const isCartOpen = useSelector(selectIsCartOpen);
  const toastMessage = useSelector(selectToastMessage);
  const subtotal = useSelector(selectSubtotal);
  const totalOriginal = useSelector(selectTotalOriginal);
  const totalSavings = useSelector(selectTotalSavings);
  const couponDiscount = useSelector(selectCouponDiscount);
  const grandTotal = useSelector(selectGrandTotal);

  const addToCart = useCallback(
    (product, quantityToAdd = 1) => {
      if (!product || !product.id) return false;
      dispatch(rtkAddToCart({ ...product, quantity: quantityToAdd }));
      return true;
    },
    [dispatch]
  );

  const removeFromCart = useCallback(
    (productId) => {
      dispatch(rtkRemoveFromCart(productId));
    },
    [dispatch]
  );

  const updateQuantity = useCallback(
    (productId, newQuantity) => {
      dispatch(rtkUpdateQuantity({ id: productId, quantity: newQuantity }));
    },
    [dispatch]
  );

  const clearCart = useCallback(() => {
    dispatch(rtkClearCart());
  }, [dispatch]);

  const applyCoupon = useCallback(
    (coupon) => {
      dispatch(rtkApplyCoupon(coupon));
    },
    [dispatch]
  );

  const removeCoupon = useCallback(() => {
    dispatch(rtkRemoveCoupon());
  }, [dispatch]);

  const openCart = useCallback(() => {
    dispatch(rtkOpenCart());
  }, [dispatch]);

  const closeCart = useCallback(() => {
    dispatch(rtkCloseCart());
  }, [dispatch]);

  const setIsCartOpen = useCallback(
    (isOpen) => {
      dispatch(rtkSetIsCartOpen(isOpen));
    },
    [dispatch]
  );

  const showToast = useCallback(
    (msg) => {
      dispatch(rtkShowToast(msg));
    },
    [dispatch]
  );

  const clearToast = useCallback(() => {
    dispatch(rtkClearToast());
  }, [dispatch]);

  const isInCart = useCallback(
    (productId) => {
      const cleanId = normalizeId(productId);
      return cart.some((item) => item.id === productId || normalizeId(item.id) === cleanId);
    },
    [cart]
  );

  const getItemQuantity = useCallback(
    (productId) => {
      const cleanId = normalizeId(productId);
      const item = cart.find((c) => c.id === productId || normalizeId(c.id) === cleanId);
      return item ? Number(item.quantity) || 1 : 0;
    },
    [cart]
  );

  const value = {
    cart,
    cartCount,
    distinctCount,
    appliedCoupon,
    isCartOpen,
    setIsCartOpen,
    openCart,
    closeCart,
    toastMessage,
    showToast,
    clearToast,
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
