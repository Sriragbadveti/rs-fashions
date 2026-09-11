import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Package,
  Layers,
  AlertTriangle,
  Sparkles,
  History,
  RotateCcw,
} from "lucide-react";
import type {
  Category,
  DashboardProduct,
  StockMovement,
} from "../../../types/dashboard";
import { SareeCard } from "./SareeCard";
import { AddSareeModal } from "./AddSareeModal";
import { EditSareeModal } from "./EditSareeModal";
import { RestockModal } from "./RestockModal";

interface CatalogViewProps {
  inventory: DashboardProduct[];
  categories: Category[];
  onAddProduct: (newProduct: DashboardProduct, categoryId: string) => void;
  onUpdateProduct: (updatedProduct: DashboardProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onAddStockMovement?: (movement: StockMovement) => void;
  onOpenHistory?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  inventory,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddStockMovement,
  onOpenHistory,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "inStock" | "outOfStock">("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DashboardProduct | null>(null);

  // Stats
  const totalDesigns = inventory.length;
  const totalStockDrapes = inventory.reduce(
    (acc, p) => acc + p.variants.reduce((s, v) => s + v.stock, 0),
    0
  );
  const lowStockCount = inventory.filter((p) =>
    p.variants.some((v) => v.stock <= 2)
  ).length;
  const totalVaultValue = inventory.reduce(
    (acc, p) =>
      acc +
      p.variants.reduce((s, v) => s + v.stock * (p.salePrice || 0), 0),
    0
  );

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((p) => {
      // Category match
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) {
        return false;
      }

      // Stock status match
      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
      if (stockFilter === "low" && !p.variants.some((v) => v.stock <= 2)) {
        return false;
      }
      if (stockFilter === "inStock" && totalStock === 0) {
        return false;
      }
      if (stockFilter === "outOfStock" && totalStock > 0) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.id.toLowerCase().includes(q);
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesVariants = p.variants.some(
          (v) =>
            v.color.toLowerCase().includes(q) ||
            v.sku.toLowerCase().includes(q) ||
            v.colorSlug.toLowerCase().includes(q)
        );
        return matchesName || matchesSku || matchesTags || matchesVariants;
      }

      return true;
    });
  }, [inventory, selectedCategory, stockFilter, search]);

  const handleEditClick = (prod: DashboardProduct) => {
    setEditingProduct(prod);
    setIsEditModalOpen(true);
  };

  const handleQuickRestock = (
    product: DashboardProduct,
    variantSku: string,
    amount: number
  ) => {
    const targetVariant = product.variants.find((v) => v.sku === variantSku);
    if (!targetVariant) return;

    const previousStock = targetVariant.stock;
    const newStock = Math.max(0, previousStock + amount);

    const updatedVariants = product.variants.map((v) =>
      v.sku === variantSku ? { ...v, stock: newStock } : v
    );

    const updatedProduct = { ...product, variants: updatedVariants };
    onUpdateProduct(updatedProduct);

    // Record stock movement
    if (onAddStockMovement) {
      onAddStockMovement({
        id: `mov-${Date.now()}-${targetVariant.colorSlug}`,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        sku: targetVariant.sku,
        productName: product.name,
        color: targetVariant.color,
        colorSlug: targetVariant.colorSlug,
        type: amount > 0 ? "RESTOCK" : "DAMAGE",
        quantity: amount,
        previousStock,
        newStock,
        referenceNumber: `QUICK-${Date.now().toString().slice(-4)}`,
        performedBy: "Store Manager",
        note: `Quick stock adjustment (${amount > 0 ? "+1 piece" : "-1 piece"})`,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A373] mb-1">
            <Sparkles size={14} />
            <span>Artisanal Silk Inventory</span>
          </div>
          <h1 className="text-3xl font-display font-medium text-stone-900 tracking-tight">
            Saree Vault &amp; Catalogue
          </h1>
          <p className="text-xs text-stone-500 max-w-xl mt-0.5">
            Manage handloom weaves, register new saree designs, adjust inventory stocks and monitor color variants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRestockModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
          >
            <RotateCcw size={15} className="text-[#D4A373]" />
            <span>Adjust / Restock</span>
          </button>

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="h-10 px-4 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
            >
              <History size={15} className="text-purple-600" />
              <span>Audit Trail</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-5 rounded-xl bg-[#2A0E20] hover:bg-[#3d162f] text-amber-100 text-xs font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={16} className="text-[#D4A373]" />
            <span>Add Saree to Vault</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Saree Designs
            </span>
            <div className="text-2xl font-display font-semibold text-stone-900 mt-1">
              {totalDesigns}
            </div>
            <span className="text-[11px] text-stone-400">Master patterns</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#D4A373] flex items-center justify-center border border-amber-200/60 shadow-xs">
            <Layers size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Drapes in Stock
            </span>
            <div className="text-2xl font-display font-semibold text-stone-900 mt-1">
              {totalStockDrapes}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              Live showroom inventory
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-xs">
            <Package size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="text-2xl font-display font-semibold text-stone-900 mt-1">
              {lowStockCount}
            </div>
            <span className="text-[11px] text-amber-700 font-medium">
              Needs replenishment
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-xs">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Vault Retail Value
            </span>
            <div className="text-2xl font-display font-semibold text-stone-900 mt-1">
              ₹{totalVaultValue.toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-stone-400">Showroom valuation</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/60 shadow-xs">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, tag, or color..."
            className="w-full h-10 pl-10 pr-4 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#D4A373] text-stone-900 placeholder:text-stone-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {/* Stock Filter Pills */}
          <div className="flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/60">
            <button
              onClick={() => setStockFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                stockFilter === "all"
                  ? "bg-white text-stone-900 shadow-2xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              All Drapes
            </button>
            <button
              onClick={() => setStockFilter("low")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                stockFilter === "low"
                  ? "bg-white text-amber-800 shadow-2xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter("inStock")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                stockFilter === "inStock"
                  ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              In Stock
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#D4A373] text-stone-800 font-medium"
          >
            <option value="all">All Weave Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Saree Cards Grid */}
      {filteredInventory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {filteredInventory.map((product) => {
            const cat = categories.find((c) => c.id === product.categoryId);
            return (
              <SareeCard
                key={product.id}
                product={product}
                categoryName={cat?.name}
                onEdit={handleEditClick}
                onDelete={onDeleteProduct}
                onQuickRestock={handleQuickRestock}
                onOpenAuditHistory={onOpenHistory}
              />
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D4A373] mx-auto flex items-center justify-center border border-amber-200/60">
            <Package size={24} />
          </div>
          <h3 className="font-display font-semibold text-lg text-stone-900">
            {inventory.length === 0 ? "Vault is Ready for Fresh Inventory" : "No Sarees Match Filters"}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {inventory.length === 0
              ? "All dummy mock items have been cleared. Click 'Catalogue New Saree' above to add your first authentic saree drape directly to Supabase."
              : "Try adjusting your search keywords or reset filter conditions to see all registered inventory."}
          </p>
          {inventory.length === 0 ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#2A0E20] hover:bg-[#3d162f] text-xs font-semibold text-amber-100 shadow-md inline-flex items-center gap-2 transition-all"
            >
              <Plus size={14} className="text-[#D4A373]" />
              <span>Catalogue First Saree</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setStockFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <AddSareeModal
        isOpen={isAddModalOpen}
        categories={categories}
        existingInventory={inventory}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(newProd, catId) => {
          onAddProduct(newProd, catId);
          setIsAddModalOpen(false);
        }}
      />

      <EditSareeModal
        isOpen={isEditModalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={(updatedProd) => {
          onUpdateProduct(updatedProd);
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
      />

      <RestockModal
        isOpen={isRestockModalOpen}
        inventory={inventory}
        onClose={() => setIsRestockModalOpen(false)}
        onSaveMovement={(movement) => {
          if (onAddStockMovement) onAddStockMovement(movement);
        }}
      />
    </div>
  );
};
