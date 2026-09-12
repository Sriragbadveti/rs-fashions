import React, { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Search, Filter, Plus, CalendarDays, AlertCircle, X, Check, Package, ChevronDown, Clock3, FileText, Download } from "lucide-react";
import type { StockMovement, MovementType, Product } from "../types/inventory";
import { sound } from "../types/soundEngine";

interface StockHistoryProps {
    history: StockMovement[];
    inventory: Product[];
    onAddStockMovement: (movement: StockMovement) => void;
}

export default function StockHistory({
    history,
    inventory,
    onAddStockMovement,
}: StockHistoryProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [selectedVariantSku, setSelectedVariantSku] = useState("");
    const [restockQty, setRestockQty] = useState(1);
    const [restockReference, setRestockReference] = useState("");
    const [restockNote, setRestockNote] = useState("");

    const allVariants = useMemo(() => {
        return inventory.flatMap((product) =>
            product.variants.map((variant) => ({
                sku: variant.sku,
                productName: product.name,
                color: variant.color,
                colorSlug: variant.colorSlug,
                currentStock: variant.stock,
            }))
        );
    }, [inventory]);

    const stats = useMemo(() => {
        let inwardStock = 0;
        let outwardStock = 0;
        let defectStock = 0;

        history.forEach((movement) => {
            if (
                movement.type === "RESTOCK" ||
                movement.type === "RETURN"
            ) {
                inwardStock += Math.abs(movement.quantity);
            }

            if (movement.type === "SALE") {
                outwardStock += Math.abs(movement.quantity);
            }

            if (movement.type === "DAMAGE") {
                defectStock += Math.abs(movement.quantity);
            }
        });

        const lowStockCount = allVariants.filter(
            (variant) => variant.currentStock <= 2
        ).length;

        return {
            inwardStock,
            outwardStock,
            defectStock,
            lowStockCount,
        };
    }, [history, allVariants]);

    const filteredMovements = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return history.filter((movement) => {
            const matchesType =
                selectedType === "ALL" || movement.type === selectedType;
            const matchesQuery =
                !query ||
                movement.sku?.toLowerCase().includes(query) ||
                movement.productName?.toLowerCase().includes(query) ||
                movement.color?.toLowerCase().includes(query) ||
                movement.referenceNumber?.toLowerCase().includes(query) ||
                movement.note?.toLowerCase().includes(query);
            return matchesType && matchesQuery;
        });
    }, [history, selectedType, searchQuery]);

    // BANK STATEMENT STYLE PDF EXPORT (Desktop App Optimized via Hidden Iframe)
    const handleExportStatementPDF = () => {
        sound.playClick();

        const reportDate = new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>RS Fashions - Stock Statement Ledger</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; margin: 0; padding: 40px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #292524; padding-bottom: 20px; margin-bottom: 30px; }
                    .brand h1 { margin: 0; font-size: 24px; font-weight: bold; color: #2A0E20; letter-spacing: -0.5px; }
                    .brand p { margin: 4px 0 0 0; font-size: 11px; color: #78716c; text-transform: uppercase; letter-spacing: 1px; }
                    .meta { text-align: right; }
                    .meta h2 { margin: 0; font-size: 16px; font-weight: 600; color: #1c1917; }
                    .meta p { margin: 4px 0 0 0; font-size: 11px; color: #78716c; }
                    
                    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                    .summary-card { background: #f5f5f4; border: 1px solid #e7e5e4; border-radius: 8px; padding: 12px 15px; }
                    .summary-card span { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #78716c; display: block; }
                    .summary-card strong { font-size: 18px; font-weight: bold; color: #1c1917; margin-top: 4px; display: block; }

                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    th { background: #2A0E20; color: #F5E6DC; text-align: left; padding: 10px 12px; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
                    td { padding: 10px 12px; border-bottom: 1px solid #e7e5e4; vertical-align: middle; color: #292524; }
                    tr:nth-child(even) { background: #fafaf9; }
                    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                    .badge-RESTOCK { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
                    .badge-SALE { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
                    .badge-DAMAGE { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
                    .badge-RETURN { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
                    .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 10px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 15px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">
                        <h1>RS FASHIONS</h1>
                        <p>SiCo Gadwal Sarees — Stock Statement Ledger</p>
                    </div>
                    <div class="meta">
                        <h2>Statement Report</h2>
                        <p>Generated on: ${reportDate}</p>
                        <p>Filter Applied: <strong>${selectedType}</strong></p>
                    </div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card">
                        <span>Total Inward</span>
                        <strong>+${stats.inwardStock} pcs</strong>
                    </div>
                    <div class="summary-card">
                        <span>Total Sales Out</span>
                        <strong>-${stats.outwardStock} pcs</strong>
                    </div>
                    <div class="summary-card">
                        <span>Damaged / Loss</span>
                        <strong>${stats.defectStock} pcs</strong>
                    </div>
                    <div class="summary-card">
                        <span>Total Records</span>
                        <strong>${filteredMovements.length} Entries</strong>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Product Name & Color</th>
                            <th>SKU</th>
                            <th>Movement Type</th>
                            <th>Qty</th>
                            <th>Stock (Prev → New)</th>
                            <th>Reference</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredMovements.map(m => `
                            <tr>
                                <td>${m.date}</td>
                                <td><strong>${m.productName}</strong><br><span style="color: #78716c; font-size: 10px;">${m.color}</span></td>
                                <td style="font-family: monospace; font-size: 10px;">${m.sku}</td>
                                <td><span class="badge badge-${m.type}">${m.type}</span></td>
                                <td><strong>${m.type === 'SALE' || m.type === 'DAMAGE' ? '-' : '+'}${Math.abs(m.quantity)}</strong></td>
                                <td>${m.previousStock} &rarr; ${m.newStock}</td>
                                <td style="font-family: monospace;">${m.referenceNumber || '—'}</td>
                                <td>${m.note || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <span>RS Fashions Enterprise Management System — Confidential Audit Trail</span>
                    <span>Page 1 of 1</span>
                </div>
            </body>
            </html>
        `;

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(htmlContent);
            doc.close();

            iframe.contentWindow?.focus();
            setTimeout(() => {
                iframe.contentWindow?.print();
                setTimeout(() => document.body.removeChild(iframe), 1000);
            }, 500);
        }
    };

    function formatMovementDate(dateValue: string) {
        if (!dateValue) {
            return { date: "—", time: "" };
        }
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) {
            const parts = dateValue.split(",");
            return {
                date: parts[0]?.trim() || dateValue,
                time: parts.slice(1).join(",").trim(),
            };
        }
        return {
            date: parsed.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            time: parsed.toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }),
        };
    }

    function getMovementConfig(type: MovementType) {
        switch (type) {
            case "RESTOCK":
                return {
                    label: "Received",
                    icon: ArrowDownLeft,
                    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    iconBg: "bg-emerald-100 text-emerald-700",
                    quantity: "text-emerald-700",
                };
            case "RETURN":
                return {
                    label: "Return",
                    icon: ArrowDownLeft,
                    badge: "bg-blue-50 text-blue-700 border-blue-200",
                    iconBg: "bg-blue-100 text-blue-700",
                    quantity: "text-blue-700",
                };
            case "SALE":
                return {
                    label: "Sold",
                    icon: ArrowUpRight,
                    badge: "bg-amber-50 text-amber-800 border-amber-200",
                    iconBg: "bg-amber-100 text-amber-800",
                    quantity: "text-amber-800",
                };
            case "DAMAGE":
                return {
                    label: "Damaged",
                    icon: AlertCircle,
                    badge: "bg-rose-50 text-rose-700 border-rose-200",
                    iconBg: "bg-rose-100 text-rose-700",
                    quantity: "text-rose-700",
                };
            default:
                return {
                    label: type,
                    icon: RefreshCw,
                    badge: "bg-stone-50 text-stone-700 border-stone-200",
                    iconBg: "bg-stone-100 text-stone-700",
                    quantity: "text-stone-700",
                };
        }
    }

    function getColorDotClass(colorSlug?: string) {
        const slug = colorSlug?.toLowerCase() || "";
        if (slug.includes("red")) return "bg-red-500";
        if (slug.includes("pink")) return "bg-pink-400";
        if (slug.includes("yellow")) return "bg-yellow-400";
        if (slug.includes("green")) return "bg-green-500";
        if (slug.includes("blue")) return "bg-blue-500";
        if (slug.includes("orange")) return "bg-orange-500";
        if (slug.includes("violet") || slug.includes("purple")) return "bg-violet-500";
        if (slug.includes("black")) return "bg-black";
        if (slug.includes("white")) return "bg-white border border-stone-300";
        if (slug.includes("gold")) return "bg-amber-400";
        if (slug.includes("silver")) return "bg-stone-300";
        return "bg-brand-plum";
    }

    function handleSaveRestock(e: React.FormEvent) {
        e.preventDefault();
        const target = allVariants.find(
            (variant) => variant.sku === selectedVariantSku
        );
        if (!target) {
            alert("Please select a valid saree color variant.");
            return;
        }

        const qty = Math.max(1, Number(restockQty) || 1);
        const newMovement: StockMovement = {
            id: `mov-${Date.now()}`,
            date: new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }),
            sku: target.sku,
            productName: target.productName,
            color: target.color,
            colorSlug: target.colorSlug,
            type: "RESTOCK",
            quantity: qty,
            previousStock: target.currentStock,
            newStock: target.currentStock + qty,
            referenceNumber:
                restockReference.trim() ||
                `PO-WEAVER-${Date.now().toString().slice(-4)}`,
            performedBy: "Store Admin",
            note: restockNote.trim() || "Weaver consignment inward",
        };

        onAddStockMovement(newMovement);
        setIsRestockModalOpen(false);
        setSelectedVariantSku("");
        setRestockQty(1);
        setRestockReference("");
        setRestockNote("");
    }

    const selectedRestockVariant = useMemo(() => {
        return allVariants.find(
            (variant) => variant.sku === selectedVariantSku
        );
    }, [allVariants, selectedVariantSku]);

    return (
        <div className="max-w-[1500px] mx-auto space-y-6 font-sans">
            {/* HEADER */}
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
                <div>
                    <h1 className="text-[30px] md:text-[34px] leading-tight font-display font-medium tracking-tight text-stone-900">
                        Stock History
                    </h1>
                    <p className="mt-1.5 text-sm text-stone-500 max-w-2xl">
                        See what came in, what went out, and export formal bank-style stock statements.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-start xl:self-auto">
                    {/* EXPORT STATEMENT PDF BUTTON */}
                    <button
                        type="button"
                        onClick={handleExportStatementPDF}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Download size={15} className="text-brand-plum" />
                        Export Statement (PDF)
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsRestockModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-plum hover:bg-brand-plumHover text-brand-blush text-xs font-semibold shadow-premium transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus size={16} className="text-brand-gold" />
                        Receive Stock
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
                <div className="glass-panel rounded-2xl border border-stone-200/60 p-5 min-h-[128px] h-full">
                    <div className="flex h-full items-center gap-4">
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <ArrowDownLeft size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-stone-400 whitespace-nowrap">
                                Stock Received
                            </p>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                                <span className="text-[26px] leading-none font-display font-semibold text-stone-900">
                                    +{stats.inwardStock}
                                </span>
                                <span className="text-[10px] font-medium text-stone-400">pieces</span>
                            </div>
                            <p className="mt-1.5 text-[10px] text-stone-400">Added to inventory</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl border border-stone-200/60 p-5 min-h-[128px] h-full">
                    <div className="flex h-full items-center gap-4">
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                            <ArrowUpRight size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-stone-400 whitespace-nowrap">
                                Sales Out
                            </p>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                                <span className="text-[26px] leading-none font-display font-semibold text-stone-900">
                                    -{stats.outwardStock}
                                </span>
                                <span className="text-[10px] font-medium text-stone-400">pieces</span>
                            </div>
                            <p className="mt-1.5 text-[10px] text-stone-400">Sold from inventory</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl border border-stone-200/60 p-5 min-h-[128px] h-full">
                    <div className="flex h-full items-center gap-4">
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                            <AlertCircle size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-stone-400 whitespace-nowrap">
                                Damaged
                            </p>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                                <span className="text-[26px] leading-none font-display font-semibold text-rose-700">
                                    {stats.defectStock}
                                </span>
                                <span className="text-[10px] font-medium text-stone-400">pieces</span>
                            </div>
                            <p className="mt-1.5 text-[10px] text-stone-400">Removed / affected</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl border border-stone-200/60 p-5 min-h-[128px] h-full">
                    <div className="flex h-full items-center gap-4">
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                            <RefreshCw size={19} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-stone-400 whitespace-nowrap">
                                Low Stock
                            </p>
                            <div className="mt-1.5 flex items-baseline gap-1.5">
                                <span className="text-[26px] leading-none font-display font-semibold text-stone-900">
                                    {stats.lowStockCount}
                                </span>
                                <span className="text-[10px] font-medium text-stone-400">shades</span>
                            </div>
                            <p className="mt-1.5 text-[10px] text-stone-400">Need your attention</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH + FILTER */}
            <div className="glass-panel rounded-2xl border border-stone-200/60 p-3">
                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1 min-w-0">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search product, SKU, reference number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 bg-white/80 border border-stone-200 rounded-xl pl-10 pr-4 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        <div className="flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-stone-400 whitespace-nowrap">
                            <Filter size={12} />
                            Filter
                        </div>

                        {[
                            { id: "ALL", label: "All" },
                            { id: "RESTOCK", label: "Received" },
                            { id: "SALE", label: "Sold" },
                            { id: "DAMAGE", label: "Damaged" },
                        ].map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setSelectedType(type.id)}
                                className={`h-9 px-3.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                                    selectedType === type.id
                                        ? "bg-brand-plum text-brand-blush shadow-sm"
                                        : "bg-stone-100/70 text-stone-600 hover:bg-stone-200/70"
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MOVEMENT TABLE */}
            <div className="glass-panel rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-stone-200/70 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-stone-900">Recent Movements</h2>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                            {filteredMovements.length} {filteredMovements.length === 1 ? "movement" : "movements"} shown
                        </p>
                    </div>

                    {searchQuery || selectedType !== "ALL" ? (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedType("ALL");
                            }}
                            className="text-[11px] font-semibold text-brand-plum hover:underline"
                        >
                            Clear filters
                        </button>
                    ) : null}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left">
                        <thead>
                            <tr className="bg-stone-50/70 border-b border-stone-200/70">
                                <th className="px-5 py-3.5 w-[150px]">
                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-black">Date & Time</span>
                                </th>
                                <th className="px-5 py-3.5 min-w-[260px]">
                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-black">Product</span>
                                </th>
                                <th className="px-5 py-3.5 w-[175px]">
                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-black">Movement</span>
                                </th>
                                <th className="px-5 py-3.5 w-[150px]">
                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-black">Stock</span>
                                </th>
                                <th className="px-5 py-3.5 w-[180px]">
                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-black">Reference</span>
                                </th>
                                <th className="px-5 py-3.5 min-w-[190px]">
                                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-black">Note</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white/40">
                            {filteredMovements.map((movement) => {
                                const movementConfig = getMovementConfig(movement.type);
                                const MovementIcon = movementConfig.icon;
                                const movementDate = formatMovementDate(movement.date);
                                const isPositive =
                                    movement.type === "RESTOCK" || movement.type === "RETURN";

                                return (
                                    <tr key={movement.id} className="group hover:bg-amber-50/20 transition-colors">
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-start gap-2.5">
                                                <div className="mt-0.5 w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
                                                    <CalendarDays size={13} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-semibold text-stone-700 whitespace-nowrap">
                                                        {movementDate.date}
                                                    </p>
                                                    {movementDate.time ? (
                                                        <p className="mt-0.5 text-[10px] text-stone-400 flex items-center gap-1">
                                                            <Clock3 size={10} />
                                                            {movementDate.time}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${movementConfig.iconBg}`}>
                                                    <Package size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[12px] font-semibold text-stone-900 truncate max-w-[250px]">
                                                        {movement.productName}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[10px] font-medium text-stone-600 truncate max-w-[120px]">
                                                            {movement.color}
                                                        </span>
                                                        <span className="text-stone-300 text-[11px]">|</span>
                                                        <span className="font-mono text-[9px] font-medium text-stone-400 tracking-wide">
                                                            {movement.sku}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${movementConfig.iconBg}`}>
                                                    <MovementIcon size={13} />
                                                </span>
                                                <div>
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${movementConfig.badge}`}>
                                                        {movementConfig.label}
                                                    </span>
                                                    <p className={`mt-1 text-[11px] font-semibold ${movementConfig.quantity}`}>
                                                        {isPositive ? "+" : "-"}{Math.abs(movement.quantity)} pieces
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-medium text-stone-400">
                                                    {movement.previousStock}
                                                </span>
                                                <span className="text-stone-300">→</span>
                                                <span className="text-sm font-semibold text-stone-900">
                                                    {movement.newStock}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[9px] text-stone-400">pieces in stock</p>
                                        </td>

                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                                                    <FileText size={13} className="text-stone-400" />
                                                </div>
                                                <p className="font-mono text-[10px] font-semibold text-stone-700 truncate max-w-[135px]">
                                                    {movement.referenceNumber}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 align-middle">
                                            <p className="text-[11px] text-stone-500 leading-relaxed max-w-[230px]" title={movement.note || undefined}>
                                                {movement.note || "No note added"}
                                            </p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredMovements.length === 0 && (
                        <div className="px-6 py-16 text-center">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                                <Package size={20} />
                            </div>
                            <h3 className="mt-4 text-sm font-semibold text-stone-800">No stock movements found</h3>
                            <p className="mt-1.5 text-xs text-stone-400 max-w-sm mx-auto">
                                Try changing your search or movement filter. New stock activity will appear here automatically.
                            </p>
                            {(searchQuery || selectedType !== "ALL") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedType("ALL");
                                    }}
                                    className="mt-4 text-xs font-semibold text-brand-plum hover:underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {filteredMovements.length > 0 && (
                    <div className="px-5 py-3 border-t border-stone-200/70 bg-stone-50/40 flex items-center justify-between">
                        <p className="text-[10px] text-stone-400">
                            Showing <span className="font-semibold text-stone-600">{filteredMovements.length}</span> movement{filteredMovements.length === 1 ? "" : "s"}
                        </p>
                        <p className="text-[10px] text-stone-400">Inventory audit trail</p>
                    </div>
                )}
            </div>

            {/* RECEIVE STOCK MODAL */}
            {isRestockModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-brand-plum/35 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setIsRestockModalOpen(false)}
                >
                    <div
                        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-white/60 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 md:px-7 py-5 border-b border-stone-200 bg-stone-50/50">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <ArrowDownLeft size={15} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                                            Stock In
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-display font-medium text-stone-900">
                                        Receive Stock
                                    </h2>
                                    <p className="mt-1 text-xs text-stone-500">
                                        Add incoming sarees to your inventory.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsRestockModalOpen(false)}
                                    className="w-9 h-9 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-stone-800 hover:bg-stone-100 flex items-center justify-center transition-colors"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSaveRestock} className="p-6 md:p-7 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-[0.12em] mb-2">
                                    Saree / Color Variant
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={selectedVariantSku}
                                        onChange={(e) => setSelectedVariantSku(e.target.value)}
                                        className="w-full h-11 appearance-none bg-white border border-stone-200 rounded-xl px-3.5 pr-10 text-xs text-stone-800 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 transition-all"
                                    >
                                        <option value="">Select a saree variant...</option>
                                        {allVariants.map((variant) => (
                                            <option key={variant.sku} value={variant.sku}>
                                                {variant.productName} — {variant.color} · Stock {variant.currentStock}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                                </div>

                                {selectedRestockVariant && (
                                    <div className="mt-2.5 flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${getColorDotClass(selectedRestockVariant.colorSlug)}`} />
                                            <span className="text-[11px] text-stone-600">{selectedRestockVariant.color}</span>
                                        </div>
                                        <span className="text-[10px] text-stone-400">
                                            Current stock <strong className="text-stone-700">{selectedRestockVariant.currentStock}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-[0.12em] mb-2">
                                        Quantity Received
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={restockQty}
                                        onChange={(e) =>
                                            setRestockQty(Math.max(1, Number(e.target.value) || 1))
                                        }
                                        className="w-full h-11 bg-white border border-stone-200 rounded-xl px-3.5 text-sm font-semibold text-stone-900 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-[0.12em] mb-2">
                                        Reference Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="PO-GADWAL-204"
                                        value={restockReference}
                                        onChange={(e) => setRestockReference(e.target.value)}
                                        className="w-full h-11 bg-white border border-stone-200 rounded-xl px-3.5 text-xs font-mono uppercase text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-[0.12em] mb-2">
                                    Note
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Example: Master weaver batch from Gadwal..."
                                    value={restockNote}
                                    onChange={(e) => setRestockNote(e.target.value)}
                                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-3 text-xs text-stone-800 placeholder:text-stone-300 resize-none focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/15 transition-all"
                                />
                            </div>

                            {selectedRestockVariant && (
                                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                                                Stock Preview
                                            </p>
                                            <p className="mt-1 text-xs text-emerald-900">
                                                {selectedRestockVariant.productName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-stone-500">
                                                {selectedRestockVariant.currentStock}
                                            </span>
                                            <span className="text-stone-300">→</span>
                                            <span className="text-lg font-display font-semibold text-emerald-700">
                                                {selectedRestockVariant.currentStock +
                                                    Math.max(1, Number(restockQty) || 1)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-[10px] text-emerald-700/70">
                                        This quantity will be added to the current stock.
                                    </p>
                                </div>
                            )}

                            <div className="pt-2 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRestockModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-plum hover:bg-brand-plumHover text-brand-blush text-xs font-semibold shadow-premium transition-all active:scale-[0.99]"
                                >
                                    <Check size={15} className="text-brand-gold" />
                                    Add to Inventory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}