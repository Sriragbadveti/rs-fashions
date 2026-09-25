import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Search,
  Plus,
  Phone,
  MapPin,
  Gift,
  Heart,
  Sparkles,
  Share2,
  Send,
  X,
  Check,
  Filter,
  Users,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Clock,
} from "lucide-react";
import type { CustomerProfile } from "../types/inventory";
import { MOCK_CUSTOMERS } from "../types/inventory";
import { getSavedCrmCustomers } from "../types/useBilling";
import { API_BASE } from "../config/api";
import { useShowroomSettings } from "../types/settings";

interface CRMProps {
  customers?: CustomerProfile[];
  onAddCustomer?: (newCustomer: CustomerProfile) => void;
}

type MessageTemplateType =
  | "birthday"
  | "anniversary"
  | "festive_offer"
  | "reactivation"
  | "custom";

const MESSAGE_TEMPLATES: {
  id: MessageTemplateType;
  label: string;
  shortLabel: string;
  icon: typeof Gift;
}[] = [
  {
    id: "birthday",
    label: "Birthday Wishes",
    shortLabel: "Birthday",
    icon: Gift,
  },
  {
    id: "anniversary",
    label: "Anniversary Honor",
    shortLabel: "Anniversary",
    icon: Heart,
  },
  {
    id: "festive_offer",
    label: "VIP Loom Drop",
    shortLabel: "Loom Drop",
    icon: Sparkles,
  },
  {
    id: "reactivation",
    label: "30-Day Welcome Back",
    shortLabel: "Welcome Back (>30d)",
    icon: Sparkles,
  },
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDisplayDate(value: string) {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getMonthFromDateString(value?: string) {
  if (!value) return -1;

  const parts = value.split("-");

  if (parts.length !== 3) return -1;

  const month = Number(parts[1]);

  return Number.isNaN(month) ? -1 : month - 1;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* -------------------------------------------------------------------------- */
/* CUSTOM CALENDAR                                                            */
/* -------------------------------------------------------------------------- */

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
}

function DatePicker({
  value,
  onChange,
  label,
  id,
}: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = useMemo(() => {
    if (!value) return new Date();

    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) return new Date();

    return new Date(year, month - 1, day);
  }, [value]);

  const [isOpen, setIsOpen] = useState(false);

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  /* ---------------------------------------------------------------------- */
  /* YEAR RANGE                                                             */
  /* ---------------------------------------------------------------------- */

  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(() => {
    const years: number[] = [];

    for (let year = currentYear - 100; year <= currentYear + 10; year++) {
      years.push(year);
    }

    return years;
  }, [currentYear]);

  /* ---------------------------------------------------------------------- */
  /* SYNC VISIBLE MONTH                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!value) return;

    const [year, month, day] = value.split("-").map(Number);

    if (year && month && day) {
      setVisibleMonth(new Date(year, month - 1, 1));
    }
  }, [value]);

  /* ---------------------------------------------------------------------- */
  /* OUTSIDE CLICK                                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* CALENDAR DATA                                                          */
  /* ---------------------------------------------------------------------- */

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  const calendarDays: {
    day: number;
    currentMonth: boolean;
    date: Date;
  }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPreviousMonth - i,
      currentMonth: false,
      date: new Date(year, month - 1, daysInPreviousMonth - i),
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      currentMonth: true,
      date: new Date(year, month, day),
    });
  }

  const remaining = 42 - calendarDays.length;

  for (let day = 1; day <= remaining; day++) {
    calendarDays.push({
      day,
      currentMonth: false,
      date: new Date(year, month + 1, day),
    });
  }

  const todayValue = toDateInputValue(new Date());

  /* ---------------------------------------------------------------------- */
  /* DATE ACTIONS                                                           */
  /* ---------------------------------------------------------------------- */

  const selectDate = (date: Date) => {
    onChange(toDateInputValue(date));
    setIsOpen(false);
  };

  const goPreviousMonth = () => {
    setVisibleMonth(new Date(year, month - 1, 1));
  };

  const goNextMonth = () => {
    setVisibleMonth(new Date(year, month + 1, 1));
  };

  const handleMonthChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedMonth = Number(event.target.value);

    setVisibleMonth(new Date(year, selectedMonth, 1));
  };

  const handleYearChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedYear = Number(event.target.value);

    setVisibleMonth(new Date(selectedYear, month, 1));
  };

  const goToday = () => {
    const today = new Date();

    setVisibleMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    onChange(toDateInputValue(today));
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <label
        htmlFor={id}
        className="block font-semibold text-stone-700 mb-1.5"
      >
        {label}
      </label>

      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[42px] px-3 rounded-xl border bg-stone-50 flex items-center justify-between gap-3 text-left transition-all duration-200 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 ${
          isOpen
            ? "border-brand-gold bg-white shadow-sm"
            : "border-stone-200 hover:border-stone-300 hover:bg-white"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarDays
            size={15}
            className={`shrink-0 ${
              value
                ? "text-brand-gold"
                : "text-stone-400"
            }`}
          />

          <span
            className={`text-xs truncate ${
              value
                ? "text-stone-800 font-medium"
                : "text-stone-400"
            }`}
          >
            {value
              ? formatDisplayDate(value)
              : "Select date"}
          </span>
        </div>

        <ChevronRight
          size={14}
          className={`text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-[320px] top-full mt-2 z-[80] bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden animate-[crmCalendarIn_0.18s_ease-out]">
          {/* Calendar header */}
          <div className="px-4 py-3 bg-[#2A0E20] text-amber-100">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={goPreviousMonth}
                className="p-1.5 rounded-lg text-amber-100/70 hover:text-amber-100 hover:bg-white/10 transition-all duration-200 active:scale-90 shrink-0"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Month + Year selectors */}
              <div className="flex items-center justify-center gap-1.5 min-w-0">
                <select
                  value={month}
                  onChange={handleMonthChange}
                  aria-label="Select month"
                  className="appearance-none bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-semibold text-amber-100 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                >
                  {MONTHS.map((monthName, index) => (
                    <option
                      key={monthName}
                      value={index}
                      className="bg-white text-stone-900"
                    >
                      {monthName}
                    </option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={handleYearChange}
                  aria-label="Select year"
                  className="appearance-none bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-semibold text-amber-100 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                >
                  {yearOptions.map((yearOption) => (
                    <option
                      key={yearOption}
                      value={yearOption}
                      className="bg-white text-stone-900"
                    >
                      {yearOption}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={goNextMonth}
                className="p-1.5 rounded-lg text-amber-100/70 hover:text-amber-100 hover:bg-white/10 transition-all duration-200 active:scale-90 shrink-0"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="p-3">
            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-[9px] uppercase tracking-wider font-bold text-stone-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((item, index) => {
                const dateValue = toDateInputValue(item.date);
                const selected = dateValue === value;
                const today = dateValue === todayValue;

                return (
                  <button
                    key={`${dateValue}-${index}`}
                    type="button"
                    onClick={() => selectDate(item.date)}
                    className={`relative h-9 w-9 mx-auto rounded-lg text-[11px] font-medium transition-all duration-150 ${
                      selected
                        ? "bg-[#2A0E20] text-amber-100 shadow-sm scale-105"
                        : item.currentMonth
                        ? "text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                        : "text-stone-300 hover:bg-stone-50"
                    }`}
                  >
                    {item.day}

                    {today && !selected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-gold" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="text-[10px] font-semibold text-stone-400 hover:text-stone-700 transition-colors"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={goToday}
                className="text-[10px] font-semibold text-brand-plum hover:text-stone-950 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CRM                                                                        */
/* -------------------------------------------------------------------------- */

export default function CRM({
  customers: initialData = [],
  onAddCustomer,
}: CRMProps) {
  const [customers, setCustomers] =
    useState<CustomerProfile[]>(() => {
      if (initialData && Array.isArray(initialData)) return initialData;
      return getSavedCrmCustomers();
    });

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setCustomers(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveCustomers() {
      try {
        const res = await fetch(`${API_BASE}/crm/customers`);
        if (!res.ok) return;
        const json = await res.json();
        const serverCustomers = json?.data?.customers || json?.customers;
        if (isMounted && Array.isArray(serverCustomers)) {
          setCustomers(serverCustomers);
          try {
            localStorage.setItem("rs_admin_customers", JSON.stringify(serverCustomers));
          } catch {}
        }
      } catch (err) {
        console.warn("Could not load live CRM customers:", err);
      }
    }
    loadLiveCustomers();
    return () => {
      isMounted = false;
    };
  }, []);

  const showroom = useShowroomSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] =
    useState(false);

  const [selectedClientForMessage, setSelectedClientForMessage] =
    useState<CustomerProfile | null>(null);

  const [isMessageModalVisible, setIsMessageModalVisible] =
    useState(false);

  const [isCustomerModalVisible, setIsCustomerModalVisible] =
    useState(false);

  const [templateType, setTemplateType] =
    useState<MessageTemplateType>("birthday");

  const [customDiscountCode, setCustomDiscountCode] =
    useState("ROYAL15");

  const [customOfferText, setCustomOfferText] = useState(
    "exclusive 15% VIP privilege gift"
  );

  const [generatedMessage, setGeneratedMessage] =
    useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Hyderabad",
    address: "",
    birthday: "",
    anniversary: "",
    preferredWeave: "",
    notes: "",
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef =
    useRef<HTMLInputElement>(null);

  /* ---------------------------------------------------------------------- */
  /* FORMATTER                                                              */
  /* ---------------------------------------------------------------------- */

  const currency = useCallback((val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* MILESTONES                                                             */
  /* ---------------------------------------------------------------------- */

  const milestoneAlerts = useMemo(() => {
    const currentMonth = new Date().getMonth();

    return customers.filter((customer) => {
      const birthdayMonth = getMonthFromDateString(
        customer.birthday
      );

      const anniversaryMonth = getMonthFromDateString(
        customer.anniversary
      );

      return (
        birthdayMonth === currentMonth ||
        anniversaryMonth === currentMonth
      );
    });
  }, [customers]);

  /* ---------------------------------------------------------------------- */
  /* PATRON LIFECYCLE & ACTIVITY STATUS (Active vs Inactive > 30 Days)       */
  /* ---------------------------------------------------------------------- */

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const getCustomerActivityInfo = useCallback((customer: CustomerProfile) => {
    const lastDate = customer.lastActiveAt || customer.joinedAt;
    const now = Date.now();
    const daysSince = lastDate ? Math.floor((now - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isInactive = customer.status === "inactive" || daysSince >= 30;
    return {
      status: isInactive ? ("inactive" as const) : ("active" as const),
      daysSince: Math.max(0, daysSince),
    };
  }, []);

  const activeCount = useMemo(() => {
    return customers.filter((c) => getCustomerActivityInfo(c).status === "active").length;
  }, [customers, getCustomerActivityInfo]);

  const inactiveCount = useMemo(() => {
    return customers.filter((c) => getCustomerActivityInfo(c).status === "inactive").length;
  }, [customers, getCustomerActivityInfo]);

  /* ---------------------------------------------------------------------- */
  /* FILTERED CUSTOMERS                                                     */
  /* ---------------------------------------------------------------------- */

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return customers.filter((customer) => {
      const activity = getCustomerActivityInfo(customer);
      if (statusFilter === "active" && activity.status !== "active") return false;
      if (statusFilter === "inactive" && activity.status !== "inactive") return false;

      if (!q) return true;
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.phone.includes(q) ||
        Boolean(customer.email?.toLowerCase().includes(q)) ||
        Boolean(customer.city?.toLowerCase().includes(q)) ||
        Boolean(customer.address?.toLowerCase().includes(q)) ||
        Boolean(customer.preferredWeave?.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery, statusFilter, getCustomerActivityInfo]);

  /* ---------------------------------------------------------------------- */
  /* PAGINATION (LOAD MORE)                                                 */
  /* ---------------------------------------------------------------------- */

  const PAGE_SIZE = 9;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination window when search query or filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, statusFilter]);

  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, visibleCount);
  }, [filteredCustomers, visibleCount]);

  /* ---------------------------------------------------------------------- */
  /* MESSAGE GENERATOR                                                      */
  /* ---------------------------------------------------------------------- */

  const buildMessage = useCallback(
    (
      client: CustomerProfile,
      type: MessageTemplateType,
      discountCode: string,
      offerText: string
    ) => {
      const storeName = showroom.storeName || "RS Fashions";
      const showroomLocation = showroom.storeAddress || "Road No. 36, Jubilee Hills, Hyderabad";

      if (type === "birthday") {
        return (
          `✨ *Namaste ${client.name} Ji!* ✨\n\n` +
          `Wishing you a very Happy Birthday from all of us at *${storeName}*! 💐\n\n` +
          `May your year ahead be blessed with good health, grace, and timeless happiness.\n\n` +
          `As a token of our appreciation for being our valued patron, we are delighted to offer you an *${offerText}* (Use code: *${discountCode}*) valid on our curated SiCo Gadwal & Heritage Handloom collections.\n\n` +
          `We look forward to welcoming you at our showroom.\n\n` +
          `Warm regards,\n*${storeName}*`
        );
      }

      if (type === "anniversary") {
        return (
          `✨ *Warmest Wedding Anniversary Greetings to ${client.name} Ji & Family!* 💍\n\n` +
          `May your bond of love and togetherness grow more radiant with every passing year, woven with grace just like our finest heritage silks.\n\n` +
          `To celebrate your milestone, enjoy an *${offerText}* on our Bridal & Gadwal collections using privilege code: *${discountCode}*.\n\n` +
          `Showroom: *${showroomLocation}*\n\n` +
          `With sincere wishes,\n*${storeName}*`
        );
      }

      if (type === "reactivation") {
        return (
          `✨ *Namaste ${client.name} Ji! We Miss You at ${storeName}* ✨\n\n` +
          `It has been a little while since your last visit to our boutique. We have recently arrived with a breathtaking new festive collection of authentic SiCo Gadwal handloom drapes woven by master artisans.\n\n` +
          `As our esteemed patron, we would love to welcome you back with an exclusive welcome-back privilege: *${offerText}* (Code: *${discountCode}*).\n\n` +
          `Explore our latest online gallery: https://rsfashions.in/shop\n` +
          `Or visit our flagship showroom: *${showroomLocation}*\n\n` +
          `With sincere regards,\n*${storeName} Team*`
        );
      }

      return (
        `✨ *Exclusive Handloom Showcase for ${client.name} Ji* ✨\n\n` +
        `We have just unveiled our fresh weaver consignments directly from the artisan looms of Gadwal.\n\n` +
        `As our valued patron, we cordially invite you for a private viewing of our newest *${
          client.preferredWeave ||
          "Pure Gadwal Silk & Zari"
        }* designs.\n\n` +
        `Enjoy an exclusive privilege offer (*${discountCode}*) on your next drape selection.\n\n` +
        `📍 *${storeName} — ${showroomLocation}*\n` +
        `Reserve a private preview: Reply to this message.`
      );
    },
    [showroom]
  );

  /* ---------------------------------------------------------------------- */
  /* MODAL HELPERS                                                          */
  /* ---------------------------------------------------------------------- */

  const closeMessageComposer = useCallback(() => {
    setIsMessageModalVisible(false);

    window.setTimeout(() => {
      setSelectedClientForMessage(null);
    }, 180);
  }, []);

  const closeCustomerModal = useCallback(() => {
    setIsCustomerModalVisible(false);

    window.setTimeout(() => {
      setIsNewCustomerModalOpen(false);
    }, 180);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* OPEN MESSAGE COMPOSER                                                  */
  /* ---------------------------------------------------------------------- */

  const openWhatsAppComposer = useCallback(
    (
      client: CustomerProfile,
      type: MessageTemplateType = "birthday"
    ) => {
      let resolvedType = type;
      if (resolvedType === "birthday" && (!client.birthday || !client.birthday.trim())) {
        resolvedType = "festive_offer";
      } else if (resolvedType === "anniversary" && (!client.anniversary || !client.anniversary.trim())) {
        resolvedType = "festive_offer";
      }
      setSelectedClientForMessage(client);
      setTemplateType(resolvedType);

      setGeneratedMessage(
        buildMessage(
          client,
          type,
          customDiscountCode,
          customOfferText
        )
      );

      setIsMessageModalVisible(false);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsMessageModalVisible(true);
        });
      });
    },
    [
      buildMessage,
      customDiscountCode,
      customOfferText,
    ]
  );

  /* ---------------------------------------------------------------------- */
  /* OPEN CUSTOMER MODAL                                                    */
  /* ---------------------------------------------------------------------- */

  const openNewCustomerModal = useCallback(() => {
    setIsNewCustomerModalOpen(true);
    setIsCustomerModalVisible(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsCustomerModalVisible(true);
      });
    });
  }, []);

  /* ---------------------------------------------------------------------- */
  /* SEND WHATSAPP                                                          */
  /* ---------------------------------------------------------------------- */

  const handleSendWhatsApp = useCallback(() => {
    if (!selectedClientForMessage) return;

    const cleanPhone =
      selectedClientForMessage.phone.replace(
        /\D/g,
        ""
      );

    if (!cleanPhone) {
      alert(
        "This client does not have a valid phone number."
      );
      return;
    }

    const formattedPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : `91${cleanPhone}`;

    window.open(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
        generatedMessage
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [
    generatedMessage,
    selectedClientForMessage,
  ]);

  /* ---------------------------------------------------------------------- */
  /* CREATE CUSTOMER                                                        */
  /* ---------------------------------------------------------------------- */

  const handleCreateCustomer = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.phone.trim()
    ) {
      alert(
        "Name and phone number are required."
      );
      return;
    }

    const resolvedAddress = formData.address.trim()
      ? formData.address.trim()
      : formData.city.trim()
      ? `${formData.city.trim()}, Telangana`
      : "Hyderabad, Telangana";

    const newCustomer: CustomerProfile = {
      id: `cust-${Date.now().toString().slice(-6)}`,
      ...formData,
      address: resolvedAddress,
      totalSpent: 0,
      ordersCount: 0,
      joinedAt: new Date().toISOString(),
    };

    setCustomers((prev) => {
      const updated = [newCustomer, ...prev.filter((c) => c.id !== newCustomer.id && c.phone !== newCustomer.phone)];
      try {
        localStorage.setItem("rs_admin_customers", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (onAddCustomer) {
      onAddCustomer(newCustomer);
    } else {
      fetch(`${API_BASE}/crm/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      }).catch((err) => console.warn("Sync customer error:", err));
    }

    closeCustomerModal();

    setFormData({
      name: "",
      phone: "",
      email: "",
      city: "Hyderabad",
      address: "",
      birthday: "",
      anniversary: "",
      preferredWeave: "",
      notes: "",
    });
  };

  /* ---------------------------------------------------------------------- */
  /* KEYBOARD SHORTCUTS                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const handleKeyboard = (
      event: KeyboardEvent
    ) => {
      const isModifier =
        event.ctrlKey || event.metaKey;

      const target =
        event.target as HTMLElement | null;

      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        if (selectedClientForMessage) {
          event.preventDefault();
          closeMessageComposer();
          return;
        }

        if (isNewCustomerModalOpen) {
          event.preventDefault();
          closeCustomerModal();
          return;
        }
      }

      if (
        isModifier &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        searchInputRef.current?.focus();
        searchInputRef.current?.select();

        return;
      }

      if (
        isModifier &&
        event.key.toLowerCase() === "n"
      ) {
        event.preventDefault();

        if (!isNewCustomerModalOpen) {
          openNewCustomerModal();
        }

        return;
      }

      if (
        isModifier &&
        event.shiftKey &&
        event.key.toLowerCase() === "w"
      ) {
        if (selectedClientForMessage) {
          event.preventDefault();

          document
            .getElementById(
              "crm-generated-message"
            )
            ?.focus();
        }

        return;
      }

      if (
        isModifier &&
        event.key === "Enter" &&
        selectedClientForMessage
      ) {
        event.preventDefault();
        handleSendWhatsApp();
        return;
      }

      if (
        event.altKey &&
        selectedClientForMessage &&
        !isTyping
      ) {
        if (event.key === "1") {
          event.preventDefault();
          setTemplateType("birthday");
        }

        if (event.key === "2") {
          event.preventDefault();
          setTemplateType("anniversary");
        }

        if (event.key === "3") {
          event.preventDefault();
          setTemplateType("festive_offer");
        }
      }

      if (
        event.key === "/" &&
        !isTyping &&
        !isModifier &&
        !event.altKey
      ) {
        event.preventDefault();

        searchInputRef.current?.focus();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    closeCustomerModal,
    closeMessageComposer,
    handleSendWhatsApp,
    isNewCustomerModalOpen,
    openNewCustomerModal,
    selectedClientForMessage,
  ]);

  /* ---------------------------------------------------------------------- */
  /* BODY SCROLL LOCK                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const hasModal =
      isNewCustomerModalOpen ||
      Boolean(selectedClientForMessage);

    if (!hasModal) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    isNewCustomerModalOpen,
    selectedClientForMessage,
  ]);

  /* ---------------------------------------------------------------------- */
  /* FORM FOCUS                                                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isCustomerModalVisible) return;

    const timeout = window.setTimeout(() => {
      customerNameInputRef.current?.focus();
    }, 220);

    return () =>
      window.clearTimeout(timeout);
  }, [isCustomerModalVisible]);

  /* ---------------------------------------------------------------------- */
  /* LIVE MESSAGE UPDATE                                                    */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!selectedClientForMessage) return;

    setGeneratedMessage(
      buildMessage(
        selectedClientForMessage,
        templateType,
        customDiscountCode,
        customOfferText
      )
    );
  }, [
    buildMessage,
    customDiscountCode,
    customOfferText,
    selectedClientForMessage,
    templateType,
  ]);

  /* ---------------------------------------------------------------------- */
  /* FORM FIELD HELPER                                                      */
  /* ---------------------------------------------------------------------- */

  const updateFormField = <
    K extends keyof typeof formData
  >(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="crm-page max-w-7xl mx-auto font-sans text-stone-800 pb-12 space-y-6">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-5 animate-[crmFadeUp_0.5s_ease-out]">
        <div className="min-w-0">

          <h1 className="text-3xl lg:text-4xl font-display font-medium text-stone-950 tracking-tight leading-tight">
            Client Directory &amp; WhatsApp Concierge
          </h1>

          <p className="text-xs text-stone-500 mt-1.5 max-w-2xl">
            Send birthday greetings, anniversary
            privileges, and festive loom drops with
            one click.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewCustomerModal}
          title="Add new client — Ctrl + N"
          className="group shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-[11px] font-semibold shadow-premium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <Plus
            size={14}
            className="text-brand-gold transition-transform duration-200 group-hover:rotate-90"
          />

          <span>Add New Client</span>

          <span className="hidden xl:inline rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-white/60">
            Ctrl + N
          </span>
        </button>
      </section>

      {/* MILESTONE TICKER */}
      {milestoneAlerts.length > 0 && (
        <section className="glass-panel p-4 rounded-3xl bg-amber-50/50 border border-amber-200/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm animate-[crmFadeUp_0.55s_ease-out]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-900 shrink-0 transition-transform duration-300 hover:scale-105 hover:rotate-2">
              <Gift
                size={18}
                className="text-brand-gold"
              />
            </div>

            <div className="min-w-0">
              <h4 className="text-xs font-bold text-stone-900">
                Celebrations This Month
              </h4>

              <p className="text-[11px] text-stone-600 mt-0.5">
                Delight your clients with personalized
                warm wishes and exclusive privileges.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* DIRECTORY CONTROLS */}
      <section className="glass-panel p-3 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 animate-[crmFadeUp_0.6s_ease-out]">
        <div className="relative w-full lg:w-[360px] group">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 transition-colors duration-200 group-focus-within:text-brand-gold pointer-events-none"
          />

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search client by name, phone, weave..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            className="w-full bg-white/90 border border-stone-200 rounded-xl pl-9 pr-12 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex px-1.5 py-0.5 rounded-md border border-stone-200 bg-stone-50 text-[9px] text-stone-400 font-mono pointer-events-none">
              /
            </kbd>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-[#2A0E20] text-amber-100 shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80"
            }`}
          >
            All Patrons ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "active"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200/80"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Active ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === "inactive"
                ? "bg-amber-700 text-white shadow-sm"
                : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200/80"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Inactive &gt;30d ({inactiveCount})</span>
          </button>
        </div>
      </section>

      {/* RESULT SUMMARY */}
      <div className="flex items-center justify-between px-1 animate-[crmFadeIn_0.4s_ease-out]">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Users
            size={14}
            className="text-brand-gold"
          />

          <span>
            Showing{" "}
            <strong className="text-stone-800">
              {displayedCustomers.length}
            </strong>{" "}
            of{" "}
            <strong className="text-stone-800">
              {filteredCustomers.length}
            </strong>{" "}
            clients
          </span>
        </div>

        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-[11px] font-semibold text-brand-plum hover:text-stone-950 transition-colors"
          >
            Clear search
          </button>
        ) : null}
      </div>

      {/* CLIENT CARDS */}
      {displayedCustomers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayedCustomers.map(
            (client, index) => {
              return (
                <article
                  key={client.id}
                  style={{
                    animationDelay: `${Math.min(
                      index * 45,
                      450
                    )}ms`,
                  }}
                  className="glass-panel p-5 rounded-3xl flex flex-col justify-between min-h-[290px] group hover:border-brand-gold/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-[crmCardIn_0.5s_ease-out_both]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-base text-stone-950 mt-0.5 truncate group-hover:text-brand-plum transition-colors duration-200">
                          {client.name}
                        </h3>

                        <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin
                            size={11}
                            className="shrink-0"
                          />

                          <span className="truncate">
                            {client.city}
                          </span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-display text-sm font-bold text-stone-900">
                          {currency(
                            client.totalSpent
                          )}
                        </p>

                        <p className="text-[10px] text-stone-400 font-mono whitespace-nowrap">
                          {client.ordersCount}{" "}
                          drapes
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-3">
                      {/* Email Address with direct mailto link */}
                      {client.email && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail
                            size={12}
                            className="text-stone-400 shrink-0"
                          />
                          <a
                            href={`mailto:${client.email}`}
                            title={`Send email to ${client.name}`}
                            className="text-[11px] text-stone-600 hover:text-brand-plum truncate underline decoration-stone-200 transition-colors"
                          >
                            {client.email}
                          </a>
                        </div>
                      )}

                      {/* Phone Number */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone
                          size={12}
                          className="text-stone-400 shrink-0"
                        />

                        <span className="font-mono text-[11px] truncate">
                          {client.phone}
                        </span>
                      </div>

                      {/* Auth Provider, Activity Status & Joined Date Badges */}
                      <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                        {/* 30-Day Active / Inactive CRM Status Pill */}
                        {(() => {
                          const act = getCustomerActivityInfo(client);
                          return act.status === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active Patron</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300/80 text-[10px] font-semibold text-amber-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>Inactive ({act.daysSince}d)</span>
                            </span>
                          );
                        })()}

                        {client.authProvider === "google" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] font-medium text-blue-700">
                            <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            <span>Google Account</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[10px] font-medium text-stone-600">
                            <span>Web Account</span>
                          </span>
                        )}

                        {client.joinedAt && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-stone-400">
                            <Clock size={10} />
                            <span>
                              Joined {new Date(client.joinedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Notes / Registration Summary */}
                      {client.notes && (
                        <p className="text-[10.5px] italic text-stone-500 bg-stone-50/80 rounded-xl p-2 border border-stone-100 mt-1">
                          "{client.notes}"
                        </p>
                      )}

                      {client.address && (
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin
                            size={12}
                            className="text-stone-400 shrink-0"
                          />

                          <span className="text-[11px] text-stone-500 truncate">
                            {client.address}
                          </span>
                        </div>
                      )}

                      {client.birthday && (
                        <div className="flex items-center gap-2">
                          <Gift
                            size={12}
                            className="text-rose-500 shrink-0"
                          />

                          <span className="text-[11px]">
                            Birthday:{" "}
                            {formatDisplayDate(
                              client.birthday
                            )}
                          </span>
                        </div>
                      )}

                      {client.anniversary && (
                        <div className="flex items-center gap-2">
                          <Heart
                            size={12}
                            className="text-amber-600 shrink-0"
                          />

                          <span className="text-[11px]">
                            Anniversary:{" "}
                            {formatDisplayDate(
                              client.anniversary
                            )}
                          </span>
                        </div>
                      )}

                      {client.preferredWeave && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Sparkles
                            size={12}
                            className="text-brand-gold shrink-0"
                          />

                          <span className="text-[11px] text-stone-500 truncate">
                            Prefers:{" "}
                            {client.preferredWeave}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100 flex items-center gap-2">
                    {(() => {
                      const hasBirthday = Boolean(client.birthday && String(client.birthday).trim() !== "");
                      const hasAnniversary = Boolean(client.anniversary && String(client.anniversary).trim() !== "");

                      return (
                        <>
                          <button
                            type="button"
                            disabled={!hasBirthday}
                            onClick={() =>
                              hasBirthday &&
                              openWhatsAppComposer(
                                client,
                                "birthday"
                              )
                            }
                            title={hasBirthday ? "Birthday Wish" : "No birthday submitted by patron (Action Disabled)"}
                            className={`group/action flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 focus:outline-none ${
                              hasBirthday
                                ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200/80 text-emerald-800 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.97] cursor-pointer"
                                : "bg-stone-100/90 border-stone-200/60 text-stone-400 opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <Gift
                              size={13}
                              className={
                                hasBirthday
                                  ? "text-emerald-700 transition-transform duration-200 group-hover/action:-translate-y-0.5"
                                  : "text-stone-400"
                              }
                            />

                            <span>
                              Birthday
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={!hasAnniversary}
                            onClick={() =>
                              hasAnniversary &&
                              openWhatsAppComposer(
                                client,
                                "anniversary"
                              )
                            }
                            title={hasAnniversary ? "Anniversary Message" : "No anniversary submitted by patron (Action Disabled)"}
                            className={`group/action flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 focus:outline-none ${
                              hasAnniversary
                                ? "bg-amber-50 hover:bg-amber-100 border-amber-200/80 text-amber-900 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.97] cursor-pointer"
                                : "bg-stone-100/90 border-stone-200/60 text-stone-400 opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <Heart
                              size={13}
                              className={
                                hasAnniversary
                                  ? "text-amber-800 transition-transform duration-200 group-hover/action:scale-110"
                                  : "text-stone-400"
                              }
                            />

                            <span>
                              Anniversary
                            </span>
                          </button>
                        </>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() =>
                        openWhatsAppComposer(
                          client,
                          "festive_offer"
                        )
                      }
                      title="Send New Weave Drop Invite"
                      className="group/action p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.94] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                    >
                      <Sparkles
                        size={14}
                        className="text-brand-gold transition-transform duration-300 group-hover/action:rotate-12"
                      />
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>

        {/* LOAD MORE BUTTON */}
        {visibleCount < filteredCustomers.length && (
          <div className="mt-8 flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white border border-stone-200/90 hover:border-brand-gold text-stone-800 hover:text-brand-plum font-semibold text-xs shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] group"
            >
              <Users className="h-4 w-4 text-brand-gold group-hover:scale-110 transition-transform" />
              <span>
                Load More Clients ({filteredCustomers.length - visibleCount} remaining)
              </span>
              <ChevronDown className="h-4 w-4 text-stone-400 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <p className="text-[11px] text-stone-400">
              Showing {displayedCustomers.length} of {filteredCustomers.length} total patron profiles
            </p>
          </div>
        )}
      </>
      ) : (
        <div className="glass-panel rounded-3xl py-16 px-6 text-center animate-[crmFadeIn_0.35s_ease-out]">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
            <Search size={20} />
          </div>

          <h3 className="font-display font-semibold text-stone-900">
            No clients found
          </h3>

          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try changing your search query.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#2A0E20] text-amber-100 text-xs font-semibold hover:bg-[#3D142E] transition-all duration-200 active:scale-[0.98]"
          >
            Reset Directory
          </button>
        </div>
      )}

      {/* WHATSAPP MODAL */}
      {selectedClientForMessage && (
        <div
          className={`fixed inset-0 z-[9999] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200 w-screen h-screen overflow-hidden ${
            isMessageModalVisible
              ? "opacity-100"
              : "opacity-0"
          }`}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0 }}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeMessageComposer();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="whatsapp-composer-title"
        >
          <div
            className={`bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[100vh] overflow-hidden transition-all duration-200 z-[10000] ${
              isMessageModalVisible
                ? "translate-y-0 scale-100"
                : "translate-y-3 scale-[0.98]"
            }`}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="px-6 md:px-7 py-4 border-b border-stone-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Share2 size={16} />
                </div>

                <div className="min-w-0">
                  <h3
                    id="whatsapp-composer-title"
                    className="font-display font-semibold text-stone-950 text-base truncate"
                  >
                    WhatsApp Message Concierge
                  </h3>

                  <p className="text-[11px] text-stone-500 truncate">
                    Sending to{" "}
                    <strong className="text-stone-700">
                      {
                        selectedClientForMessage.name
                      }
                    </strong>{" "}
                    ·{" "}
                    {
                      selectedClientForMessage.phone
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMessageComposer}
                title="Close — Esc"
                className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-all duration-200 hover:rotate-90 active:scale-90 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 md:px-7 py-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Message Type
                  </label>

                  <span className="text-[9px] text-stone-400">
                    Alt + 1 / 2 / 3
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {MESSAGE_TEMPLATES.map(
                    (template) => {
                      const Icon = template.icon;
                      const active =
                        templateType ===
                        template.id;
                      const isBirthday = template.id === "birthday";
                      const isAnniv = template.id === "anniversary";
                      const hasBday = Boolean(selectedClientForMessage?.birthday && String(selectedClientForMessage.birthday).trim() !== "");
                      const hasAnniv = Boolean(selectedClientForMessage?.anniversary && String(selectedClientForMessage.anniversary).trim() !== "");
                      const isTemplateDisabled = (isBirthday && !hasBday) || (isAnniv && !hasAnniv);

                      return (
                        <button
                          key={template.id}
                          type="button"
                          disabled={isTemplateDisabled}
                          title={
                            isTemplateDisabled
                              ? `No ${isBirthday ? "birthday" : "anniversary"} submitted by patron`
                              : undefined
                          }
                          onClick={() =>
                            !isTemplateDisabled &&
                            setTemplateType(
                              template.id
                            )
                          }
                          className={`group flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            isTemplateDisabled
                              ? "bg-stone-100 border border-stone-200/50 text-stone-400 opacity-40 cursor-not-allowed"
                              : active
                              ? "bg-[#2A0E20] text-amber-100 shadow-sm cursor-pointer active:scale-[0.97]"
                              : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:-translate-y-0.5 cursor-pointer active:scale-[0.97]"
                          }`}
                        >
                          <Icon
                            size={13}
                            className={
                              isTemplateDisabled
                                ? "text-stone-400"
                                : active
                                ? "text-brand-gold"
                                : "group-hover:scale-110 transition-transform"
                            }
                          />

                          <span className="hidden sm:inline">
                            {template.label}
                          </span>

                          <span className="sm:hidden">
                            {
                              template.shortLabel
                            }
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div>
                  <label
                    htmlFor="crm-discount-code"
                    className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-1.5"
                  >
                    Privilege Voucher Code
                  </label>

                  <input
                    id="crm-discount-code"
                    type="text"
                    value={customDiscountCode}
                    onChange={(event) =>
                      setCustomDiscountCode(
                        event.target.value.toUpperCase()
                      )
                    }
                    className="w-full text-xs font-mono py-2.5 px-3 border border-stone-200 rounded-xl uppercase font-bold bg-white focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="crm-offer-text"
                    className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-1.5"
                  >
                    Gift / Offer Description
                  </label>

                  <input
                    id="crm-offer-text"
                    type="text"
                    value={customOfferText}
                    onChange={(event) =>
                      setCustomOfferText(
                        event.target.value
                      )
                    }
                    className="w-full text-xs py-2.5 px-3 border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="crm-generated-message"
                    className="text-[10px] uppercase font-bold tracking-wider text-stone-400"
                  >
                    Formatted WhatsApp Message
                  </label>

                  <span className="text-[9px] text-stone-400 flex items-center gap-1">
                    <ArrowUpRight size={10} />
                    Editable
                  </span>
                </div>

                <textarea
                  id="crm-generated-message"
                  rows={10}
                  value={generatedMessage}
                  onChange={(event) =>
                    setGeneratedMessage(
                      event.target.value
                    )
                  }
                  className="w-full text-xs font-sans p-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 resize-none text-stone-800 leading-relaxed transition-all duration-200"
                />
              </div>
            </div>

            <div className="px-6 md:px-7 py-4 border-t border-stone-200 flex items-center justify-between gap-3 bg-white">
              <button
                type="button"
                onClick={closeMessageComposer}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-all duration-200 active:scale-[0.97]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!generatedMessage.trim()}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <Send
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />

                <span className="hidden sm:inline">
                  Open in WhatsApp &amp; Send
                </span>

                <span className="sm:hidden">
                  Send
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div
          className={`fixed inset-0 z-[9999] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200 w-screen h-screen overflow-hidden ${
            isCustomerModalVisible
              ? "opacity-100"
              : "opacity-0"
          }`}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0 }}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCustomerModal();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-client-title"
        >
          <div
            className={`bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[100vh] overflow-hidden transition-all duration-200 z-[10000] ${
              isCustomerModalVisible
                ? "translate-y-0 scale-100"
                : "translate-y-3 scale-[0.98]"
            }`}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* Header */}
            <div className="shrink-0 px-6 md:px-7 py-4 border-b border-stone-200 flex items-center justify-between gap-4 bg-white">
              <div className="min-w-0">
                <h3
                  id="new-client-title"
                  className="font-display font-semibold text-lg text-stone-950"
                >
                  Register New Client
                </h3>

                <p className="text-xs text-stone-500 mt-0.5">
                  Save customer profile, address, celebrations,
                  and preferred silk details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCustomerModal}
                title="Close — Esc"
                className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-all duration-200 hover:rotate-90 active:scale-90 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleCreateCustomer}
              className="min-h-0 flex flex-col"
            >
              <div className="px-6 md:px-7 py-5 space-y-4 text-xs overflow-y-auto">
                {/* Name */}
                <div>
                  <label
                    htmlFor="crm-client-name"
                    className="block font-semibold text-stone-700 mb-1.5"
                  >
                    Full Customer Name *
                  </label>

                  <input
                    ref={customerNameInputRef}
                    id="crm-client-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Customer Name"
                    value={formData.name}
                    onChange={(event) =>
                      updateFormField(
                        "name",
                        event.target.value
                      )
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                  />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="crm-client-phone"
                      className="block font-semibold text-stone-700 mb-1.5"
                    >
                      WhatsApp Phone Number *
                    </label>

                    <input
                      id="crm-client-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(event) =>
                        updateFormField(
                          "phone",
                          event.target.value
                        )
                      }
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="crm-client-email"
                      className="block font-semibold text-stone-700 mb-1.5"
                    >
                      Email Address
                    </label>

                    <input
                      id="crm-client-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(event) =>
                        updateFormField(
                          "email",
                          event.target.value
                        )
                      }
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Location / City */}
                <div>
                  <label
                    htmlFor="crm-client-city"
                    className="block font-semibold text-stone-700 mb-1.5"
                  >
                    Location / City
                  </label>

                  <input
                    id="crm-client-city"
                    type="text"
                    placeholder="e.g. Banjara Hills, Hyderabad"
                    value={formData.city}
                    onChange={(event) =>
                      updateFormField(
                        "city",
                        event.target.value
                      )
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="crm-client-address"
                    className="block font-semibold text-stone-700 mb-1.5"
                  >
                    Street Address
                  </label>

                  <input
                    id="crm-client-address"
                    type="text"
                    placeholder="e.g. Plot 42, Road No. 36, Jubilee Hills"
                    value={formData.address}
                    onChange={(event) =>
                      updateFormField(
                        "address",
                        event.target.value
                      )
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                  />
                </div>

                {/* Birthday + Anniversary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DatePicker
                    id="crm-client-birthday"
                    label="Birthday"
                    value={formData.birthday}
                    onChange={(value) =>
                      updateFormField(
                        "birthday",
                        value
                      )
                    }
                  />

                  <DatePicker
                    id="crm-client-anniversary"
                    label="Wedding Anniversary"
                    value={formData.anniversary}
                    onChange={(value) =>
                      updateFormField(
                        "anniversary",
                        value
                      )
                    }
                  />
                </div>

                {/* Weave */}
                <div>
                  <label
                    htmlFor="crm-client-weave"
                    className="block font-semibold text-stone-700 mb-1.5"
                  >
                    Preferred Design Pattern
                  </label>

                  <input
                    id="crm-client-weave"
                    type="text"
                    placeholder="Designs, weaves, or patterns they love"
                    value={
                      formData.preferredWeave
                    }
                    onChange={(event) =>
                      updateFormField(
                        "preferredWeave",
                        event.target.value
                      )
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="crm-client-notes"
                    className="block font-semibold text-stone-700 mb-1.5"
                  >
                    Styling Notes / Palette Preferences
                  </label>

                  <textarea
                    id="crm-client-notes"
                    rows={3}
                    placeholder="Loves gold zari borders, crimson tones..."
                    value={formData.notes}
                    onChange={(event) =>
                      updateFormField(
                        "notes",
                        event.target.value
                      )
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl resize-none focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 md:px-7 py-3.5 border-t border-stone-200 flex items-center justify-between gap-3 bg-white">
                <button
                  type="button"
                  onClick={closeCustomerModal}
                  className="px-3 py-2 rounded-lg text-[11px] font-medium text-stone-600 hover:bg-stone-100 transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
                >
                  <kbd className="font-mono px-1 py-0.5 rounded bg-stone-100 border border-stone-200 text-[9px]">
                    Esc
                  </kbd>

                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  className="group px-3 py-2 rounded-lg bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-[10px] font-semibold flex items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  <Check
                    size={12}
                    className="text-brand-gold transition-transform duration-200 group-hover:scale-110"
                  />

                  <span>Save Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCAL ANIMATIONS */}
      <style>{`
        @keyframes crmFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes crmFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes crmCardIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes crmCalendarIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
