/**
 * ProductCardSkeleton Component
 * High-fidelity, shimmer-animated placeholder matching ProductCard dimensions.
 * Eliminates Cumulative Layout Shift (CLS) during catalog data fetching.
 */
export default function ProductCardSkeleton() {
  return (
    <div
      className="group relative rounded-xl sm:rounded-2xl bg-white border border-slate-200 p-2.5 sm:p-4 flex flex-col justify-between animate-pulse select-none shadow-xs"
      aria-hidden="true"
    >
      {/* Product Image Area Skeleton */}
      <div className="relative aspect-[4/3] rounded-lg sm:rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center p-2 sm:p-3 mb-2 sm:mb-3 border border-slate-100">
        {/* Shimmer linear-gradient shine */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        {/* Top-left Category Badge Skeleton */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          <div className="w-14 sm:w-16 h-4 sm:h-5 rounded-md bg-cyan-100 border border-cyan-200" />
        </div>

        {/* Top-right Wishlist Heart Skeleton */}
        <div className="absolute top-2 right-2 z-10 w-7 h-7 rounded-xl bg-slate-200 border border-slate-200" />

        {/* Image Placeholder Icon */}
        <div className="w-12 h-12 rounded-xl bg-slate-200 border border-slate-300" />
      </div>

      {/* Card Body Skeleton */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Brand & Star Rating Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="w-16 sm:w-20 h-3 rounded bg-slate-200" />
            <div className="w-8 sm:w-10 h-3 rounded bg-amber-100" />
          </div>

          {/* Product Title Skeleton (2 lines) */}
          <div className="space-y-1 pt-0.5">
            <div className="h-3.5 sm:h-4 bg-slate-200 rounded-md w-11/12" />
            <div className="h-3.5 sm:h-4 bg-slate-100 rounded-md w-2/3" />
          </div>
        </div>

        {/* Pricing & Add-to-Cart Button Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
          <div className="space-y-1">
            <div className="h-4 sm:h-5 bg-slate-200 rounded-md w-20 sm:w-24 font-mono" />
            <div className="h-2.5 bg-slate-100 rounded w-12 sm:w-14 font-mono" />
          </div>

          {/* Action Button Skeleton */}
          <div className="w-8 sm:w-16 h-8 sm:h-9 rounded-xl bg-slate-200 border border-slate-200 shrink-0" />
        </div>
      </div>
    </div>
  );
}

/**
 * Convenience helper rendering a grid of Skeletons
 */
export function ProductCardSkeletonGrid({ count = 8, className = "" }) {
  return (
    <div
      className={
        className ||
        "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
      }
    >
      {[...Array(count)].map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
}
