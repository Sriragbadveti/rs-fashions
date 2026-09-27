import React, { useState } from "react";
import { Phone, ShieldCheck, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { API_BASE } from "../../config/api";
import { setUserSession, getUserSession, USER_SESSION_EVENT } from "../../utils/userSession";

interface GooglePhoneModalProps {
  isOpen: boolean;
  user: {
    id?: string;
    name?: string;
    email: string;
    phone?: string;
    authProvider?: string;
  };
  onSuccess: (phone: string) => void;
  onCancel?: () => void;
}

export default function GooglePhoneModal({
  isOpen,
  user,
  onSuccess,
  onCancel,
}: GooglePhoneModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(raw);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneNumber.replace(/\D/g, "");

    if (clean.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(clean)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Sync with backend API
      const res = await fetch(`${API_BASE}/auth/update-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: clean,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save mobile number");
      }

      // 2. Update local user session
      const existingSession = getUserSession();
      setUserSession({
        id: user.id || existingSession?.id || `user-g-${Date.now().toString(36)}`,
        name: user.name || existingSession?.name || "Patron",
        email: user.email,
        phone: clean,
        role: existingSession?.role || "user",
        authProvider: "google",
      });

      // 3. Update local CRM cache if present
      try {
        const raw = localStorage.getItem("rs_admin_customers");
        if (raw) {
          const custs = JSON.parse(raw);
          if (Array.isArray(custs)) {
            const cleanEmail = user.email.toLowerCase().trim();
            const idx = custs.findIndex(
              (c: any) => c.email && c.email.toLowerCase() === cleanEmail
            );
            if (idx >= 0) {
              custs[idx].phone = clean;
              localStorage.setItem("rs_admin_customers", JSON.stringify(custs));
            }
          }
        }
      } catch {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(USER_SESSION_EVENT, { detail: null }));
      }

      onSuccess(clean);
    } catch (err: any) {
      console.error("Failed to update mobile number:", err);
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-300/40 bg-linear-to-b from-[#2A0E20] via-[#3B142D] to-[#200A18] p-6 sm:p-8 text-white shadow-2xl ring-1 ring-white/10">
        
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#8E3D51]/30 blur-3xl" />

        <div className="relative z-10 text-center">
          {/* Header Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/20">
            <Phone size={26} className="stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 border border-amber-400/20 mb-2">
            <Sparkles size={11} className="text-amber-300" />
            <span>Mobile Verification Required</span>
          </div>

          <h3 className="font-serif text-2xl font-light text-amber-50">
            Welcome, {user.name?.split(" ")[0] || "Patron"}
          </h3>

          <p className="mt-2 text-xs text-stone-300 font-light leading-relaxed">
            To activate your exclusive patron account and receive instant order dispatch &amp; WhatsApp tracking updates, please provide your mobile number.
          </p>

          {/* User Email Pill */}
          <div className="mt-3.5 inline-block rounded-xl bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs font-mono text-stone-300">
            {user.email}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-200/90 mb-1.5">
                Mobile Number *
              </label>

              <div className="flex h-12 items-center rounded-2xl border border-white/20 bg-white/10 px-3.5 backdrop-blur-md focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
                <span className="flex items-center gap-1 text-xs font-bold font-mono text-amber-300 pr-2.5 border-r border-white/15 select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter 10-digit number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  autoFocus
                  required
                  className="h-full w-full bg-transparent pl-3 text-sm font-semibold tracking-wider text-white placeholder:text-stone-400 outline-none"
                />
              </div>

              {error && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-300 flex items-center gap-1">
                  <span>⚠</span> {error}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-amber-400 via-amber-300 to-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-stone-950" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Proceed to RS Fashions</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-3 w-full text-center text-xs text-stone-400 hover:text-white transition-colors"
                >
                  Cancel &amp; Sign out
                </button>
              )}
            </div>
          </form>

          {/* Privacy Assurance */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[10.5px] text-stone-400 border-t border-white/10 pt-3.5">
            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            <span>Used strictly for delivery coordination and WhatsApp invoices. No spam.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
