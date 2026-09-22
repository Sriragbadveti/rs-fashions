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
import logo from "../assets/logo/logo1.png";
import {
  useOrderFulfillment,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from "../context/OrderFulfillmentContext";
import type { OrderStatus } from "../context/OrderFulfillmentContext";
import { STORE_ADDRESS, STORE_WHATSAPP_NUMBER } from "../types/useBilling";

interface TransactionHistoryProps {
  salesHistory: CompletedSale[];
}

const STORE_LEGAL_NAME = "Fashions";

/* -------------------------------------------------------------------------- */
/* HELPERS                                    */
/* -------------------------------------------------------------------------- */

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDateParts = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return {
      date,
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
  switch ((method || "").toLowerCase()) {
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
      return method ? method.toUpperCase() : "Unknown";
  }
};

const PaymentIcon = ({
  method,
  size = 12,
}: {
  method: string;
  size?: number;
}) => {
  const normalized = (method || "").toLowerCase();

  if (normalized === "upi") return <QrCode size={size} />;
  if (normalized === "card") return <CreditCard size={size} />;
  if (normalized === "cash") return <Banknote size={size} />;
  if (normalized === "phonepe") {
    return <Smartphone size={size} className="text-purple-600" />;
  }
  if (normalized === "razorpay") {
    return <CreditCard size={size} className="text-blue-600" />;
  }

  return <ReceiptIndianRupee size={size} />;
};

const PaymentBadge = ({ method }: { method: string }) => {
  const normalized = (method || "").toLowerCase();

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
      className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold whitespace-nowrap ${
        styles[normalized] ??
        "border-stone-200 bg-stone-100 text-stone-700"
      }`}
    >
      <PaymentIcon method={normalized} size={11} />
      <span className="truncate">{getPaymentLabel(normalized)}</span>
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function TransactionHistory({
  salesHistory,
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [inspectInvoice, setInspectInvoice] =
    useState<CompletedSale | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { getFulfillment, updateStatus } = useOrderFulfillment();

  /* ------------------------------------------------------------------------ */
  /* CUSTOMER HELPERS                                                         */
  /* ------------------------------------------------------------------------ */

  const getCustomerName = (sale: CompletedSale) =>
    sale.customerName || sale.customer?.name || "Valued Customer";

  const getCustomerPhone = (sale: CompletedSale) =>
    sale.customerPhone || sale.customer?.phone || "";

  const getCustomerEmail = (sale: CompletedSale) =>
    sale.customer?.email || (sale as any).customerEmail || "";

  const getCustomerAddress = (sale: CompletedSale) =>
    sale.customer?.address ||
    (sale as any).shippingAddress ||
    "";

  const getSaleQty = (sale: CompletedSale) =>
    (sale.items || []).reduce(
      (sum, item: any) =>
        sum + (Number(item.qty || item.quantity) || 1),
      0
    );

  const getNetPayable = (sale: CompletedSale) =>
    Math.max(
      0,
      Number(sale.subtotal || 0) - Number(sale.discount || 0)
    );

  /* ------------------------------------------------------------------------ */
  /* ROBUST COPY                                                              */
  /* ------------------------------------------------------------------------ */

  const copyToClipboard = async (
    text: string,
    fieldId: string
  ): Promise<boolean> => {
    if (!text) return false;

    let success = false;

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch (error) {
      console.warn("Modern clipboard failed:", error);
    }

    if (!success) {
      try {
        const textarea = document.createElement("textarea");

        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        success = document.execCommand("copy");

        document.body.removeChild(textarea);
      } catch (error) {
        console.error("Clipboard fallback failed:", error);
      }
    }

    if (success) {
      setCopiedField(fieldId);

      window.setTimeout(() => {
        setCopiedField((current) =>
          current === fieldId ? null : current
        );
      }, 1600);
    }

    return success;
  };

  /* ------------------------------------------------------------------------ */
  /* COPY FULL ORDER                                                          */
  /* ------------------------------------------------------------------------ */

  const copyFullOrderDetails = async (sale: CompletedSale) => {
    const trueNetPayable = getNetPayable(sale);
    const custName = getCustomerName(sale);
    const custPhone = getCustomerPhone(sale) || "N/A";
    const custEmail = getCustomerEmail(sale) || "N/A";
    const custAddress =
      getCustomerAddress(sale) || "In-store / Counter Pickup";

    const status = getFulfillment(sale.invoiceNumber).status;
    const statusLabel = ORDER_STATUS_LABELS[status] || status;

    const itemLines = (sale.items || [])
      .map((item: any, idx) => {
        const q = Number(item.qty || item.quantity) || 1;
        const p = Number(item.unitPrice || item.price) || 0;

        return `  ${idx + 1}. ${
          item.name || "SiCo Gadwal Saree"
        } (${item.color || "Standard"})
      SKU: ${item.sku || "N/A"} | Qty: ${q} | Price: ₹${p.toLocaleString(
          "en-IN"
        )} | Total: ₹${(p * q).toLocaleString("en-IN")}`;
      })
      .join("\n");

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
      `• Subtotal: ₹${Number(sale.subtotal || 0).toLocaleString(
        "en-IN"
      )}`,
      Number(sale.discount) > 0
        ? `• Discount: -₹${Number(sale.discount).toLocaleString(
            "en-IN"
          )}`
        : null,
      `• Net Amount Paid: ₹${trueNetPayable.toLocaleString(
        "en-IN"
      )}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    ]
      .filter(Boolean)
      .join("\n");

    await copyToClipboard(
      text,
      `full-order-${sale.invoiceNumber}`
    );
  };

  /* ------------------------------------------------------------------------ */
  /* METRICS                                                                  */
  /* ------------------------------------------------------------------------ */

  const metrics = useMemo(() => {
    const totalRevenue = salesHistory.reduce(
      (sum, sale) =>
        sum +
        Math.max(
          0,
          Number(sale.subtotal || 0) -
            Number(sale.discount || 0)
        ),
      0
    );

    const totalDrapesSold = salesHistory.reduce(
      (sum, sale) => sum + getSaleQty(sale),
      0
    );

    return {
      totalRevenue,
      totalDrapesSold,
    };
  }, [salesHistory]);

  /* ------------------------------------------------------------------------ */
  /* FILTERING                                                                */
  /* ------------------------------------------------------------------------ */

  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return salesHistory.filter((sale) => {
      const saleMethod = (sale.paymentMethod || "").toLowerCase();
      const filterMethod = paymentFilter.toLowerCase();

      const matchesPayment =
        paymentFilter === "ALL" ||
        saleMethod === filterMethod;

      if (!q) return matchesPayment;

      const invMatch = (sale.invoiceNumber || "")
        .toLowerCase()
        .includes(q);

      const nameMatch = getCustomerName(sale)
        .toLowerCase()
        .includes(q);

      const phoneMatch = getCustomerPhone(sale)
        .toLowerCase()
        .includes(q);

      const emailMatch = getCustomerEmail(sale)
        .toLowerCase()
        .includes(q);

      const addressMatch = getCustomerAddress(sale)
        .toLowerCase()
        .includes(q);

      const itemsMatch = (sale.items || []).some(
        (item: any) =>
          (item.name &&
            item.name.toLowerCase().includes(q)) ||
          (item.sku &&
            item.sku.toLowerCase().includes(q)) ||
          (item.color &&
            item.color.toLowerCase().includes(q))
      );

      return (
        matchesPayment &&
        (invMatch ||
          nameMatch ||
          phoneMatch ||
          emailMatch ||
          addressMatch ||
          itemsMatch)
      );
    });
  }, [salesHistory, paymentFilter, searchQuery]);

  /* ------------------------------------------------------------------------ */
  /* PRINT                                                                    */
  /* ------------------------------------------------------------------------ */

  const handlePrintInvoice = () => {
    window.print();
  };

  /* ------------------------------------------------------------------------ */
  /* WHATSAPP                                                                 */
  /* ------------------------------------------------------------------------ */

  const whatsappInvoice = (sale: CompletedSale) => {
    const trueNetPayable = getNetPayable(sale);

    const lines = (sale.items || []).map((item: any) => {
      const q = Number(item.qty || item.quantity) || 1;
      const p = Number(item.unitPrice || item.price) || 0;

      return `• ${item.name || "Saree"} (${
        item.color || "Standard"
      })\n  SKU: ${item.sku || "N/A"}\n  Qty: ${q} × ${currency(
        p
      )} = ${currency(p * q)}`;
    });

    const customerPhone = getCustomerPhone(sale);

    const message = [
      `✨ *${STORE_LEGAL_NAME} — HYDERABAD* ✨`,
      "SiCo Gadwal Sarees & Curated Silks",
      "━━━━━━━━━━━━━━━━━━",
      "*RETAIL SALES RECEIPT*",
      `*Receipt #:* ${sale.invoiceNumber}`,
      `*Date:* ${formatDate(sale.date)}`,
      `*Customer:* ${getCustomerName(sale)} (${
        customerPhone || ""
      })`,
      "━━━━━━━━━━━━━━━━━━",
      "*ITEMS BILLED:*",
      ...lines,
      "━━━━━━━━━━━━━━━━━━",
      `*Subtotal:* ${currency(sale.subtotal)}`,
      Number(sale.discount) > 0
        ? `*Trade Discount:* -${currency(sale.discount)}`
        : null,
      `*Net Payable:* ${currency(trueNetPayable)}`,
      `*Payment Mode:* ${getPaymentLabel(
        sale.paymentMethod
      ).toUpperCase()}`,
      "━━━━━━━━━━━━━━━━━━",
      "Thank you for choosing RS Fashions.",
    ]
      .filter(Boolean)
      .join("\n");

    const phone = customerPhone.replace(/\D/g, "");
    const formattedPhone =
      phone.length === 10 ? `91${phone}` : phone;

    if (!formattedPhone) {
      return;
    }

    window.open(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* ------------------------------------------------------------------------ */
  /* MOBILE CUSTOMER INFO                                                     */
  /* ------------------------------------------------------------------------ */

  const MobileCustomerInfo = ({
    sale,
  }: {
    sale: CompletedSale;
  }) => {
    const phone = getCustomerPhone(sale);
    const email = getCustomerEmail(sale);
    const address = getCustomerAddress(sale);

    return (
      <div className="min-w-0 space-y-1.5">
        <p className="truncate text-[13px] font-semibold text-stone-900">
          {getCustomerName(sale)}
        </p>

        {phone && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(
                phone,
                `phone-${sale.invoiceNumber}`
              );
            }}
            className="flex min-w-0 max-w-full items-center gap-1.5 text-left text-[11px] text-stone-600 active:text-stone-950"
          >
            <Phone
              size={11}
              className="shrink-0 text-stone-400"
            />
            <span className="truncate">{phone}</span>

            {copiedField === `phone-${sale.invoiceNumber}` ? (
              <Check
                size={11}
                className="shrink-0 text-emerald-600"
              />
            ) : (
              <Copy
                size={10}
                className="shrink-0 text-stone-300"
              />
            )}
          </button>
        )}

        {address && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(
                address,
                `address-${sale.invoiceNumber}`
              );
            }}
            className="flex min-w-0 max-w-full items-start gap-1.5 text-left text-[10px] leading-4 text-stone-500"
          >
            <MapPin
              size={11}
              className="mt-0.5 shrink-0 text-stone-400"
            />
            <span className="min-w-0 break-words">
              {address}
            </span>

            {copiedField ===
            `address-${sale.invoiceNumber}` ? (
              <Check
                size={10}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
            ) : (
              <Copy
                size={9}
                className="mt-0.5 shrink-0 text-stone-300"
              />
            )}
          </button>
        )}

        {email && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(
                email,
                `email-${sale.invoiceNumber}`
              );
            }}
            className="flex min-w-0 max-w-full items-start gap-1.5 text-left text-[10px] leading-4 text-stone-500"
          >
            <Mail
              size={11}
              className="mt-0.5 shrink-0 text-stone-400"
            />
            <span className="min-w-0 break-all">
              {email}
            </span>

            {copiedField === `email-${sale.invoiceNumber}` ? (
              <Check
                size={10}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
            ) : (
              <Copy
                size={9}
                className="mt-0.5 shrink-0 text-stone-300"
              />
            )}
          </button>
        )}
      </div>
    );
  };

  /* ------------------------------------------------------------------------ */
  /* MOBILE TRANSACTION CARD                                                  */
  /* ------------------------------------------------------------------------ */

  const renderMobileSales = (
    sales: CompletedSale[],
    emptyMessage: string
  ) => {
    if (sales.length === 0) {
      return (
        <div className="px-4 py-12 text-center sm:hidden">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
            <ReceiptIndianRupee size={20} />
          </div>

          <p className="mt-3 text-xs font-semibold text-stone-700">
            No transactions found
          </p>

          <p className="mx-auto mt-1 max-w-xs text-[10px] leading-5 text-stone-400">
            {emptyMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-3 sm:hidden">
        {sales.map((sale) => {
          const dateParts = formatDateParts(sale.date);
          const totalQty = getSaleQty(sale);
          const trueNetPayable = getNetPayable(sale);
          const currentStatus =
            getFulfillment(sale.invoiceNumber).status;

          const firstItem = sale.items?.[0] as any;
          const itemCount = (sale.items || []).length;

          return (
            <article
              key={sale.invoiceNumber}
              onClick={() => setInspectInvoice(sale)}
              className="w-full min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm active:scale-[0.995] transition-transform"
            >
              {/* TOP ROW */}
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="max-w-full truncate rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[10px] font-bold text-stone-800">
                      {sale.invoiceNumber}
                    </span>

                    <span className="rounded-full bg-stone-100 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-stone-500">
                      Retail
                    </span>
                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[10px] text-stone-400">
                    <Calendar size={11} className="shrink-0" />
                    <span className="truncate">
                      {dateParts.date}
                    </span>

                    {dateParts.time && (
                      <>
                        <span>•</span>
                        <span className="shrink-0">
                          {dateParts.time}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-stone-400">
                    Net Paid
                  </p>

                  <p className="mt-0.5 font-display text-base font-bold text-stone-950">
                    {currency(trueNetPayable)}
                  </p>
                </div>
              </div>

              {/* CUSTOMER */}
              <div className="mt-3 rounded-xl border border-stone-100 bg-stone-50/70 p-3">
                <MobileCustomerInfo sale={sale} />
              </div>

              {/* ITEM */}
              <div className="mt-3 flex min-w-0 items-start gap-2.5 rounded-xl border border-stone-100 bg-white p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Package size={14} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-stone-800">
                    {itemCount === 1
                      ? firstItem?.name || "Saree"
                      : `${itemCount} Items`}
                  </p>

                  {itemCount === 1 ? (
                    <p className="mt-0.5 text-[9px] text-stone-400">
                      {totalQty} piece
                      {totalQty !== 1 ? "s" : ""}
                      {firstItem?.color
                        ? ` • ${firstItem.color}`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-0.5 break-words text-[9px] leading-4 text-stone-400">
                      {(sale.items || [])
                        .map((item: any) => item.name)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* PAYMENT + STATUS */}
              <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                <div className="min-w-0">
                  <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-stone-400">
                    Payment
                  </p>
                  <PaymentBadge method={sale.paymentMethod} />
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-stone-400">
                    Order Status
                  </p>

                  <select
                    value={currentStatus}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateStatus(
                        sale.invoiceNumber,
                        e.target.value as OrderStatus
                      );
                    }}
                    className={`h-[31px] w-full min-w-0 rounded-lg border bg-white px-2 text-[9px] font-semibold outline-none cursor-pointer ${ORDER_STATUS_STYLES[currentStatus]}`}
                  >
                    {(
                      Object.keys(
                        ORDER_STATUS_LABELS
                      ) as OrderStatus[]
                    ).map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyFullOrderDetails(sale);
                  }}
                  className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10px] font-semibold transition-all ${
                    copiedField ===
                    `full-order-${sale.invoiceNumber}`
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-stone-200 bg-white text-stone-700 active:bg-stone-100"
                  }`}
                >
                  {copiedField ===
                  `full-order-${sale.invoiceNumber}` ? (
                    <>
                      <Check
                        size={12}
                        className="shrink-0 text-emerald-600"
                      />
                      <span className="truncate">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy
                        size={12}
                        className="shrink-0 text-stone-500"
                      />
                      <span className="truncate">
                        Copy Details
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectInvoice(sale);
                  }}
                  className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#2A0E20] px-2 py-2.5 text-[10px] font-semibold text-amber-100 shadow-sm active:bg-[#3D142E]"
                >
                  <Eye size={12} className="shrink-0" />
                  <span>View Bill</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  /* ------------------------------------------------------------------------ */
  /* DESKTOP TABLE                                                            */
  /* ------------------------------------------------------------------------ */

  const renderDesktopSalesTable = (
    sales: CompletedSale[],
    emptyMessage: string
  ) => {
    return (
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[1020px] text-left">
          <thead className="border-b border-stone-200/80 bg-stone-50/60">
            <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              <th className="px-4 py-3.5">Invoice</th>
              <th className="px-4 py-3.5">Date &amp; Time</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Item</th>
              <th className="px-4 py-3.5 text-right">
                Net Paid
              </th>
              <th className="px-4 py-3.5">Payment</th>
              <th className="px-4 py-3.5">Order Status</th>
              <th className="px-4 py-3.5 text-right pr-5">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100/80 bg-white/35 text-xs">
            {sales.map((sale) => {
              const dateParts = formatDateParts(sale.date);
              const totalQty = getSaleQty(sale);
              const trueNetPayable = getNetPayable(sale);
              const currentStatus =
                getFulfillment(sale.invoiceNumber).status;

              const phone = getCustomerPhone(sale);
              const address = getCustomerAddress(sale);
              const email = getCustomerEmail(sale);

              return (
                <tr
                  key={sale.invoiceNumber}
                  onClick={(e) => {
                    if (
                      (
                        e.target as HTMLElement
                      ).closest(
                        "button, select, a, input"
                      )
                    ) {
                      return;
                    }

                    setInspectInvoice(sale);
                  }}
                  className="group cursor-pointer transition-colors hover:bg-amber-50/25"
                >
                  {/* INVOICE */}
                  <td className="px-4 py-4 align-middle">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 font-mono text-[10px] font-semibold text-stone-800">
                        {sale.invoiceNumber}
                      </span>

                      <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-400">
                        Retail Invoice
                      </span>
                    </div>
                  </td>

                  {/* DATE */}
                  <td className="whitespace-nowrap px-4 py-4 align-middle">
                    <div className="flex items-start gap-2">
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

                  {/* CUSTOMER */}
                  <td className="px-4 py-4 align-middle">
                    <div className="min-w-[145px]">
                      <p className="max-w-[170px] truncate text-[12px] font-semibold text-stone-900">
                        {getCustomerName(sale)}
                      </p>

                      {phone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(
                              phone,
                              `phone-${sale.invoiceNumber}`
                            );
                          }}
                          className="mt-1 flex items-center gap-1.5 text-left text-stone-600 hover:text-stone-950"
                        >
                          <Phone
                            size={11}
                            className="shrink-0 text-stone-400"
                          />
                          <span className="text-[11px] font-medium tracking-wide">
                            {phone}
                          </span>

                          {copiedField ===
                          `phone-${sale.invoiceNumber}` ? (
                            <Check
                              size={10}
                              className="text-green-500"
                            />
                          ) : (
                            <Copy
                              size={10}
                              className="text-stone-400 opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          )}
                        </button>
                      )}

                      {address && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(
                              address,
                              `address-${sale.invoiceNumber}`
                            );
                          }}
                          className="mt-1 flex max-w-full items-start gap-1.5 text-left text-stone-600 hover:text-stone-950"
                        >
                          <MapPin
                            size={11}
                            className="mt-[1px] shrink-0 text-stone-400"
                          />

                          <span className="max-w-[150px] truncate text-[10px] font-medium leading-snug">
                            {address}
                          </span>

                          {copiedField ===
                          `address-${sale.invoiceNumber}` ? (
                            <Check
                              size={10}
                              className="mt-[1px] shrink-0 text-green-500"
                            />
                          ) : (
                            <Copy
                              size={10}
                              className="mt-[1px] shrink-0 text-stone-400 opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          )}
                        </button>
                      )}

                      {email && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(
                              email,
                              `email-${sale.invoiceNumber}`
                            );
                          }}
                          className="mt-0.5 flex max-w-full items-start gap-1.5 text-left text-stone-500 hover:text-stone-950"
                        >
                          <Mail
                            size={11}
                            className="mt-[1px] shrink-0 text-stone-400"
                          />

                          <span className="max-w-[150px] truncate text-[10px] font-medium leading-snug">
                            {email}
                          </span>

                          {copiedField ===
                          `email-${sale.invoiceNumber}` ? (
                            <Check
                              size={10}
                              className="mt-[1px] shrink-0 text-green-500"
                            />
                          ) : (
                            <Copy
                              size={10}
                              className="mt-[1px] shrink-0 text-stone-400 opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* ITEM */}
                  <td className="px-4 py-4 align-middle">
                    <div className="min-w-[160px] max-w-[210px]">
                      <p className="text-[11px] font-semibold text-stone-800">
                        {(sale.items || []).length === 1
                          ? (sale.items?.[0] as any)?.name
                          : `${(sale.items || []).length} Items`}
                      </p>

                      {(sale.items || []).length === 1 ? (
                        <p className="mt-1 text-[10px] text-stone-400">
                          {totalQty} piece
                          {totalQty !== 1 ? "s" : ""}
                        </p>
                      ) : (
                        <p className="mt-1 truncate text-[10px] text-stone-400">
                          {(sale.items || [])
                            .map((item: any) => item.name)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td className="px-4 py-4 text-right align-middle">
                    <span className="font-display text-[14px] font-semibold text-stone-950 whitespace-nowrap">
                      {currency(trueNetPayable)}
                    </span>
                  </td>

                  {/* PAYMENT */}
                  <td className="px-4 py-4 align-middle">
                    <PaymentBadge method={sale.paymentMethod} />
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-4 align-middle">
                    <select
                      value={currentStatus}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(
                          sale.invoiceNumber,
                          e.target.value as OrderStatus
                        );
                      }}
                      className={`cursor-pointer rounded-lg border px-2 py-1.5 text-[10px] font-semibold outline-none transition-colors ${ORDER_STATUS_STYLES[currentStatus]}`}
                    >
                      {(
                        Object.keys(
                          ORDER_STATUS_LABELS
                        ) as OrderStatus[]
                      ).map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4 text-right align-middle pr-5">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyFullOrderDetails(sale);
                        }}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-all ${
                          copiedField ===
                          `full-order-${sale.invoiceNumber}`
                            ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                            : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        {copiedField ===
                        `full-order-${sale.invoiceNumber}` ? (
                          <>
                            <Check
                              size={11}
                              className="text-emerald-600"
                            />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy
                              size={11}
                              className="text-stone-500"
                            />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectInvoice(sale);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-stone-700 shadow-2xs transition-all hover:bg-stone-100"
                      >
                        <Eye size={11} />
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

  /* ------------------------------------------------------------------------ */
  /* RETURN                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-3 pb-8 font-sans select-none sm:px-4 sm:pb-12 lg:px-0">
      <div className="space-y-4 sm:space-y-6">
        {/* HEADER */}
        <header className="min-w-0">
          <h1 className="font-display text-2xl font-medium tracking-tight text-stone-950 sm:text-3xl">
            Sales Receipts &amp; Invoices
          </h1>

          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-stone-500 sm:text-xs">
            Review counter receipts, customer registries, and
            re-print slips in thermal POS layout.
          </p>
        </header>

        {/* KPI TILES */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="glass-panel flex min-h-[105px] min-w-0 items-center gap-3 rounded-2xl p-4 shadow-sm sm:min-h-[122px] sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-800 sm:h-11 sm:w-11">
              <IndianRupee
                size={19}
                strokeWidth={2.2}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-stone-400 sm:text-[10px]">
                Total Invoiced Revenue
              </p>

              <p className="mt-1 truncate font-display text-xl font-semibold leading-tight text-stone-900 sm:text-2xl">
                {currency(metrics.totalRevenue)}
              </p>

              <p className="mt-1 truncate text-[9px] text-stone-400 sm:text-[10px]">
                Across {salesHistory.length} completed bill
                {salesHistory.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="glass-panel flex min-h-[105px] min-w-0 items-center gap-3 rounded-2xl p-4 shadow-sm sm:min-h-[122px] sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-800 sm:h-11 sm:w-11">
              <Package size={19} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-stone-400 sm:text-[10px]">
                Total Pieces Sold
              </p>

              <p className="mt-1 font-display text-xl font-semibold leading-tight text-stone-900 sm:text-2xl">
                {metrics.totalDrapesSold}
              </p>

              <p className="mt-1 truncate text-[9px] text-stone-400 sm:text-[10px]">
                Sarees / drapes billed
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="glass-panel min-w-0 rounded-2xl p-2.5 shadow-sm sm:p-3">
          <div className="flex min-w-0 flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
            <div className="relative min-w-0 w-full lg:max-w-md">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                type="text"
                placeholder="Search invoice, customer, phone, item..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="h-10 w-full min-w-0 rounded-xl border border-stone-200 bg-white/80 py-2 pl-9 pr-3 text-xs text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-brand-gold sm:h-auto sm:py-2.5 sm:pr-4"
              />
            </div>

            <div className="flex min-w-0 w-full items-center gap-1.5 overflow-x-auto pb-0.5 lg:w-auto">
              <span className="mr-1 flex shrink-0 items-center gap-1 text-[9px] font-medium text-stone-400 sm:text-[10px]">
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
                  onClick={() =>
                    setPaymentFilter(mode.id)
                  }
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-semibold transition-all sm:px-3 sm:text-[10px] ${
                    paymentFilter === mode.id
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
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          <div className="min-w-0 rounded-xl border border-stone-200 bg-white/60 px-3 py-2.5 sm:px-4">
            <p className="text-[8px] uppercase tracking-wider text-stone-400 sm:text-[9px]">
              Showing
            </p>

            <p className="mt-0.5 text-sm font-semibold text-stone-800">
              {filteredSales.length}
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-stone-200 bg-white/60 px-3 py-2.5 sm:px-4">
            <p className="text-[8px] uppercase tracking-wider text-stone-400 sm:text-[9px]">
              Retail Bills
            </p>

            <p className="mt-0.5 text-sm font-semibold text-stone-700">
              {filteredSales.length}
            </p>
          </div>

          <div className="col-span-2 min-w-0 rounded-xl border border-stone-200 bg-white/60 px-3 py-2.5 sm:col-span-1 sm:px-4">
            <p className="text-[8px] uppercase tracking-wider text-stone-400 sm:text-[9px]">
              Filter
            </p>

            <p className="mt-0.5 truncate text-sm font-semibold text-stone-700">
              {paymentFilter === "ALL"
                ? "All Payments"
                : getPaymentLabel(paymentFilter)}
            </p>
          </div>
        </div>

        {/* SALES SECTION */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200/80 bg-white/50 shadow-sm">
          <div className="flex min-w-0 flex-col gap-3 border-b border-stone-200/80 bg-stone-50/45 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500 sm:h-9 sm:w-9">
                <ReceiptIndianRupee size={16} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-stone-900">
                    Sales History
                  </h2>

                  <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-semibold text-stone-500">
                    {filteredSales.length}
                  </span>
                </div>

                <p className="mt-0.5 truncate text-[9px] text-stone-400 sm:text-[10px]">
                  All completed counter receipts and invoices
                </p>
              </div>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-[9px] uppercase tracking-wider text-stone-400">
                Section Total
              </p>

              <p className="mt-0.5 font-display text-sm font-semibold text-stone-800">
                {currency(
                  filteredSales.reduce(
                    (sum, sale) =>
                      sum +
                      Math.max(
                        0,
                        Number(sale.subtotal || 0) -
                          Number(sale.discount || 0)
                      ),
                    0
                  )
                )}
              </p>
            </div>
          </div>

          {/* MOBILE */}
          {renderMobileSales(
            filteredSales,
            "Retail invoices matching your search will appear here."
          )}

          {/* DESKTOP */}
          {renderDesktopSalesTable(
            filteredSales,
            "Retail invoices matching your search will appear here."
          )}
        </section>
      </div>

      {/* ================================================================== */}
      {/* VIEW BILL MODAL                                                    */}
      {/* ================================================================== */}

      {inspectInvoice && (
        <div
          className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-stone-900/60 p-2 backdrop-blur-md sm:p-4"
          onClick={() => setInspectInvoice(null)}
        >
          <div
            className="flex h-auto max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-xl flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex min-w-0 shrink-0 items-center gap-2 border-b border-stone-200 px-3 py-3 sm:px-6 sm:py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <ReceiptIndianRupee
                  size={16}
                  className="shrink-0 text-brand-plum"
                />

                <span className="min-w-0 truncate font-display text-sm font-semibold text-stone-900">
                  Invoice Preview:{" "}
                  {inspectInvoice.invoiceNumber}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    copyFullOrderDetails(inspectInvoice)
                  }
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold transition-all sm:px-2.5 sm:text-[11px] ${
                    copiedField ===
                    `full-order-${inspectInvoice.invoiceNumber}`
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                      : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {copiedField ===
                  `full-order-${inspectInvoice.invoiceNumber}` ? (
                    <Check
                      size={12}
                      className="text-emerald-600"
                    />
                  ) : (
                    <Copy
                      size={12}
                      className="text-stone-500"
                    />
                  )}

                  <span className="hidden min-[400px]:inline">
                    {copiedField ===
                    `full-order-${inspectInvoice.invoiceNumber}`
                      ? "Copied"
                      : "Copy Details"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectInvoice(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  aria-label="Close invoice"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* INVOICE BODY */}
            <div
              id="printable-invoice-preview"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 text-stone-800 sm:p-6"
            >
              {/* LOGO */}
              <div className="flex flex-col items-center justify-center border-b border-stone-200 pb-3 text-center">
                <div className="mb-2 flex h-10 justify-center">
                  <img
                    src={logo}
                    alt="RS Fashions Logo"
                    className="h-10 w-auto max-w-[110px] object-contain"
                  />
                </div>

                <h2 className="font-mona text-xl font-bold tracking-wide text-[#2A0E20] sm:text-2xl">
                  {STORE_LEGAL_NAME}
                </h2>

                <p className="mt-0.5 text-[10px] font-medium text-stone-500 sm:text-xs">
                  SiCo Gadwal Sarees • Pure Handlooms • Heritage
                  Silks
                </p>

                <p className="mx-auto mt-1 max-w-full break-words text-[9px] leading-4 text-stone-600 sm:max-w-sm sm:text-[10px]">
                  {STORE_ADDRESS}
                </p>

                <p className="mx-auto mt-0.5 max-w-full break-all text-[9px] leading-4 text-stone-600 sm:max-w-sm sm:text-[10px]">
                  {STORE_WHATSAPP_NUMBER}
                </p>
              </div>

              {/* RECEIPT + CUSTOMER */}
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-stone-100 bg-stone-50/70 p-3 text-xs sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                    Receipt Number
                  </p>

                  <div className="mt-0.5 flex min-w-0 items-center gap-2">
                    <p className="min-w-0 truncate font-mono font-bold text-stone-900">
                      {inspectInvoice.invoiceNumber}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          inspectInvoice.invoiceNumber,
                          `modal-inv-${inspectInvoice.invoiceNumber}`
                        )
                      }
                      className="shrink-0 p-0.5 text-stone-400 hover:text-stone-700"
                      title="Copy Invoice Number"
                    >
                      {copiedField ===
                      `modal-inv-${inspectInvoice.invoiceNumber}` ? (
                        <Check
                          size={11}
                          className="text-emerald-600"
                        />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>

                  <p className="mt-1 text-[10px] text-stone-400">
                    {formatDate(inspectInvoice.date)}
                  </p>
                </div>

                <div className="min-w-0 sm:text-right">
                  <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                      Customer Details
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        const custText = [
                          `Name: ${getCustomerName(
                            inspectInvoice
                          )}`,
                          getCustomerPhone(inspectInvoice)
                            ? `Phone: ${getCustomerPhone(
                                inspectInvoice
                              )}`
                            : null,
                          getCustomerEmail(inspectInvoice)
                            ? `Email: ${getCustomerEmail(
                                inspectInvoice
                              )}`
                            : null,
                          getCustomerAddress(inspectInvoice)
                            ? `Address: ${getCustomerAddress(
                                inspectInvoice
                              )}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join("\n");

                        copyToClipboard(
                          custText,
                          `modal-cust-${inspectInvoice.invoiceNumber}`
                        );
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded bg-stone-200/70 px-1.5 py-0.5 text-[8px] font-semibold text-stone-700 transition-colors hover:bg-stone-300/80 sm:text-[9px]"
                    >
                      {copiedField ===
                      `modal-cust-${inspectInvoice.invoiceNumber}` ? (
                        <>
                          <Check
                            size={9}
                            className="text-emerald-600"
                          />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={9} />
                          <span className="hidden min-[400px]:inline">
                            Copy Info
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-1 break-words font-semibold text-stone-900">
                    {getCustomerName(inspectInvoice)}
                  </p>

                  {getCustomerPhone(inspectInvoice) && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-stone-600 sm:justify-end">
                      <span className="break-all">
                        {getCustomerPhone(inspectInvoice)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            getCustomerPhone(inspectInvoice),
                            `modal-phone-${inspectInvoice.invoiceNumber}`
                          )
                        }
                        className="shrink-0 p-0.5 text-stone-400 hover:text-stone-700"
                      >
                        {copiedField ===
                        `modal-phone-${inspectInvoice.invoiceNumber}` ? (
                          <Check
                            size={10}
                            className="text-emerald-600"
                          />
                        ) : (
                          <Copy size={10} />
                        )}
                      </button>
                    </div>
                  )}

                  {getCustomerEmail(inspectInvoice) && (
                    <div className="mt-0.5 flex items-start gap-1.5 text-[10px] text-stone-500 sm:justify-end">
                      <span className="min-w-0 break-all">
                        {getCustomerEmail(inspectInvoice)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            getCustomerEmail(inspectInvoice),
                            `modal-email-${inspectInvoice.invoiceNumber}`
                          )
                        }
                        className="shrink-0 p-0.5 text-stone-400 hover:text-stone-700"
                      >
                        {copiedField ===
                        `modal-email-${inspectInvoice.invoiceNumber}` ? (
                          <Check
                            size={10}
                            className="text-emerald-600"
                          />
                        ) : (
                          <Copy size={10} />
                        )}
                      </button>
                    </div>
                  )}

                  {getCustomerAddress(inspectInvoice) && (
                    <div className="mt-0.5 flex items-start gap-1.5 text-[10px] text-stone-500 sm:justify-end">
                      <span className="min-w-0 break-words text-left sm:max-w-[260px] sm:text-right">
                        {getCustomerAddress(inspectInvoice)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            getCustomerAddress(
                              inspectInvoice
                            ),
                            `modal-addr-${inspectInvoice.invoiceNumber}`
                          )
                        }
                        className="mt-0.5 shrink-0 p-0.5 text-stone-400 hover:text-stone-700"
                      >
                        {copiedField ===
                        `modal-addr-${inspectInvoice.invoiceNumber}` ? (
                          <Check
                            size={10}
                            className="text-emerald-600"
                          />
                        ) : (
                          <Copy size={10} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ITEMS */}
              <div className="mt-4 min-w-0 overflow-hidden">
                <table className="w-full table-fixed text-left text-xs">
                  <thead className="border-b border-stone-200 text-[9px] uppercase tracking-wider text-stone-400">
                    <tr>
                      <th className="w-[57%] pb-2 pr-2">
                        Saree / Shade
                      </th>
                      <th className="w-[13%] pb-2 text-center">
                        Qty
                      </th>
                      <th className="w-[30%] pb-2 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {(inspectInvoice.items || []).map(
                      (item: any, idx: number) => {
                        const q =
                          Number(
                            item.qty || item.quantity
                          ) || 1;

                        const p =
                          Number(
                            item.unitPrice || item.price
                          ) || 0;

                        return (
                          <tr
                            key={item.cartId || idx}
                            className="text-[10px] sm:text-[11px]"
                          >
                            <td className="min-w-0 py-2.5 pr-2">
                              <p className="break-words font-semibold text-stone-900">
                                {item.name ||
                                  "SiCo Gadwal Saree"}
                              </p>

                              <span className="break-words text-[9px] font-mono text-stone-400 sm:text-[10px]">
                                {item.color ||
                                  "Standard"}{" "}
                                • {item.sku || "N/A"}
                              </span>
                            </td>

                            <td className="py-2.5 text-center font-semibold">
                              {q}
                            </td>

                            <td className="py-2.5 text-right font-bold text-stone-900">
                              {currency(p * q)}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* TOTALS */}
              <div className="mt-3 space-y-1.5 border-t border-stone-200 pt-3 text-xs text-stone-600">
                {Number(inspectInvoice.discount) > 0 && (
                  <div className="flex items-center justify-between gap-4 font-medium text-emerald-700">
                    <span>Trade Discount</span>
                    <span className="shrink-0">
                      -{currency(inspectInvoice.discount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-2.5 font-display text-base font-bold text-stone-950">
                  <span>Net Payable</span>

                  <span className="shrink-0">
                    {currency(
                      getNetPayable(inspectInvoice)
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-stone-400">
                    Payment Tender
                  </span>

                  <PaymentBadge
                    method={inspectInvoice.paymentMethod}
                  />
                </div>
              </div>

              {/* FOOTER MESSAGE */}
              <div className="mt-4 border-t border-dashed border-stone-200 pt-3 text-center">
                <p className="font-display text-base leading-relaxed text-black sm:text-[20px]">
                  Thank you for choosing RS Fashions.
                </p>

                <p className="mt-1 text-[8px] leading-4 text-stone-400 sm:text-[9px]">
                  Returns or replacements are only accepted
                  for items received damaged. Please provide a
                  360-degree unboxing video within 2 days of
                  delivery.
                </p>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="shrink-0 border-t border-stone-200 bg-stone-50/70 p-2.5 sm:px-6 sm:py-3.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setInspectInvoice(null)}
                  className="order-3 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-200/60 sm:order-1 sm:w-auto"
                >
                  Close
                </button>

                <div className="order-1 grid w-full grid-cols-2 gap-2 sm:order-2 sm:flex sm:w-auto sm:items-center">
                  {/* COPY */}
                  <button
                    type="button"
                    onClick={() =>
                      copyFullOrderDetails(inspectInvoice)
                    }
                    className={`col-span-2 inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[10px] font-semibold shadow-sm transition-all sm:col-span-1 sm:text-xs ${
                      copiedField ===
                      `full-order-${inspectInvoice.invoiceNumber}`
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                        : "border-amber-300/80 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    {copiedField ===
                    `full-order-${inspectInvoice.invoiceNumber}` ? (
                      <>
                        <Check
                          size={13}
                          className="shrink-0 text-emerald-700"
                        />
                        <span className="truncate">
                          Copied All Details!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy
                          size={13}
                          className="shrink-0 text-amber-800"
                        />
                        <span className="truncate">
                          Copy Order &amp; User Details
                        </span>
                      </>
                    )}
                  </button>

                  {/* WHATSAPP */}
                  <button
                    type="button"
                    onClick={() =>
                      whatsappInvoice(inspectInvoice)
                    }
                    className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 py-2.5 text-[10px] font-semibold text-emerald-700 shadow-sm transition-all hover:bg-stone-50 sm:px-3.5 sm:text-xs"
                  >
                    <Share2
                      size={13}
                      className="shrink-0"
                    />
                    <span className="truncate">
                      WhatsApp
                    </span>
                  </button>

                  {/* PRINT */}
                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#2A0E20] px-2 py-2.5 text-[10px] font-semibold text-amber-100 shadow-sm transition-all active:scale-[0.98] sm:px-4 sm:text-xs"
                  >
                    <Printer
                      size={14}
                      className="shrink-0 text-brand-gold"
                    />

                    <span className="truncate">
                      Print Receipt
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT CSS */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
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
            min-height: 100vh !important;
            height: auto !important;
            background: white !important;
            padding: 24px !important;
            margin: 0 !important;
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