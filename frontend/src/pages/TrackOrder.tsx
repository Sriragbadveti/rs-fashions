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
} from "lucide-react";
import type { CompletedSale } from "../types/inventory";
import {
  useOrderFulfillment,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from "../context/OrderFulfillmentContext";
import type { OrderStatus } from "../context/OrderFulfillmentContext";
import { sound } from "../types/soundEngine";

interface TrackOrderProps {
  // Same completed-sales data that TransactionHistory renders — every
  // finished sale is automatically a trackable order here. No manual
  // order creation anymore.
  salesHistory: CompletedSale[];
}

const STORE_NAME = "RS Fashions";
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
  // Shared order status + AWB store — same one TransactionHistory writes to,
  // so updating status/tracking here is immediately reflected there too.
  const { getFulfillment, updateStatus, updateTrackingNumber, updateCarrierPartner } =
    useOrderFulfillment();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(
    salesHistory[0]?.invoiceNumber ?? null
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: Ctrl+K and "/" focus search.
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

  // Every sale is an "order" here — filter by search text and by fulfillment status.
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

  const handleSaveDispatchDetails = () => {
    if (!selectedOrder) return;
    sound.playNotification();
  };

  // Sends the current AWB / carrier / status to the customer over WhatsApp.
  const handleShareTrackingWhatsApp = (sale: CompletedSale) => {
    sound.playClick();
    const fulfillment = getFulfillment(sale.invoiceNumber);
    const totalQty = sale.items.reduce((sum, item) => sum + item.qty, 0);

    const message = [
      `✨ *${STORE_NAME} — DISPATCH & TRACKING UPDATE* ✨`,
      "SiCo Gadwal Sarees & Heritage Handlooms",
      "━━━━━━━━━━━━━━━━━━",
      `*Invoice:* ${sale.invoiceNumber}`,
      fulfillment.trackingNumber ? `*AWB / Tracking #:* ${fulfillment.trackingNumber}` : null,
      fulfillment.carrierPartner ? `*Courier Partner:* ${fulfillment.carrierPartner}` : null,
      `*Current Status:* ${ORDER_STATUS_LABELS[fulfillment.status]}`,
      "━━━━━━━━━━━━━━━━━━",
      `*Recipient:* ${sale.customerName}`,
      `*Drapes in Package:* ${totalQty} Piece${totalQty !== 1 ? "s" : ""}`,
      "━━━━━━━━━━━━━━━━━━",
      "Your saree has undergone signature handloom quality inspection and safe luxury packaging.",
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
            Order Tracking
          </h1>

          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Every completed sale from Transaction History shows up here automatically —
            add the AWB number, save dispatch info, and update status as each order moves.
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
            placeholder="Search invoice, customer, AWB, SKU..."
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
              Orders ({filteredOrders.length})
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

        {/* RIGHT: SELECTED ORDER DETAILS */}
        <div className="lg:col-span-7 min-w-0 glass-panel p-6 md:p-7 rounded-3xl shadow-premium space-y-6 sticky top-4">
          {selectedOrder ? (
            (() => {
              const fulfillment = getFulfillment(selectedOrder.invoiceNumber);
              const netPaid = Math.max(0, selectedOrder.subtotal - selectedOrder.discount);

              return (
                <>
                  {/* Header + WhatsApp trigger & Save Button */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-200/60 pb-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                          {selectedOrder.invoiceNumber}
                        </span>

                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ORDER_STATUS_STYLES[fulfillment.status]}`}
                        >
                          {ORDER_STATUS_LABELS[fulfillment.status]}
                        </span>
                      </div>

                      <h2 className="font-display font-bold text-xl text-stone-950 mt-2 leading-tight">
                        {selectedOrder.customerName}
                      </h2>

                      <p className="text-xs text-stone-500 mt-0.5">
                        {formatDate(selectedOrder.date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => handleShareTrackingWhatsApp(selectedOrder)}
                        className="h-9 shrink-0 flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        <Share2 size={13} />
                        <span>Share WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveDispatchDetails}
                        className="h-9 shrink-0 flex items-center justify-center gap-1.5 px-4 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-xs font-semibold shadow-sm transition-all"
                      >
                        <Save size={13} className="text-brand-gold" />
                        <span>Save AWB</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer contact — click any line to copy */}
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
                        Consignment Value
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
                        title="Click to copy address"
                      >
                        <MapPin size={13} className="mt-0.5 shrink-0 text-stone-400" />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-stone-400 block">Address</span>
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
                        title="Click to copy email"
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

                  {/* Drapes included */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Drapes Included ({selectedOrder.items.length}):
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedOrder.items.map((item) => (
                        <span
                          key={item.cartId}
                          className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80"
                        >
                          {item.sku} &times;{item.qty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AWB / carrier / status — manual dispatch entry section */}
                  <div className="space-y-3 pt-2 border-t border-stone-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                      <Truck size={12} />
                      Dispatch Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1 text-xs">
                          AWB / Tracking Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BD-HYD-482910"
                          value={fulfillment.trackingNumber}
                          onChange={(e) =>
                            updateTrackingNumber(selectedOrder.invoiceNumber, e.target.value)
                          }
                          className="w-full h-9 px-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none focus:border-brand-gold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-700 mb-1 text-xs">
                          Courier / Carrier
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Blue Dart Express"
                          value={fulfillment.carrierPartner}
                          onChange={(e) =>
                            updateCarrierPartner(selectedOrder.invoiceNumber, e.target.value)
                          }
                          className="w-full h-9 px-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1 text-xs">
                        Order Status
                      </label>
                      <select
                        value={fulfillment.status}
                        onChange={(e) => {
                          sound.playClick();
                          updateStatus(selectedOrder.invoiceNumber, e.target.value as OrderStatus);
                        }}
                        className={`w-full h-9 px-2 rounded-xl border text-xs font-semibold outline-none cursor-pointer transition-colors ${ORDER_STATUS_STYLES[fulfillment.status]}`}
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
              Select an order from the left to view and update its dispatch details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}