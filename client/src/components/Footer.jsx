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
    <footer className="w-full bg-[#040711] border-t border-white/[0.08] text-slate-400 text-xs mt-auto">
      {/* Upper Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="text-xl font-extrabold text-white font-['Outfit'] block">
                  Suffex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Store</span>
                </span>
                <span className="text-[11px] text-cyan-400/80 font-mono">Cyber Titanium Edition</span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Discover authentic premium gadgets, flagship devices, high-end acoustics, and luxury essentials with nationwide rapid fulfillment and 100% genuine warranty.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified Official Store</span>
              </span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">Dhaka, Bangladesh</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-['Outfit'] mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Quick Links</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link
                  to="/"
                  onClick={() => handleLinkClick("home")}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Home Showcase
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-400 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Shop Catalog</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono font-bold">API</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/my-orders"
                  onClick={() => handleLinkClick("orders")}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  My Orders &amp; Tracking
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  onClick={() => handleLinkClick("contact")}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Customer Support &amp; FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-['Outfit'] mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>Departments</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link
                  to="/products?category=smartphones"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Smartphones &amp; Tech
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=laptops"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Laptops &amp; Computing
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=fragrances"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Fragrances &amp; Perfumes
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=beauty"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Beauty &amp; Skincare
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=home-decoration"
                  onClick={() => handleLinkClick("products")}
                  className="hover:text-cyan-400 transition cursor-pointer"
                >
                  Modern Living &amp; Home
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter and support */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-['Outfit'] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>VIP Newsletter</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b14] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold cursor-pointer transition shrink-0 shadow-lg shadow-cyan-500/25"
                >
                  Join
                </button>
              </div>
              {subscribed && (
                <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Subscribed for VIP discounts!</span>
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom copyright and payment badges */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Suffex Store Bangladesh. All rights reserved.</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap justify-center font-mono">
            <span>Verified Payments:</span>
            <span className="font-bold text-rose-400">bKash</span>
            <span>•</span>
            <span className="font-bold text-amber-400">Nagad</span>
            <span>•</span>
            <span className="font-bold text-cyan-400">Visa / Mastercard</span>
            <span>•</span>
            <span className="font-bold text-emerald-400">Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
