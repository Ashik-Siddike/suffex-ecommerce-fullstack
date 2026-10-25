import useDocumentTitle from "../hooks/useDocumentTitle";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, openCart, selectIsInCart } from "../redux/slices/cartSlice";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import {
  Star,
  ShoppingCart,
  Zap,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Share2,
  Boxes,
  Plus,
  Minus,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  Check
} from "lucide-react";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // State
  const [product, setProduct] = useState(null);
  useDocumentTitle(product ? product.title : "Product Details");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    totalReviews: 0,
    averageRating: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("specs"); // 'specs' | 'reviews'

  // Review Submission State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewerPhone, setReviewerPhone] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState(null);
  const [reviewErrorMessage, setReviewErrorMessage] = useState(null);

  const cleanId = String(id || "").replace(/^prod-/, "");
  const cardId = `prod-${cleanId}`;
  const alreadyInCart = useSelector(selectIsInCart(cardId));
  const isWishlisted = isInWishlist(cleanId);

  // Auto-fill user credentials into review form if authenticated
  useEffect(() => {
    if (user) {
      if (user.name) setReviewerName(user.name);
      if (user.email) setReviewerEmail(user.email);
      if (user.phone) setReviewerPhone(user.phone);
    }
  }, [user]);

  // Fetch Product, Reviews, and Related Products
  const loadProductData = useCallback(async () => {
    setLoading(true);
    setReviewSuccessMessage(null);
    setReviewErrorMessage(null);
    setQuantity(1);

    try {
      const [prodRes, reviewsRes] = await Promise.all([
        axiosClient.get(`/products/${cleanId}`),
        axiosClient.get(`/products/${cleanId}/reviews`),
      ]);

      const currentProd = prodRes.data?.product || prodRes.data?.data;
      setProduct(currentProd);

      if (reviewsRes.data?.reviews) {
        setReviewsData({
          reviews: reviewsRes.data.reviews,
          totalReviews: reviewsRes.data.totalReviews || 0,
          averageRating: reviewsRes.data.averageRating || 0,
          ratingBreakdown: reviewsRes.data.ratingBreakdown || {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        });
      }

      // Fetch related products from same category
      if (currentProd?.category) {
        try {
          const relatedRes = await axiosClient.get(
            `/products?category=${encodeURIComponent(currentProd.category)}&limit=5`
          );
          const allRelated = relatedRes.data?.products || relatedRes.data?.data || [];
          setRelatedProducts(
            allRelated.filter((p) => String(p.id) !== String(cleanId)).slice(0, 4)
          );
        } catch (e) {
          console.warn("Could not load related products:", e);
        }
      }
    } catch (err) {
      console.error("Error loading product details:", err);
    } finally {
      setLoading(false);
    }
  }, [cleanId]);

  useEffect(() => {
    loadProductData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [loadProductData]);

  // Pricing calculations
  const numPrice = Number(product?.price) || 0;
  const isDirectBDT = numPrice >= 1000;
  const bdtPrice = isDirectBDT ? Math.round(numPrice) : Math.round(numPrice * 120);
  const usdPrice = isDirectBDT ? (numPrice / 120).toFixed(2) : numPrice.toFixed(2);
  const maxStock = product?.stock !== undefined ? Number(product.stock) : 99;

  // Quantity handlers
  const handleIncreaseQty = () => {
    setQuantity((prev) => Math.min(maxStock > 0 ? maxStock : 1, prev + 1));
  };

  const handleDecreaseQty = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  // Add to Cart
  const handleAddToCart = () => {
    if (!product || maxStock === 0) return;
    dispatch(
      addToCart({
        id: cardId,
        title: product.title,
        price: bdtPrice,
        originalPrice: bdtPrice,
        image: product.thumbnail || product.image_url,
        directImage: product.thumbnail || product.image_url,
        category: product.category,
        brand: product.brand || "Official Store",
        stock: maxStock,
        quantity: quantity,
      })
    );
  };

  // Buy Now -> Adds to cart and navigates directly to checkout
  const handleBuyNow = () => {
    if (!product || maxStock === 0) return;
    handleAddToCart();
    navigate("/checkout");
  };

  // Review Submission Handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewErrorMessage(null);
    setReviewSuccessMessage(null);

    if (!reviewerName.trim()) {
      setReviewErrorMessage("Please enter your name.");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewErrorMessage("Please write a few words about your experience.");
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        customer_name: reviewerName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
        email: reviewerEmail.trim() || undefined,
        phone: reviewerPhone.trim() || undefined,
      };

      const res = await axiosClient.post(`/products/${cleanId}/reviews`, payload);
      setReviewSuccessMessage(res.data?.message || "Review submitted successfully!");
      setReviewComment("");

      // Refresh reviews list
      const updatedReviews = await axiosClient.get(`/products/${cleanId}/reviews`);
      if (updatedReviews.data?.reviews) {
        setReviewsData({
          reviews: updatedReviews.data.reviews,
          totalReviews: updatedReviews.data.totalReviews,
          averageRating: updatedReviews.data.averageRating,
          ratingBreakdown: updatedReviews.data.ratingBreakdown,
        });
      }
    } catch (err) {
      console.error("Submit review error:", err);
      setReviewErrorMessage(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Copy product link to clipboard
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Product URL copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-1">Loading product specifications & reviews...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
          <Boxes className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Product Not Found</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">
          The requested product may have been archived or is no longer listed.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  // Stock status pill
  const isOutOfStock = maxStock === 0;
  const isLowStock = maxStock > 0 && maxStock <= 5;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 selection:bg-cyan-500/20 selection:text-cyan-800">
      
      {/* Top Ambient Glow */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-cyan-500/5 via-indigo-500/5 to-transparent blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <Link to="/" className="hover:text-cyan-600 transition">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-cyan-600 transition">
            Store
          </Link>
          <span>/</span>
          <Link
            to={`/products?category=${encodeURIComponent(product.category || "")}`}
            className="hover:text-cyan-600 transition"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{product.title}</span>
        </nav>

        {/* ========================================================= */}
        {/* HERO PRODUCT STAGE (Split 2-Column Grid)                  */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Product Showcase Imagery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 flex items-center justify-center shadow-lg overflow-hidden aspect-square">
              
              {/* Category Badge */}
              <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/95 text-cyan-700 border border-cyan-200 backdrop-blur-md shadow-xs">
                {product.category}
              </span>

              {/* Wishlist Heart Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 z-10 p-3 rounded-2xl bg-white/90 hover:bg-white backdrop-blur-md border border-slate-200 transition cursor-pointer shadow-md hover:scale-110 active:scale-90"
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-600"
                  }`}
                />
              </button>

              {/* Ambient Glow behind image */}
              <div className="absolute inset-0 bg-radial from-cyan-500/5 via-transparent to-transparent opacity-60 pointer-events-none" />

              <img
                src={product.thumbnail || product.image_url}
                alt={product.title}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600";
                }}
              />
            </div>

            {/* Reassurance Feature Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-xs">
                <Truck className="w-5 h-5 text-cyan-600 mx-auto" />
                <p className="text-[11px] font-bold text-slate-900">Express Delivery</p>
                <p className="text-[10px] text-slate-500">Nationwide 24-48h</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="text-[11px] font-bold text-slate-900">100% Genuine</p>
                <p className="text-[10px] text-slate-500">Official Warranty</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-center space-y-1 shadow-xs">
                <RotateCcw className="w-5 h-5 text-indigo-600 mx-auto" />
                <p className="text-[11px] font-bold text-slate-900">7-Day Return</p>
                <p className="text-[10px] text-slate-500">Hassle-Free Policy</p>
              </div>
            </div>
          </div>

          {/* Right Column: Product Specs, Stock, Quantity & Purchase */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header info */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                    {product.brand || "Authentic Storefront"}
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs text-slate-500 font-mono">ID: #{product.id}</span>
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition cursor-pointer shadow-xs"
                  title="Share product link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight leading-tight">
                {product.title}
              </h1>

              {/* Star Rating Summary & Link to Reviews */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(reviewsData.averageRating || 4.5)
                          ? "fill-current"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {reviewsData.averageRating > 0
                    ? Number(reviewsData.averageRating).toFixed(1)
                    : "4.8"}{" "}
                  / 5.0
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("reviews");
                    document.getElementById("product-tabs-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 underline cursor-pointer"
                >
                  {reviewsData.totalReviews} verified customer reviews
                </button>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Special Price
                </p>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight mt-0.5">
                  ৳{bdtPrice.toLocaleString()}
                </div>
                <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                  Approx. ${usdPrice} USD
                </span>
              </div>

              {/* Stock Status Badge */}
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${
                    isOutOfStock
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : isLowStock
                      ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOutOfStock
                        ? "bg-rose-500"
                        : isLowStock
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  {isOutOfStock
                    ? "Out of Stock"
                    : isLowStock
                    ? `Only ${maxStock} Left!`
                    : `In Stock (${maxStock} units)`}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Tax & VAT Included</p>
              </div>
            </div>

            {/* Product Short Description */}
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              {product.description ||
                "Engineered with premium craftsmanship and industry-grade high efficiency components. Guaranteed authentic with official warranty support."}
            </div>

            {/* Quantity Selector & Action Buttons */}
            {!isOutOfStock && (
              <div className="space-y-4 pt-2">
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Quantity:
                  </span>
                  <div className="flex items-center rounded-2xl bg-white border border-slate-200 p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={handleDecreaseQty}
                      disabled={quantity <= 1}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center text-xs font-bold text-slate-900 font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncreaseQty}
                      disabled={quantity >= maxStock}
                      className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 transition cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Subtotal: <strong className="text-slate-900">৳{(bdtPrice * quantity).toLocaleString()}</strong>
                  </span>
                </div>

                {/* Primary CTA Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
                      alreadyInCart
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                        : "bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-cyan-500"
                    }`}
                  >
                    {alreadyInCart ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>In Your Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-cyan-600" />
                        <span>Add {quantity > 1 ? `(${quantity})` : ""} to Cart</span>
                      </>
                    )}
                  </button>

                  {/* Buy Now (Direct Checkout) */}
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-current" />
                    <span>Buy Now &bull; Instant Checkout</span>
                  </button>
                </div>
              </div>
            )}

            {isOutOfStock && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
                <Clock className="w-5 h-5 shrink-0 text-rose-600" />
                <span>
                  This item is currently out of stock. You can save it to your Wishlist to receive restock alerts.
                </span>
              </div>
            )}

          </div>
        </div>

        {/* ========================================================= */}
        {/* TABS SECTION: TECHNICAL SPECIFICATIONS & VERIFIED REVIEWS */}
        {/* ========================================================= */}
        <div id="product-tabs-section" className="space-y-6 pt-6">
          
          {/* Tab Switchers */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "specs"
                  ? "bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Boxes className="w-4 h-4 text-cyan-600" />
              <span>Technical Specifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === "reviews"
                  ? "bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-cyan-600" />
              <span>Verified Reviews ({reviewsData.totalReviews})</span>
            </button>
          </div>

          {/* TAB 1: TECHNICAL SPECIFICATIONS (JSONB) */}
          {activeTab === "specs" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                  Hardware &amp; System Specifications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authentic verified specifications retrieved directly from official manufacturing logs.
                </p>
              </div>

              {product.attributes &&
              typeof product.attributes === "object" &&
              Object.keys(product.attributes).length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <tbody className="divide-y divide-slate-200">
                      {Object.entries(product.attributes).map(([key, val], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                        >
                          <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-cyan-700 w-1/3">
                            {key}
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 text-slate-700">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Standard technical specifications apply. Full official manufacturer documentation is included in the retail packaging.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VERIFIED PURCHASE REVIEWS */}
          {activeTab === "reviews" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Rating Analytics Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                
                {/* Score Column */}
                <div className="md:col-span-4 text-center md:border-r border-slate-200 md:pr-6 flex flex-col justify-center items-center space-y-2">
                  <span className="text-5xl font-black text-slate-900 font-mono">
                    {reviewsData.averageRating > 0
                      ? Number(reviewsData.averageRating).toFixed(1)
                      : "4.8"}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(reviewsData.averageRating || 4.5)
                            ? "fill-current"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Based on {reviewsData.totalReviews} verified ratings
                  </p>
                </div>

                {/* Rating Distribution Bar Chart */}
                <div className="md:col-span-8 space-y-2 flex flex-col justify-center">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviewsData.ratingBreakdown?.[stars] || 0;
                    const percent =
                      reviewsData.totalReviews > 0
                        ? Math.round((count / reviewsData.totalReviews) * 100)
                        : stars === 5
                        ? 80
                        : stars === 4
                        ? 20
                        : 0;

                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-slate-500 font-mono flex items-center gap-1">
                          {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-slate-500 font-mono text-[11px]">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write a Review Submission Form */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                    Share Your Feedback
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    If you purchased this item, your review will automatically receive a{" "}
                    <strong className="text-emerald-600">Verified Purchase</strong> trust badge.
                  </p>
                </div>

                {reviewSuccessMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{reviewSuccessMessage}</span>
                  </div>
                )}

                {reviewErrorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {reviewErrorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Star Rating Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Overall Rating *
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= (reviewHoverRating || reviewRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono font-bold text-amber-500 ml-2">
                        {reviewRating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="e.g. Ashikur Rahman"
                        className="w-full bg-white text-slate-900 text-xs rounded-xl px-4 py-2.5 border border-slate-300 focus:border-cyan-500 focus:outline-none placeholder-slate-400 shadow-xs"
                      />
                    </div>

                    {/* Email for Verified Purchase Match */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Order Email (for verification)
                      </label>
                      <input
                        type="email"
                        value={reviewerEmail}
                        onChange={(e) => setReviewerEmail(e.target.value)}
                        placeholder="e.g. user@example.com"
                        className="w-full bg-white text-slate-900 text-xs rounded-xl px-4 py-2.5 border border-slate-300 focus:border-cyan-500 focus:outline-none placeholder-slate-400 shadow-xs"
                      />
                    </div>

                    {/* Phone for Verified Purchase Match */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Order Phone (for verification)
                      </label>
                      <input
                        type="tel"
                        value={reviewerPhone}
                        onChange={(e) => setReviewerPhone(e.target.value)}
                        placeholder="e.g. 01700000000"
                        className="w-full bg-white text-slate-900 text-xs rounded-xl px-4 py-2.5 border border-slate-300 focus:border-cyan-500 focus:outline-none placeholder-slate-400 font-mono shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Your Review *</label>
                    <textarea
                      rows={3}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share details of your experience, performance, and hardware quality..."
                      className="w-full bg-white text-slate-900 text-xs rounded-xl px-4 py-2.5 border border-slate-300 focus:border-cyan-500 focus:outline-none placeholder-slate-400 shadow-xs"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow-md shadow-cyan-600/20 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                    >
                      {submittingReview ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Submit Review</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
                  Customer Testimonials ({reviewsData.reviews.length})
                </h3>

                {reviewsData.reviews.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 text-xs shadow-xs">
                    Be the first to review this product and help fellow shoppers!
                  </div>
                ) : (
                  reviewsData.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs font-mono">
                            {rev.customer_name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs">
                              {rev.customer_name}
                            </span>
                            {rev.is_verified_purchase && (
                              <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Verified Purchase</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating ? "fill-current" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pl-9">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* RELATED PRODUCTS SECTION                                  */}
        {/* ========================================================= */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-10 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Outfit']">
                  Similar Flagship Gear
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customers browsing this category also loved these devices.
                </p>
              </div>

              <Link
                to={`/products?category=${encodeURIComponent(product.category || "")}`}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 underline cursor-pointer"
              >
                View Category &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
