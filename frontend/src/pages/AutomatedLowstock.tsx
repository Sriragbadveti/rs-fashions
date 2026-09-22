import { useMemo, useState } from "react";
import { Package, Check, Phone, User } from "lucide-react";
import type { Product } from "../types/inventory";
import { getLowStockVariants, SAFETY_STOCK_THRESHOLD } from "../types/lowStockEngine";
import { useModal } from "../context/ModalContext";

interface AutomatedLowstockProps {
  inventory: Product[];
  onUpdateProduct: (updatedProduct: Product) => void;
}

const WhatsAppIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12.031 2C6.511 2 2.016 6.486 2.016 11.996c0 1.93.551 3.734 1.507 5.267L2 22l4.908-1.488a9.92 9.92 0 0 0 5.123 1.484h.004c5.518 0 10.014-4.486 10.014-9.996A9.97 9.97 0 0 0 12.031 2zm0 18.275a8.27 8.27 0 0 1-4.22-1.156l-.303-.18-3.136.951.968-3.056-.197-.314a8.23 8.23 0 0 1-1.267-4.524c0-4.568 3.72-8.283 8.287-8.283 2.213 0 4.293.863 5.858 2.428a8.22 8.22 0 0 1 2.424 5.856c-.004 4.568-3.724 8.284-8.414 8.284zm4.542-6.195c-.248-.124-1.47-.726-1.698-.809-.228-.083-.394-.124-.56.124-.166.248-.642.809-.787.975-.145.166-.29.186-.539.062-.248-.124-1.049-.387-1.998-1.233-.738-.658-1.236-1.47-1.381-1.719-.145-.248-.016-.383.108-.506.112-.112.248-.29.373-.435.124-.145.166-.248.248-.415.083-.166.041-.311-.021-.435-.062-.124-.56-1.35-.767-1.848-.201-.486-.406-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.311-.228.248-.87.85-.87 2.073 0 1.223.891 2.405 1.015 2.571.124.166 1.753 2.678 4.247 3.755.593.256 1.056.409 1.417.524.595.19 1.137.163 1.565.099.477-.071 1.47-.601 1.677-1.182.207-.581.207-1.079.145-1.182-.062-.104-.228-.166-.477-.29z" />
  </svg>
);

