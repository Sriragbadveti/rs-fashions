import React, { useState } from "react";
import { X, User, Check, Gift, Heart } from "lucide-react";
import type { CustomerProfile, ClientTier } from "../../../types/dashboard";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: CustomerProfile) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [tier, setTier] = useState<ClientTier>("Heritage Club");
  const [birthday, setBirthday] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [preferredWeave, setPreferredWeave] = useState("Ma Inti Bangaram");
  const [notes, setNotes] = useState("");
  const [gstin, setGstin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Name and Phone number are required.");
      return;
    }

    const newCustomer: CustomerProfile = {
      id: `cust-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim(),
      tier,
      totalSpent: 0,
      ordersCount: 0,
      birthday: birthday || undefined,
      anniversary: anniversary || undefined,
      preferredWeave: preferredWeave.trim() || undefined,
      notes: notes.trim() || undefined,
      gstin: gstin.trim() || undefined,
    };

    onSave(newCustomer);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200/70 bg-[#2A0E20] text-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-[#D4A373] flex items-center justify-center border border-amber-400/30">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-white">
                Register New Patron
              </h3>
              <p className="text-xs text-amber-200/70 font-light">
                Add client to VIP directory with birthday &amp; anniversary triggers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-200/70 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Patron Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Smt. Kavitha Reddy"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                WhatsApp Phone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9849012345"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patron@rsfashions.com"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="36AAAAA0000A1Z5"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                City / Address
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Jubilee Hills, Hyderabad"
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                VIP Patron Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as ClientTier)}
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] font-semibold text-stone-800"
              >
                <option value="Royal Patron">Royal Patron (₹1.5L+)</option>
                <option value="Heritage Club">Heritage Club (₹50k+)</option>
                <option value="Boutique Member">Boutique Member</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Gift size={13} className="text-amber-600" />
                <span>Birthday (YYYY-MM-DD)</span>
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Heart size={13} className="text-rose-600" />
                <span>Anniversary (YYYY-MM-DD)</span>
              </label>
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">
              Preferred Saree Weave / Style
            </label>
            <input
              type="text"
              value={preferredWeave}
              onChange={(e) => setPreferredWeave(e.target.value)}
              placeholder="e.g. Pure Gold Zari Gadwal or Vintage Checks"
              className="w-full h-10 px-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">
              Personalized Notes &amp; Preferences
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special color favorites, family wedding dates, custom requests..."
              className="w-full p-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] resize-none"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 h-11 rounded-xl bg-[#2A0E20] text-amber-100 hover:bg-[#3d162f] text-xs font-semibold flex items-center gap-2 shadow-md"
            >
              <Check size={16} className="text-[#D4A373]" />
              <span>Save Patron Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
