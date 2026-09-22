import { supabase } from "../config/supabase.js";
import { successResponse, errorResponse } from "../utils/response.js";
import {
  getReviewsFromStore,
  saveReviewToStore,
  deleteReviewFromStore,
} from "../database/localStore.js";

/**
 * Controller: Product Reviews Management
 */

let cachedReviews = null;
let lastReviewsFetch = 0;
let inFlightReviewsPromise = null;
const REVIEWS_CACHE_TTL_MS = 60 * 1000;

export function invalidateReviewsCache() {
  cachedReviews = null;
  lastReviewsFetch = 0;
}

// 1. GET REVIEWS
export async function getReviews(req, res) {
  try {
    const { productId } = req.query;

    if (!productId && cachedReviews && Date.now() - lastReviewsFetch < REVIEWS_CACHE_TTL_MS) {
      return successResponse(res, { reviews: cachedReviews }, "Reviews retrieved successfully (cached)");
    }

    if (!productId && !inFlightReviewsPromise) {
      inFlightReviewsPromise = (async () => {
        if (supabase) {
          try {
            const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
            if (!error && data && data.length > 0) {
              const formatted = data.map((r) => ({
                id: r.id,
                productId: r.product_id,
                productName: r.product_name,
                reviewerName: r.reviewer_name,
                reviewerLocation: r.reviewer_location,
                rating: Number(r.rating) || 5,
                title: r.title,
                content: r.content,
                verifiedBuyer: r.verified_buyer !== false,
                date: r.date || new Date(r.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }),
                createdAt: r.created_at,
              }));
              cachedReviews = formatted;
              lastReviewsFetch = Date.now();
              return formatted;
            }
          } catch (e) {
            console.warn("Supabase reviews fetch error:", e.message);
          }
        }
        const local = getReviewsFromStore();
        cachedReviews = local;
        lastReviewsFetch = Date.now();
        return local;
      })().finally(() => {
        inFlightReviewsPromise = null;
      });
    }

    if (!productId && inFlightReviewsPromise) {
      const reviews = await inFlightReviewsPromise;
      return successResponse(res, { reviews }, "Reviews retrieved successfully");
    }

    if (supabase) {
      try {
        let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
        if (productId) {
          query = query.eq("product_id", productId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const formatted = data.map((r) => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            reviewerName: r.reviewer_name,
            reviewerLocation: r.reviewer_location,
            rating: Number(r.rating) || 5,
            title: r.title,
            content: r.content,
            verifiedBuyer: r.verified_buyer !== false,
            date: r.date || new Date(r.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }),
            createdAt: r.created_at,
          }));
          return successResponse(res, { reviews: formatted }, "Reviews retrieved successfully");
        }
      } catch (err) {
        console.warn("Reviews fetch error:", err.message);
      }
    }

    const localReviews = getReviewsFromStore(productId);
    return successResponse(res, { reviews: localReviews }, "Reviews retrieved from store");
  } catch (err) {
    if (cachedReviews) {
      return successResponse(res, { reviews: cachedReviews }, "Reviews retrieved successfully (fallback)");
    }
    return errorResponse(res, err.message, 500);
  }
}

// 2. CREATE REVIEW
export async function createReview(req, res) {
  try {
    const {
      productId,
      productName,
      reviewerName,
      reviewerLocation,
      rating = 5,
      title,
      content,
      verifiedBuyer = true,
      date,
    } = req.body;

    if (!productId || !reviewerName || !content) {
      return errorResponse(res, "Product, reviewer name, and review content are required", 400);
    }

    const reviewId = `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const reviewData = {
      id: reviewId,
      productId: String(productId),
      productName: productName || "SiCo Gadwal Saree",
      reviewerName: String(reviewerName).trim(),
      reviewerLocation: reviewerLocation ? String(reviewerLocation).trim() : "Hyderabad, Telangana",
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      title: title ? String(title).trim() : "Generational Masterpiece",
      content: String(content).trim(),
      verifiedBuyer: Boolean(verifiedBuyer),
      date: date || new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      createdAt: new Date().toISOString(),
    };

    // Save to local store
    saveReviewToStore(reviewData);

    // Save to Supabase if available
    if (supabase) {
      try {
        await supabase.from("reviews").insert([{
          id: reviewData.id,
          product_id: reviewData.productId,
          product_name: reviewData.productName,
          reviewer_name: reviewData.reviewerName,
          reviewer_location: reviewData.reviewerLocation,
          rating: reviewData.rating,
          title: reviewData.title,
          content: reviewData.content,
          verified_buyer: reviewData.verifiedBuyer,
          date: reviewData.date,
        }]);
      } catch (sbErr) {
        console.warn("Supabase createReview notice:", sbErr.message);
      }
    }

    return successResponse(res, { review: reviewData }, "Review published successfully", 201);
  } catch (err) {
    console.error("createReview error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 3. UPDATE REVIEW
export async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return errorResponse(res, "Review ID is required", 400);
    }

    const updated = saveReviewToStore({ ...updates, id });

    if (supabase) {
      try {
        await supabase.from("reviews").update({
          product_id: updates.productId,
          product_name: updates.productName,
          reviewer_name: updates.reviewerName,
          reviewer_location: updates.reviewerLocation,
          rating: updates.rating,
          title: updates.title,
          content: updates.content,
          verified_buyer: updates.verifiedBuyer,
          date: updates.date,
        }).eq("id", id);
      } catch (sbErr) {
        console.warn("Supabase updateReview notice:", sbErr.message);
      }
    }

    return successResponse(res, { review: updated }, "Review updated successfully");
  } catch (err) {
    console.error("updateReview error:", err);
    return errorResponse(res, err.message, 500);
  }
}

// 4. DELETE REVIEW
export async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, "Review ID is required", 400);
    }

    deleteReviewFromStore(id);

    if (supabase) {
      try {
        await supabase.from("reviews").delete().eq("id", id);
      } catch (sbErr) {
        console.warn("Supabase deleteReview notice:", sbErr.message);
      }
    }

    return successResponse(res, { id }, "Review deleted successfully");
  } catch (err) {
    console.error("deleteReview error:", err);
    return errorResponse(res, err.message, 500);
  }
}