async function openExternalUrl(url: string) {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const opener = await (Function('return import("@tauri-apps/plugin-opener")')() as Promise<{ openUrl: (u: string) => Promise<void> }>);
      await opener.openUrl(url);
      return;
    }
  } catch {
    // Falls through to DOM-based fallback if running in browser
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AutomatedLowstock({
  inventory,
  onUpdateProduct,
}: AutomatedLowstockProps) {
  const { toast } = useModal();
  const [weaverName, setWeaverName] = useState("");
  const [weaverPhone, setWeaverPhone] = useState("");
  const [targetQtys, setTargetQtys] = useState<Record<string, number>>({});
  const [selectedSkus, setSelectedSkus] = useState<Record<string, boolean>>({});

  const lowStockList = useMemo(() => getLowStockVariants(inventory), [inventory]);

  const toggleSelect = (sku: string) => {
    setSelectedSkus((prev) => ({ ...prev, [sku]: !prev[sku] }));
  };

  const handleQtyChange = (sku: string, qtyStr: string) => {
    const val = Math.max(1, parseInt(qtyStr) || 1);
    setTargetQtys((prev) => ({ ...prev, [sku]: val }));
  };

  const handleQuickRestock = (product: Product, sku: string, addQty: number) => {
    const updatedVariants = product.variants.map((v) =>
      v.sku === sku ? { ...v, stock: v.stock + addQty } : v
    );
    onUpdateProduct({ ...product, variants: updatedVariants });
    toast("Stock Replenished", `Added ${addQty} units to ${sku}`, "success");
  };

  const handleSendWhatsAppPO = async () => {
    const itemsToOrder = lowStockList
      .filter((item) => selectedSkus[item.variant.sku])
      .map((item) => ({
        productName: item.product.name,
        color: item.variant.color,
        sku: item.variant.sku,
        targetQty: targetQtys[item.variant.sku] || 5,
      }));

    if (itemsToOrder.length === 0) {
      toast("No Items Selected", "Please select at least one low-stock saree variant to dispatch PO.", "warning");
      return;
    }

    const cleanPhone = weaverPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast("Phone Number Required", "Please enter a valid 10-digit WhatsApp number for the weaver.", "warning");
      return;
    }

    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const itemsText = itemsToOrder
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.productName}* (${it.color})\n   SKU: \`${it.sku}\`\n   Order Qty: *${it.targetQty} Pieces*`
      )
      .join("\n\n");

    const message = [
      "🧵 *RS FASHIONS — WEAVER PURCHASE ORDER (PO)* 🧵",
      "Jubilee Hills Flagship Studio • Hyderabad",
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      `*PO Reference:* PO-WEAVER-${Date.now().toString().slice(-6)}`,
      `*Date:* ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
      `*Master Weaver / Cluster:* ${weaverName.trim() || "Gadwal Artisan Cluster"}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      "*REPLENISHMENT ITEMS REQUIRED:*",
      itemsText,
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      "*SPECIFICATIONS:*",
      "• Zari: Tested Silver electroplated 24kt Gold",
      "• Weave: Pure Handloom Silk Warp & Interlocked Zari Border",
      "• Target Delivery: Within 14 business days",
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      "Kindly acknowledge this loom assignment and confirm the pit loom schedule.",
    ].join("\n");

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    await openExternalUrl(whatsappUrl);
    toast("WhatsApp PO Dispatched", `Redirecting to WhatsApp for ${weaverName.trim() || "Master Weaver"}`, "success");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 font-sans select-none pb-12 text-stone-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight">
            Automated Low-Stock Management &amp; WhatsApp Dispatch
          </h1>
          <p className="text-xs opacity-75 mt-0.5">
            Monitor depleted handloom shade variants and dispatch replenishment purchase orders instantly via WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSendWhatsAppPO}
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
        >
          <WhatsAppIcon size={16} className="text-white" />
          <span>Dispatch WhatsApp PO to Weaver</span>
        </button>
      </div>

      <div className="glass-panel rounded-3xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider opacity-75 mb-1.5">
            Master Weaver / Loom Cluster Name
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              type="text"
              value={weaverName}
              placeholder="e.g. Master Weaver K. Narayana"
              onChange={(e) => setWeaverName(e.target.value)}
              className="w-full h-11 pl-10 pr-3 text-xs bg-(--input-bg)] border border-stone-500/30 rounded-xl focus:outline-none focus:border-brand-gold font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold tracking-wider opacity-75 mb-1.5">
            WhatsApp Number (10 Digits)
          </label>
          <div className="relative flex items-center">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
            <span className="absolute left-10 text-xs font-mono font-bold opacity-60">+91</span>
            <input
              type="text"
              maxLength={10}
              placeholder="9848012345"
              value={weaverPhone}
              onChange={(e) => {
                const numericVal = e.target.value.replace(/\D/g, "");
                setWeaverPhone(numericVal);
              }}
              className="w-full h-11 pl-20 pr-3 text-xs font-mono bg-(--input-bg)] border border-stone-500/30 rounded-xl focus:outline-none focus:border-brand-gold font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-stone-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
              <Package size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold">Critical Shade Variants (Threshold &le; {SAFETY_STOCK_THRESHOLD})</h2>
              <p className="text-[10px] opacity-75">Select items to include in the WhatsApp weaver purchase order.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold font-mono">
            {lowStockList.length} Deficits Found
          </span>
        </div>

        {lowStockList.length === 0 ? (
          <div className="py-20 text-center">
            <Check size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-bold">All Showroom Drapes Well Stocked</p>
            <p className="text-xs opacity-60 mt-1">No variants are currently running below safety buffer limits.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-xs">
              <thead className="bg-stone-500/5 border-b border-stone-500/20 text-[10px] uppercase font-bold tracking-wider opacity-70">
                <tr>
                  <th className="px-5 py-3 w-10 text-center">Select</th>
                  <th className="px-5 py-3">Saree Design &amp; Shade</th>
                  <th className="px-5 py-3 font-mono">SKU Code</th>
                  <th className="px-5 py-3 text-center">Current Stock</th>
                  <th className="px-5 py-3 text-center">Order Buffer Qty</th>
                  <th className="px-5 py-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-500/10">
                {lowStockList.map(({ product, variant }) => {
                  const isSelected = !!selectedSkus[variant.sku];
                  const bufferQty = targetQtys[variant.sku] || 5;

                  return (
                    <tr key={variant.sku} className="hover:bg-amber-500/5 transition-colors">
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(variant.sku)}
                          className="w-4 h-4 rounded border-stone-400 text-[#2A0E20] focus:ring-[#2A0E20] cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-stone-900">{product.name}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-brand-blush text-brand-plum font-mono text-[9px] font-bold">
                          {variant.color} ({variant.colorSlug})
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] opacity-80">{variant.sku}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 font-bold text-xs">
                          {variant.stock} left
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={bufferQty}
                          onChange={(e) => handleQtyChange(variant.sku, e.target.value)}
                          className="w-16 h-8 text-center font-mono font-bold bg-(--input-bg)] border border-stone-500/30 rounded-lg text-xs outline-none"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(product, variant.sku, 5)}
                          className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-500/20 transition-all shadow-sm"
                        >
                          +5 Restock Inward
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}