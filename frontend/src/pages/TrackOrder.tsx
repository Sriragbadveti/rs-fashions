import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Package,
  Share2,
  Truck,
  Phone,
  MapPin,
  Mail,
  Copy,
  Check,
  SlidersHorizontal,
  Save,
  Image as ImageIcon,
  ExternalLink,
  X,
  RefreshCw,
} from "lucide-react";
import type { CompletedSale, Product } from "../types/inventory";
import {
  useOrderFulfillment,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from "../context/OrderFulfillmentContext";
import type { OrderStatus } from "../context/OrderFulfillmentContext";
import { sound } from "../types/soundEngine";
import { useShowroomSettings } from "../types/settings";

interface TrackOrderProps {
  salesHistory: CompletedSale[];
}

const INDIA_COUNTRY_CODE = "91";

const currency = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

export default function TrackOrder({ salesHistory }: TrackOrderProps) {
  const showroom = useShowroomSettings();
  const {
    getFulfillment,
    updateStatus,
    updateTrackingNumber,
    updateCarrierPartner,
    saveFulfillment,
  } = useOrderFulfillment();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(
    salesHistory[0]?.invoiceNumber ?? null
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const inventoryProducts: Product[] = useMemo(() => {
    try {
      const saved = localStorage.getItem("rs_fashions_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  }, []);

  const findSkuImage = (item: CompletedSale["items"][number]): string => {
    const itemWithImg = item as { imageUrl?: string; image?: string };
    if (itemWithImg.imageUrl) return itemWithImg.imageUrl;
    if (itemWithImg.image) return itemWithImg.image;

    const matched = inventoryProducts.find((p) => {
      const hasVariant = p.variants?.some((v) => v.sku === item.sku);
      const isDirectId = p.id === item.sku;
      return hasVariant || isDirectId;
    });

    if (matched) {
      const productWithImages = matched as { imageUrl?: string; images?: string[] };
      return productWithImages.imageUrl || productWithImages.images?.[0] || "";
    }

    return "";
  };

  const getItemPrice = (item: CompletedSale["items"][number]): number => {
    const itemWithPrice = item as { unitPrice?: number; price?: number; salePrice?: number };
    return itemWithPrice.unitPrice ?? itemWithPrice.price ?? itemWithPrice.salePrice ?? 0;
  };

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (isTyping) return;

      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return salesHistory.filter((sale) => {
      const status = getFulfillment(sale.invoiceNumber).status;
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;

      const matchesSearch =
        !q ||
        sale.invoiceNumber.toLowerCase().includes(q) ||
        sale.customerName.toLowerCase().includes(q) ||
        sale.customerPhone.toLowerCase().includes(q) ||
        sale.items.some((item) => item.sku.toLowerCase().includes(q)) ||
        getFulfillment(sale.invoiceNumber).trackingNumber.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [salesHistory, searchQuery, statusFilter, getFulfillment]);

  const selectedOrder = useMemo(
    () => salesHistory.find((sale) => sale.invoiceNumber === selectedInvoice) ?? null,
    [salesHistory, selectedInvoice]
  );

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      sound.playClick();
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField((c) => (c === fieldId ? null : c)), 1500);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleSaveDispatchDetails = async () => {
    if (!selectedOrder) return;
    try {
      setIsSaving(true);
      sound.playNotification();
      const currentFulfillment = getFulfillment(selectedOrder.invoiceNumber);
      await saveFulfillment(selectedOrder.invoiceNumber, currentFulfillment);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save dispatch details:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareTrackingWhatsApp = (sale: CompletedSale) => {
    sound.playClick();
    const fulfillment = getFulfillment(sale.invoiceNumber);
    const totalQty = sale.items.reduce((sum, item) => sum + item.qty, 0);

    const itemsSummary = sale.items
      .map((it, idx) => `${idx + 1}. *${it.name || "Gadwal Saree"}* (SKU: \`${it.sku}\`) × ${it.qty}`)
      .join("\n");

    const message = [
      `✨ *${showroom.storeName} — DISPATCH & TRACKING UPDATE* ✨`,
      "SiCo Gadwal Sarees & Heritage Handlooms",
      "━━━━━━━━━━━━━━━━━━",
      `*Invoice:* ${sale.invoiceNumber}`,
      fulfillment.trackingNumber ? `*AWB / Tracking #:* ${fulfillment.trackingNumber}` : null,
      fulfillment.carrierPartner ? `*Courier Partner:* ${fulfillment.carrierPartner}` : null,
      `*Current Status:* ${ORDER_STATUS_LABELS[fulfillment.status]}`,
      "━━━━━━━━━━━━━━━━━━",
      `*Recipient:* ${sale.customerName}`,
      `*Total Drapes:* ${totalQty} Piece${totalQty !== 1 ? "s" : ""}`,
      "━━━━━━━━━━━━━━━━━━",
      "*PACKAGE CONTENTS:*",
      itemsSummary,
      "━━━━━━━━━━━━━━━━━━",
      "Your saree has passed handloom master inspection and has been dispatched safely in tamper-proof luxury packaging.",
    ]
      .filter(Boolean)
      .join("\n");

    const phone = sale.customerPhone.replace(/\D/g, "");
    const formattedPhone = phone.length === 10 ? `${INDIA_COUNTRY_CODE}${phone}` : phone;

    window.open(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans text-stone-800 select-none pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl lg:text-4xl font-display font-medium text-stone-950 tracking-tight leading-tight">
            Order Dispatch &amp; Tracking
          </h1>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Inspect drape photographs by SKU, update consignment AWB numbers, and send live WhatsApp notifications to patrons.
          </p>
        </div>
      </div>

      {/* SEARCH + STATUS FILTER */}
      <div className="glass-panel p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80 shrink-0">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search invoice, patron, AWB, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-white/90 border border-stone-200 rounded-xl pl-9 pr-14 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-brand-gold transition-colors"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-stone-200 bg-stone-50 text-[9px] font-mono font-semibold text-stone-400">
            Ctrl K
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-[11px] text-stone-400 mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal size={12} />
            Status:
          </span>

          {(
            [
              { id: "ALL" as const, label: "All Orders" },
              { id: "new" as const, label: ORDER_STATUS_LABELS.new },
              { id: "packaging" as const, label: ORDER_STATUS_LABELS.packaging },
              { id: "shipped" as const, label: ORDER_STATUS_LABELS.shipped },
              { id: "delivered" as const, label: ORDER_STATUS_LABELS.delivered },
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sound.playClick();
                setStatusFilter(tab.id);
              }}
              className={`h-8 px-3.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                  : "bg-white/60 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-PANEL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: ORDERS LIST */}
        <div className="lg:col-span-5 min-w-0 space-y-3">
          <div className="flex items-center justify-between px-1 min-h-5">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Orders Ready for Dispatch ({filteredOrders.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredOrders.map((sale) => {
              const isSelected = selectedInvoice === sale.invoiceNumber;
              const fulfillment = getFulfillment(sale.invoiceNumber);
              const totalQty = sale.items.reduce((sum, item) => sum + item.qty, 0);
              const netPaid = Math.max(0, sale.subtotal - sale.discount);

              return (
                <div
                  key={sale.invoiceNumber}
                  onClick={() => {
                    sound.playClick();
                    setSelectedInvoice(sale.invoiceNumber);
                  }}
                  className={`p-4 rounded-3xl glass-panel transition-all duration-200 cursor-pointer text-left relative ${
                    isSelected
                      ? "ring-2 ring-brand-gold/60 border-brand-gold/40 bg-white shadow-md -translate-y-0.5"
                      : "hover:border-stone-300 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] font-bold text-stone-800">
                        {sale.invoiceNumber}
                      </span>
                      <h3 className="font-semibold text-xs text-stone-900 mt-1 line-clamp-1 leading-5">
                        {sale.customerName}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ORDER_STATUS_STYLES[fulfillment.status]}`}
                    >
                      {ORDER_STATUS_LABELS[fulfillment.status]}
                    </span>
                  </div>

                  {/* MINI THUMBNAILS PREVIEW IN ORDER LIST */}
                  <div className="flex items-center gap-1.5 my-2.5 overflow-hidden">
                    {sale.items.slice(0, 4).map((it) => {
                      const img = findSkuImage(it);
                      return (
                        <div
                          key={it.cartId}
                          className="w-9 h-9 rounded-lg border border-stone-200/80 bg-stone-100 overflow-hidden shrink-0 relative"
                        >
                          {img ? (
                            <img
                              src={img}
                              alt={it.sku}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-stone-400">
                              SKU
                            </div>
                          )}
                          {it.qty > 1 && (
                            <span className="absolute bottom-0 right-0 px-1 text-[8px] font-mono font-bold bg-black/70 text-white rounded-tl">
                              &times;{it.qty}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {sale.items.length > 4 && (
                      <span className="text-[10px] font-mono text-stone-400 ml-1">
                        +{sale.items.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-3 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-stone-800 text-[10px] truncate">
                        {fulfillment.trackingNumber || "AWB not assigned"}
                      </p>
                      <p className="text-stone-400 mt-0.5">{formatDate(sale.date)}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-stone-900 whitespace-nowrap">
                        {currency(netPaid)}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono whitespace-nowrap">
                        {totalQty} {totalQty === 1 ? "Drape" : "Drapes"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="p-8 text-center glass-panel rounded-3xl">
                <Package size={28} className="mx-auto text-stone-300 mb-2" />
                <p className="text-xs font-semibold text-stone-600">No matching orders found</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Try adjusting the search or status filter.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: SELECTED ORDER DETAILS & VISUAL DRAPE INSPECTION */}
        <div className="lg:col-span-7 min-w-0 glass-panel p-6 md:p-7 rounded-3xl shadow-premium space-y-6 sticky top-4">
          {selectedOrder ? (
            (() => {
              const fulfillment = getFulfillment(selectedOrder.invoiceNumber);
              const netPaid = Math.max(0, selectedOrder.subtotal - selectedOrder.discount);

              return (
                <>
                  {/* Header & Quick Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-200/60 pb-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                          {selectedOrder.invoiceNumber}
                        </span>

                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${ORDER_STATUS_STYLES[fulfillment.status]}`}
                        >
                          {ORDER_STATUS_LABELS[fulfillment.status]}
                        </span>
                      </div>

                      <h2 className="font-display font-bold text-xl text-stone-950 mt-2 leading-tight">
                        {selectedOrder.customerName}
                      </h2>

                      <p className="text-xs text-stone-500 mt-0.5">
                        Order Booked on {formatDate(selectedOrder.date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => handleShareTrackingWhatsApp(selectedOrder)}
                        className="h-9 shrink-0 flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Share2 size={13} />
                        <span>Share Tracking</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveDispatchDetails}
                        disabled={isSaving}
                        className={`h-9 shrink-0 flex items-center justify-center gap-1.5 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                          savedSuccess
                            ? "bg-emerald-700 text-white"
                            : "bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100"
                        }`}
                      >
                        {savedSuccess ? (
                          <>
                            <Check size={13} className="text-emerald-300" />
                            <span>Saved &amp; Synced!</span>
                          </>
                        ) : isSaving ? (
                          <>
                            <RefreshCw size={13} className="animate-spin text-brand-gold" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={13} className="text-brand-gold" />
                            <span>Save AWB</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Patron Contact Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/70 p-3.5 rounded-2xl border border-stone-200/60">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(selectedOrder.customerPhone, `phone-${selectedOrder.invoiceNumber}`)
                      }
                      className="flex items-start gap-2 text-left"
                      title="Click to copy phone number"
                    >
                      <Phone size={13} className="mt-0.5 shrink-0 text-stone-400" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Phone</span>
                        <span className="font-semibold text-stone-900 truncate block">
                          {selectedOrder.customerPhone}
                        </span>
                      </div>
                      {copiedField === `phone-${selectedOrder.invoiceNumber}` ? (
                        <Check size={12} className="ml-auto mt-0.5 shrink-0 text-emerald-600" />
                      ) : (
                        <Copy size={12} className="ml-auto mt-0.5 shrink-0 text-stone-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Order Value
                      </span>
                      <span className="font-display font-bold text-stone-950 mt-0.5 block truncate">
                        {currency(netPaid)}
                      </span>
                    </div>

                    {selectedOrder.customer?.address && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            selectedOrder.customer!.address!,
                            `address-${selectedOrder.invoiceNumber}`
                          )
                        }
                        className="flex items-start gap-2 text-left sm:col-span-2"
                        title="Click to copy delivery address"
                      >
                        <MapPin size={13} className="mt-0.5 shrink-0 text-stone-400" />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Delivery Address</span>
                          <span className="font-semibold text-stone-900 block">
                            {selectedOrder.customer.address}
                          </span>
                        </div>
                        {copiedField === `address-${selectedOrder.invoiceNumber}` ? (
                          <Check size={12} className="ml-auto mt-0.5 shrink-0 text-emerald-600" />
                        ) : (
                          <Copy size={12} className="ml-auto mt-0.5 shrink-0 text-stone-300" />
                        )}
                      </button>
                    )}

                    {selectedOrder.customer?.email && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            selectedOrder.customer!.email!,
                            `email-${selectedOrder.invoiceNumber}`
                          )
                        }
                        className="flex items-start gap-2 text-left sm:col-span-2"
                        title="Click to copy email address"
                      >
                        <Mail size={13} className="mt-0.5 shrink-0 text-stone-400" />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Email</span>
                          <span className="font-semibold text-stone-900 block truncate">
                            {selectedOrder.customer.email}
                          </span>
                        </div>
                        {copiedField === `email-${selectedOrder.invoiceNumber}` ? (
                          <Check size={12} className="ml-auto mt-0.5 shrink-0 text-emerald-600" />
                        ) : (
                          <Copy size={12} className="ml-auto mt-0.5 shrink-0 text-stone-300" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* DRAPES TO DELIVER — VISUAL PHOTO CARDS */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <Package size={13} />
                        Drapes to Deliver ({selectedOrder.items.length} Distinct SKUs)
                      </span>
                      <span className="text-[11px] text-stone-400">
                        Click photo to enlarge &amp; inspect weave
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                      {selectedOrder.items.map((item) => {
                        const drapeImage = findSkuImage(item);
                        const drapePrice = getItemPrice(item);

                        return (
                          <div
                            key={item.cartId}
                            className="flex items-center gap-3 p-2.5 rounded-2xl border border-stone-200 bg-white/90 hover:border-brand-gold/50 transition-all shadow-xs group relative"
                          >
                            {/* Interactive Drape Photo Box */}
                            <div
                              onClick={() => {
                                if (drapeImage) {
                                  sound.playClick();
                                  setPreviewImage({ url: drapeImage, title: item.name || item.sku });
                                }
                              }}
                              className="relative w-16 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 cursor-pointer group-hover:shadow-sm"
                            >
                              {drapeImage ? (
                                <>
                                  <img
                                    src={drapeImage}
                                    alt={item.name || item.sku}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <ExternalLink size={14} />
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 text-[9px] text-center p-1">
                                  <ImageIcon size={16} />
                                  <span>No Photo</span>
                                </div>
                              )}
                            </div>

                            {/* Drape Details & Exact Quantity */}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-xs text-stone-900 line-clamp-1 leading-snug">
                                {item.name || "Gadwal Silk Drape"}
                              </h4>

                              {item.color && (
                                <p className="text-[10px] text-brand-plum font-medium mt-0.5">
                                  Shade: {item.color}
                                </p>
                              )}

                              <div className="mt-1.5 flex items-center justify-between gap-2">
                                <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 truncate">
                                  {item.sku}
                                </span>

                                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#2A0E20] text-amber-100 font-bold font-mono text-[10px]">
                                  Qty: {item.qty}
                                </span>
                              </div>

                              <p className="font-display font-medium text-[11px] text-stone-800 mt-1">
                                {currency(drapePrice)} each
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dispatch Credentials & Logistics Input */}
                  <div className="space-y-3 pt-2 border-t border-stone-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                      <Truck size={12} />
                      Consignment Logistics Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1 text-xs">
                          AWB / Tracking Docket Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BD-HYD-482910"
                          value={fulfillment.trackingNumber}
                          onChange={(e) =>
                            updateTrackingNumber(selectedOrder.invoiceNumber, e.target.value)
                          }
                          className="w-full h-9 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-brand-gold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-700 mb-1 text-xs">
                          Courier Logistics Partner
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Blue Dart Express, DTDC, Delhivery"
                          value={fulfillment.carrierPartner}
                          onChange={(e) =>
                            updateCarrierPartner(selectedOrder.invoiceNumber, e.target.value)
                          }
                          className="w-full h-9 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1 text-xs">
                        Consignment Dispatch Status
                      </label>
                      <select
                        value={fulfillment.status}
                        onChange={(e) => {
                          sound.playClick();
                          updateStatus(selectedOrder.invoiceNumber, e.target.value as OrderStatus);
                        }}
                        className={`w-full h-9 px-3 rounded-xl border text-xs font-semibold outline-none cursor-pointer transition-colors ${ORDER_STATUS_STYLES[fulfillment.status]}`}
                      >
                        {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              );
            })()
          ) : (
            <div className="py-20 text-center text-stone-400 text-xs">
              Select an order from the left to view package contents and dispatch information.
            </div>
          )}
        </div>
      </div>

      {/* FULL RESOLUTION IMAGE INSPECTION MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full rounded-3xl overflow-hidden bg-white shadow-2xl border border-stone-200"
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <span className="font-serif font-semibold text-sm text-stone-900 truncate">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="aspect-[3/4] w-full bg-stone-100">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}