import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  FiLock,
  FiMail,
  FiArrowRight,
  FiShield,
  FiUser,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiCheckCircle,
  FiGift,
  FiHeart,
  FiCalendar,
} from "react-icons/fi";
import { API_BASE } from "../config/api";
import { setUserSession } from "../utils/userSession";
import { StoreService } from "../services/supabase";
import logo from "../assets/logo/logo1.png";

type AuthRole = "user" | "admin";
type AuthMode = "signin" | "signup";

/* ---------------------------------------------------------
   VALIDATION DATA
--------------------------------------------------------- */
const DISPOSABLE_EMAIL_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "guerrillamail.info",
  "10minutemail.com",
  "10minutemail.net",
  "throwawaymail.com",
  "yopmail.com",
  "fakeinbox.com",
  "trashmail.com",
  "getnada.com",
  "maildrop.cc",
  "mintemail.com",
  "sharklasers.com",
  "dispostable.com",
  "mailnesia.com",
  "spamgourmet.com",
  "moakt.com",
  "emailondeck.com",
];

const BLOCKED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "cunt",
  "slut",
  "whore",
  "rape",
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function containsBlockedWord(value: string): boolean {
  const lower = value.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address.";
  }
  if (containsBlockedWord(trimmed)) {
    return "Please use an appropriate email address.";
  }
  const domain = trimmed.split("@")[1];
  if (domain && DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return "Temporary or disposable email addresses aren't allowed. Please use a permanent email.";
  }
  return null;
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return "Please enter your full name.";
  }
  if (containsBlockedWord(trimmed)) {
    return "Please enter an appropriate name.";
  }
  return null;
}

