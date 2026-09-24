import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  MapPin,
  Calendar,
  Sparkles,
  ShoppingBag,
  MessageSquare,
  ThumbsUp,
  X,
  AlertCircle,
} from "lucide-react";
import type { Product } from "../types/inventory";
import { API_BASE } from "../config/api";

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  reviewerName: string;
  reviewerLocation: string;
  rating: number;
  title: string;
  content: string;
  verifiedBuyer: boolean;
  date: string;
  createdAt?: string;
}

interface ReviewsManagerProps {
  inventory: Product[];
}

const DEFAULT_REVIEWS: ProductReview[] = [];

export default function ReviewsManager({ inventory }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    try {
      const saved = localStorage.getItem("rs_product_reviews");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | "all">("all");
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    reviewerName: "",
    reviewerLocation: "Hyderabad, Telangana",
    rating: 5,
    title: "",
    content: "",
    verifiedBuyer: true,
    date: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  });

  // Sync with backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchBackendReviews() {
      try {
        const res = await fetch(`${API_BASE}/reviews`);
        if (res.ok) {
          const json = await res.json();
          const list = json.reviews || json.data?.reviews;
          if (Array.isArray(list) && isMounted) {
            setReviews(list);
            localStorage.setItem("rs_product_reviews", JSON.stringify(list));
          }
        }
      } catch (err) {
        console.warn("Reviews backend fetch notice:", err);
      }
    }
    fetchBackendReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes locally and attempt backend sync
  const persistReviews = (updated: ProductReview[]) => {
    setReviews(updated);
    localStorage.setItem("rs_product_reviews", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("rs_reviews_updated", { detail: updated }));
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    const firstProd = inventory[0];
    setEditingReview(null);
    setFormData({
      productId: firstProd ? String(firstProd.id) : "1",
      productName: firstProd ? firstProd.name : "SiCo Gadwal Saree",
      reviewerName: "",
      reviewerLocation: "Hyderabad, Telangana",
      rating: 5,
      title: "",
      content: "",
      verifiedBuyer: true,
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rev: ProductReview) => {
    setEditingReview(rev);
    setFormData({
      productId: rev.productId,
      productName: rev.productName,
      reviewerName: rev.reviewerName,
      reviewerLocation: rev.reviewerLocation,
      rating: rev.rating,
      title: rev.title,
      content: rev.content,
      verifiedBuyer: rev.verifiedBuyer,
      date: rev.date,
    });
    setIsModalOpen(true);
  };

  // Save Review Submit
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reviewerName.trim() || !formData.content.trim()) return;

    const matchedProd = inventory.find((p) => String(p.id) === String(formData.productId));
    const effectiveProductName = matchedProd ? matchedProd.name : formData.productName || "SiCo Gadwal Saree";

    if (editingReview) {
      // Update
      const updatedItem: ProductReview = {
        ...editingReview,
        productId: formData.productId,
        productName: effectiveProductName,
        reviewerName: formData.reviewerName.trim(),
        reviewerLocation: formData.reviewerLocation.trim(),
        rating: formData.rating,
        title: formData.title.trim() || "Exquisite Handloom Weave",
        content: formData.content.trim(),
        verifiedBuyer: formData.verifiedBuyer,
        date: formData.date,
      };

      const updatedList = reviews.map((r) => (r.id === editingReview.id ? updatedItem : r));
      persistReviews(updatedList);

      fetch(`${API_BASE}/reviews/${editingReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      }).catch((err) => console.warn("Review update API notice:", err));
    } else {
      // Create new
      const newReview: ProductReview = {
        id: `rev-${Date.now().toString(36)}`,
        productId: formData.productId,
        productName: effectiveProductName,
        reviewerName: formData.reviewerName.trim(),
        reviewerLocation: formData.reviewerLocation.trim() || "Hyderabad, Telangana",
        rating: formData.rating,
        title: formData.title.trim() || "Exquisite Handloom Weave",
        content: formData.content.trim(),
        verifiedBuyer: formData.verifiedBuyer,
        date: formData.date,
        createdAt: new Date().toISOString(),
      };

      const updatedList = [newReview, ...reviews];
      persistReviews(updatedList);

      fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview),
      }).catch((err) => console.warn("Review create API notice:", err));
    }

    setIsModalOpen(false);
  };

  // Delete Review
  const handleDeleteReview = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this product review?")) return;
    const updated = reviews.filter((r) => r.id !== id);
    persistReviews(updated);

    fetch(`${API_BASE}/reviews/${id}`, {
      method: "DELETE",
    }).catch((err) => console.warn("Review delete API notice:", err));
  };

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        searchQuery === "" ||
        r.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reviewerLocation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRating = selectedRatingFilter === "all" || r.rating === selectedRatingFilter;
      const matchProduct = selectedProductFilter === "all" || String(r.productId) === String(selectedProductFilter);

      return matchSearch && matchRating && matchProduct;
    });
  }, [reviews, searchQuery, selectedRatingFilter, selectedProductFilter]);

  // Summary Metrics
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const fiveStarCount = useMemo(() => {
    return reviews.filter((r) => r.rating === 5).length;
  }, [reviews]);

  const verifiedPercent = useMemo(() => {
    if (reviews.length === 0) return 100;
    const verified = reviews.filter((r) => r.verifiedBuyer).length;
    return Math.round((verified / reviews.length) * 100);
  }, [reviews]);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#2A2421] via-[#3A322D] to-[#1E1917] p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#D9C2A5] mb-2 text-xs font-bold uppercase tracking-[0.25em]">
              <Sparkles size={16} />
              <span>Operations &amp; CRM · Product Experience</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#FAF8F5]">
              Patron Reviews &amp; <span className="italic font-normal text-[#D9C2A5]">Testimonials</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-300 max-w-2xl font-light">
              Manually add, curate, and feature verified patron testimonials for handloom SiCo Gadwal drapes across our studio storefront.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#8E3D51] to-[#A2425B] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            <Plus size={18} />
            <span>Add New Review</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#8E3D51]/30 blur-3xl" />
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 block mb-1">
            Total Reviews
          </span>
          <p className="font-serif text-3xl font-normal text-stone-900">{reviews.length}</p>
          <span className="text-[11px] text-stone-500 mt-1 block">Live across storefront</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 block mb-1">
            Average Rating
          </span>
          <div className="flex items-center gap-2">
            <p className="font-serif text-3xl font-normal text-stone-900">{avgRating}</p>
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-current" />
              ))}
            </div>
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Out of 5.0 stars</span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 block mb-1">
            5-Star Appraisals
          </span>
          <p className="font-serif text-3xl font-normal text-[#8E3D51]">{fiveStarCount}</p>
          <span className="text-[11px] text-stone-500 mt-1 block">
            {Math.round((fiveStarCount / Math.max(1, reviews.length)) * 100)}% excellence rate
          </span>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 block mb-1">
            Verified Patrons
          </span>
          <div className="flex items-center gap-2">
            <p className="font-serif text-3xl font-normal text-emerald-700">{verifiedPercent}%</p>
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Authenticated buyers</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by patron name, saree, location, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-[#8E3D51] focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rating filter */}
          <select
            value={selectedRatingFilter}
            onChange={(e) => setSelectedRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-700 focus:border-[#8E3D51] focus:outline-hidden"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
          </select>

          {/* Product filter */}
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-700 focus:border-[#8E3D51] focus:outline-hidden max-w-[200px] truncate"
          >
            <option value="all">All Sarees</option>
            {inventory.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* REVIEWS GRID */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 p-12 text-center bg-stone-50">
          <MessageSquare size={36} className="mx-auto text-stone-400 mb-3" />
          <p className="font-serif text-lg text-stone-800">No reviews found</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            No customer reviews matched your search criteria. Click below to add a review for any saree in your inventory.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#8E3D51] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#722F40] transition-colors"
          >
            <Plus size={16} />
            <span>Add Review Manually</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-xs hover:shadow-md transition-all group"
            >
              <div>
                {/* Header: Saree Badge & Rating */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF7F2] border border-stone-200/80 px-2.5 py-1 text-[10px] font-medium text-[#8E3D51] max-w-[70%] truncate">
                    <ShoppingBag size={11} className="shrink-0" />
                    <span className="truncate">{rev.productName}</span>
                  </span>

                  <div className="flex text-amber-500 shrink-0">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={13} className="fill-current" />
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                <h3 className="font-serif text-base font-medium text-stone-900 group-hover:text-[#8E3D51] transition-colors line-clamp-2">
                  "{rev.title}"
                </h3>

                {/* Content */}
                <p className="mt-2 text-xs leading-relaxed text-stone-600 font-light line-clamp-4">
                  {rev.content}
                </p>
              </div>

              {/* Bottom: Patron Details & Actions */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-800">{rev.reviewerName}</span>
                    {rev.verifiedBuyer && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={10} />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-stone-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      <span>{rev.reviewerLocation}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      <span>{rev.date}</span>
                    </span>
                  </div>
                </div>

                {/* Edit & Delete Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(rev)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Edit Review"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT REVIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-[#8E3D51] mb-1 text-xs font-bold uppercase tracking-[0.2em]">
              <Sparkles size={14} />
              <span>{editingReview ? "Edit Review" : "Add New Review"}</span>
            </div>
            <h2 className="font-serif text-2xl font-light text-stone-900">
              {editingReview ? "Modify Patron Review" : "Curate Patron Testimonial"}
            </h2>
            <p className="text-xs text-stone-500 mt-1 mb-6">
              This review will be featured in the store and linked directly to the selected saree.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Product selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Select Saree Drape *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const matched = inventory.find((p) => String(p.id) === String(selId));
                    setFormData((prev) => ({
                      ...prev,
                      productId: selId,
                      productName: matched ? matched.name : prev.productName,
                    }));
                  }}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:border-[#8E3D51] focus:outline-hidden"
                  required
                >
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reviewer Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    Patron Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sowmya Reddy"
                    value={formData.reviewerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reviewerName: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:border-[#8E3D51] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad, Telangana"
                    value={formData.reviewerLocation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reviewerLocation: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:border-[#8E3D51] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Star Rating Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={22}
                        className={star <= formData.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-stone-600 ml-2">
                    {formData.rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Headline */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Review Headline / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Breathable SiCo Weave with Radiant Gold Border"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:border-[#8E3D51] focus:outline-hidden"
                />
              </div>

              {/* Review Content */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Review Comments &amp; Experience *
                </label>
                <textarea
                  rows={4}
                  placeholder="Share details about the texture, drape weight, zari sheen, festive comfort, or packaging..."
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:border-[#8E3D51] focus:outline-hidden"
                  required
                />
              </div>

              {/* Verified Buyer & Date */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verifiedBuyer}
                    onChange={(e) => setFormData((prev) => ({ ...prev, verifiedBuyer: e.target.checked }))}
                    className="h-4 w-4 rounded-sm border-stone-300 text-[#8E3D51] focus:ring-[#8E3D51]"
                  />
                  <span className="text-xs font-medium text-stone-700">Display "Verified Buyer" badge</span>
                </label>

                <div className="w-36">
                  <input
                    type="text"
                    placeholder="Date (e.g. 15 Sep 2026)"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3 py-1.5 text-xs text-stone-800 focus:border-[#8E3D51] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-stone-300 px-5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-linear-to-r from-[#8E3D51] to-[#A2425B] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  {editingReview ? "Save Changes" : "Publish Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
