import React from "react";
import {
  X,
  Printer,
  Share2,
  Sparkles,
} from "lucide-react";
import type { CompletedSale } from "../../../types/dashboard";

interface InvoiceModalProps {
  sale: CompletedSale | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const currency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = sale.customerPhone.replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      `Namaste ${sale.customerName || "Patron"},\n\nThank you for shopping at RS Fashions. Your GST Tax Invoice #${sale.invoiceNumber} for ₹${sale.total.toLocaleString("en-IN")} is generated.\n\nDate: ${sale.date}\nPayment: ${sale.paymentMethod.toUpperCase()}\n\nWe look forward to serving you again!`
    );
    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${text}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/75 backdrop-blur-sm p-4 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#2A0E20] text-amber-100 print:hidden">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-[#D4A373]" />
            <span className="font-display font-semibold text-base text-white">
              Official GST Tax Invoice
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer size={13} />
              <span>Print Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Share2 size={13} />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-amber-200/70 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 space-y-6 text-stone-800 bg-white" id="printable-invoice">
          {/* Brand & Store Header */}
          <div className="flex items-start justify-between border-b border-stone-200/80 pb-5">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#2A0E20]">
                RS Fashions
              </h2>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                Luxury Handloom Silk &amp; SiCo Gadwal Sarees
              </p>
              <p className="text-[11px] text-stone-500 mt-1 max-w-xs leading-relaxed">
                Plot 42, Jubilee Hills Road No. 36, Hyderabad, Telangana 500033
              </p>
              <p className="text-[11px] font-mono text-stone-600 mt-1 font-semibold">
                GSTIN: 36AAAAA0000A1Z5
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-mono text-xs font-bold uppercase tracking-wider inline-block">
                Tax Invoice
              </span>
              <p className="font-mono text-xs font-bold text-stone-900 mt-1">
                #{sale.invoiceNumber}
              </p>
              <p className="text-[11px] text-stone-500 font-mono">{sale.date}</p>
              <p className="text-[11px] font-semibold text-emerald-700 uppercase">
                Paid via {sale.paymentMethod.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Customer Details Bar */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 flex flex-col sm:flex-row justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block">
                Billed To (Patron)
              </span>
              <p className="font-semibold text-stone-900 mt-0.5">
                {sale.customerName || "Walk-in Patron"}
              </p>
              <p className="text-stone-500 font-mono text-[11px]">
                Phone: {sale.customerPhone || "N/A"}
              </p>
              {sale.customer?.address && (
                <p className="text-stone-500 text-[11px]">{sale.customer.address}</p>
              )}
            </div>

            {sale.customer?.gstin && (
              <div className="sm:text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block">
                  Customer GSTIN
                </span>
                <p className="font-mono text-xs font-bold text-stone-900 mt-0.5">
                  {sale.customer.gstin}
                </p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/90 text-stone-600 font-semibold text-[10px] uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3.5">#</th>
                  <th className="py-2.5 px-3.5">Item Description &amp; SKU</th>
                  <th className="py-2.5 px-3.5">HSN</th>
                  <th className="py-2.5 px-3.5 text-right">Rate</th>
                  <th className="py-2.5 px-3.5 text-center">Qty</th>
                  <th className="py-2.5 px-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70">
                {sale.items.map((item, idx) => (
                  <tr key={item.cartId || idx}>
                    <td className="py-3 px-3.5 text-stone-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-stone-900">{item.name}</div>
                      <div className="font-mono text-[10px] text-stone-500">
                        {item.sku} &bull; <span className="font-sans">{item.color}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-stone-600">
                      {item.hsn || "5208"}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-medium">
                      {currency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold">
                      {item.qty}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-stone-900">
                      {currency(item.unitPrice * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Gross Subtotal:</span>
                <span className="font-mono font-semibold">{currency(sale.subtotal)}</span>
              </div>

              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Privilege Discount:</span>
                  <span className="font-mono font-semibold">-{currency(sale.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-600">
                <span>CGST (2.5% / 6%):</span>
                <span className="font-mono font-semibold">{currency(sale.cgst)}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>SGST (2.5% / 6%):</span>
                <span className="font-mono font-semibold">{currency(sale.sgst)}</span>
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between text-stone-900 text-base font-bold">
                <span>Total Net Payable:</span>
                <span className="font-display font-bold text-[#2A0E20]">
                  {currency(sale.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Footer */}
          <div className="pt-4 border-t border-stone-200/80 text-[10px] text-stone-400 text-center space-y-1">
            <p>Thank you for patronizing RS Fashions Gadwal Silk Atelier.</p>
            <p className="font-mono">Computer Generated Official GST Tax Invoice &bull; E. &amp; O.E.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
