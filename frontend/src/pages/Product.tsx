import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Minus,
  Package,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
} from "lucide-react";

import { type Product as ProductType, products as staticProducts } from "../data/products";
import { useCart } from "../context/CartContext";
import { StoreService } from "../services/supabase";

interface ColorVariantItem {
  name: string;
  hex: string;
  image?: string;
  inStock: boolean;
}

const FALLBACK_VARIANTS: ColorVariantItem[] = [
  {
    name: "Crimson Red",
    hex: "#991B1B",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
    inStock: true,
  },
  {
    name: "Deep Teal",
    hex: "#0F766E",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
    inStock: true,
  },
  {
    name: "Emerald Green",
    hex: "#065F46",
    image: "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg",
    inStock: true,
  },
  {
    name: "Maroon Gold",
    hex: "#7F1D1D",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    inStock: true,
  },
  {
    name: "Ivory Gold",
    hex: "#FEF3C7",
    image: "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/b/a/bandhej-printed-cotton-saree-in-cream-v1-sfc217.jpg",
    inStock: false,
  },
];

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cart = [], addToCart } = useCart() as any;

  const [allProducts, setAllProducts] = useState<ProductType[]>(staticProducts);
  const [product, setProduct] = useState<ProductType | null>(() => {
    return staticProducts.find((item) => item.id === id) || null;
  });
  const [loading, setLoading] = useState<boolean>(!product);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("Crimson Red");
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Real-time IST Status Check
  const isSpecialistOnline = useMemo(() => {
    const now = new Date();
    const istOffset = 5.5 * 60;
    const localOffset = now.getTimezoneOffset();
    const istTime = new Date(now.getTime() + (istOffset + localOffset) * 60000);
    const hours = istTime.getHours();
    return hours >= 10 && hours < 21; // 10:00 AM - 9:00 PM IST
  }, []);

  const inCart = useMemo(() => {
    if (!product) return false;
    return (cart || []).some((item: any) => {
      const cId = item?.product?.id ?? item?.id;
      return String(cId) === String(product.id);
    });
  }, [cart, product]);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!id) return;
      try {
        const prods = await StoreService.getProducts();
        if (isMounted && prods.length > 0) setAllProducts(prods);
        const found = prods.find((p) => p.id === id) || (await StoreService.getProductById(id));
        if (isMounted && found) {
          setProduct(found);
          if (found.colors?.length) {
            setSelectedColor(found.colors[0]);
          }
        }
      } catch (err) {
        console.warn("Could not fetch product dynamically:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const colorVariants: ColorVariantItem[] = useMemo(() => {
    if (!product) return FALLBACK_VARIANTS;

    if ((product as any).variants && Array.isArray((product as any).variants)) {
      return (product as any).variants.map((v: any, idx: number) => ({
        name: v.color || v.name || `Shade ${idx + 1}`,
        hex: v.hex || FALLBACK_VARIANTS[idx % FALLBACK_VARIANTS.length].hex,
        image: v.imageUrl || product.images?.[idx % (product.images?.length || 1)],
        inStock: v.stock === undefined ? true : v.stock > 0,
      }));
    }

    if (product.colors && product.colors.length > 0 && product.colors[0] !== "Standard") {
      return product.colors.map((colorName: string, idx: number) => {
        const fallback =
          FALLBACK_VARIANTS.find((f) => f.name.toLowerCase() === colorName.toLowerCase()) ||
          FALLBACK_VARIANTS[idx % FALLBACK_VARIANTS.length];
        return {
          name: colorName,
          hex: fallback.hex,
          image: product.images?.[idx] || fallback.image,
          inStock: true,
        };
      });
    }

    return FALLBACK_VARIANTS;
  }, [product]);

  const enrichedImages = useMemo(() => {
    if (!product) return [];
    const base =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images.filter(Boolean)
        : [product.images?.[0] || (product as any)?.image || FALLBACK_VARIANTS[0].image];

    if (base.length >= 4) return base;

    const extras = [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1200&auto=format&fit=crop",
      "https://medias.utsavfashion.com/media/catalog/product/cache/1/image/1000x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-saree-in-emerald-green-v1-ssf833_2.jpg",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop",
    ];
    return [...base, ...extras.filter((e) => !base.includes(e)).slice(0, 4 - base.length)];
  }, [product]);

  const handleColorSelect = (variant: ColorVariantItem) => {
    setSelectedColor(variant.name);
    if (variant.image) {
      const foundIdx = enrichedImages.findIndex((img) => img === variant.image);
      if (foundIdx !== -1) {
        setSelectedImage(foundIdx);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product || inCart) return;
    addToCart(product, {
      quantity,
      selectedColor,
      selectedSize: "Free Size (5.5m + 0.8m Blouse)",
    });
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 2200);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!inCart) {
      addToCart(product, {
        quantity,
        selectedColor,
        selectedSize: "Free Size (5.5m + 0.8m Blouse)",
      });
    }
    navigate("/checkout");
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = product?.name || "RS Fashions Saree";
  const shareText = `Check out this handcrafted ${shareTitle} at RS Fashions:`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Handled silently
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && navigator.canShare && navigator.canShare({ url: shareUrl })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setShowShareModal(false);
      } catch {
        // Dismissed by user
      }
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#8E3D51] border-t-transparent" />
          <p className="text-xs uppercase tracking-widest text-[#8C7A6B]">Loading Saree Details...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FAF7F2] px-6 text-center">
        <h1 className="font-serif text-3xl font-light text-[#2A2421]">We couldn't find this saree</h1>
        <p className="mt-2 text-sm text-[#756A60]">It might have been sold out or moved to our archive.</p>
        <Link
          to="/shop"
          className="mt-6 rounded-full bg-[#8E3D51] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:bg-[#783144] transition-colors"
        >
          Browse All Sarees
        </Link>
      </main>
    );
  }

  const isSoldOut = product.stock !== undefined && product.stock <= 0;
  const relatedProducts = allProducts.filter((item) => item.id !== product.id).slice(0, 4);

  return (
    <main className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] select-none pb-24 sm:pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {showAddedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#2A2421] px-5 py-2.5 text-xs font-medium text-white shadow-xl"
          >
            <Check size={14} className="text-emerald-400 stroke-[3]" />
            <span>Added to your bag!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Share Drawer Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-stone-200 bg-[#FAF7F2] p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="text-[#8E3D51]" />
                  <h3 className="font-serif text-lg font-normal text-[#2A2421]">Share Drape</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200/60 text-stone-600 hover:bg-stone-200"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Saree Mini Card Preview */}
              <div className="my-3.5 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-2.5">
                <img
                  src={enrichedImages[0]}
                  alt={product.name}
                  className="h-12 w-10 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-serif text-xs font-medium text-stone-900 truncate">{product.name}</p>
                  <p className="text-[11px] font-bold text-[#8E3D51]">₹{product.price.toLocaleString("en-IN")}</p>
                </div>
              </div>

              {/* Direct Social Grid with Official SVGs */}
              <div className="grid grid-cols-4 gap-2.5 text-center my-4">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-stone-700">WhatsApp</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-stone-700">Facebook</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-stone-700">X</span>
                </a>

                {/* Gmail / Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Check out ${shareTitle}`)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EA4335] text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-stone-700">Email</span>
                </a>
              </div>

              {/* Native App Drawer Button */}
              {typeof navigator !== "undefined" && Boolean(navigator.share) && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 active:scale-98 transition-all shadow-2xs"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <radialGradient id="ig-grad-share" r="150%" cx="30%" cy="107%">
                      <stop stopColor="#fdf497" offset="0%" />
                      <stop stopColor="#fdf497" offset="5%" />
                      <stop stopColor="#fd5949" offset="45%" />
                      <stop stopColor="#d6249f" offset="60%" />
                      <stop stopColor="#285AEB" offset="90%" />
                    </radialGradient>
                    <path
                      fill="url(#ig-grad-share)"
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    />
                  </svg>
                  <span>More Apps (Instagram, AirDrop, etc.)</span>
                </button>
              )}

              {/* Copy Link Input Bar */}
              <div className="flex items-center justify-between rounded-xl border border-stone-300 bg-white p-1.5">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full bg-transparent px-2 text-[11px] text-stone-600 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-[#2A2421] text-white hover:bg-[#8E3D51] active:scale-95"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={12} className="stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 text-xs text-[#8C7A6B]">
          <Link to="/" className="hover:text-[#2A2421] transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#2A2421] transition-colors">Collection</Link>
          <span>/</span>
          <span className="text-[#2A2421] font-medium truncate">{product.name}</span>
        </nav>
      </div>

      {/* Main Section */}
      <section className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: Photo Gallery */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div className="hidden sm:grid sm:grid-cols-[80px_1fr] gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-3">
                {enrichedImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImage === idx
                        ? "border-[#8E3D51] shadow-sm scale-102"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Big Stage Image */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-[#EDE8E0] shadow-sm">
                <img
                  src={enrichedImages[selectedImage] || enrichedImages[0]}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />

                {enrichedImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : enrichedImages.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-md backdrop-blur-sm hover:bg-white active:scale-95 transition-all"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImage((prev) => (prev < enrichedImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-800 shadow-md backdrop-blur-sm hover:bg-white active:scale-95 transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-900 shadow-xs backdrop-blur-md">
                    Pure SiCo Handloom
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Swipe Gallery */}
            <div className="relative sm:hidden -mx-4">
              <div
                ref={scrollRef}
                onScroll={() => {
                  if (!scrollRef.current) return;
                  const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
                  setSelectedImage(idx);
                }}
                className="flex w-full snap-x snap-mandatory overflow-x-auto scrollbar-none"
              >
                {enrichedImages.map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-[#EDE8E0]">
                    <img src={img} alt={`View ${idx + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
                {enrichedImages.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedImage === idx ? "w-5 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Product Details & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E3D51]">
                  {product.category || "SiCo Gadwal Saree"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:scale-95 transition-all shadow-xs"
                  title="Share this saree"
                >
                  <Share2 size={16} />
                </button>
              </div>

              <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-normal leading-snug text-[#2A2421]">
                {product.name}
              </h1>

              <div className="mt-3 flex items-center gap-2 text-sm text-stone-600">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-stone-900">{product.rating || 4.8}</span>
                </div>
                <span>&bull;</span>
                <span className="text-xs">{product.reviewCount || 24} Verified Buyer Ratings</span>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#2A2421]">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                   
                  </>
                )}
              </div>

              <p className="mt-1 text-xs text-stone-500">Inclusive of all taxes &middot; Free express delivery</p>

              <p className="mt-4 text-xs sm:text-sm text-stone-600 font-light leading-relaxed border-t border-stone-200/80 pt-4">
                {product.description || "Authentic handwoven SiCo Gadwal drape crafted with heritage interlocked contrast zari border and pure silk warp."}
              </p>

              {/* COLOR VARIANTS */}
              <div className="mt-6 border-t border-stone-200/80 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Select Color: <span className="font-normal text-[#8E3D51]">{selectedColor}</span>
                  </span>
                  <span className="text-[11px] text-stone-500">{colorVariants.length} shades available</span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {colorVariants.map((variant) => {
                    const isSelected = selectedColor === variant.name;
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => handleColorSelect(variant)}
                        className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
                          isSelected
                            ? "border-[#8E3D51] bg-[#FAF4ED] ring-2 ring-[#8E3D51]/20 shadow-xs"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        {variant.image ? (
                          <img
                            src={variant.image}
                            alt={variant.name}
                            className="h-8 w-8 rounded-lg object-cover shrink-0 border border-stone-200"
                          />
                        ) : (
                          <span
                            className="h-7 w-7 rounded-lg border border-black/10 shrink-0"
                            style={{ backgroundColor: variant.hex }}
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs truncate font-medium ${isSelected ? "text-[#8E3D51]" : "text-stone-800"}`}>
                            {variant.name}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {variant.inStock ? "In Stock" : "Limited"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drape Specifications */}
              <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs text-stone-700">
                <div className="flex items-center justify-between font-medium">
                  <span>Standard Length: 5.5m Saree + 0.8m Unstitched Blouse</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check size={13} /> Fall &amp; Pico Ready
                  </span>
                </div>
              </div>

              {/* DESKTOP Quantity & Action Buttons */}
              <div className="mt-6 hidden sm:flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex h-12 items-center rounded-2xl border border-stone-200 bg-white px-3">
                    <button
                      type="button"
                      disabled={isSoldOut || quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="text-stone-500 hover:text-stone-900 disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center font-medium text-sm">{quantity}</span>
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => setQuantity((q) => q + 1)}
                      className="text-stone-500 hover:text-stone-900 disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={handleAddToCart}
                    className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all ${
                      inCart
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-[#2A2421] bg-white text-[#2A2421] hover:bg-stone-50 active:scale-98 shadow-xs"
                    }`}
                  >
                    <ShoppingBag size={15} />
                    <span>{isSoldOut ? "Out of Stock" : inCart ? "Added in Bag" : "Add to Bag"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={handleBuyNow}
                  className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md transition-all ${
                    isSoldOut
                      ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                      : "bg-[#8E3D51] text-white hover:bg-[#783144] active:scale-98"
                  }`}
                >
                  <span>{isSoldOut ? "Currently Sold Out" : "Buy It Now"}</span>
                  {!isSoldOut && <ArrowRight size={14} />}
                </button>
              </div>

              {/* Delivery & Policy Assurances */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-200/80 pt-5">
                <div className="flex items-center gap-2 text-xs text-stone-700">
                  <Truck size={16} className="text-[#8E3D51] shrink-0" />
                  <span>Dispatched in 24 Hours</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-700">
                  <ShieldCheck size={16} className="text-[#8E3D51] shrink-0" />
                  <span>100% Genuine Handloom</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-700">
                  <Package size={16} className="text-[#8E3D51] shrink-0" />
                  <span>Secure Protective Packaging</span>
                </div>
                <Link
                  to="/return-policy"
                  className="flex items-center gap-2 text-xs text-[#8E3D51] font-semibold hover:underline"
                >
                  <FileText size={16} className="shrink-0" />
                  <span>Return &amp; Exchange Policy &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE THIS WEAVE */}
      <section className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 mt-16 sm:mt-24">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E3D51]">The Artisan Difference</span>
            <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-normal text-stone-900">
              Why You'll Love This Saree
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-light text-stone-600 leading-relaxed">
              {product.longDescription ||
                "Woven on authentic pit looms in Gadwal, Telangana. Crafted using natural silk in the warp and premium cotton in the weft for an effortless drape that stays wrinkle-resistant and breathable all day long."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-stone-100 pt-6">
            <div>
              <h3 className="font-serif text-base text-stone-900">Featherlight Feel</h3>
              <p className="mt-1 text-xs text-stone-500 font-light">
                Comfortable weight designed for 10+ hours of festive or ceremonial wear without feeling heavy.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-base text-stone-900">Interlocked Zari</h3>
              <p className="mt-1 text-xs text-stone-500 font-light">
                Authentic kuttu border technique ensuring the rich golden threads never unravel.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-base text-stone-900">Dry Clean Friendly</h3>
              <p className="mt-1 text-xs text-stone-500 font-light">
                Store folded inside a breathable cotton bag to maintain genuine shine for generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 mt-12 sm:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E3D51]">Got Questions?</span>
            <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-normal text-stone-900">
              Everything You Need to Know
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
              Have doubts about blouse sizing or our store policies? Chat directly with our team.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <div className="flex flex-col gap-1.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hi RS Fashions, I am inquiring about "${product.name}" (Ref: ${product.id}). Is this available?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#20bd5a] active:scale-[0.98] transition-all shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>Chat with us</span>
                </a>

                {/* Real-time Status Badge */}
                <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-stone-500">
                  <span className="relative flex h-2 w-2">
                    {isSpecialistOnline ? (
                      <>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </>
                    ) : (
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </span>
                  <span>
                    {isSpecialistOnline
                      ? "Loom specialist online · Instant reply"
                      : "Replies within 15–30 mins"}
                  </span>
                </div>
              </div>

              <Link
                to="/return-policy"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <FileText size={13} className="text-[#8E3D51]" />
                <span>Read Return Policy</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8 divide-y divide-stone-200 border-y border-stone-200">
            {[
              {
                q: "Is Fall and Pico included?",
                a: "Yes! Every saree arrives completely finished with pre-stitched matching fall and delicate pico hem roll at no extra charge.",
              },
              {
                q: "Does it come with a blouse piece?",
                a: "Yes, an unstitched 0.8-meter matching contrast blouse piece is connected to the saree drape.",
              },
              {
                q: "How fast will my package arrive?",
                a: "We ship orders within 24 hours via express courier. Most metro destinations receive delivery in 2 to 4 business days.",
              },
              {
                q: "What is your return or replacement policy?",
                a: (
                  <span>
                    To protect the exclusivity and delicate nature of authentic handwoven pit-loom sarees, orders are subject to our dedicated return guidelines. Please review our full{" "}
                    <Link to="/return-policy" className="text-[#8E3D51] font-semibold underline">
                      Return &amp; Replacement Policy
                    </Link>{" "}
                    before placing your order.
                  </span>
                ),
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left font-serif text-base sm:text-lg font-normal text-stone-900"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-2 text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10 mt-16 sm:mt-24">
          <div className="flex items-end justify-between border-b border-stone-200 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E3D51]">More In Store</span>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-normal text-stone-900">
                You May Also Like
              </h2>
            </div>
            <Link to="/shop" className="text-xs font-semibold text-[#8E3D51] hover:underline">
              View All Sarees &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                to={`/product/${rel.id}`}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="group flex flex-col"
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-stone-100">
                  <img
                    src={rel.images[0]}
                    alt={rel.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-2">
                  <span className="text-[10px] uppercase tracking-wider text-stone-500">{rel.material || "SiCo"}</span>
                  <h3 className="font-serif text-sm text-stone-900 group-hover:text-[#8E3D51] transition-colors truncate">
                    {rel.name}
                  </h3>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">₹{rel.price.toLocaleString("en-IN")}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PERSISTENT MOBILE FLOATING BUY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-stone-400">Total Price</span>
            <p className="text-lg font-bold text-stone-900 leading-tight">
              ₹{(product.price * quantity).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSoldOut}
              onClick={handleAddToCart}
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider ${
                inCart
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-stone-800 bg-white text-stone-900 active:scale-95"
              }`}
            >
              {inCart ? "In Bag" : "Add"}
            </button>
            <button
              type="button"
              disabled={isSoldOut}
              onClick={handleBuyNow}
              className="rounded-xl bg-[#8E3D51] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md active:scale-95"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}