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
  FiKey,
  FiPhone,
  FiCheckCircle,
} from "react-icons/fi";
import { API_BASE } from "../config/api";
import { setUserSession } from "../utils/userSession";
import { StoreService } from "../services/supabase";
import logo from "../assets/logo/logo1.png";

type AuthRole = "user" | "admin";
type AuthMode = "signin" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const [role, setRole] = useState<AuthRole>("user");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("Ananya Sharma");
  const [email, setEmail] = useState("ananya.sharma@example.com");
  const [phoneDigits, setPhoneDigits] = useState("9876543210");
  const [password, setPassword] = useState("pass123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSwitch = (selectedRole: AuthRole) => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === "admin") {
      setAuthMode("signin");
      setEmail("admin@rsfashions.com");
      setPassword("admin2026");
    } else {
      setEmail("ananya.sharma@example.com");
      setPassword("user123");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneDigits(cleaned);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Admin Credentials Verification
    if (role === "admin") {
      if (password !== "admin2026") {
        setError("Invalid administrator security key. Access denied.");
        return;
      }
    }

    // 2. User Input Validation
    if (role === "user") {
      if (authMode === "signup" && phoneDigits.length < 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (!email.includes("@")) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setLoading(true);

    try {
      const cleanPhone = phoneDigits.trim();
      const cleanEmail = email.trim().toLowerCase();
      const formattedPhone = `+91 ${cleanPhone}`;

      // 3. Duplicate Prevention on Signup
      if (role === "user" && authMode === "signup") {
        const check = await StoreService.checkUserExists(cleanEmail, cleanPhone);
        if (check.exists) {
          if (check.emailExists) {
            setError(`An account with email '${cleanEmail}' is already registered. Please sign in instead.`);
            setLoading(false);
            return;
          }
          if (check.phoneExists) {
            setError(`An account with mobile number '+91 ${cleanPhone}' is already registered. Please sign in instead.`);
            setLoading(false);
            return;
          }
        }
      }

      // 4. Resolve Name
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
          }
        } catch {}
      }

      // 5. Establish Session
      const session = setUserSession({
        name: displayName,
        email: cleanEmail,
        phone: formattedPhone,
        role,
        authProvider: "email",
      });

      // Register into CRM backend & local admin store
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
            birthday: existing?.birthday,
            anniversary: existing?.anniversary,
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
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError(null);

    const destination = redirectUrl && redirectUrl !== "/account" ? redirectUrl : "/shop";
    sessionStorage.setItem("rs_auth_redirect", destination);

    const backendOAuthUrl = `${API_BASE}/auth/google?redirect=${encodeURIComponent(destination)}`;
    window.location.href = backendOAuthUrl;
  };

  return (
    <main
      style={{ transform: "translate3d(0, 0, 0)" }}
      className="relative min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none overflow-hidden will-change-transform"
    >
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block group">
          <div className="relative mx-auto flex flex-col items-center justify-center p-2">
            <img
              src={logo}
              alt="RS Fashions"
              className="relative h-14 sm:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="relative mt-1.5 font-serif text-[10.5px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-[#8E3D51]">
              Fashion
            </span>
          </div>
        </Link>
        <p className="mt-1 text-xs font-light uppercase tracking-[0.2em] text-[#8C7A6B]">
          Heritage Silks &amp; Handloom Saree Store
        </p>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          style={{ contain: "paint layout" }}
          className="rounded-[2.5rem] border border-white/80 bg-white/60 p-7 sm:p-9 shadow-[0_20px_50px_rgba(42,36,33,0.08)] backdrop-blur-[24px] relative overflow-hidden"
        >
          {/* Inner Glossy Highlight Line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80 pointer-events-none" />

          {/* Checkout Redirection Notice */}
          {redirectUrl && redirectUrl.includes("checkout") && (
            <div className="mb-6 rounded-2xl bg-amber-50/90 border border-amber-200/90 p-3.5 flex items-start gap-2.5 text-amber-900 shadow-2xs backdrop-blur-xs">
              <FiCheckCircle className="shrink-0 mt-0.5 text-[#D4A373]" size={16} />
              <div className="text-[11px] leading-relaxed">
                <strong className="block font-semibold">Sign In Required for Purchase</strong>
                Please sign in or create an account to proceed to checkout. Your selected sarees remain safe in your bag!
              </div>
            </div>
          )}

          {/* Role Toggle */}
          <div className="mb-6 flex rounded-2xl bg-black/5 p-1.5 border border-white/80 backdrop-blur-xs">
            <button
              type="button"
              data-role-btn="user"
              onClick={() => handleRoleSwitch("user")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                role === "user"
                  ? "bg-[#2A2421] text-white shadow-sm"
                  : "text-[#6E6359] hover:text-[#2A2421]"
              }`}
            >
              <FiUser size={13} />
              <span>Customer</span>
            </button>

            <button
              type="button"
              data-role-btn="admin"
              onClick={() => handleRoleSwitch("admin")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                role === "admin"
                  ? "bg-[#8E3D51] text-white shadow-sm"
                  : "text-[#6E6359] hover:text-[#8E3D51]"
              }`}
            >
              <FiShield size={13} />
              <span>Store Admin</span>
            </button>
          </div>

          {/* Google Sign-in */}
          {role === "user" && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-stone-200/90 bg-white/80 hover:bg-white text-stone-800 text-xs font-medium tracking-wide shadow-xs hover:shadow transition-all duration-200 active:scale-[0.98] disabled:opacity-60 backdrop-blur-xs"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-stone-400 border-t-[#8E3D51] rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {googleLoading ? "Connecting to Google..." : "Sign in with Google"}
                </span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200/80" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-[#FAF7F2]/90 px-3 text-stone-400 font-medium backdrop-blur-xs">or continue with email</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Mode Toggle */}
          {role === "user" && (
            <div className="mb-5 flex border-b border-black/6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setError(null);
                }}
                className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  authMode === "signin"
                    ? "border-[#8E3D51] text-[#8E3D51]"
                    : "border-transparent text-[#8C7A6B] hover:text-[#2A2421]"
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
                className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  authMode === "signup"
                    ? "border-[#8E3D51] text-[#8E3D51]"
                    : "border-transparent text-[#8C7A6B] hover:text-[#2A2421]"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Quick Pre-filled Credentials Info Box */}
          {authMode === "signin" && (
            <div className="mb-6 rounded-2xl border border-dashed border-[#8E3D51]/30 bg-white/70 p-3.5 backdrop-blur-xs shadow-2xs">
              <div className="flex items-start gap-2 text-xs">
                <FiKey className="mt-0.5 shrink-0 text-[#8E3D51]" size={14} />
                <div className="text-[11px] leading-relaxed text-[#544B44]">
                  <strong className="font-semibold text-[#2A2421] block">
                    Demo Credentials Pre-filled:
                  </strong>
                  {role === "admin" ? (
                    <>
                      Email: <span className="font-mono text-[#8E3D51]">admin@rsfashions.com</span>
                      <br />
                      Password: <span className="font-mono text-[#8E3D51]">admin2026</span>
                    </>
                  ) : (
                    <>
                      Email: <span className="font-mono text-[#8E3D51]">ananya.sharma@example.com</span>
                      <br />
                      Password: <span className="font-mono text-[#8E3D51]">user123</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {role === "user" && authMode === "signup" && (
              <div>
                <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" size={15} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ananya Sharma"
                    className="w-full rounded-xl border border-stone-200/90 bg-white/80 py-2.5 pl-10 pr-4 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white backdrop-blur-xs"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#8C7A6B] mb-1">
                {role === "admin" ? "Admin Corporate Email" : "Email Address"}
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" size={15} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full rounded-xl border border-stone-200/90 bg-white/80 py-2.5 pl-10 pr-4 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white backdrop-blur-xs"
                />
              </div>
            </div>

            {/* Phone Number (Sign Up only) */}
            {role === "user" && authMode === "signup" && (
              <div>
                <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Mobile Number
                </label>
                <div className="flex rounded-xl border border-stone-200/90 bg-white/80 overflow-hidden focus-within:border-[#8E3D51] focus-within:bg-white transition-all backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 px-3 bg-stone-100/90 border-r border-stone-200 text-xs font-bold text-stone-700 select-none">
                    <FiPhone size={13} className="text-[#8C7A6B]" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phoneDigits}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    className="flex-1 py-2.5 px-3 text-xs font-mono font-medium tracking-wider text-[#2A2421] bg-transparent outline-none"
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#8C7A6B]">We will send your order updates &amp; parcel tracking via WhatsApp.</p>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#8C7A6B]">
                  Security Password
                </label>
                {authMode === "signin" && (
                  <span className="text-[10px] text-[#8C7A6B]">Any demo password</span>
                )}
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" size={15} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-stone-200/90 bg-white/80 py-2.5 pl-10 pr-10 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white backdrop-blur-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#2A2421]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200 shadow-2xs">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className={`group mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md transition-all duration-200 active:scale-95 ${
                role === "admin"
                  ? "bg-[#8E3D51] hover:bg-[#722F40]"
                  : "bg-[#2A2421] hover:bg-[#8E3D51]"
              }`}
            >
              <span>
                {loading
                  ? "Authenticating..."
                  : role === "admin"
                  ? "Open Admin Portal"
                  : authMode === "signup"
                  ? "Create Account & Go to Shop"
                  : "Sign In to Shop"}
              </span>
              <FiArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
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
                  className="text-xs text-[#8C7A6B] hover:text-[#8E3D51] font-medium transition-colors"
                >
                  Don't have an account? <span className="underline font-semibold">Create an account</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setError(null);
                  }}
                  className="text-xs text-[#8C7A6B] hover:text-[#8E3D51] font-medium transition-colors"
                >
                  Already have an account? <span className="underline font-semibold">Sign In</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Direct Link to Catalog */}
          <div className="mt-6 border-t border-black/6 pt-4 text-center">
            <Link
              to="/shop"
              className="text-xs font-medium text-[#8C7A6B] hover:text-[#8E3D51] transition-colors"
            >
              Browse sarees in flagship collection →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}