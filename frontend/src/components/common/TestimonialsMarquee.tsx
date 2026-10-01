import { useEffect, useState, useMemo } from "react";
import { FiStar, FiCheck } from "react-icons/fi";
import { API_BASE } from "../../config/api";

export interface ReviewItem {
  id: string;
  productId?: string;
  productName?: string;
  reviewerName: string;
  reviewerLocation: string;
  rating: number;
  title: string;
  content: string;
  verifiedBuyer?: boolean;
  approved?: boolean;
  date?: string;
}

export default function TestimonialsMarquee() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchApprovedReviews() {
      try {
        const res = await fetch(`${API_BASE}/reviews?approved=true`);
        if (!res.ok) return;
        const json = await res.json();
        const list = json.reviews || json.data?.reviews || [];
        if (isMounted && Array.isArray(list)) {
          // Filter strictly approved reviews
          const approvedReviews = list.filter((r: ReviewItem) => r && r.approved !== false);
          setReviews(approvedReviews);
        }
      } catch (err) {
        console.warn("TestimonialsMarquee fetch notice:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchApprovedReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hidden if empty or still loading with no data
  if (loading || reviews.length === 0) {
    return null;
  }

  // Triple items for seamless continuous looping on all screen widths
  const marqueeList = reviews.length >= 3 ? [...reviews, ...reviews, ...reviews] : [...reviews, ...reviews, ...reviews, ...reviews];

  return (
    <aside
      aria-label="Customer Testimonials"
      className="relative overflow-hidden bg-linear-to-b from-transparent via-[#F4E7E4]/50 to-[#E9C9C3]/30 py-10 font-sans select-none sm:py-14"
    >
      <style>{`
        @keyframes testimonialsMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }

        .testimonials-track {
          display: flex;
          width: max-content;
          animation: testimonialsMarquee 70s linear infinite;
          will-change: transform;
        }

        .testimonials-track.paused {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .testimonials-track {
            animation: none !important;
            overflow-x: auto;
            width: 100%;
            padding-bottom: 8px;
          }
        }
      `}</style>

      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#E9C9C3]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#CBC0D3]/35 blur-3xl" />

      {/* Header Container */}
      <div className="mx-auto mb-6 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8E3D51]">
          Patron Experiences
        </p>
        <h2 className="mt-1 font-serif text-2xl font-light text-[#2A2421] sm:text-3xl">
          Words from Our Saree Connoisseurs
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs font-light text-stone-600">
          Authentic drapes handwoven by master artisans, cherished across generations.
        </p>
      </div>

      {/* Marquee Container with edge fading */}
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Soft Fade Masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-[#F7EBEC] to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-[#F7EBEC] to-transparent sm:w-28" />

        <div className={`testimonials-track gap-4 px-4 sm:gap-6 sm:px-8 ${isPaused ? "paused" : ""}`}>
          {marqueeList.map((review, idx) => (
            <article
              key={`${review.id}-${idx}`}
              className="flex w-72.5 shrink-0 flex-col justify-between rounded-2xl border border-white/80 bg-white/80 p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-[#8E3D51]/40 hover:bg-white hover:shadow-md sm:w-85"
            >
              <div>
                {/* Star Rating & Verified Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: Math.min(5, Math.max(1, review.rating || 5)) }).map((_, sIdx) => (
                      <FiStar key={sIdx} size={13} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {review.verifiedBuyer !== false && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-200/60">
                      <FiCheck size={10} className="stroke-3" />
                      Verified Patron
                    </span>
                  )}
                </div>

                {/* Review Title */}
                {review.title && (
                  <h3 className="mt-2.5 font-serif text-sm font-medium text-[#2A2421] line-clamp-1">
                    "{review.title}"
                  </h3>
                )}

                {/* Content Quote */}
                <p className="mt-1.5 text-xs font-light leading-relaxed text-stone-600 line-clamp-3">
                  {review.content}
                </p>
              </div>

              {/* Reviewer Details & Saree Name */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                <div>
                  <h4 className="font-semibold text-[#2A2421]">{review.reviewerName}</h4>
                  <p className="text-[10px] text-stone-500">{review.reviewerLocation}</p>
                </div>
                {review.productName && (
                  <span className="max-w-32.5 truncate text-[9.5px] font-medium text-[#8E3D51]">
                    {review.productName}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}
