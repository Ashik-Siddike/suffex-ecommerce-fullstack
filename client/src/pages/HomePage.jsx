import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, removeFromCart, selectIsInCart } from "../redux/slices/cartSlice";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import useProducts from "../hooks/useProducts";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Flame,
  Truck,
  ShieldCheck,
  RotateCcw,
  Clock,
  Headphones,
  Check,
  Copy,
  Star,
  Smartphone,
  Laptop,
  Heart,
  Tag,
  Zap,
  Search,
  Watch,
  Keyboard,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Percent,
  SlidersHorizontal,
  Volume2,
  Activity,
  BatteryCharging,
  Eye,
  Award,
} from "lucide-react";


// ========================================================
// THUMBNAIL CAROUSEL STRIP (HOVER TRIGGERED)
// ========================================================
const FULL_THUMB_WIDTH = 140;
const COLLAPSED_THUMB_WIDTH = 48;
const THUMB_GAP = 6;

function HeroThumbnails({ slides, activeSlide, onSelectSlide }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      let scrollPos = 0;
      for (let i = 0; i < activeSlide; i++) {
        scrollPos += COLLAPSED_THUMB_WIDTH + THUMB_GAP;
      }
      const containerWidth = scrollRef.current.offsetWidth || 1;
      const centerOffset = containerWidth / 2 - FULL_THUMB_WIDTH / 2;
      scrollPos -= centerOffset;

      scrollRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "smooth",
      });
    }
  }, [activeSlide]);

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto no-scrollbar py-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex items-center gap-2 h-20 mx-auto" style={{ width: "fit-content" }}>
        {slides.map((slide, idx) => {
          const isSelected = idx === activeSlide;
          return (
            <motion.button
              key={slide.id}
              onClick={() => onSelectSlide(idx)}
              onMouseEnter={() => onSelectSlide(idx)}
              initial={false}
              animate={{
                width: isSelected ? FULL_THUMB_WIDTH : COLLAPSED_THUMB_WIDTH,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`relative shrink-0 h-full overflow-hidden rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg scale-[1.02]"
                  : "border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300"
              }`}
              title={slide.title}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 pointer-events-none">
                {isSelected ? (
                  <span className="text-[10px] font-bold text-cyan-300 truncate font-['Outfit'] block leading-tight">
                    {slide.title}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-white/90 block text-center">
                    0{idx + 1}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage({
  onNavigate,
  cart: propCart,
  onAddToCart: propAddToCart,
  onRemoveFromCart: propRemoveFromCart,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartContext = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const cart = propCart !== undefined ? propCart : cartContext.cart;
  const onAddToCart = propAddToCart || cartContext.addToCart;
  const onRemoveFromCart = propRemoveFromCart || cartContext.removeFromCart;

  useDocumentTitle("Suffex E-Commerce | Binomo-Inspired Tech Experience");

  const [copiedCode, setCopiedCode] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");
  const [activeCatalogCategory, setActiveCatalogCategory] = useState("all");

  // Live Flash Sale Countdown Timer (Deals of the day)
  const [timeLeft, setTimeLeft] = useState({
    hours: "08",
    minutes: "42",
    seconds: "15",
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    calculateTimeRemaining();
    const timerInterval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const handleNavigation = (destination) => {
    if (onNavigate) {
      onNavigate(destination);
    } else {
      if (destination === "products" || destination === "/products") {
        navigate("/products");
      } else if (destination === "orders" || destination === "/my-orders") {
        navigate("/my-orders");
      } else if (destination === "contact" || destination === "/contact") {
        navigate("/contact");
      } else if (destination === "checkout" || destination === "/checkout") {
        navigate("/checkout");
      } else if (destination === "home" || destination === "/") {
        navigate("/");
      } else if (destination.startsWith("/")) {
        navigate(destination);
      } else {
        navigate("/" + destination);
      }
    }
  };

  // Fetch live products for landing page catalog (Most sold this week)
  const {
    products: catalogProducts,
    loading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useProducts({
    category: activeCatalogCategory === "all" ? "" : activeCatalogCategory,
    limit: 8,
  });

  const catalogTabs = [
    { id: "all", label: "All Items", icon: Sparkles },
    { id: "smartphones", label: "Smartphones", icon: Smartphone },
    { id: "laptops", label: "Laptops & PC", icon: Laptop },
    { id: "audio", label: "Headphones & Audio", icon: Headphones },
    { id: "accessories", label: "Smartwatch & Gear", icon: Watch },
  ];

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    const query = heroSearch.trim();
    if (query) {
      navigate(`/products?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/products");
    }
  };

  const handleCategoryClick = (catId) => {
    setActiveCatalogCategory(catId);
    const catalogEl = document.getElementById("most-sold-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Binomo-Style High-Impact Hero Slider
  const heroSlides = [
    {
      id: 1,
      badge: "Smart Technology",
      badgeIcon: Smartphone,
      title: "Stay Connected With Flagship Titanium",
      subtitle: "Aerospace Titanium frame, Super Retina XDR with ProMotion, and official 1-year brand warranty.",
      quote: "Top-notch performance and unrivaled battery endurance for everyday power users.",
      priceBDT: 105000,
      originalPriceBDT: 120000,
      discount: "Save ৳15,000",
      rating: 4.9,
      reviews: "1,240 Verified Reviews",
      image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=700&auto=format&fit=crop&q=80",
      accentGlow: "from-cyan-500/20 via-blue-500/10 to-transparent",
      accentColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
      category: "smartphones",
    },
    {
      id: 8,
      badge: "Smart Sound",
      badgeIcon: Headphones,
      title: "Sound Without Limits: Studio Hi-Fi",
      subtitle: "Industry-leading noise cancellation, dual processors, and crystal-clear 30-hour lossless playback.",
      quote: "A transformative acoustic experience that completely blocks out ambient city noise.",
      priceBDT: 38500,
      originalPriceBDT: 44000,
      discount: "12% OFF",
      rating: 4.9,
      reviews: "2,150 Verified Reviews",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
      accentGlow: "from-violet-500/20 via-purple-500/10 to-transparent",
      accentColor: "text-violet-400 bg-violet-500/10 border-violet-500/30",
      category: "audio",
    },
    {
      id: 4,
      badge: "Pro Workstation",
      badgeIcon: Laptop,
      title: "Power For Creators: MacBook Pro M3",
      subtitle: "Supercharged by Apple M3 Max silicon, 120Hz Liquid Retina XDR, and MagSafe ultra-fast charging.",
      quote: "Blazing compilation speeds and unmatched multi-stream 4K editing capability.",
      priceBDT: 340000,
      originalPriceBDT: 365000,
      discount: "Save ৳25,000",
      rating: 5.0,
      reviews: "880 Verified Reviews",
      image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=700&auto=format&fit=crop&q=80",
      accentGlow: "from-blue-500/20 via-indigo-500/10 to-transparent",
      accentColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      category: "laptops",
    },
    {
      id: 9,
      badge: "Ultra Wearable",
      badgeIcon: Watch,
      title: "Apple Watch Ultra 2 GPS + Cellular",
      subtitle: "Precision dual-frequency GPS, 3000 nits brightness display, and aerospace-grade 49mm titanium case.",
      quote: "The ultimate rugged companion for extreme endurance and everyday health tracking.",
      priceBDT: 94000,
      originalPriceBDT: 105000,
      discount: "10% OFF",
      rating: 4.9,
      reviews: "950 Verified Reviews",
      image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=700&auto=format&fit=crop&q=80",
      accentGlow: "from-amber-500/20 via-orange-500/10 to-transparent",
      accentColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      category: "accessories",
    },
    {
      id: 11,
      badge: "Custom Mechanical",
      badgeIcon: Keyboard,
      title: "Keychron Q1 Pro Wireless Mechanical",
      subtitle: "Full CNC aluminum body, double-gasket design, and hot-swappable switches for unmatched typing feel.",
      quote: "Crisp acoustic feedback with sublime mechanical key travel and multi-device Bluetooth.",
      priceBDT: 23500,
      originalPriceBDT: 27000,
      discount: "13% OFF",
      rating: 4.8,
      reviews: "640 Verified Reviews",
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80",
      accentGlow: "from-emerald-500/20 via-teal-500/10 to-transparent",
      accentColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      category: "accessories",
    },
    {
      id: 6,
      badge: "Ultra Flagship",
      badgeIcon: Smartphone,
      title: "Samsung Galaxy S24 Ultra 5G AI",
      subtitle: "Snapdragon 8 Gen 3, built-in S-Pen, Galaxy AI live translation, and quad telephoto zoom system.",
      quote: "Incredible zoom clarity and breakthrough generative editing tools right in your pocket.",
      priceBDT: 154999,
      originalPriceBDT: 172000,
      discount: "Save ৳17,000",
      rating: 4.9,
      reviews: "1,420 Verified Reviews",
      image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=700&auto=format&fit=crop&q=80",
      accentGlow: "from-sky-500/20 via-indigo-500/10 to-transparent",
      accentColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
      category: "smartphones",
    },
  ];

  const currentSlide = heroSlides[activeSlide];

  // Auto-advance hero carousel with pause on hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, heroSlides.length]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Binomo-Inspired "Deals of the day" items
  const flashDeals = [
    {
      id: 8,
      title: "Sony WH-1000XM5 Wireless Headphones",
      category: "audio",
      price: 38500,
      originalPrice: 44000,
      discount: "12% OFF",
      rating: 4.9,
      soldCount: 19,
      totalStock: 25,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: 9,
      title: "Apple Watch Ultra 2 GPS + Cellular 49mm Titanium",
      category: "accessories",
      price: 94000,
      originalPrice: 105000,
      discount: "10% OFF",
      rating: 4.9,
      soldCount: 14,
      totalStock: 20,
      image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: 11,
      title: "Keychron Q1 Pro Wireless Mechanical Keyboard",
      category: "accessories",
      price: 23500,
      originalPrice: 27000,
      discount: "13% OFF",
      rating: 4.8,
      soldCount: 22,
      totalStock: 30,
      image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: 6,
      title: "Samsung Galaxy S24 Ultra 5G 512GB Titanium",
      category: "smartphones",
      price: 154999,
      originalPrice: 172000,
      discount: "10% OFF",
      rating: 5.0,
      soldCount: 11,
      totalStock: 15,
      image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
    },
  ];

  // Helper function to check if item is in cart
  const isItemInCart = (prodId) => {
    const cardId = `prod-${prodId}`;
    if (cart && Array.isArray(cart.items)) {
      return cart.items.some((i) => i.id === cardId || i.id === prodId);
    }
    return false;
  };

  const handleAddDealToCart = (deal, e) => {
    e.stopPropagation();
    const cardId = `prod-${deal.id}`;
    if (isItemInCart(deal.id)) {
      if (onRemoveFromCart) onRemoveFromCart(cardId);
      else dispatch(removeFromCart(cardId));
    } else {
      const itemData = {
        id: cardId,
        title: deal.title,
        price: deal.price,
        originalPrice: deal.originalPrice,
        image: deal.image,
        category: deal.category,
        brand: "Official Store",
        stock: 15,
        quantity: 1,
      };
      if (onAddToCart) onAddToCart(itemData);
      else dispatch(addToCart(itemData));
    }
  };

  const SlideBadgeIcon = currentSlide.badgeIcon;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-cyan-500/20 selection:text-cyan-800">
      {/* ========================================================
          SECTION 1: THUMBNAIL-CAROUSEL HERO EXPERIENCE
         ======================================================== */}
      <section
        className="relative pt-6 sm:pt-10 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-500/5 via-blue-500/5 to-indigo-500/5 blur-[130px] rounded-full pointer-events-none" />

        {/* Hero Card Container */}
        <div className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-10 shadow-xl overflow-hidden group">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Content Area */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-colors border-cyan-200 bg-cyan-50 text-cyan-700">
                  <SlideBadgeIcon className="w-3.5 h-3.5" />
                  <span>{currentSlide.badge}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-['Outfit'] tracking-tight leading-[1.1]">
                  {currentSlide.title}
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  {currentSlide.subtitle}
                </p>

                {/* Client Quote Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic max-w-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center shrink-0 text-cyan-600">
                    <Star className="w-4 h-4 fill-current text-amber-500" />
                  </div>
                  <div>
                    <span className="text-slate-900 font-semibold not-italic block">{currentSlide.reviews}</span>
                    <span>"{currentSlide.quote}"</span>
                  </div>
                </div>

                {/* Price & CTA Action */}
                <div className="pt-2 flex items-center gap-4 flex-wrap">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit']">
                      ৳{currentSlide.priceBDT.toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-400 line-through">
                      ৳{currentSlide.originalPriceBDT.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/products/${currentSlide.id}`)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/20 hover:opacity-95 active:scale-95 transition cursor-pointer flex items-center gap-2"
                  >
                    <span>Shop now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const itemData = {
                        id: `prod-${currentSlide.id}`,
                        title: currentSlide.title,
                        price: currentSlide.priceBDT,
                        originalPrice: currentSlide.originalPriceBDT,
                        image: currentSlide.image,
                        category: currentSlide.category,
                        brand: "Official Store",
                        stock: 15,
                        quantity: 1,
                      };
                      if (isItemInCart(currentSlide.id)) {
                        if (onRemoveFromCart) onRemoveFromCart(`prod-${currentSlide.id}`);
                        else dispatch(removeFromCart(`prod-${currentSlide.id}`));
                      } else {
                        if (onAddToCart) onAddToCart(itemData);
                        else dispatch(addToCart(itemData));
                      }
                    }}
                    className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer flex items-center gap-2 ${
                      isItemInCart(currentSlide.id)
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                    }`}
                  >
                    {isItemInCart(currentSlide.id) ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>In Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-cyan-600" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Showcase Image */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="relative w-full aspect-square max-h-96 rounded-3xl bg-slate-50 border border-slate-200 p-6 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-blue-500/5 pointer-events-none" />
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-500"
                  />

                  <span className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black shadow">
                    {currentSlide.discount}
                  </span>

                  <span className="absolute bottom-4 left-4 px-3 py-1 rounded-xl bg-white/95 text-cyan-700 border border-cyan-200 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                    <span>100% Genuine</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-cyan-600 hover:text-white border border-slate-200 text-slate-700 flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-md z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-cyan-600 hover:text-white border border-slate-200 text-slate-700 flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-md z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Index Badge */}
          <div className="absolute top-4 right-4 hidden sm:block px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-sm backdrop-blur-md">
            0{activeSlide + 1} / 0{heroSlides.length}
          </div>

          {/* Interactive Thumbnail Carousel Strip (Hover Trigger) */}
          <div className="mt-8 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2 px-1">
              <span className="flex items-center gap-1.5 text-cyan-600 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hover card below to switch slide:</span>
              </span>
              <span>Auto-swiping enabled</span>
            </div>
            <HeroThumbnails
              slides={heroSlides}
              activeSlide={activeSlide}
              onSelectSlide={(idx) => setActiveSlide(idx)}
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 2: BINOMO CONTAINER 6 — SERVICE HIGHLIGHTS (4 PILLARS)
         ======================================================== */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/30 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Free shipping</h4>
              <p className="text-xs text-slate-500 mt-0.5">Fast and free nationwide delivery across 64 districts.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500/30 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Official store</h4>
              <p className="text-xs text-slate-500 mt-0.5">Guaranteed clear origin and 100% authentic sealed tech.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500/30 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Warranty service</h4>
              <p className="text-xs text-slate-500 mt-0.5">Reliable warranty service, ensuring customer rights.</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-violet-500/30 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">bKash &amp; Cards</h4>
              <p className="text-xs text-slate-500 mt-0.5">Instant secure digital checkout and Cash on Delivery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 3: BINOMO CONTAINER 1 — "MOST SOLD THIS WEEK"
         ======================================================== */}
      <section id="most-sold-section" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold mb-2">
              <Flame className="w-3.5 h-3.5 text-cyan-600" />
              <span>POPULAR HIGHLIGHTS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
              Most sold this week
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top-selling flagship hardware and genuine accessories ordered by our customers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleNavigation("products")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-cyan-700 border border-slate-200 shadow-xs hover:border-cyan-300 transition cursor-pointer self-start md:self-auto"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Tabs (All, Smartphones, Laptops, Audio, Accessories) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {catalogTabs.map((tab) => {
            const isActive = activeCatalogCategory === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCatalogCategory(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white border-transparent shadow-md shadow-cyan-600/20"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Catalog Product Grid */}
        {catalogLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : catalogError ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-8 text-center max-w-md mx-auto">
            <p className="text-sm font-semibold text-rose-700">Failed to load catalog products.</p>
            <button
              onClick={() => refetchCatalog()}
              className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : catalogProducts && catalogProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {catalogProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                isInCart={isItemInCart(prod.id)}
                onAddToCart={onAddToCart}
                onRemoveFromCart={onRemoveFromCart}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No products found in this category.</p>
            <button
              onClick={() => setActiveCatalogCategory("all")}
              className="mt-3 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
            >
              Show All Products
            </button>
          </div>
        )}
      </section>

      {/* ========================================================
          SECTION 4: BINOMO CONTAINER 2 — DUAL CATEGORY SPOTLIGHT BANNERS
         ======================================================== */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner Left: Music & Audio */}
          <div className="relative rounded-3xl bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-100/70 border border-cyan-200 p-8 sm:p-10 shadow-sm overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-3 z-10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-700">
                Acoustic Architecture
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] leading-tight">
                Immerse Yourself in Music with Powerful Sound
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                Active noise cancellation headphones and studio monitors crafted for pure acoustic immersion.
              </p>
            </div>

            <div className="mt-6 z-10">
              <button
                type="button"
                onClick={() => navigate("/products?category=audio")}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/20 transition cursor-pointer inline-flex items-center gap-2"
              >
                <span>Shop now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Banner Right: Smartwatch & Tech */}
          <div className="relative rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100/70 border border-violet-200 p-8 sm:p-10 shadow-sm overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-3 z-10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-700">
                Connected Life
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] leading-tight">
                Smartwatch &amp; Wearable Health Tech
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                All-day ECG monitoring, 40+ dynamic workout modes, and aerospace titanium cellular connectivity.
              </p>
            </div>

            <div className="mt-6 z-10">
              <button
                type="button"
                onClick={() => navigate("/products?category=accessories")}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-600/20 transition cursor-pointer inline-flex items-center gap-2"
              >
                <span>Shop now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 5: BINOMO CONTAINER 3 — "ALWAYS ACTIVE: TECHNOLOGY HELPS IMPROVE"
          (3-Column Interactive Hardware Showcase)
         ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 mb-2 uppercase tracking-wider font-['Outfit']">
            <Activity className="w-3.5 h-3.5" />
            <span>Always active</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            Technology helps improve your life
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Engineered with precision sensors, ultra-durable materials, and continuous wellness tracking.
          </p>
        </div>

        {/* 3-Column Layout: Left Features | Center Visual | Right Features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column (3 features) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/30 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <Eye className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Display</h4>
              <p className="text-xs text-slate-500 mt-1">
                Easily monitor anytime, anywhere with larger Super Retina XDR with 2,000 nits peak brightness.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/30 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <BatteryCharging className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Capacity</h4>
              <p className="text-xs text-slate-500 mt-1">
                24-hour battery endurance with the display always on and ultra-fast GaN wired charging.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/30 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Safety check</h4>
              <p className="text-xs text-slate-500 mt-1">
                Detects loss of pulse, sudden impact, and alerts emergency contacts with precision GPS.
              </p>
            </div>
          </div>

          {/* Middle Column (Product Visual Showcase) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square max-h-80 rounded-3xl bg-gradient-to-b from-slate-100 to-slate-200/70 border border-slate-200 p-6 flex items-center justify-center shadow-lg overflow-hidden group">
              <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              <img
                src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80"
                alt="Apple Watch Ultra 2 Titanium"
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] group-hover:scale-108 transition-transform duration-500"
              />
              <span className="absolute bottom-3 px-3 py-1 rounded-xl bg-white/95 text-cyan-700 border border-cyan-200 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
                Titanium Series
              </span>
            </div>
          </div>

          {/* Right Column (3 features) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/30 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Exercise &amp; Fitness</h4>
              <p className="text-xs text-slate-500 mt-1">
                Track running performance, heart rate zones, and over 40 distinct outdoor workout modes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/30 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <Heart className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Health monitoring</h4>
              <p className="text-xs text-slate-500 mt-1">
                Balancing activity and rest based on comprehensive sleep metrics, ECG, and SpO2 readings.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/30 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">Guarantee</h4>
              <p className="text-xs text-slate-500 mt-1">
                Designed to endure extreme environments with official brand 1-year replacement warranty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 6: BINOMO CONTAINER 5 — "DEALS OF THE DAY." (FLASH DEALS)
         ======================================================== */}
      <section id="deals-of-the-day" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-1.5 uppercase tracking-wider font-['Outfit']">
              <Flame className="w-4 h-4 text-rose-500 fill-current animate-pulse" />
              <span>Limited Time Mega Offers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
              Deals of the day.
            </h2>
          </div>

          {/* Dynamic Countdown Timer */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>Ends in:</span>
            </span>
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-900">
              <span className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                {timeLeft.hours}h
              </span>
              <span className="text-rose-600">:</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                {timeLeft.minutes}m
              </span>
              <span className="text-rose-600">:</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                {timeLeft.seconds}s
              </span>
            </div>
          </div>
        </div>

        {/* Deals Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {flashDeals.map((deal) => {
            const inCart = isItemInCart(deal.id);
            const isWishlisted = isInWishlist(deal.id);
            const percentSold = Math.round((deal.soldCount / deal.totalStock) * 100);

            return (
              <div
                key={deal.id}
                onClick={() => navigate(`/products/${deal.id}`)}
                className="group relative rounded-2xl bg-white border border-slate-200 hover:border-rose-400 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between cursor-pointer"
              >
                {/* Product Image Area (.products-thumb) */}
                <div className="relative aspect-square rounded-xl bg-slate-50 border border-slate-100 p-3 mb-3 flex items-center justify-center overflow-hidden">
                  
                  {/* Top-Left Labels (.product-lable) */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-extrabold shadow-sm tracking-wider">
                      {deal.discount}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/95 text-rose-700 border border-rose-200 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
                      DEAL OF DAY
                    </span>
                  </div>

                  {/* Top-Right Floating Action Button Stack (.product-button) - Binomo Signature Hover */}
                  <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-2 items-center">
                    {/* Wishlist Heart Button */}
                    <div className="group/btn relative transform translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-[0ms]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist({
                            id: deal.id,
                            title: deal.title,
                            price: deal.price,
                            thumbnail: deal.image,
                            category: deal.category,
                          });
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90 ${
                          isWishlisted
                            ? "bg-rose-50 border-rose-300 text-rose-600"
                            : "bg-white/95 hover:bg-rose-500 hover:border-rose-400 border-slate-200 text-slate-600 hover:text-white"
                        }`}
                        aria-label="Wishlist"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-colors ${
                            isWishlisted ? "fill-rose-500 text-rose-500" : ""
                          }`}
                        />
                      </button>
                      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white text-[10px] font-medium tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity duration-200 shadow-xl hidden sm:block">
                        {isWishlisted ? "In Wishlist" : "Wishlist"}
                      </span>
                    </div>

                    {/* Quick View Button */}
                    <div className="group/btn relative transform translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-[75ms]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${deal.id}`);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/95 hover:bg-rose-500 border border-slate-200 hover:border-rose-400 text-slate-600 hover:text-white shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90"
                        aria-label="Quick View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white text-[10px] font-medium tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity duration-200 shadow-xl hidden sm:block">
                        Quick View
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Image with smooth scale */}
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="max-h-full max-w-full object-contain transform transition-transform duration-700 ease-out group-hover:scale-110"
                  />

                  {/* Slide-up bottom explore indicator */}
                  <div className="absolute inset-x-2 bottom-2 z-10 transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none hidden sm:flex justify-center">
                    <div className="px-3 py-1 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 text-[10px] font-bold flex items-center gap-1 shadow-md">
                      <span>Explore Deal</span>
                      <ArrowRight className="w-3 h-3 text-rose-500" />
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {deal.category}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{deal.rating}</span>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-['Outfit'] line-clamp-2 group-hover:text-cyan-600 transition-colors">
                    {deal.title}
                  </h4>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-['Outfit']">
                      ৳{deal.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      ৳{deal.originalPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Claimed: {deal.soldCount}/{deal.totalStock}</span>
                      <span className="text-rose-600 font-bold">{percentSold}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentSold}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleAddDealToCart(deal, e)}
                    className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 ${
                      inCart
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-100 hover:bg-gradient-to-r hover:from-rose-600 hover:to-pink-600 text-slate-800 hover:text-white border border-slate-200 hover:border-transparent"
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>In Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                        <span>Claim Deal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          SECTION 7: BINOMO CONTAINER 7 — SECONDARY PROMO VOUCHERS
         ======================================================== */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50/70 border border-cyan-200 p-6 sm:p-8 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-800 text-[10px] font-mono font-bold tracking-wider uppercase border border-cyan-200">
                <Percent className="w-3 h-3 text-cyan-700" />
                <span>STORE-WIDE PROMO</span>
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-['Outfit']">
                20% Flat Discount Voucher
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apply on any order during checkout. Valid for smartphones, laptops, and all accessories.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-dashed border-cyan-200 flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-700 text-base tracking-wider">
                STORE20
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode("STORE20")}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {copiedCode === "STORE20" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50/70 border border-violet-200 p-6 sm:p-8 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-100 text-violet-800 text-[10px] font-mono font-bold tracking-wider uppercase border border-violet-200">
                <Tag className="w-3 h-3 text-violet-700" />
                <span>TECH GADGETS SPECIAL</span>
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-['Outfit']">
                15% Tech Discount
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Special 15% discount for laptops, phones, and acoustic audio products.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-dashed border-violet-200 flex items-center justify-between">
              <span className="font-mono font-bold text-violet-700 text-base tracking-wider">
                TECH15
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode("TECH15")}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {copiedCode === "TECH15" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 8: BINOMO CONTAINER 8 — "OUR HAPPY CLIENTS"
         ======================================================== */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 mb-1.5 uppercase tracking-wider font-['Outfit']">
            <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>Testimonials</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
            Our Happy Clients
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            See what our satisfied customers have to say about our electronic accessories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-cyan-500/30 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "I've been using this product for a month now, and I've had no issues. The customer service is top-notch, and the official sealed packaging was 100% genuine."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 font-['Outfit']">Tanvir Ahmed</h5>
                <span className="text-[10px] text-slate-500">Chittagong</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Buyer</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500/30 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "Ordered a mechanical keyboard and charger. Warranty papers and invoice were included. Delivery in Dhaka was within 24 hours. The best electronics shopping experience."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 font-['Outfit']">Farhana Rahman</h5>
                <span className="text-[10px] text-slate-500">Dhaka</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Buyer</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-violet-500/30 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                "MacBook Pro M3 arrived in pristine condition with Apple warranty active upon setup. Reliable, fast, and 100% authentic tech store in Bangladesh."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 font-['Outfit']">Sabbir Hossain</h5>
                <span className="text-[10px] text-slate-500">Sylhet</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Buyer</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 9: AUTHORIZED BRAND PARTNERS STRIP
         ======================================================== */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6 font-['Outfit']">
          Authorized Tech Brands &amp; Official Distribution
        </p>
        <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap text-slate-500 text-sm sm:text-base font-bold font-['Outfit']">
          <span className="hover:text-slate-900 transition">Apple</span>
          <span className="hover:text-slate-900 transition">Samsung</span>
          <span className="hover:text-slate-900 transition">Sony</span>
          <span className="hover:text-slate-900 transition">ASUS ROG</span>
          <span className="hover:text-slate-900 transition">Anker</span>
          <span className="hover:text-slate-900 transition">Keychron</span>
          <span className="hover:text-slate-900 transition">Logitech</span>
          <span className="hover:text-slate-900 transition">Google</span>
        </div>
      </section>

      {/* ========================================================
          SECTION 10: BINOMO NEWSLETTER / COMMUNITY VIP
         ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-800 border border-blue-600/30 p-8 sm:p-12 shadow-xl overflow-hidden text-center sm:text-left text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-cyan-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SUBSCRIBE OUR NEWSLETTER</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
              Ready to Upgrade Your Tech Setup?
            </h2>
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal">
              Subscribe to get secret member discounts, flash sale updates, and fast delivery notifications.
            </p>
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleNavigation("products")}
                className="px-7 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Start Shopping Now</span>
                <ArrowRight className="w-4 h-4 text-slate-900" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
