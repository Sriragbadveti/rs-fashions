import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";

import { type Product, products as fallbackProducts } from "../../data/products";
import ProductCard from "../product/ProductCard";
import { StoreService } from "../../services/supabase";

function TrendingProducts() {
  const [trendingPieces, setTrendingPieces] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 4);
      }
    } catch {}
    return fallbackProducts.slice(0, 4);
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const prods = await StoreService.getProducts();
        if (isMounted && Array.isArray(prods) && prods.length > 0) {
          setTrendingPieces(prods.slice(0, 4));
        }
      } catch (err) {
        console.warn("Could not load trending pieces:", err);
      }
    }
    load();

    const unsubscribe = StoreService.subscribeToRealtime(() => {
      load();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <section className="bg-[#FAF7F2] px-4 py-10 sm:px-6 sm:py-24 lg:px-10 font-sans select-none">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between border-b border-black/6 pb-6 sm:mb-12">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8C7A6B]">
              Loved Right Now
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#2A2421]">
              Trending <span className="italic font-normal">pieces.</span>
            </h2>
          </div>

          <Link
            to="/shop"
            className="group hidden sm:inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#2A2421] transition-colors hover:text-[#8E3D51]"
          >
            <span>View All Sarees</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFEAE2] transition-transform duration-300 group-hover:rotate-45 group-hover:bg-[#8E3D51] group-hover:text-white">
              <FiArrowUpRight size={14} />
            </span>
          </Link>
        </div>

        {/* Responsive Layout */}
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {trendingPieces.map((product) => (
            <div key={product.id} className="w-[74vw] shrink-0 sm:w-auto">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Mobile View All Link */}
        <Link
          to="/shop"
          className="mt-8 flex items-center justify-between border-b border-black/10 pb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#2A2421] sm:hidden"
        >
          <span>Explore All Pieces</span>
          <FiArrowUpRight size={15} />
        </Link>
      </div>
    </section>
  );
}

export default TrendingProducts;
