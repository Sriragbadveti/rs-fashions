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
    // Only accept numeric inputs up to 10 digits
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneDigits(cleaned);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === "user" && authMode === "signup" && phoneDigits.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const displayName =
        role === "admin"
          ? "Store Admin"
          : authMode === "signup"
          ? fullName.trim()
          : fullName || "Valued Customer";

      const formattedPhone = `+91 ${phoneDigits.trim()}`;

      const userSession = {
        email: email.trim().toLowerCase(),
        role,
        name: displayName,
        phone: formattedPhone,
        authProvider: "email",
        loggedInAt: new Date().toISOString(),
      };

      localStorage.setItem("rs_fashions_current_user", JSON.stringify(userSession));

      // Register into CRM backend & local admin store so customer appears on store admin CRM & Billing
      if (role === "user") {
        try {
          const adminCustStr = localStorage.getItem("rs_admin_customers");
          const adminCusts = adminCustStr ? JSON.parse(adminCustStr) : [];
          const existingIdx = adminCusts.findIndex(
            (c: any) =>
              (c.email && c.email.toLowerCase() === email.trim().toLowerCase()) ||
              (c.phone && c.phone.replace(/\D/g, "") === phoneDigits.trim())
          );
          const newCust = {
            id: `cust-${Date.now().toString().slice(-6)}`,
            name: displayName,
            email: email.trim().toLowerCase(),
            phone: formattedPhone,
            city: "Hyderabad",
            address: "Hyderabad, Telangana",
            state: "Telangana",
            tier: "Heritage Club",
            totalSpent: 0,
            ordersCount: 0,
            notes:
              authMode === "signup"
                ? "Registered via Website Account"
                : "Signed in via Email",
            authProvider: "email",
            joinedAt: new Date().toISOString(),
          };
          if (existingIdx >= 0) {
            adminCusts[existingIdx] = { ...adminCusts[existingIdx], ...newCust };
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
              name: displayName,
              email: email.trim().toLowerCase(),
              phone: formattedPhone,
              city: "Hyderabad",
              address: "Hyderabad, Telangana",
              tier: "Heritage Club",
              notes:
                authMode === "signup"
                  ? "Registered via Website Account"
                  : "Signed in via Email",
              authProvider: "email",
            }),
          });
        } catch {
          // ignore offline mode
        }
      }

      setTimeout(() => {
        setLoading(false);
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/shop");
        }
      }, 500);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Authentication failed. Please check your details and try again.");
    }
  };

  // Real Google Sign-in Trigger
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError(null);

    // Save current redirect destination to return to after Google handshake
    if (redirectUrl) {
      sessionStorage.setItem("rs_auth_redirect", redirectUrl);
    } else {
      sessionStorage.setItem("rs_auth_redirect", "/shop");
    }

    // Direct redirection to backend Google OAuth2 endpoint
    const backendOAuthUrl = `${API_BASE}/auth/google?redirect=${encodeURIComponent(
      redirectUrl || "/shop"
    )}`;

    window.location.href = backendOAuthUrl;
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="font-serif text-3xl sm:text-4xl font-light tracking-[0.24em] text-[#8E3D51]"
        >
          RS FASHIONS
        </Link>
        <p className="mt-2 text-xs font-light uppercase tracking-[0.2em] text-[#8C7A6B]">
          Heritage Silks &amp; Handloom Saree Store
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-black/8 bg-white p-7 sm:p-9 shadow-xl relative overflow-hidden">
          {/* Checkout Redirection Notice */}
          {redirectUrl && redirectUrl.includes("checkout") && (
            <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 flex items-start gap-2.5 text-amber-900">
              <FiCheckCircle className="shrink-0 mt-0.5 text-[#D4A373]" size={16} />
              <div className="text-[11px] leading-relaxed">
                <strong className="block font-semibold">Sign In Required for Purchase</strong>
                Please sign in or create an account to proceed to checkout. Your selected sarees remain safe in your bag!
              </div>
            </div>
          )}

          {/* Role Toggle */}
          <div className="mb-6 flex rounded-2xl bg-[#FAF7F2] p-1.5 border border-black/6">
            <button
              type="button"
              onClick={() => handleRoleSwitch("user")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
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
              onClick={() => handleRoleSwitch("admin")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                role === "admin"
                  ? "bg-[#8E3D51] text-white shadow-sm"
                  : "text-[#6E6359] hover:text-[#8E3D51]"
              }`}
            >
              <FiShield size={13} />
              <span>Store Admin</span>
            </button>
          </div>

          {/* Real Google OAuth Button (For Customers) */}
          {role === "user" && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium tracking-wide shadow-sm hover:shadow transition-all active:scale-[0.98] disabled:opacity-60"
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
                  <div className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-white px-3 text-stone-400 font-medium">or continue with email</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Mode Toggle: Sign In vs Create Account */}
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
            <div className="mb-6 rounded-2xl border border-dashed border-[#8E3D51]/30 bg-[#8E3D51]/5 p-3.5">
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
                    className="w-full rounded-xl border border-black/10 bg-[#FAF7F2] py-2.5 pl-10 pr-4 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white"
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
                  className="w-full rounded-xl border border-black/10 bg-[#FAF7F2] py-2.5 pl-10 pr-4 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white"
                />
              </div>
            </div>

            {/* Phone Number with Locked +91 Country Badge (Sign Up only) */}
            {role === "user" && authMode === "signup" && (
              <div>
                <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Mobile Number
                </label>
                <div className="flex rounded-xl border border-black/10 bg-[#FAF7F2] overflow-hidden focus-within:border-[#8E3D51] focus-within:bg-white transition-all">
                  {/* Fixed Non-Editable +91 Prefix */}
                  <div className="flex items-center gap-1.5 px-3 bg-stone-100/90 border-r border-black/10 text-xs font-bold text-stone-700 select-none">
                    <FiPhone size={13} className="text-[#8C7A6B]" />
                    <span>+91</span>
                  </div>

                  {/* 10-Digit Clean Input Field */}
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
                  className="w-full rounded-xl border border-black/10 bg-[#FAF7F2] py-2.5 pl-10 pr-10 text-xs font-light text-[#2A2421] outline-none transition-all focus:border-[#8E3D51] focus:bg-white"
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
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className={`group mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md transition-all active:scale-95 ${
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
                  : "Sign In & Go to Shop"}
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