import { useState } from "react";
import { motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import type { Product } from "../../types/product";

interface ProductGalleryProps {
  product: Product;
}

function ProductGallery({ product }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  const nextImage = () => {
    setActiveImage((current) =>
      current === product.images.length - 1 ? 0 : current + 1
    );
  };

  const previousImage = () => {
    setActiveImage((current) =>
      current === 0 ? product.images.length - 1 : current - 1
    );
  };

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[0.78] overflow-hidden rounded-[1.75rem] bg-[#e8dfd7] sm:rounded-[2.25rem] lg:aspect-[0.82]">
        <motion.img
          key={activeImage}
          initial={{ opacity: 0, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          src={product.images[activeImage]}
          alt={`${product.name} - view ${activeImage + 1}`}
          className="h-full w-full object-cover"
        />

        <button
          type="button"
          onClick={previousImage}
          aria-label="Previous product image"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 opacity-100 shadow-lg backdrop-blur-xl transition-all active:scale-90 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <FiChevronLeft size={19} />
        </button>

        <button
          type="button"
          onClick={nextImage}
          aria-label="Next product image"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 opacity-100 shadow-lg backdrop-blur-xl transition-all active:scale-90 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <FiChevronRight size={19} />
        </button>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-3 py-2 backdrop-blur-xl sm:hidden">
          {product.images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveImage(index)}
              aria-label={`View image ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeImage
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="hidden grid-cols-4 gap-3 sm:grid">
        {product.images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveImage(index)}
            className={`relative aspect-[0.8] overflow-hidden rounded-xl transition-all ${
              index === activeImage
                ? "ring-2 ring-[#211b18] ring-offset-2"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            <img
              src={image}
              alt={`${product.name} thumbnail ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProductGallery;