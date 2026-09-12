import { useMemo, useState } from "react";
import {
  Search,
  Calendar,
  Phone,
  Eye,
  Printer,
  QrCode,
  CreditCard,
  Banknote,
  Share2,
  Filter,
  Package,
  IndianRupee,
  X,
  ReceiptIndianRupee,
  MapPin,
  Mail,
  Copy,
  Check,
  Smartphone,
} from "lucide-react";
import type { CompletedSale } from "../types/inventory";
import {
  useOrderFulfillment,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from "../context/OrderFulfillmentContext";
import type { OrderStatus } from "../context/OrderFulfillmentContext";

interface TransactionHistoryProps {
  salesHistory: CompletedSale[];
}
import { STORE_ADDRESS, STORE_WHATSAPP_NUMBER } from "../types/useBilling";

const STORE_LEGAL_NAME = "Fashions";

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateParts = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return {
      date: date,
      time: "",
    };
  }

  return {
    date: new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsed),

    time: new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(parsed),
  };
};

const formatDate = (date: string) => {
  const parts = formatDateParts(date);
  return parts.time ? `${parts.date}, ${parts.time}` : parts.date;
};

const getPaymentLabel = (method: string) => {
  switch (method) {
    case "upi":
      return "UPI / QR";
    case "card":
      return "Card";
    case "cash":
      return "Cash";
    case "split":
      return "Split";
    case "phonepe":
      return "PhonePe";
    case "razorpay":
      return "Razorpay";
    default:
      return method.toUpperCase();
  }
};

const PaymentIcon = ({
  method,
  size = 12,
}: {
  method: string;
  size?: number;
}) => {
  if (method === "upi") return <QrCode size={size} />;
  if (method === "card") return <CreditCard size={size} />;
  if (method === "cash") return <Banknote size={size} />;
  if (method === "phonepe") return <Smartphone size={size} className="text-purple-600" />;
  if (method === "razorpay") return <CreditCard size={size} className="text-blue-600" />;
  return <ReceiptIndianRupee size={size} />;
};

const PaymentBadge = ({ method }: { method: string }) => {
  const styles: Record<string, string> = {
    upi: "bg-violet-50 text-violet-700 border-violet-100",
    card: "bg-blue-50 text-blue-700 border-blue-100",
    cash: "bg-emerald-50 text-emerald-700 border-emerald-100",
    split: "bg-amber-50 text-amber-700 border-amber-100",
    phonepe: "bg-purple-50 text-purple-700 border-purple-200",
    razorpay: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${styles[method] ?? "bg-stone-100 text-stone-700 border-stone-200"
        }`}
    >
      <PaymentIcon method={method} size={11} />
      {getPaymentLabel(method)}
    </span>
  );
};

export default function TransactionHistory({
  salesHistory,
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [inspectInvoice, setInspectInvoice] = useState<CompletedSale | null>(null);

  // NEW: status now comes from the shared context instead of local state,
  // so a change made here is instantly visible on the Track Order page too.
  const { getFulfillment, updateStatus } = useOrderFulfillment();

  // Tracks which copy button was just clicked, so we can flash a "copied" checkmark.
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField((current) => (current === fieldId ? null : current)), 1500);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const copyFullOrderDetails = async (sale: CompletedSale) => {
    const trueNetPayable = Math.max(0, (sale.subtotal || 0) - (sale.discount || 0));
    const custName = sale.customerName || sale.customer?.name || "Valued Customer";
    const custPhone = sale.customerPhone || sale.customer?.phone || "N/A";
    const custEmail = sale.customer?.email || (sale as any).customerEmail || "N/A";
    const custAddress = sale.customer?.address || (sale as any).shippingAddress || "In-store / Counter Pickup";
    const status = getFulfillment(sale.invoiceNumber).status;
    const statusLabel = ORDER_STATUS_LABELS[status] || status;

    const itemLines = (sale.items || []).map((item: any, idx) => {
      const q = Number(item.qty || item.quantity) || 1;
      const p = Number(item.unitPrice || item.price) || 0;
      return `  ${idx + 1}. ${item.name || "SiCo Gadwal Saree"} (${item.color || "Standard"})\n     SKU: ${item.sku || "N/A"} | Qty: ${q} | Price: ₹${p.toLocaleString("en-IN")} | Total: ₹${(p * q).toLocaleString("en-IN")}`;
    }).join("\n");

    const text = [
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "RS FASHIONS - ORDER & CUSTOMER DETAILS",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      `Invoice / Order #: ${sale.invoiceNumber}`,
      `Date: ${formatDate(sale.date)}`,
      `Payment Method: ${getPaymentLabel(sale.paymentMethod)}`,
      `Order Status: ${statusLabel}`,
      "",
      "CUSTOMER DETAILS:",
      `• Name: ${custName}`,
      `• Phone: ${custPhone}`,
      `• Email: ${custEmail}`,
      `• Delivery Address: ${custAddress}`,
      "",
      "ITEMS BILLED:",
      itemLines || "  No item details available",
      "",
      "PAYMENT SUMMARY:",
      `• Subtotal: ₹${(sale.subtotal || 0).toLocaleString("en-IN")}`,
      Number(sale.discount) > 0 ? `• Discount: -₹${Number(sale.discount).toLocaleString("en-IN")}` : null,
      `• Net Amount Paid: ₹${trueNetPayable.toLocaleString("en-IN")}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ].filter(Boolean).join("\n");

    await copyToClipboard(text, `full-order-${sale.invoiceNumber}`);
  };

  const metrics = useMemo(() => {
    const totalRevenue = salesHistory.reduce((sum, sale) => sum + (Number(sale.subtotal || 0) - Number(sale.discount || 0)), 0);
    const totalDrapesSold = salesHistory.reduce(
      (sum, sale) =>
        sum + (sale.items || []).reduce((itemSum, item: any) => itemSum + (Number(item.qty || item.quantity) || 1), 0),
      0
    );

    return {
      totalRevenue,
      totalDrapesSold,
    };
  }, [salesHistory]);

  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return salesHistory.filter((sale) => {
      const saleMethod = (sale.paymentMethod || "").toLowerCase();
      const filterMethod = paymentFilter.toLowerCase();
      const matchesPayment =
        paymentFilter === "ALL" || saleMethod === filterMethod;

      if (!q) return matchesPayment;

      const invMatch = (sale.invoiceNumber || "").toLowerCase().includes(q);
      const nameMatch = (sale.customerName || sale.customer?.name || "").toLowerCase().includes(q);
      const phoneMatch = (sale.customerPhone || sale.customer?.phone || "").toLowerCase().includes(q);
      const emailMatch = (sale.customer?.email || (sale as any).customerEmail || "").toLowerCase().includes(q);
      const addressMatch = (sale.customer?.address || (sale as any).shippingAddress || "").toLowerCase().includes(q);
      const itemsMatch = (sale.items || []).some(
        (item: any) =>
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.color && item.color.toLowerCase().includes(q))
      );

      return matchesPayment && (invMatch || nameMatch || phoneMatch || emailMatch || addressMatch || itemsMatch);
    });
  }, [salesHistory, paymentFilter, searchQuery]);

  const handlePrintInvoice = () => {
    window.print();
  };

  const whatsappInvoice = (sale: CompletedSale) => {
    const trueNetPayable = Math.max(0, (sale.subtotal || 0) - (sale.discount || 0));
    const lines = (sale.items || []).map(
      (item: any) => {
        const q = Number(item.qty || item.quantity) || 1;
        const p = Number(item.unitPrice || item.price) || 0;
        return `• ${item.name} (${item.color || "Standard"})\n  SKU: ${item.sku || "N/A"}\n  Qty: ${q} × ${currency(p)} = ${currency(p * q)}`;
      }
    );

    const message = [
      `✨ *${STORE_LEGAL_NAME} — HYDERABAD* ✨`,
      "SiCo Gadwal Sarees & Curated Silks",
      "━━━━━━━━━━━━━━━━━━",
      `*RETAIL SALES RECEIPT*`,
      `*Receipt #:* ${sale.invoiceNumber}`,
      `*Date:* ${formatDate(sale.date)}`,
      `*Customer:* ${sale.customerName} (${sale.customerPhone || ""})`,
      "━━━━━━━━━━━━━━━━━━",
      "*ITEMS BILLED:*",
      ...lines,
      "━━━━━━━━━━━━━━━━━━",
      `*Subtotal:* ${currency(sale.subtotal)}`,
      Number(sale.discount) > 0 ? `*Trade Discount:* -${currency(sale.discount)}` : null,
      `*Net Payable:* ${currency(trueNetPayable)}`,
      `*Payment Mode:* ${getPaymentLabel(sale.paymentMethod).toUpperCase()}`,
      "━━━━━━━━━━━━━━━━━━",
      "Thank you for choosing RS Fashions.",
    ]
      .filter(Boolean)
      .join("\n");

    const phone = (sale.customerPhone || "").replace(/\D/g, "");
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;

    window.open(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const renderSalesTable = (
    sales: CompletedSale[],
    emptyMessage: string
  ) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="border-b border-stone-200/80 bg-stone-50/60">
            <tr className="text-[10px] uppercase tracking-[0.08em] text-stone-500 font-semibold">
              <th className="px-5 py-3.5">Invoice</th>
              <th className="px-5 py-3.5">Date &amp; Time</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Item</th>
              <th className="px-5 py-3.5 text-right">Net Paid</th>
              <th className="px-5 py-3.5">Payment</th>
              <th className="px-5 py-3.5">Order Status</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100/80 bg-white/35 text-xs">
            {sales.map((sale) => {
              const dateParts = formatDateParts(sale.date);
              const totalQty = (sale.items || []).reduce((sum, item: any) => sum + (Number(item.qty || item.quantity) || 1), 0);
              const trueNetPayable = Math.max(0, (sale.subtotal || 0) - (sale.discount || 0));
              const currentStatus = getFulfillment(sale.invoiceNumber).status; // NEW: from context

              return (
                <tr
                  key={sale.invoiceNumber}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button, select, a, input")) return;
                    setInspectInvoice(sale);
                  }}
                  className="group hover:bg-amber-50/25 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4 align-middle">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-stone-800">
                        {sale.invoiceNumber}
                      </span>

                      <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                        Retail Invoice
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle whitespace-nowrap">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                        <Calendar size={13} />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-stone-800">
                          {dateParts.date}
                        </p>

                        {dateParts.time && (
                          <p className="mt-0.5 text-[10px] font-medium text-stone-400">
                            {dateParts.time}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <div className="min-w-[155px]">
                      <p className="truncate max-w-[190px] text-[12px] font-semibold text-stone-900">
                        {sale.customerName || sale.customer?.name || "Customer"}
                      </p>

                      {sale.customerPhone && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(sale.customerPhone, `phone-${sale.invoiceNumber}`)
                          }
                          className="mt-1 flex items-center gap-1.5 text-left text-stone-600 hover:text-stone-950"
                          title="Click to copy phone number"
                        >
                          <Phone size={11} className="shrink-0 text-stone-400" />
                          <span className="text-[11px] font-medium tracking-wide">
                            {sale.customerPhone}
                          </span>
                          {copiedField === `phone-${sale.invoiceNumber}` ? (
                            <Check size={10} className="text-green-500" />
                          ) : (
                            <Copy
                              size={10}
                              className="text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </button>
                      )}

                      {(sale.customer?.address || (sale as any).shippingAddress) && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              sale.customer?.address || (sale as any).shippingAddress,
                              `address-${sale.invoiceNumber}`
                            )
                          }
                          className="mt-1 flex items-start gap-1.5 text-left text-stone-600 hover:text-stone-950"
                          title="Click to copy address"
                        >
                          <MapPin size={11} className="mt-[1px] shrink-0 text-stone-400" />
                          <span className="max-w-[160px] truncate text-[10px] font-medium leading-snug">
                            {sale.customer?.address || (sale as any).shippingAddress}
                          </span>
                          {copiedField === `address-${sale.invoiceNumber}` ? (
                            <Check size={10} className="mt-[1px] shrink-0 text-green-500" />
                          ) : (
                            <Copy
                              size={10}
                              className="mt-[1px] shrink-0 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </button>
                      )}

                      {(sale.customer?.email || (sale as any).customerEmail) && (
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              sale.customer?.email || (sale as any).customerEmail,
                              `email-${sale.invoiceNumber}`
                            )
                          }
                          className="mt-0.5 flex items-start gap-1.5 text-left text-stone-500 hover:text-stone-950"
                          title="Click to copy email"
                        >
                          <Mail size={11} className="mt-[1px] shrink-0 text-stone-400" />
                          <span className="max-w-[160px] truncate text-[10px] font-medium leading-snug">
                            {sale.customer?.email || (sale as any).customerEmail}
                          </span>
                          {copiedField === `email-${sale.invoiceNumber}` ? (
                            <Check size={10} className="mt-[1px] shrink-0 text-green-500" />
                          ) : (
                            <Copy
                              size={10}
                              className="mt-[1px] shrink-0 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <div className="min-w-[180px] max-w-[250px]">
                      <p className="text-[11px] font-semibold text-stone-800">
                        {(sale.items || []).length === 1
                          ? sale.items[0].name
                          : `${(sale.items || []).length} Items`}
                      </p>

                      {(sale.items || []).length === 1 ? (
                        <p className="mt-1 text-[10px] text-stone-400">
                          {totalQty} piece{totalQty !== 1 ? "s" : ""}
                        </p>
                      ) : (
                        <p className="mt-1 truncate text-[10px] text-stone-400">
                          {(sale.items || []).map((item) => item.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle text-right">
                    <span className="font-display text-[15px] font-semibold text-stone-950">
                      {currency(trueNetPayable)}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <PaymentBadge method={sale.paymentMethod} />
                  </td>

                  {/* Status dropdown */}
                  <td className="px-5 py-4 align-middle">
                    <select
                      value={currentStatus}
                      onChange={(e) =>
                        updateStatus(sale.invoiceNumber, e.target.value as OrderStatus)
                      }
                      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold outline-none cursor-pointer transition-colors ${ORDER_STATUS_STYLES[currentStatus]}`}
                    >
                      {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyFullOrderDetails(sale)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
                          copiedField === `full-order-${sale.invoiceNumber}`
                            ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-bold shadow-2xs"
                            : "border-stone-200 bg-white text-stone-700 hover:border-brand-gold/60 hover:bg-stone-50"
                        }`}
                        title="Copy full order and user details"
                      >
                        {copiedField === `full-order-${sale.invoiceNumber}` ? (
                          <>
                            <Check size={11} className="text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} className="text-stone-500" />
                            <span>Copy Details</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectInvoice(sale)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-stone-700 shadow-2xs transition-all hover:border-brand-gold/40 hover:bg-brand-blush/30 hover:text-brand-plum"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {sales.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
                      <ReceiptIndianRupee size={19} />
                    </div>

                    <p className="text-xs font-semibold text-stone-700">
                      No transactions found
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-stone-400">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 font-sans select-none pb-12">
      {/* HEADER */}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-3xl font-medium tracking-tight text-stone-950">
          Transaction &amp; Billing History
        </h1>
        <p className="max-w-2xl text-xs text-stone-500">
          Review counter receipts, customer registries, and re-print slips in thermal POS layout.
        </p>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-panel flex min-h-[122px] h-full items-center gap-4 rounded-2xl p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800">
            <IndianRupee size={20} strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400">
              Total Invoiced Revenue
            </p>

            <p className="mt-1 font-display text-2xl font-semibold leading-tight text-stone-900">
              {currency(metrics.totalRevenue)}
            </p>

            <p className="mt-1 text-[10px] text-stone-400">
              Across {salesHistory.length} completed bill{salesHistory.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="glass-panel flex min-h-[122px] h-full items-center gap-4 rounded-2xl p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800">
            <Package size={20} strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400">
              Total Pieces Sold
            </p>

            <p className="mt-1 font-display text-2xl font-semibold leading-tight text-stone-900">
              {metrics.totalDrapesSold}
            </p>

            <p className="mt-1 text-[10px] text-stone-400">
              Sarees / drapes billed
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="glass-panel rounded-2xl p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />

            <input
              type="text"
              placeholder="Search invoice, customer, phone, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white/80 py-2 pl-9 pr-4 text-xs text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-brand-gold"
            />
          </div>

          <div className="flex w-full items-center gap-1.5 overflow-x-auto pb-0.5 lg:w-auto">
            <span className="mr-1 flex shrink-0 items-center gap-1 text-[10px] font-medium text-stone-400">
              <Filter size={12} />
              Payment
            </span>

            {[
              { id: "ALL", label: "All Sales" },
              { id: "upi", label: "UPI" },
              { id: "razorpay", label: "Razorpay" },
              { id: "phonepe", label: "PhonePe" },
              { id: "card", label: "Card" },
              { id: "cash", label: "Cash" },
              { id: "split", label: "Split" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPaymentFilter(mode.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-all ${paymentFilter === mode.id
                    ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                    : "bg-white/70 text-stone-600 hover:bg-stone-100"
                  }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white/60 px-4 py-2.5">
          <p className="text-[9px] uppercase tracking-wider text-stone-400">Showing</p>
          <p className="mt-0.5 text-sm font-semibold text-stone-800">{filteredSales.length}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white/60 px-4 py-2.5">
          <p className="text-[9px] uppercase tracking-wider text-stone-400">Retail Bills</p>
          <p className="mt-0.5 text-sm font-semibold text-stone-700">{filteredSales.length}</p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white/60 px-4 py-2.5">
          <p className="text-[9px] uppercase tracking-wider text-stone-400">Filter</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-stone-700">
            {paymentFilter === "ALL" ? "All Payments" : getPaymentLabel(paymentFilter)}
          </p>
        </div>
      </div>

      {/* SECTIONS */}
      <section className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white/50 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200/80 bg-stone-50/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
              <ReceiptIndianRupee size={17} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-stone-900">
                  Sales History
                </h2>

                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-semibold text-stone-500">
                  {filteredSales.length}
                </span>
              </div>

              <p className="mt-0.5 text-[10px] text-stone-400">
                All completed counter receipts and invoices
              </p>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-[9px] uppercase tracking-wider text-stone-400">
              Section Total
            </p>

            <p className="mt-0.5 text-sm font-display font-semibold text-stone-800">
              {currency(
                filteredSales.reduce((sum, sale) => sum + (sale.subtotal - sale.discount), 0)
              )}
            </p>
          </div>
        </div>

        {renderSalesTable(
          filteredSales,
          "Retail invoices matching your search will appear here."
        )}
      </section>

      {/* =====================================================================
          VIEW BILL MODAL
      ===================================================================== */}
      {inspectInvoice && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-md select-none w-screen h-screen overflow-hidden"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0 }}
          onClick={() => setInspectInvoice(null)}
        >
          <div
            className="flex max-h-[100vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200/80 z-[10000]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-200 no-print">
              <div className="flex items-center gap-2">
                <ReceiptIndianRupee size={16} className="text-brand-plum" />
                <span className="font-display font-semibold text-stone-900 text-sm">
                  Invoice Preview: {inspectInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyFullOrderDetails(inspectInvoice)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                    copiedField === `full-order-${inspectInvoice.invoiceNumber}`
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-bold shadow-2xs"
                      : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                  }`}
                  title="Copy full order and user details"
                >
                  {copiedField === `full-order-${inspectInvoice.invoiceNumber}` ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span>Copied Details!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="text-stone-500" />
                      <span>Copy Details</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setInspectInvoice(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              id="printable-invoice-preview"
              className="flex-1 space-y-4 overflow-y-auto p-6 text-stone-800"
            >
              <div className="border-b border-stone-200 pb-3 text-center flex flex-col items-center justify-center">
                <div className="mb-2 flex justify-center">
                  <img
                    src="src/assets/logo/logo1.png"
                    alt="RS Fashions Logo"
                    className="w-10 h-full object-contain"
                  />
                </div>

                <h2 className="font-mona text-2xl font-bold tracking-wide text-[#2A0E20]">
                  {STORE_LEGAL_NAME}
                </h2>

                <p className="text-xs font-medium text-stone-500 mt-0.5">
                  SiCo Gadwal Sarees &bull; Pure Handlooms &bull; Heritage Silks
                </p>

                <p className="mx-auto mt-1 max-w-sm text-[10px] text-stone-600">
                  {STORE_ADDRESS} | {STORE_WHATSAPP_NUMBER}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[10px] text-stone-600">
                  {STORE_WHATSAPP_NUMBER}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-stone-100 bg-stone-50/70 p-3 sm:grid-cols-2 text-xs">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Receipt Number</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="font-mono font-bold text-stone-900">{inspectInvoice.invoiceNumber}</p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inspectInvoice.invoiceNumber, `modal-inv-${inspectInvoice.invoiceNumber}`)}
                      className="text-stone-400 hover:text-stone-700 p-0.5"
                      title="Copy Invoice Number"
                    >
                      {copiedField === `modal-inv-${inspectInvoice.invoiceNumber}` ? (
                        <Check size={11} className="text-emerald-600" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-stone-400">{formatDate(inspectInvoice.date)}</p>
                </div>

                <div className="sm:text-right">
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Customer Details</p>
                    <button
                      type="button"
                      onClick={() => {
                        const custText = [
                          `Name: ${inspectInvoice.customerName || inspectInvoice.customer?.name || "Valued Customer"}`,
                          inspectInvoice.customerPhone ? `Phone: ${inspectInvoice.customerPhone}` : null,
                          (inspectInvoice.customer?.email || (inspectInvoice as any).customerEmail) ? `Email: ${inspectInvoice.customer?.email || (inspectInvoice as any).customerEmail}` : null,
                          (inspectInvoice.customer?.address || (inspectInvoice as any).shippingAddress) ? `Address: ${inspectInvoice.customer?.address || (inspectInvoice as any).shippingAddress}` : null,
                        ].filter(Boolean).join("\n");
                        copyToClipboard(custText, `modal-cust-${inspectInvoice.invoiceNumber}`);
                      }}
                      className="inline-flex items-center gap-1 rounded bg-stone-200/70 px-1.5 py-0.5 text-[9px] font-semibold text-stone-700 hover:bg-stone-300/80 transition-colors"
                      title="Copy all customer info"
                    >
                      {copiedField === `modal-cust-${inspectInvoice.invoiceNumber}` ? (
                        <>
                          <Check size={9} className="text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={9} />
                          <span>Copy Customer Info</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-0.5 font-semibold text-stone-900">
                    {inspectInvoice.customerName || inspectInvoice.customer?.name || "Valued Customer"}
                  </p>

                  {inspectInvoice.customerPhone && (
                    <div className="mt-0.5 flex items-center sm:justify-end gap-1.5 text-[11px] text-stone-600">
                      <span>{inspectInvoice.customerPhone}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(inspectInvoice.customerPhone, `modal-phone-${inspectInvoice.invoiceNumber}`)}
                        className="text-stone-400 hover:text-stone-700 p-0.5"
                        title="Copy Phone"
                      >
                        {copiedField === `modal-phone-${inspectInvoice.invoiceNumber}` ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                      </button>
                    </div>
                  )}

                  {(inspectInvoice.customer?.email || (inspectInvoice as any).customerEmail) && (
                    <div className="mt-0.5 flex items-center sm:justify-end gap-1.5 text-[10px] text-stone-500">
                      <span>{inspectInvoice.customer?.email || (inspectInvoice as any).customerEmail}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(inspectInvoice.customer?.email || (inspectInvoice as any).customerEmail, `modal-email-${inspectInvoice.invoiceNumber}`)}
                        className="text-stone-400 hover:text-stone-700 p-0.5"
                        title="Copy Email"
                      >
                        {copiedField === `modal-email-${inspectInvoice.invoiceNumber}` ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                      </button>
                    </div>
                  )}

                  {(inspectInvoice.customer?.address || (inspectInvoice as any).shippingAddress) && (
                    <div className="mt-0.5 flex items-start sm:justify-end gap-1.5 text-[10px] text-stone-500">
                      <span className="max-w-[260px] text-left sm:text-right">
                        {inspectInvoice.customer?.address || (inspectInvoice as any).shippingAddress}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(inspectInvoice.customer?.address || (inspectInvoice as any).shippingAddress, `modal-addr-${inspectInvoice.invoiceNumber}`)}
                        className="text-stone-400 hover:text-stone-700 shrink-0 mt-0.5 p-0.5"
                        title="Copy Address"
                      >
                        {copiedField === `modal-addr-${inspectInvoice.invoiceNumber}` ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 text-[9px] uppercase tracking-wider text-stone-400">
                  <tr>
                    <th className="pb-2">Saree / Shade</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {(inspectInvoice.items || []).map((item: any, idx: number) => {
                    const q = Number(item.qty || item.quantity) || 1;
                    const p = Number(item.unitPrice || item.price) || 0;
                    return (
                      <tr key={item.cartId || idx} className="text-[11px]">
                        <td className="py-2.5">
                          <p className="font-semibold text-stone-900">{item.name || "SiCo Gadwal Saree"}</p>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {item.color || "Standard"} &bull; {item.sku || "N/A"}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-semibold">{q}</td>
                        <td className="py-2.5 text-right font-bold text-stone-900">
                          {currency(p * q)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="space-y-1.5 border-t border-stone-200 pt-3 text-xs text-stone-600">
                {inspectInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Trade Discount</span>
                    <span>-{currency(inspectInvoice.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-stone-200 pt-2.5 font-display text-base font-bold text-stone-950">
                  <span>Net Payable</span>
                  <span>{currency(Math.max(0, inspectInvoice.subtotal - inspectInvoice.discount))}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-stone-400">Payment Tender</span>
                  <PaymentBadge method={inspectInvoice.paymentMethod} />
                </div>
              </div>

              <div className="border-t border-dashed border-stone-200 pt-3 text-center font-display text-[20px] text-black leading-relaxed">
                <p>Thank you for choosing RS Fashions.</p>
                <p className="text-center text-[9px] text-stone-400 leading-relaxed">
                  Returns or replacements are only accepted for items received damaged, provide a 360-degree unboxing video within 2 days of delivery.</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50/70 px-6 py-3.5 no-print">
              <button
                type="button"
                onClick={() => setInspectInvoice(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/60 transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyFullOrderDetails(inspectInvoice)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] ${
                    copiedField === `full-order-${inspectInvoice.invoiceNumber}`
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-amber-300/80 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  }`}
                >
                  {copiedField === `full-order-${inspectInvoice.invoiceNumber}` ? (
                    <>
                      <Check size={13} className="text-emerald-700" />
                      <span>Copied All Details!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-amber-800" />
                      <span>Copy Order &amp; User Details</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => whatsappInvoice(inspectInvoice)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-stone-50 shadow-sm transition-all"
                >
                  <Share2 size={13} />
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-1.5 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] px-4 py-2 text-xs font-semibold text-amber-100 shadow-sm transition-all active:scale-[0.98]"
                >
                  <Printer size={14} className="text-brand-gold" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-preview,
          #printable-invoice-preview * {
            visibility: visible !important;
          }
          #printable-invoice-preview {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            padding: 24px !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}