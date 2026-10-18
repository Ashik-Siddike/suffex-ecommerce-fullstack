import useDocumentTitle from "../hooks/useDocumentTitle";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { Headphones, Mail, Phone, MapPin, Send, ChevronDown } from "lucide-react";

export default function ContactPage({ onShowToast }) {
  useDocumentTitle("Support & FAQ");

  const { showToast } = useCart();
  const triggerToast = onShowToast || showToast;
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "Order Inquiry",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: "How does nationwide express delivery work?",
      a: "Inside Dhaka Metro, deliveries are completed within 24 hours. For all other 63 districts across Bangladesh, orders are dispatched via Steadfast/Pathao Courier within 48 to 72 hours.",
    },
    {
      q: "Are the products 100% original and authentic?",
      a: "Yes, every single product sold on Suffex Store is sourced directly from certified authorized global brand distributors and backed by official manufacturer warranties.",
    },
    {
      q: "Can I pay using bKash, Nagad, or Cash on Delivery?",
      a: "Absolutely! We accept Cash on Delivery nationwide, as well as instant bKash, Nagad, Rocket merchant gateways and major Visa/Mastercard credit/debit cards.",
    },
    {
      q: "How can I apply promo discount vouchers?",
      a: "Open your shopping cart drawer or proceed to checkout, enter any active promo code like SAVE500, TECH10, or CYBER300 and click Apply to enjoy immediate bill discounts.",
    },
    {
      q: "What is your replacement and return policy?",
      a: "We offer a 7-day hassle-free replacement guarantee if the product arrives with manufacturing defects or physical transit damage. Just reach out to our support line.",
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (triggerToast) {
      triggerToast("Your inquiry has been submitted! Our team will reach you shortly.");
    }
    setFormData({
      name: "",
      phone: "",
      email: "",
      subject: "Order Inquiry",
      message: "",
    });
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="w-full text-slate-100 animate-fadeIn pb-24 font-sans bg-[#030712]">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#080e1e] via-[#050914] to-[#030712] border-b border-white/[0.08] py-16 text-center px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-cyan-500/10 blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Headphones className="w-3.5 h-3.5" />
            <span>24/7 CUSTOMER CARE & SUPPORT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-['Outfit'] tracking-tight">
            How Can We{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Help You Today?
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Need help tracking a shipment, inquiring about product availability, or claiming warranty? Our dedicated customer team is ready to assist you.
          </p>
        </div>
      </section>

      {/* Main Grid: Channels + Inquiry Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-6 rounded-3xl bg-[#070b14] border border-white/[0.08] hover:border-cyan-500/30 transition shadow-xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-['Outfit']">Official Phone Hotline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Available 7 days a week, 9:00 AM to 10:00 PM for instant order assistance.
            </p>
            <span className="font-mono text-sm font-bold text-cyan-400 block pt-1">
              +880 1800-SUFFEX (783339)
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-[#070b14] border border-white/[0.08] hover:border-indigo-500/30 transition shadow-xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-['Outfit']">Email Support Desk</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Send us corporate orders, warranty inquiries, or partner proposals.
            </p>
            <span className="font-mono text-sm font-bold text-indigo-400 block pt-1">
              support@suffexstore.com
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-[#070b14] border border-white/[0.08] hover:border-emerald-500/30 transition shadow-xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-['Outfit']">Flagship Experience Hub</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Level 4, Suffex IT Tower, Dhanmondi 27, Dhaka-1209, Bangladesh.
            </p>
            <span className="text-xs font-semibold text-emerald-400 block pt-1">
              Walk-in Experience Center
            </span>
          </div>
        </div>

        {/* 2-Column: Inquiry Form & Interactive FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#070b14] border border-white/[0.08] shadow-2xl space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
                Send Us a Quick Message
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Fill out the form below and our customer representative will get in touch within 2 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-4 py-3 rounded-xl bg-[#030712] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-4 py-3 rounded-xl bg-[#030712] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tanvir@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#030712] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Inquiry Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#030712] border border-white/10 text-xs text-white focus:border-cyan-500 outline-none transition cursor-pointer"
                >
                  <option value="Order Inquiry">Order Status & Delivery Tracking</option>
                  <option value="Warranty Claim">Warranty Claim & Technical Support</option>
                  <option value="Coupon Inquiry">Promo Coupons & Special Discounts</option>
                  <option value="Corporate Order">Bulk Corporate Wholesale Purchase</option>
                  <option value="Other">General Feedback or Inquiries</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Your Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry or include your Order ID..."
                  className="w-full px-4 py-3 rounded-xl bg-[#030712] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-1 mb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-['Outfit']">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="text-2xl font-bold text-white font-['Outfit']">
                Help & Shopping Guide
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#070b14] border border-white/[0.08] hover:border-cyan-500/20 overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-white hover:text-cyan-400 transition cursor-pointer"
                    >
                      <span className="font-['Outfit']">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.04] pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
