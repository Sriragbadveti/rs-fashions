import { useMemo, useEffect, useState } from "react";
import {
  Bell,
  Cake,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  X,
  Trash2,
  CheckCheck,
} from "lucide-react";
import type { CompletedSale } from "../types/inventory";
import { sound } from "../types/soundEngine";

interface NotificationsProps {
  salesHistory: CompletedSale[];
  onNavigateTab: (tab: any) => void;
  onClose: () => void;
}

function getStoredCRMContactsWithMilestones() {
  try {
    const saved = localStorage.getItem("rs_fashions_crm_contacts");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  return [
    { name: "Smt. Kamala Reddy", phone: "9876543210", birthday: "2026-09-15", anniversary: "2026-09-18" },
    { name: "Dr. Ananya Rao", phone: "9123456789", birthday: "2026-09-12", anniversary: "2026-10-01" },
    { name: "Sri Rajeshwar Rao", phone: "9848098480", birthday: "2026-09-25", anniversary: "2026-09-11" },
  ];
}

export default function Notifications({ salesHistory, onNavigateTab, onClose }: NotificationsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_notifications_read");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("rs_admin_notifications_dismissed");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [clearingIds, setClearingIds] = useState<string[]>([]);

  useEffect(() => {
    sound.playNotification();
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleTriggerClose = () => {
    sound.playClick();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleTriggerClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      type: "order" | "birthday" | "anniversary";
      title: string;
      description: string;
      timestamp: string;
      actionTab: string;
      badgeText: string;
    }> = [];

    salesHistory.slice(0, 10).forEach((sale) => {
      list.push({
        id: `order-${sale.invoiceNumber}`,
        type: "order",
        title: `New Order Billed (${sale.invoiceNumber})`,
        description: `${sale.customerName} purchased ${sale.items.length} item(s) worth ₹${sale.total.toLocaleString("en-IN")} via ${sale.paymentMethod.toUpperCase()}`,
        timestamp: sale.date,
        actionTab: "sales-ledger",
        badgeText: "Order Completed",
      });
    });

    const contacts = getStoredCRMContactsWithMilestones();
    const today = new Date();

    contacts.forEach((c: any) => {
      if (c.birthday) {
        const bDay = new Date(c.birthday);
        const diffDays = Math.ceil((bDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          list.push({
            id: `bday-${c.phone}`,
            type: "birthday",
            title: `🎂 Upcoming Birthday: ${c.name}`,
            description: `${c.name}'s birthday is in ${diffDays === 0 ? "today!" : `${diffDays} day(s).`} Send a special SiCo Gadwal saree greeting.`,
            timestamp: "Milestone Alert",
            actionTab: "crm",
            badgeText: "Birthday",
          });
        }
      }

      if (c.anniversary) {
        const anniv = new Date(c.anniversary);
        const diffDays = Math.ceil((anniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          list.push({
            id: `anniv-${c.phone}`,
            type: "anniversary",
            title: `💍 Wedding Anniversary: ${c.name}`,
            description: `${c.name}'s anniversary is coming up in ${diffDays === 0 ? "today!" : `${diffDays} day(s).`} Propose a matching bridal collection.`,
            timestamp: "Milestone Alert",
            actionTab: "crm",
            badgeText: "Anniversary",
          });
        }
      }
    });

    return list;
  }, [salesHistory]);

  const activeNotifications = useMemo(() => {
    return allNotifications.filter(
      (item) => !dismissedIds.includes(item.id) && !readIds.includes(item.id)
    );
  }, [allNotifications, dismissedIds, readIds]);

  const handleMarkAsRead = (id: string) => {
    sound.playPaperCrease();
    setClearingIds((prev) => [...prev, id]);
    setTimeout(() => {
      setReadIds((prev) => {
        const next = prev.includes(id) ? prev : [...prev, id];
        try {
          localStorage.setItem("rs_admin_notifications_read", JSON.stringify(next));
        } catch {}
        return next;
      });
      setClearingIds((prev) => prev.filter((item) => item !== id));
      window.dispatchEvent(new Event("notificationsUpdated"));
    }, 320);
  };

  const handleDismiss = (id: string) => {
    sound.playPaperCrease();
    setClearingIds((prev) => [...prev, id]);
    setTimeout(() => {
      setDismissedIds((prev) => {
        const next = prev.includes(id) ? prev : [...prev, id];
        try {
          localStorage.setItem("rs_admin_notifications_dismissed", JSON.stringify(next));
        } catch {}
        return next;
      });
      setClearingIds((prev) => prev.filter((item) => item !== id));
      window.dispatchEvent(new Event("notificationsUpdated"));
    }, 320);
  };

  const handleClearAll = () => {
    sound.playPaperCrease();
    const ids = activeNotifications.map((item) => item.id);
    setClearingIds(ids);
    setTimeout(() => {
      setDismissedIds((prev) => {
        const next = Array.from(new Set([...prev, ...ids]));
        try {
          localStorage.setItem("rs_admin_notifications_dismissed", JSON.stringify(next));
        } catch {}
        return next;
      });
      setClearingIds([]);
      window.dispatchEvent(new Event("notificationsUpdated"));
    }, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex justify-end bg-stone-950/40 backdrop-blur-[3px] transition-opacity duration-300 select-none ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleTriggerClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md h-full glass-panel border-l border-white/60 bg-white/90 backdrop-blur-2xl shadow-2xl flex flex-col p-6 transition-transform duration-300 ease-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* PANEL HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A0E20] text-[#D4A373] shadow-sm">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Notifications &amp; Milestones</h2>
              <p className="text-[10px] text-stone-400">Activity Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                title="Clear All Notifications"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-[10px] font-semibold text-stone-600 transition-colors"
              >
                <Trash2 size={12} />
                <span>Clear All</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleTriggerClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* NOTIFICATION FEED */}
        <div
          className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1
            [scrollbar-width:thin] [scrollbar-color:rgba(168,162,158,0.55)_transparent]
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-stone-300/60
            [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {activeNotifications.length === 0 ? (
            <div className="rounded-3xl p-12 text-center space-y-2 mt-20 border border-stone-200/60 bg-white/50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Bell size={20} />
              </div>
              <h3 className="text-xs font-bold text-stone-800">No New Notifications</h3>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                Orders and customer birthday reminders will appear here automatically.
              </p>
            </div>
          ) : (
            activeNotifications.map((item) => {
              const isOrder = item.type === "order";
              const isBday = item.type === "birthday";
              const isClearing = clearingIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white/90 p-4 shadow-sm transition-all duration-400 transform ${
                    isClearing ? "opacity-0 scale-95 translate-x-full transition-all duration-300 ease-in" : "opacity-100 scale-100 translate-x-0 transition-all duration-200"
                  } hover:border-[#D4A373]/50 hover:shadow`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                        isOrder
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isBday
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {isOrder ? <ShoppingBag size={18} /> : isBday ? <Cake size={18} /> : <Sparkles size={18} />}
                    </div>

                    <div className="min-w-0 space-y-0.5 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-stone-900 truncate">{item.title}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shrink-0 ${
                            isOrder
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.badgeText}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-snug">{item.description}</p>
                      <p className="text-[9px] font-mono text-stone-400">{item.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <CheckCheck size={13} className="text-emerald-600" />
                        <span>Mark as Read</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDismiss(item.id)}
                        className="flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all"
                        title="Dismiss notification"
                      >
                        <X size={13} />
                        <span>Clear</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleDismiss(item.id);
                        onNavigateTab(item.actionTab);
                        handleTriggerClose();
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 hover:bg-[#2A0E20] hover:text-amber-100 px-3.5 py-1.5 text-[11px] font-semibold text-stone-700 transition-all"
                    >
                      <span>View Details</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}