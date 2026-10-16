import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import SEO from "../components/common/SEO";
import ProductCard from "../components/product/ProductCard";
import { StoreService, getCachedCardProducts } from "../services/supabase";
import { SPECIAL_OFFER_PRICE, onlySpecialOffers } from "../utils/specialOffer";
import type { Product } from "../data/products";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * The one place Special Offer sarees are listed. A saree appears here only when the admin turned
 * on "Special Offer" for it; every other page (shop, trending, search, suggestions) leaves them out.
 */
export default function SpecialOffers() {
  const [products, setProducts] = useState<Product[]>(() => (getCachedCardProducts?.() as Product[] | undefined) || []);
  const [loaded, setLoaded] = useState(products.length > 0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const list = await StoreService.getProducts({ view: "card" });
        if (alive) setProducts(list);
      } catch {
        // keep whatever is already shown
      } finally {
        if (alive) setLoaded(true);
      }
    };
    load();
    window.addEventListener("catalogUpdated", load);
    window.addEventListener("rs_inventory_updated", load);
    return () => {
      alive = false;
      window.removeEventListener("catalogUpdated", load);
      window.removeEventListener("rs_inventory_updated", load);
    };
  }, []);

  const offers = useMemo(() => {
    const list = onlySpecialOffers(products);
    // Sold-out sarees go last.
    const soldOut = (p: Product) => (p.stock !== undefined && p.stock <= 0 ? 1 : 0);
    return [...list].sort((a, b) => soldOut(a) - soldOut(b));
  }, [products]);

  return (
    <main className="min-h-screen bg-linear-to-b from-[#F7EBEC] via-[#F4E7E4] to-[#E9C9C3]/40 px-3.5 pb-16 pt-6 sm:px-6 lg:px-12 font-sans text-[#2A2421]">
      <SEO
        title="Special Offers — RS Fashions"
        description="Any saree under this offer costs only ₹2,500."
        canonicalPath="/special-offers"
      />
      <div className="mx-auto max-w-[1500px]">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8E3D51]">Special Offers</p>
          <h1 className="mt-2 font-serif text-3xl font-light sm:text-4xl">
            Special <span className="italic text-[#8E3D51]">Offers</span>
          </h1>
          <p className="mt-3 text-sm font-medium text-[#6E6359]">
            Any saree under this offer costs only {inr(SPECIAL_OFFER_PRICE)}
          </p>
        </header>

        {offers.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {offers.map((product) => (
              <ProductCard key={product.id} product={product} showDiscountBadge={false} />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-16 max-w-md rounded-3xl border border-black/8 bg-white/80 p-8 text-center shadow-sm">
            <p className="font-serif text-xl">{loaded ? "No special offers right now" : "Loading offers…"}</p>
            {loaded && (
              <>
                <p className="mt-2 text-xs text-[#6E6359]">Check back soon, or explore the full collection.</p>
                <Link to="/shop" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8E3D51]">
                  Shop all sarees <FiArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
