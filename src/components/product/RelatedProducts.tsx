import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";

import {
  products,
  type Product,
} from "../../data/products";

import ProductCard from "./ProductCard";

interface RelatedProductsProps {
  product: Product;
}

function RelatedProducts({
  product,
}: RelatedProductsProps) {
  const related = products
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.material === product.material ||
          item.category === product.category)
    )
    .slice(0, 4);

  return (
    <section className="border-t border-black/[0.07] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-[1600px]">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
              You may also like
            </p>

            <h2 className="mt-3 font-display text-4xl sm:text-5xl">
              More to
              <span className="italic"> love.</span>
            </h2>
          </div>

          <Link
            to="/shop"
            className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-60 sm:flex"
          >
            View all
            <FiArrowUpRight />
          </Link>
        </div>

        {/* =====================================================
            RELATED PRODUCTS
        ====================================================== */}

        <div className="-mr-4 flex gap-4 overflow-x-auto pb-4 sm:-mr-6 sm:grid sm:grid-cols-4 sm:overflow-visible">
          {related.map((item) => (
            <div
              key={item.id}
              className="w-[76vw] shrink-0 sm:w-auto"
            >
              <ProductCard product={item} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default RelatedProducts;