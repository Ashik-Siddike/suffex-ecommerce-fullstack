import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { useDispatch, useSelector } from "react-redux";
import { selectToastMessage, clearToast } from "./redux/slices/cartSlice";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import AdminRoute from "./components/AdminRoute";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ContactPage from "./pages/ContactPage";
import WishlistPage from "./pages/WishlistPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

/**
 * ScrollToTop Component
 * Ensures window smoothly resets to the top on every route transition
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

/**
 * AppContent Component
 * Renders header, footer, toast notifications, drawers, and active routes
 */
function AppContent() {
  const dispatch = useDispatch();
  const toastMessage = useSelector(selectToastMessage);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        dispatch(clearToast());
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, dispatch]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative selection:bg-cyan-500/20 selection:text-cyan-800">
      <ScrollToTop />

      {/* Global Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-white/95 backdrop-blur-xl text-slate-900 px-5 py-3.5 rounded-2xl shadow-2xl shadow-slate-900/10 flex items-center gap-3 border border-slate-200 text-xs font-semibold animate-bounce max-w-sm">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
            ✓
          </div>
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Sticky Header Navigation */}
      <Navbar />

      {/* Main Page Content Routed via react-router-dom */}
      <main className="flex-1 w-full pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Protected Administrator Dashboard Route */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Mobile Floating Bottom Navigation */}
      <BottomNav />

      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer />
    </div>
  );
}

/**
 * Root App with Global AuthProvider, CartProvider & WishlistProvider
 */
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AppContent />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
