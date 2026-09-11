import { useState } from "react";
import { FiStar } from "react-icons/fi";

import type { Product } from "../../types/product";

interface ProductReviewsProps {
  product: Product;
}

const reviews = [
  {
    name: "Ananya",
    rating: 5,
    text: "The fabric looks even better in person. Absolutely beautiful.",
    date: "2 weeks ago",
  },
  {
    name: "Meera",
    rating: 5,
    text: "Loved the finish and packaging. The saree feels very elegant.",
    date: "1 month ago",
  },
  {
    name: "Priya",
    rating: 4,
    text: "Beautiful piece and exactly as shown. Delivery was smooth too.",
    date: "1 month ago",
  },
];

function ProductReviews({
  product,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="bg-[#eee8e0] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-300">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
              The community
            </p>

            <h2 className="mt-3 font-display text-4xl sm:text-5xl">
              What they
              <span className="italic"> say.</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="w-fit rounded-full bg-black px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
          >
            Write a review
          </button>
        </div>

        {showForm && (
          <div className="mt-8 rounded-3xl bg-white/60 p-6">
            <p className="font-display text-2xl">
              Share your experience
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Your name"
                className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none"
              />

              <input
                placeholder="Your email"
                type="email"
                className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none"
              />
            </div>

            <textarea
              placeholder="Tell us about your experience..."
              rows={4}
              className="mt-4 w-full resize-none rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none"
            />

            <button
              type="button"
              className="mt-4 rounded-full bg-[#8e3d51] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
            >
              Submit review
            </button>

            <p className="mt-3 text-[10px] text-black/35">
              Demo only — reviews are not persisted because this version has no backend.
            </p>
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="rounded-3xl bg-white/55 p-6"
            >
              <div className="flex items-center gap-1">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <FiStar
                    key={index}
                    size={13}
                    fill={
                      index < review.rating
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>

              <p className="mt-5 font-display text-xl leading-7">
                “{review.text}”
              </p>

              <div className="mt-7 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-black/40">
                <span>{review.name}</span>
                <span>{review.date}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-sm">
          <span className="font-semibold">
            {product.rating}
          </span>

          <FiStar fill="currentColor" />

          <span className="text-black/40">
            Based on {product.reviewCount} reviews
          </span>
        </div>
      </div>
    </section>
  );
}

export default ProductReviews;