function validatePhone(digits: string): string | null {
  if (!PHONE_REGEX.test(digits)) {
    return "Please enter a valid 10-digit Indian mobile number.";
  }
  return null;
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const [role, setRole] = useState<AuthRole>("user");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Birthday & Anniversary — optional, signup only.
  const [birthday, setBirthday] = useState("");
  const [anniversary, setAnniversary] = useState("");

  const handleRoleSwitch = (selectedRole: AuthRole) => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === "admin") {
      setAuthMode("signin");
      setEmail("admin@rsfashion.com");
      setPassword("admin2026");
    } else {
      setEmail("");
      setPassword("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneDigits(cleaned);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ---- ADMIN PATH ----
    if (role === "admin") {
      if (password !== "admin2026") {
        setError("Invalid administrator security key. Access denied.");
        return;
      }
    }

    // ---- USER PATH ----
    if (role === "user") {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }

      if (authMode === "signup") {
        const nameError = validateName(fullName);
        if (nameError) {
          setError(nameError);
          return;
        }

        const phoneError = validatePhone(phoneDigits);
        if (phoneError) {
          setError(phoneError);
          return;
        }
      }
    }

    setLoading(true);

    try {
      const cleanPhone = phoneDigits.trim();
      const cleanEmail = email.trim().toLowerCase();
      const formattedPhone = cleanPhone ? `+91 ${cleanPhone}` : "";

      // Duplicate Check on Signup
      if (role === "user" && authMode === "signup") {
        const check = await StoreService.checkUserExists(cleanEmail, cleanPhone);
        if (check.exists) {
          if (check.emailExists) {
            setError(`An account with email '${cleanEmail}' already exists. Please sign in instead.`);
          } else if (check.phoneExists) {
            setError(`An account with mobile number '+91 ${cleanPhone}' already exists. Please sign in instead.`);
          }
          setLoading(false);
          return;
        }
      }

      let displayName =
        role === "admin"
          ? "Store Admin"
          : authMode === "signup"
            ? fullName.trim()
            : fullName || "Valued Customer";

      if (role === "user" && authMode === "signin") {
        try {
          const check = await StoreService.checkUserExists(cleanEmail, cleanPhone);
          if (check.existingName) {
            displayName = check.existingName;
          } else if (!check.exists) {
            setError("No account found with this email. Please create an account first.");
            setLoading(false);
            return;
          }
        } catch {}
      }

      const session = setUserSession({
        name: displayName,
        email: cleanEmail,
        phone: formattedPhone,
        role,
        authProvider: "email",
        birthday: birthday || undefined,
      });

      if (role === "user") {
        try {
          const adminCustStr = localStorage.getItem("rs_admin_customers");
          const adminCusts = adminCustStr ? JSON.parse(adminCustStr) : [];
          const existingIdx = adminCusts.findIndex(
            (c: any) =>
              (c.email && c.email.toLowerCase() === cleanEmail) ||
              (c.phone && c.phone.replace(/\D/g, "") === cleanPhone)
          );
          const existing = existingIdx >= 0 ? adminCusts[existingIdx] : null;
          const nowIso = new Date().toISOString();
          const newCust = {
            id: existing?.id || session.id,
            name: displayName || existing?.name,
            email: cleanEmail || existing?.email,
            phone: formattedPhone || existing?.phone,
            city: existing?.city || "Hyderabad",
            address: existing?.address || "Hyderabad, Telangana",
            state: existing?.state || "Telangana",
            totalSpent: existing?.totalSpent ?? 0,
            ordersCount: existing?.ordersCount ?? 0,
            birthday: birthday || existing?.birthday,
            anniversary: anniversary || existing?.anniversary,
            preferredWeave: existing?.preferredWeave,
            notes: existing?.notes || (authMode === "signup" ? "Registered via Website Account" : "Signed in via Email"),
            authProvider: "email",
            status: "active",
            lastActiveAt: nowIso,
            joinedAt: existing?.joinedAt || nowIso,
          };
          if (existingIdx >= 0) {
            adminCusts[existingIdx] = newCust;
          } else {
            adminCusts.unshift(newCust);
          }
          localStorage.setItem("rs_admin_customers", JSON.stringify(adminCusts));
        } catch {}

        try {
          await fetch(`${API_BASE}/crm/customers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: session.id,
              name: displayName,
              email: cleanEmail,
              phone: formattedPhone,
              city: "Hyderabad",
              address: "Hyderabad, Telangana",
              birthday: birthday || null,
              anniversary: anniversary || null,
              isNewRegistration: authMode === "signup",
              notes:
                authMode === "signup"
                  ? "Registered via Website Account"
                  : "Signed in via Email",
              authProvider: "email",
            }),
          });
        } catch {}
      }

      setTimeout(() => {
        setLoading(false);
        if (role === "admin") {
          navigate("/admin");
        } else {
          const destination = redirectUrl && redirectUrl !== "/account" ? redirectUrl : "/shop";
          navigate(destination, { replace: true });
        }
      }, 400);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Authentication failed. Please check your details and try again.");
    }
  };

  // Google Sign-in Trigger
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    const destination = redirectUrl && redirectUrl !== "/account" ? redirectUrl : "/shop";
    await StoreService.signInWithGoogle(destination);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#F7F4EE] font-sans text-[#2A2421] flex items-center justify-center py-6 px-4 sm:px-6 select-none">
      {/* Soft floating color blobs behind everything */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="rsf-blob rsf-blob-1" />
        <div className="rsf-blob rsf-blob-2" />
        <div className="rsf-blob rsf-blob-3" />
      </div>

      <style>{`
        @keyframes rsfFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(24px, -28px) scale(1.08); }
        }
        @keyframes rsfFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rsfShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .rsf-blob { position: absolute; border-radius: 9999px; filter: blur(70px); animation: rsfFloat 13s ease-in-out infinite; }
        .rsf-blob-1 { width: 420px; height: 420px; background: #8E3D51; opacity: 0.28; top: -140px; left: -120px; }
        .rsf-blob-2 { width: 380px; height: 380px; background: #D4A373; opacity: 0.3; bottom: -150px; right: -110px; animation-delay: 2.2s; }
        .rsf-blob-3 { width: 280px; height: 280px; background: #5B7B7A; opacity: 0.16; top: 45%; left: 55%; animation-delay: 4.4s; }
        .rsf-card-in { animation: rsfFadeUp 0.6s ease-out both; }
        .rsf-shimmer-btn { position: relative; overflow: hidden; }
        .rsf-shimmer-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: rsfShimmer 3s linear infinite;
        }
      `}</style>

      {/* Card container */}
      <div className="relative z-10 w-full sm:max-w-100 lg:max-w-3xl rsf-card-in">
        <div className="relative overflow-hidden rounded-4xl border border-white/90 bg-white/70 shadow-[0_30px_70px_rgba(42,36,33,0.12)] backdrop-blur-[32px] lg:grid lg:grid-cols-5">

          {/* ============ LEFT: brand panel ============ */}
          <div className="hidden lg:flex lg:col-span-2 relative flex-col justify-between overflow-hidden bg-linear-to-br from-[#8E3D51] via-[#8E3D51] to-[#722F40] p-8 text-[#F7F4EE]">
            <svg aria-hidden className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 opacity-20" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="98" stroke="#D4A373" strokeWidth="1" />
              <circle cx="100" cy="100" r="78" stroke="#D4A373" strokeWidth="1" strokeDasharray="3 7" />
              <circle cx="100" cy="100" r="58" stroke="#D4A373" strokeWidth="1" />
            </svg>

            <div className="relative z-10 flex flex-col items-center text-center">
              <Link
                to="/"
                aria-label="Go to RS Fashions homepage"
                className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FAF7F2] shadow-lg ring-4 ring-white/20 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <img src={logo} alt="RS Fashions" className="h-12 w-auto object-contain" />
              </Link>

              <div className="mt-5 flex items-center gap-2.5">
                <span className="h-px w-6 bg-[#F7F4EE]/40" />
                <h1 className="font-serif text-2xl font-semibold tracking-widest text-[#F7F4EE]">
                  Fashions
                </h1>
                <span className="h-px w-6 bg-[#F7F4EE]/40" />
              </div>

              <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-[#D4A373]">
                Heritage Silks &amp; Handloom Sarees
              </p>

              <p className="mt-5 max-w-56 text-sm leading-relaxed text-[#F7F4EE]/80">
                Sign in to track your orders and be the first to see new arrivals from our weavers.
              </p>
            </div>

            <ul className="relative z-10 mt-8 space-y-2.5 text-xs text-[#F7F4EE]/85">
              <li className="flex items-center gap-2">
                <FiCheckCircle className="shrink-0 text-[#D4A373]" size={14} />
                Handpicked weaves, sourced with care
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="shrink-0 text-[#D4A373]" size={14} />
                Safe checkout, easy returns
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="shrink-0 text-[#D4A373]" size={14} />
                Real updates on WhatsApp, no spam
              </li>
            </ul>

            <p className="relative z-10 mt-8 text-center text-[10px] text-[#F7F4EE]/50">
              © {new Date().getFullYear()} RS Fashion
            </p>
          </div>

          {/* ============ RIGHT: interactive form ============ */}
          <div className="lg:col-span-3 p-6 sm:p-7 lg:p-8">

            {/* Compact brand header — mobile & tablet only */}
            <div className="lg:hidden mb-6 text-center">
              <div className="inline-flex flex-col items-center">
                <Link
                  to="/"
                  aria-label="Go to RS Fashion homepage"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F2] shadow-md ring-2 ring-[#8E3D51]/10 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <img src={logo} alt="RS Fashion" className="h-9 w-auto object-contain" />
                </Link>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="h-px w-6 bg-[#8E3D51]/40" />
                  <h1 className="font-serif text-lg font-semibold text-[#2A2421]">RS Fashion</h1>
                  <span className="h-px w-6 bg-[#8E3D51]/40" />
                </div>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-[#8E3D51]">
                  Heritage Silks &amp; Handloom Sarees
                </p>
              </div>
            </div>

            {/* Checkout Redirection Notice */}
            {redirectUrl && redirectUrl.includes("checkout") && (
              <div className="mb-5 rounded-2xl bg-[#FAF3EC] border border-[#E6D5C3] p-3.5 flex items-start gap-3 text-[#5A4535] shadow-xs">
                <FiCheckCircle className="shrink-0 mt-0.5 text-[#8E3D51]" size={17} />
                <div className="text-xs leading-relaxed">
                  <strong className="block font-semibold text-[#2A2421] mb-0.5">Sign in to continue</strong>
                  Please sign in or create an account to complete your checkout. Your items are still saved.
                </div>
              </div>
            )}

            {/* Role Toggle (Customer vs Admin) */}
            <div className="mb-5 flex rounded-2xl bg-[#EFECE6]/70 p-1.5 border border-stone-200/60 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => handleRoleSwitch("user")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                  role === "user"
                    ? "bg-[#2A2421] text-white shadow-md"
                    : "text-[#7A6B5D] hover:text-[#2A2421]"
                }`}
              >
                <FiUser size={14} />
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch("admin")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                  role === "admin"
                    ? "bg-[#8E3D51] text-white shadow-md"
                    : "text-[#7A6B5D] hover:text-[#8E3D51]"
                }`}
              >
                <FiShield size={14} />
                <span>Store Admin</span>
              </button>
            </div>

            {/* Google Sign-in */}
            {role === "user" && (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-stone-200/90 bg-white hover:bg-stone-50/80 text-stone-800 text-xs font-medium tracking-wide shadow-xs hover:shadow-md transition-all duration-300 active:scale-[0.98] disabled:opacity-60"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 border-2 border-stone-400 border-t-[#8E3D51] rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200/80" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="bg-[#FAF7F2] px-3 text-stone-400 font-medium">Or continue with email</span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Mode Toggle (Sign In vs Create Account) */}
            {role === "user" && (
              <div className="mb-5 flex border-b border-stone-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setError(null);
                  }}
                  className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                    authMode === "signin"
                      ? "border-[#8E3D51] text-[#8E3D51]"
                      : "border-transparent text-[#7A6B5D] hover:text-[#2A2421]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setError(null);
                  }}
                  className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                    authMode === "signup"
                      ? "border-[#8E3D51] text-[#8E3D51]"
                      : "border-transparent text-[#7A6B5D] hover:text-[#2A2421]"
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {role === "user" && authMode === "signup" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#7A6B5D] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6B5D]" size={15} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-2xl border border-stone-200/90 bg-white/90 py-2.5 pl-11 pr-4 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white focus:ring-2 focus:ring-[#8E3D51]/10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#7A6B5D] mb-1.5">
                  {role === "admin" ? "Admin Corporate Email" : "Email Address"}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6B5D]" size={15} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Id"
                    className="w-full rounded-2xl border border-stone-200/90 bg-white/90 py-2.5 pl-11 pr-4 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white focus:ring-2 focus:ring-[#8E3D51]/10"
                  />
                </div>
                {role === "user" && authMode === "signup" && (
                  <p className="mt-1 text-[10px] text-[#7A6B5D]">
                    Temporary or disposable email addresses aren't accepted.
                  </p>
                )}
              </div>

              {role === "user" && authMode === "signup" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#7A6B5D] mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex rounded-2xl border border-stone-200/90 bg-white/90 overflow-hidden focus-within:border-[#8E3D51] focus-within:ring-2 focus-within:ring-[#8E3D51]/10 transition-all">
                    <div className="flex items-center gap-1.5 px-3.5 bg-stone-100/90 border-r border-stone-200/80 text-xs font-bold text-stone-700 select-none">
                      <FiPhone size={13} className="text-[#7A6B5D]" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phoneDigits}
                      onChange={handlePhoneChange}
                      placeholder="9876543210"
                      className="flex-1 min-w-0 py-2.5 px-3.5 text-xs font-mono font-medium tracking-wider text-[#2A2421] bg-transparent outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-[#7A6B5D]">Order updates &amp; tracking will be sent via WhatsApp.</p>
                </div>
              )}

              {role === "user" && authMode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#7A6B5D]">
                      <FiGift size={11} className="text-[#B23A55]" />
                      Birthday <span className="normal-case font-normal text-[9px] text-[#7A6B5D]/70">(Opt.)</span>
                    </label>
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      style={{ accentColor: "#B23A55" }}
                      className="w-full rounded-2xl border border-[#E7B8C4] bg-[#FDF3F5] py-2.5 px-3 text-xs font-medium text-[#7A2E42] outline-none transition-all focus:border-[#B23A55] focus:ring-2 focus:ring-[#B23A55]/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#7A6B5D]">
                      <FiHeart size={11} className="text-[#A9812F]" />
                      Anniversary <span className="normal-case font-normal text-[9px] text-[#7A6B5D]/70">(Opt.)</span>
                    </label>
                    <input
                      type="date"
                      value={anniversary}
                      onChange={(e) => setAnniversary(e.target.value)}
                      style={{ accentColor: "#A9812F" }}
                      className="w-full rounded-2xl border border-[#E8D3A6] bg-[#FBF6EA] py-2.5 px-3 text-xs font-medium text-[#7A5E1F] outline-none transition-all focus:border-[#A9812F] focus:ring-2 focus:ring-[#A9812F]/15"
                    />
                  </div>
                </div>
              )}

              {role === "user" && authMode === "signup" && (
                <div className="flex items-center gap-1.5 text-[10.5px] text-[#8E3D51] bg-[#8E3D51]/5 px-3 py-2 rounded-xl border border-[#8E3D51]/10">
                  <FiGift size={13} className="shrink-0" />
                  <span>We'll send you a little surprise on these days.</span>
                </div>
              )}

              {/* Password field */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#7A6B5D] mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6B5D]" size={15} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-2xl border border-stone-200/90 bg-white/90 py-2.5 pl-11 pr-11 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white focus:ring-2 focus:ring-[#8E3D51]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6B5D] hover:text-[#2A2421] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-200 shadow-2xs">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className={`rsf-shimmer-btn group mt-5 flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${
                  role === "admin"
                    ? "bg-[#8E3D51] hover:bg-[#722F40] shadow-[#8E3D51]/20"
                    : "bg-[#2A2421] hover:bg-[#8E3D51] shadow-[#2A2421]/15"
                }`}
              >
                <span>
                  {loading
                    ? "Please wait..."
                    : role === "admin"
                      ? "Open Admin Portal"
                      : authMode === "signup"
                        ? "Create Account & Go to Shop"
                        : "Sign In to Shop"}
                </span>
                <FiArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </form>

            {/* Toggle link between Sign In & Sign Up */}
            {role === "user" && (
              <div className="mt-5 text-center">
                {authMode === "signin" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setError(null);
                    }}
                    className="text-xs text-[#7A6B5D] hover:text-[#8E3D51] font-medium transition-colors"
                  >
                    Don't have an account? <span className="underline font-semibold text-[#2A2421]">Create an account</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setError(null);
                    }}
                    className="text-xs text-[#7A6B5D] hover:text-[#8E3D51] font-medium transition-colors"
                  >
                    Already have an account? <span className="underline font-semibold text-[#2A2421]">Sign In</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Direct Link to Catalog */}
            <div className="mt-5 border-t border-stone-200/60 pt-4 text-center">
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A6B5D] hover:text-[#8E3D51] transition-colors group"
              >
                <span>Browse sarees in collection</span>
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}