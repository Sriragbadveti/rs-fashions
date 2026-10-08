import { useEffect, useMemo, useState } from "react";
import { Power, Plus, Trash2, Save, Megaphone, Calendar, Tag, RefreshCw } from "lucide-react";
import { API_BASE } from "../config/api";
import { adminFetch } from "../utils/adminSession";
import { useModal } from "../context/ModalContext";
import { useCart } from "../context/CartContext";
import { festivalMarqueeText, type FestivalOfferConfig, type FestivalTier } from "../utils/festivalOffer";
import { computeBundleOffer } from "../utils/specialOffer";

/**
 * Admin "Offers" tab: the festival offer (flat amount off by number of eligible sarees).
 * Saved to the `festival_offer` setting; the storefront picks it up within a minute (on the next
 * page load, tab focus, or its 60-second refresh) and the server re-checks every order against it.
 */

type Draft = Omit<FestivalOfferConfig, "active">;

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function statusOf(cfg: Draft | null): { label: string; tone: string } {
  if (!cfg?.enabled) return { label: "Off", tone: "bg-stone-100 text-stone-600 border-stone-200" };
  const now = Date.now();
  if (cfg.startsAt && now < new Date(cfg.startsAt).getTime()) return { label: "Scheduled", tone: "bg-amber-50 text-amber-800 border-amber-200" };
  if (cfg.endsAt && now > new Date(cfg.endsAt).getTime()) return { label: "Ended", tone: "bg-stone-100 text-stone-600 border-stone-200" };
  return { label: "Live on website", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" };
}

export default function OffersManager() {
  const { toast } = useModal();
  const { refreshFestivalOffer } = useCart();
  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState(2);

  const fetchConfig = async (): Promise<Draft> => {
    const res = await fetch(`${API_BASE}/billing/festival-offer`, { cache: "no-store" });
    const json = await res.json();
    const cfg = (json.data?.config || json.config) as FestivalOfferConfig;
    return {
      name: cfg.name,
      enabled: cfg.enabled,
      minPriceExclusive: cfg.minPriceExclusive,
      tiers: cfg.tiers,
      startsAt: cfg.startsAt,
      endsAt: cfg.endsAt,
    };
  };
  const apply = (cfg: Draft) => {
    setSaved(cfg);
    setDraft(cfg);
  };
  const load = async () => {
    try {
      apply(await fetchConfig());
    } catch {
      toast("Could not load offers", "Please check your connection and try again.", "error");
    }
  };

  useEffect(() => {
    fetchConfig()
      .then(apply)
      .catch(() => toast("Could not load offers", "Please check your connection and try again.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = async (next: Draft, successTitle: string, successMsg: string) => {
    setSaving(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/settings/festival_offer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || "Save failed");
      await load();
      await refreshFestivalOffer();
      toast(successTitle, successMsg, "success");
    } catch (err) {
      toast("Offer not saved", err instanceof Error ? err.message : "Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = () => {
    if (!saved) return;
    const enabled = !saved.enabled;
    // Toggling uses the SAVED rules (unsaved edits stay in the form until "Save changes").
    persist(
      { ...saved, enabled },
      enabled ? `${saved.name} is ON` : `${saved.name} is OFF`,
      enabled
        ? "Customers get the discount in their cart and at checkout right away, and it is announced in the header."
        : "The discount is no longer applied and the header announcement is removed."
    );
  };

  const save = () => {
    if (!draft) return;
    const tiers = draft.tiers.filter((t) => t.qty >= 1 && t.discount > 0);
    if (tiers.length === 0) return toast("Add at least one tier", "Each tier needs a quantity and a discount.", "warning");
    if (draft.startsAt && draft.endsAt && new Date(draft.endsAt) <= new Date(draft.startsAt)) {
      return toast("Check the dates", "The end date must be after the start date.", "warning");
    }
    persist({ ...draft, tiers }, "Offer saved", draft.enabled ? "The updated offer is live on the website." : "Saved. Switch it on when you're ready.");
  };

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  const status = statusOf(saved);
  const previewDiscount = useMemo(() => {
    if (!draft) return 0;
    let best = 0;
    for (const t of [...draft.tiers].sort((a, b) => a.qty - b.qty)) if (previewCount >= t.qty) best = t.discount;
    return best;
  }, [draft, previewCount]);

  const setTier = (i: number, field: keyof FestivalTier, value: number) => {
    if (!draft) return;
    const tiers = draft.tiers.map((t, idx) => (idx === i ? { ...t, [field]: Math.max(0, Math.floor(value) || 0) } : t));
    setDraft({ ...draft, tiers });
  };

  if (loading || !draft || !saved) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-stone-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading offers…
      </div>
    );
  }

  const marqueeLines = [
    ...(status.label === "Live on website" ? [festivalMarqueeText({ ...saved, active: true })] : []),
    computeBundleOffer(0, 0).message,
    "Complimentary shipping on orders of ₹1,999 & above",
  ];

  return (
    <div className="space-y-6 font-sans text-stone-800">
      {/* FESTIVAL OFFER */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[#8E3D51]" />
              <h3 className="font-serif text-xl font-bold text-stone-900">{saved.name}</h3>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status.tone}`}>{status.label}</span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-stone-500">
              Flat amount off the order by how many eligible sarees are bought (the highest tier reached applies). Eligible: sarees priced
              above {inr(saved.minPriceExclusive)} that are not in the Special Offer section. Customers see it in the cart and checkout, and the
              server checks every order.
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            disabled={saving}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-60 ${
              saved.enabled ? "bg-stone-800 hover:bg-black" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Power className="h-4 w-4" />
            {saving ? "Saving…" : saved.enabled ? "Switch OFF" : "Switch ON (go live)"}
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Rules */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-stone-600">
              Offer name (shown to customers)
              <input
                value={draft.name}
                maxLength={80}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-stone-600">
              Saree price must be above (₹)
              <input
                type="number"
                min={0}
                value={draft.minPriceExclusive}
                onChange={(e) => setDraft({ ...draft, minPriceExclusive: Math.max(0, Number(e.target.value) || 0) })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </label>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">Tiers</span>
                <button
                  type="button"
                  onClick={() => {
                    const last = draft.tiers[draft.tiers.length - 1];
                    setDraft({ ...draft, tiers: [...draft.tiers, { qty: (last?.qty || 0) + 1, discount: last?.discount || 100 }] });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-2 py-1 text-[11px] font-semibold hover:bg-stone-50"
                >
                  <Plus className="h-3 w-3" /> Add tier
                </button>
              </div>
              <div className="space-y-2">
                {draft.tiers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-10 text-xs text-stone-500">Buy</span>
                    <input type="number" min={1} value={t.qty} onChange={(e) => setTier(i, "qty", Number(e.target.value))} className="w-20 rounded-lg border border-stone-300 px-2 py-1.5" aria-label={`Tier ${i + 1} quantity`} />
                    <span className="text-xs text-stone-500">get ₹</span>
                    <input type="number" min={1} value={t.discount} onChange={(e) => setTier(i, "discount", Number(e.target.value))} className="w-24 rounded-lg border border-stone-300 px-2 py-1.5" aria-label={`Tier ${i + 1} discount`} />
                    <span className="text-xs text-stone-500">off</span>
                    <button type="button" onClick={() => setDraft({ ...draft, tiers: draft.tiers.filter((_, idx) => idx !== i) })} className="ml-auto rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove tier ${i + 1}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-stone-600">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Starts (optional)</span>
                <input type="datetime-local" value={toLocalInput(draft.startsAt)} onChange={(e) => setDraft({ ...draft, startsAt: fromLocalInput(e.target.value) })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
              </label>
              <label className="block text-xs font-semibold text-stone-600">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Ends (optional)</span>
                <input type="datetime-local" value={toLocalInput(draft.endsAt)} onChange={(e) => setDraft({ ...draft, endsAt: fromLocalInput(e.target.value) })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
              </label>
            </div>
            <p className="text-[11px] text-stone-500">Leave the dates empty to run the offer until you switch it off.</p>

            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-xl bg-[#8E3D51] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#783144] disabled:opacity-50">
                <Save className="h-4 w-4" /> Save changes
              </button>
              {dirty && (
                <button type="button" onClick={() => setDraft(saved)} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold hover:bg-stone-50">
                  Discard
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
              <p className="text-xs font-semibold text-stone-600">Quick check</p>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span>Customer buys</span>
                <input type="number" min={0} max={50} value={previewCount} onChange={(e) => setPreviewCount(Math.max(0, Number(e.target.value) || 0))} className="w-16 rounded-lg border border-stone-300 px-2 py-1" aria-label="Number of eligible sarees" />
                <span>eligible sarees →</span>
                <span className="font-bold text-emerald-700">{inr(previewDiscount)} off</span>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-[#2A2421] p-4 text-[#F7EBEC]">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-200"><Megaphone className="h-3.5 w-3.5" /> Header announcement (live)</p>
              <ul className="mt-2 space-y-1.5 text-[11px] uppercase tracking-wider text-stone-200">
                {marqueeLines.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] normal-case text-stone-400">The festival line appears automatically while the offer is live.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
