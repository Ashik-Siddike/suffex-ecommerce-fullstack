import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check } from "lucide-react";

export default function Footer({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 4000);
    }
  };

  const handleLinkClick = (tab) => {
    if (onNavigate) onNavigate(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-slate-100 border-t border-slate-200 text-slate-600 text-xs mt-auto">
      {/* Upper Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-600/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="text-xl font-extrabold text-slate-900 font-['Outfit'] block">
                  Suffex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Store</span>
                </span>
                <span className="text-[11px] text-cyan-700 font-mono font-medium">Cyber Titanium Edition</span>
              </div>
            </Link>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Discover authentic premium gadgets, flagship devices, high-end acoustics, and luxury essentials with nationwide rapid fulfillment and 100% genuine warranty.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified Official Store</span>
              </span>
              <span>•</span>
              <span className="text-[11px] text-slate-500">Dhaka, Bangladesh</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-['Outfit'] mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              <span>Quick Links</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link
                  to="/"
                  onClick={() => handleLinkClick("home")}
                  className="hover:text-cyan-600 transition cursor-pointer"
                >
                  Home Showcase
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-600 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Shop Catalog</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 border border-cyan-200 font-mono font-bold">API</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/my-orders"
                  onClick={() => handleLinkClick("orders")}
                  className="hover:text-cyan-600 transition cursor-pointer"
                >
                  My Orders &amp; Tracking
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  onClick={() => handleLinkClick("contact")}
                  className="hover:text-cyan-600 transition cursor-pointer"
                >
                  Customer Support &amp; FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-['Outfit'] mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              <span>Departments</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link
                  to="/products?category=smartphones"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-600 transition cursor-pointer"
                >
                  Smartphones &amp; Tech
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=laptops"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-600 transition cursor-pointer"
                >
                  Laptops &amp; Computing
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=fragrances"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-600 transition cursor-pointer"
                >
                  Fragrances &amp; Perfumes
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=beauty"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-600 transition cursor-pointer"
                >
                  Beauty &amp; Skincare
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=home-decoration"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-600 transition cursor-pointer"
                >
                  Modern Living &amp; Home
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter and support */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-['Outfit'] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              <span>VIP Newsletter</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Subscribe to get instant alerts on flash sales, new flagship arrivals, and exclusive vouchers.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition shadow-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:brightness-105 text-white text-xs font-bold cursor-pointer transition shrink-0 shadow-md shadow-cyan-600/20"
                >
                  Join
                </button>
              </div>
              {subscribed && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Subscribed for VIP discounts!</span>
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom copyright and payment badges */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Suffex Store Bangladesh. All rights reserved.</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap justify-center font-mono">
            <span>Verified Payments:</span>
            <span className="font-bold text-rose-600">bKash</span>
            <span>•</span>
            <span className="font-bold text-amber-600">Nagad</span>
            <span>•</span>
            <span className="font-bold text-cyan-600">Visa / Mastercard</span>
            <span>•</span>
            <span className="font-bold text-emerald-600">Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
