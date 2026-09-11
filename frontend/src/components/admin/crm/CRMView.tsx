import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Gift,
  Heart,
  Sparkles,
  UserPlus,
} from "lucide-react";
import type { CustomerProfile } from "../../../types/dashboard";
import { AddCustomerModal } from "./AddCustomerModal";

interface CRMViewProps {
  customers?: CustomerProfile[];
  onAddCustomer?: (customer: CustomerProfile) => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  customers: initialCustomers = [],
  onAddCustomer,
}) => {
  const [customers, setCustomers] = useState<CustomerProfile[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(
    initialCustomers[0] || null
  );

  useEffect(() => {
    setCustomers(initialCustomers);
    if (!selectedCustomer && initialCustomers.length > 0) {
      setSelectedCustomer(initialCustomers[0]);
    } else if (selectedCustomer && !initialCustomers.some(c => c.id === selectedCustomer.id)) {
      setSelectedCustomer(initialCustomers[0] || null);
    }
  }, [initialCustomers]);

  const currency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (tierFilter !== "ALL" && c.tier !== tierFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.city.toLowerCase().includes(q) ||
          (c.preferredWeave && c.preferredWeave.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [customers, tierFilter, search]);

  const handleSendWhatsApp = (
    c: CustomerProfile,
    type: "greeting" | "birthday" | "anniversary" | "drop"
  ) => {
    const phone = c.phone.replace(/[^0-9]/g, "");
    let text = `Namaste ${c.name},\n\nGreetings from RS Fashions Jubilee Hills Flagship Atelier!`;

    if (type === "birthday") {
      text = `Namaste ${c.name},\n\nWishing you a joyful & blessed Birthday from all of us at RS Fashions!\n\nAs a valued ${c.tier}, we have reserved an exclusive 10% celebratory privilege on your next heirloom Gadwal silk saree choice.\n\nWarm regards,\nRS Fashions`;
    } else if (type === "anniversary") {
      text = `Namaste ${c.name},\n\nWishing you and your family a very happy Wedding Anniversary from RS Fashions!\n\nMay your celebrations be adorned with elegance. We look forward to welcoming you soon.\n\nWarm regards,\nRS Fashions`;
    } else if (type === "drop") {
      text = `Namaste ${c.name},\n\nA brand new hand-woven batch of ${c.preferredWeave || "pure silk Gadwal drapes"} has just arrived fresh from our Gadwal master weavers.\n\nSince this matches your personal preference, we'd love to share preview pictures with you!\n\nWarm regards,\nRS Fashions`;
    }

    window.open(`https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSaveCustomer = (newCustomer: CustomerProfile) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    if (onAddCustomer) {
      onAddCustomer(newCustomer);
    }
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D4A373] mb-1">
            <Users size={14} />
            <span>Client Loyalty &amp; Concierge</span>
          </div>
          <h1 className="text-3xl font-display font-medium text-stone-900 tracking-tight">
            Patron Relationship Directory
          </h1>
          <p className="text-xs text-stone-500 max-w-xl mt-0.5">
            Manage VIP patron tiers, track lifetime silk investments, celebrate birthdays/anniversaries, and dispatch personalized WhatsApp invitations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 px-5 rounded-xl bg-[#2A0E20] hover:bg-[#3d162f] text-amber-100 text-xs font-semibold flex items-center gap-2 shadow-md transition-all self-start md:self-auto"
        >
          <Plus size={16} className="text-[#D4A373]" />
          <span>Add New Patron</span>
        </button>
      </div>

      {/* 2-Column CRM layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Directory List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Tier Pills */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patrons by name, phone, city..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["ALL", "Royal Patron", "Heritage Club", "Boutique Member"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    tierFilter === tier
                      ? "bg-[#2A0E20] text-amber-100 shadow-2xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {tier === "ALL" ? "All Patrons" : tier}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center glass-panel rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D4A373] flex items-center justify-center mx-auto">
                  <UserPlus size={22} />
                </div>
                <h3 className="font-display font-semibold text-stone-800 text-sm">
                  {search ? "No matching patrons found" : "No Patrons Registered Yet"}
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  {search
                    ? "Try adjusting your search keywords or filter tab."
                    : "Register your first showroom VIP client to start tracking purchases and birthdays."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-9 px-4 rounded-xl bg-[#2A0E20] text-amber-100 text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#3d162f] transition-all"
                  >
                    <Plus size={14} className="text-[#D4A373]" />
                    <span>Add First Patron</span>
                  </button>
                )}
              </div>
            ) : (
              filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#D4A373] shadow-md ring-2 ring-[#D4A373]/20"
                      : "bg-white/80 border-stone-200/80 hover:bg-white hover:border-stone-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#2A0E20] text-amber-200 font-display font-bold text-sm flex items-center justify-center shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold text-sm text-stone-900">
                            {c.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              c.tier === "Royal Patron"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : c.tier === "Heritage Club"
                                ? "bg-purple-100 text-purple-900 border border-purple-300"
                                : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {c.tier}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-stone-500 mt-0.5">
                          {c.phone} &bull; <span className="font-sans">{c.city}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-bold text-sm text-stone-900 block">
                        {currency(c.totalSpent)}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {c.ordersCount} Orders
                      </span>
                    </div>
                  </div>

                  {/* Preferred Weave & Celebration Badge */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-stone-600 text-[11px] truncate max-w-xs">
                      <Sparkles size={12} className="text-[#D4A373] shrink-0" />
                      <span className="truncate">Loves: {c.preferredWeave || "Gadwal Silk"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.birthday && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-medium flex items-center gap-1">
                          <Gift size={11} />
                          <span>{c.birthday}</span>
                        </span>
                      )}
                      {c.anniversary && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-medium flex items-center gap-1">
                          <Heart size={11} />
                          <span>{c.anniversary}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Right Column: Selected Patron Dossier & WhatsApp Concierge */}
        <div className="lg:col-span-5 sticky top-6">
          {selectedCustomer ? (
            <div className="glass-panel p-6 rounded-3xl space-y-5">
              {/* Dossier Header */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-200/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#2A0E20] text-amber-200 font-display font-bold text-xl flex items-center justify-center shadow-md">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900">
                      {selectedCustomer.name}
                    </h3>
                    <p className="text-xs text-stone-500 font-mono">
                      {selectedCustomer.phone}
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider border border-amber-300">
                      {selectedCustomer.tier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block">
                    Lifetime Silk Investment
                  </span>
                  <p className="font-display text-lg font-bold text-stone-900 mt-0.5">
                    {currency(selectedCustomer.totalSpent)}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/80 border border-stone-200/80">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block">
                    Completed Purchases
                  </span>
                  <p className="font-display text-lg font-bold text-stone-900 mt-0.5">
                    {selectedCustomer.ordersCount} Drapes
                  </p>
                </div>
              </div>

              {/* Patron Preferences */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Location:</span>
                  <span className="font-medium text-stone-900">{selectedCustomer.city}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Preferred Pattern:</span>
                  <span className="font-medium text-stone-900">{selectedCustomer.preferredWeave || "Gadwal Silk"}</span>
                </div>
                {selectedCustomer.notes && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-stone-700 text-[11px] leading-relaxed">
                    <strong>Concierge Note:</strong> {selectedCustomer.notes}
                  </div>
                )}
              </div>

              {/* One-Tap WhatsApp Concierge Dispatch */}
              <div className="space-y-2 pt-3 border-t border-stone-200/80">
                <span className="text-[11px] uppercase tracking-wider font-bold text-stone-700 block">
                  One-Tap WhatsApp Concierge Actions
                </span>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(selectedCustomer, "birthday")}
                    className="w-full h-10 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Gift size={14} className="text-amber-700" />
                    <span>Send Birthday Greeting + Privilege Offer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(selectedCustomer, "anniversary")}
                    className="w-full h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Heart size={14} className="text-rose-700" />
                    <span>Send Anniversary Congratulations</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(selectedCustomer, "drop")}
                    className="w-full h-10 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Sparkles size={14} className="text-purple-700" />
                    <span>Notify for New Weave Loom Drop</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center text-stone-400 text-xs">
              Select a patron to view profile &amp; concierge actions.
            </div>
          )}
        </div>
      </div>

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
};
