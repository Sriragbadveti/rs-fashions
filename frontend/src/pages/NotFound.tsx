import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiSearch,
  FiShoppingBag,
  FiCompass,
  FiTruck,
  FiArrowRight,
} from "react-icons/fi";

export default function NotFound() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 select-none">
      <div className="max-w-2xl w-full text-center">
        {/* Editorial Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#D4A373]/50 bg-white/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8E3D51] shadow-sm mb-6"
        >
          <span>Error 404</span>
          <span className="text-[#D4A373]">✦</span>
          <span>Weave Not Found</span>
        </motion.div>

        {/* Large Editorial Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif text-5xl sm:text-7xl font-light text-[#2A2421] tracking-tight leading-none"
        >
          Lost in the <span className="italic font-normal text-[#8E3D51]">archives.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 text-xs sm:text-sm font-light text-[#6E6359] max-w-md mx-auto leading-relaxed"
        >
          The saree design or page you are seeking has been archived or moved to another vault. Allow us to guide you back to our curated showroom collections.
        </motion.p>

        {/* Search Bar */}
        <motion.form
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleSearch}
          className="mt-8 max-w-md mx-auto"
        >
          <div className="relative flex items-center rounded-full border border-black/10 bg-white shadow-sm p-1.5 transition-all focus-within:border-[#8E3D51] focus-within:ring-2 focus-within:ring-[#8E3D51]/10">
            <FiSearch className="ml-3.5 text-[#8C7A6B] shrink-0" size={17} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by weave, color, or motif..."
              className="w-full bg-transparent px-3 text-xs text-[#2A2421] placeholder-[#A89C8F] outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded-full bg-[#8E3D51] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#722F40] transition-colors shrink-0"
            >
              <span>Discover</span>
              <FiArrowRight size={12} />
            </button>
          </div>
        </motion.form>

        {/* Quick Route Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left"
        >
          <Link
            to="/shop"
            className="group rounded-2xl border border-black/8 bg-white/85 p-4 shadow-sm transition-all hover:border-[#8E3D51]/40 hover:bg-white hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-2.5 text-[#8E3D51] mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8E3D51]/10 group-hover:bg-[#8E3D51] group-hover:text-white transition-colors">
                <FiShoppingBag size={15} />
              </span>
              <span className="text-xs font-semibold text-[#2A2421]">Explore Shop</span>
            </div>
            <p className="text-[11px] text-[#8C7A6B] leading-relaxed">
              Browse our store of authentic handloom Gadwal sarees.
            </p>
          </Link>

          <Link
            to="/"
            className="group rounded-2xl border border-black/8 bg-white/85 p-4 shadow-sm transition-all hover:border-[#8E3D51]/40 hover:bg-white hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-2.5 text-[#8E3D51] mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8E3D51]/10 group-hover:bg-[#8E3D51] group-hover:text-white transition-colors">
                <FiCompass size={15} />
              </span>
              <span className="text-xs font-semibold text-[#2A2421]">Store Home</span>
            </div>
            <p className="text-[11px] text-[#8C7A6B] leading-relaxed">
              Return to the flagship landing page and curated editorial highlights.
            </p>
          </Link>

          <Link
            to="/shop?filter=sale"
            className="group rounded-2xl border border-black/8 bg-white/85 p-4 shadow-sm transition-all hover:border-[#8E3D51]/40 hover:bg-white hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-2.5 text-[#8E3D51] mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8E3D51]/10 group-hover:bg-[#8E3D51] group-hover:text-white transition-colors">
                <FiTruck size={15} />
              </span>
              <span className="text-xs font-semibold text-[#2A2421]">Privilege Offers</span>
            </div>
            <p className="text-[11px] text-[#8C7A6B] leading-relaxed">
              Discover celebratory discounts and festive sale drapes available right now.
            </p>
          </Link>
        </motion.div>

        {/* Return Button */}
        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8C7A6B] hover:text-[#8E3D51] transition-colors"
          >
            <FiArrowLeft size={13} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
