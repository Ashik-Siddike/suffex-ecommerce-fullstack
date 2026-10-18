import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import useProducts from "../hooks/useProducts";
import useDebounce from "../hooks/useDebounce";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import ProductModal from "../components/ProductModal";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  PackageSearch,
} from "lucide-react";

export default function ProductsPage({
  cart: propCart,
  onAddToCart: propAddToCart,
  onRemoveFromCart: propRemoveFromCart,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const cartContext = useCart();

  const cart = propCart !== undefined ? propCart : cartContext.cart;
  const onAddToCart = propAddToCart || cartContext.addToCart;
  const onRemoveFromCart = propRemoveFromCart || cartContext.removeFromCart;

  // Read current URL search parameters (?q=... & ?category=...)
  const urlQ = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "all";

  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Official React pattern: adjust state during render when URL query changes externally
  const [prevUrlState, setPrevUrlState] = useState({ q: urlQ, category: urlCategory });
  if (prevUrlState.q !== urlQ || prevUrlState.category !== urlCategory) {
    setPrevUrlState({ q: urlQ, category: urlCategory });
    setSearchQuery(urlQ);
    setSelectedCategory(urlCategory);
    setCurrentPage(1);
  }

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const isDebouncing = searchQuery !== debouncedSearchQuery;

  // Synchronize debounced search & category into URL search params for shareability
  useEffect(() => {
    const params = {};
    const trimmed = debouncedSearchQuery.trim();
    if (trimmed) params.q = trimmed;
    if (selectedCategory && selectedCategory !== "all") params.category = selectedCategory;

    const currentQ = searchParams.get("q") || "";
    const currentCat = searchParams.get("category") || "all";
    const targetCat = selectedCategory || "all";

    if (currentQ !== trimmed || currentCat !== targetCat) {
      setSearchParams(params, { replace: true });
    }
  }, [debouncedSearchQuery, selectedCategory, searchParams, setSearchParams]);

  // Selected product ID for Quick View Modal
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Dynamic SEO Page Title based on category and search query
  const pageTitle = useMemo(() => {
    if (debouncedSearchQuery) {
      return `Search: "${debouncedSearchQuery}"`;
    }
    if (selectedCategory && selectedCategory !== "all") {
      return `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Products`;
    }
    return "Products Catalog";
  }, [debouncedSearchQuery, selectedCategory]);

  useDocumentTitle(pageTitle);

  // Derive SQL-level sort parameters
  const sortParams = useMemo(() => {
    switch (sortBy) {
      case "price-asc":
        return { sort: "price_asc", sortBy: "price", order: "asc" };
      case "price-desc":
        return { sort: "price_desc", sortBy: "price", order: "desc" };
      case "newest":
        return { sort: "newest", sortBy: "created_at", order: "desc" };
      case "title-asc":
        return { sort: "title_asc", sortBy: "title", order: "asc" };
      default:
        return { sort: "", sortBy: "", order: "asc" };
    }
  }, [sortBy]);

  // Fetch products using custom hook with debounced search, category, sort, and pagination
  const {
    products,
    total,
    totalPages: apiTotalPages,
    loading,
    error,
    refetch,
  } = useProducts({
    search: debouncedSearchQuery,
    category: selectedCategory,
    limit: itemsPerPage,
    page: currentPage,
    skip: (currentPage - 1) * itemsPerPage,
    sort: sortParams.sort,
    sortBy: sortParams.sortBy,
    order: sortParams.order,
  });

  // Available categories list
  const categories = [
    { id: "all", label: "All Items" },
    { id: "beauty", label: "Beauty" },
    { id: "fragrances", label: "Fragrances" },
    { id: "furniture", label: "Furniture" },
    { id: "groceries", label: "Groceries" },
    { id: "laptops", label: "Laptops" },
    { id: "smartphones", label: "Smartphones" },
    { id: "home-decoration", label: "Home Decor" },
    { id: "kitchen-accessories", label: "Kitchen" },
    { id: "mens-shirts", label: "Men's Wear" },
    { id: "womens-dresses", label: "Women's Wear" },
  ];

  const totalPages = Math.ceil(total / itemsPerPage) || 1;

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("default");
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  // Check if product is in cart
  const isProductInCart = (id) => {
    const cleanId = String(id).replace(/^prod-/, "");
    return cart.some(
      (c) => c.id === id || String(c.id).replace(/^prod-/, "") === cleanId
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time API Store Catalog</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Outfit'] tracking-tight">
          Explore Flagship Tech &amp; Lifestyle
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Search authentic products, filter by official categories, and discover exclusive store discounts with instant closure pricing calculation.
        </p>
      </div>

      {/* Controls Container: Search, Category pills, and Sort */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Debounced Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search products, brands, models..."
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#090e1c] border border-white/[0.1] focus:border-cyan-400 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition shadow-inner"
            />
            {isDebouncing && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 animate-spin" />
            )}
          </div>

          {/* Sort Dropdown & Reset Action */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center">
              <SlidersHorizontal className="absolute left-3 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8.5 pr-8 py-3 rounded-xl bg-[#090e1c] border border-white/[0.1] text-xs font-semibold text-slate-200 outline-none hover:border-cyan-500/40 cursor-pointer appearance-none transition"
              >
                <option value="default">Default Sorting</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Customer Rating</option>
                <option value="title-asc">Alphabetical (A - Z)</option>
              </select>
            </div>

            {(searchQuery || selectedCategory !== "all" || sortBy !== "default") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-3 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/50"
                    : "bg-[#090e1c] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results Metadata Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div>
            Showing <strong className="text-white font-mono">{products.length}</strong> of{" "}
            <strong className="text-white font-mono">{total}</strong> items
            {selectedCategory !== "all" && (
              <span> in <strong className="text-cyan-400 capitalize">{selectedCategory}</strong></span>
            )}
            {debouncedSearchQuery && (
              <span> matching &quot;<strong className="text-white">{debouncedSearchQuery}</strong>&quot;</span>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Main Content: Loading, Error, or Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(itemsPerPage)].map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-[#0d1424] border border-rose-500/30 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Outfit']">Failed to Load Products</h3>
          <p className="text-xs text-rose-300/80 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-lg transition"
          >
            Retry Fetching
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl bg-[#090e1c] border border-white/[0.08] p-10 sm:p-16 text-center max-w-md mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <PackageSearch className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Outfit']">No products found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No items matched your search criteria. Try modifying your keywords or resetting filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {products.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              isInCart={isProductInCart(item.id)}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              onViewDetails={(prod) => setSelectedProductId(prod.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage((prev) => Math.max(1, prev - 1));
              window.scrollTo({ top: 180, behavior: "smooth" });
            }}
            className="p-2.5 rounded-xl bg-[#090e1c] border border-white/[0.1] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 180, behavior: "smooth" });
                    }}
                    className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                        : "bg-[#090e1c] text-slate-400 hover:text-white border border-white/[0.08]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="text-slate-500 text-xs px-1">...</span>;
              }
              return null;
            })}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage((prev) => Math.min(totalPages, prev + 1));
              window.scrollTo({ top: 180, behavior: "smooth" });
            }}
            className="p-2.5 rounded-xl bg-[#090e1c] border border-white/[0.1] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick View Product Modal with JS Closure Price Calculation */}
      {selectedProductId && (
        <ProductModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          isInCart={isProductInCart(selectedProductId)}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
        />
      )}
    </div>
  );
}
