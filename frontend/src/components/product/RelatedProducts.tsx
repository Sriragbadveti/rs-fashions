import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { type Product } from "../../data/products";
import { StoreService } from "../../services/supabase";
import ProductCard from "./ProductCard";

export interface RelatedProductsProps {
  currentProduct?: Product | null;
  product?: Product | null;
  products?: Product[];
  title?: string;
  badge?: string;
  viewAllLink?: string;
  maxItems?: number;
}

export default function RelatedProducts({
  currentProduct,
  product,
  products,
  title = "You May Also Like",
  badge = "More In Store",
  viewAllLink = "/shop",
  maxItems = 4,
}: RelatedProductsProps) {
  const targetProduct = currentProduct || product;
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products && products.length > 0) return;
    let isMounted = true;
    async function load() {
      try {
        const prods = await StoreService.getProducts({ view: "card" });
        if (isMounted && prods.length > 0) setFetchedProducts(prods);
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [products]);

  const sourceProducts = products && products.length > 0 ? products : fetchedProducts;

  const related = useMemo(() => {
    if (!sourceProducts.length) return [];
    if (!targetProduct) return sourceProducts.slice(0, maxItems);

    // 1. Try to find products with matching material or category
    const sameCategoryOrMaterial = sourceProducts.filter(
      (item) =>
        item.id !== targetProduct.id &&
        (item.material === targetProduct.material ||
          item.category === targetProduct.category)
    );

    if (sameCategoryOrMaterial.length >= maxItems) {
      return sameCategoryOrMaterial.slice(0, maxItems);
    }

    // 2. Fill remainder with other available sarees
    const otherProducts = sourceProducts.filter(
      (item) =>
        item.id !== targetProduct.id &&
        !sameCategoryOrMaterial.some((s) => s.id === item.id)
    );

    return [...sameCategoryOrMaterial, ...otherProducts].slice(0, maxItems);
  }, [sourceProducts, targetProduct, maxItems]);

  if (!related.length) return null;

  return (
    <section className="mx-auto max-w-375 px-4 sm:px-6 lg:px-10 mt-16 sm:mt-24">
      <div className="flex items-end justify-between border-b border-stone-200 pb-4 mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E3D51]">
            {badge}
          </span>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-normal text-stone-900">
            {title}
          </h2>
        </div>
        <Link
          to={viewAllLink}
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E3D51] hover:underline"
        >
          <span>View All Sarees</span>
          <FiArrowUpRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-4">
        {related.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}