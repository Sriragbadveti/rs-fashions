import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Mail,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Store,
  UserPlus,
  X,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { API_BASE } from "../config/api";
import { setAdminSession, AdminUser } from "../utils/adminSession";

interface LoginProps {
  onLoginSuccess?: (user: { name: string; email: string; role: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Add Admin Modal State
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [masterEmail, setMasterEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState("");
  const [addAdminSuccess, setAddAdminSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your administrator email.");
      return;
    }

    if (!password) {
      setError("Please enter your administrator passkey.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Invalid administrator credentials. Access denied.");
      }

      const { token, user } = json.data || {};
      if (!token || !user) {
        throw new Error("Invalid session token returned by authentication server.");
      }

      const adminUser: AdminUser = {
        name: user.name || "Administrator",
        email: user.email || cleanEmail,
        role: "admin",
        sessionId: user.sessionId,
      };

      // Store cryptographically signed token strictly in sessionStorage (tab-isolated)
      setAdminSession(token, adminUser);

      if (onLoginSuccess) {
        onLoginSuccess(adminUser);
      } else {
        navigate("/admin-7f9a2b8e");
      }
    } catch (err: any) {
      console.error("[Admin Login Error]:", err);
      setError(err.message || "Authentication service unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddAdminSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddAdminError("");
    setAddAdminSuccess("");

    if (!masterEmail.trim() || !masterPassword) {
      setAddAdminError("Authorizing master administrator credentials are required.");
      return;
    }

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setAddAdminError("All fields for the new administrator are required.");
      return;
    }

    if (newPassword.length < 6) {
      setAddAdminError("New administrator passkey must be at least 6 characters.");
      return;
    }

    setAddAdminLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/admin-create-authorized`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterEmail: masterEmail.trim().toLowerCase(),
          masterPassword,
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Failed to authorize and create administrator account.");
      }

      const registeredAdmin = json.data?.admin;
      setAddAdminSuccess(
        `Administrator account for ${registeredAdmin?.email || newEmail} created successfully!`
      );
      setEmail(newEmail.trim().toLowerCase());
      setPassword("");

      // Clear form
      setTimeout(() => {
        setIsAddAdminOpen(false);
        setAddAdminSuccess("");
        setMasterPassword("");
        setNewName("");
        setNewEmail("");
        setNewPassword("");
      }, 2000);
    } catch (err: any) {
      setAddAdminError(err.message || "Failed to create administrator account.");
    } finally {
      setAddAdminLoading(false);
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#F7EBEC] flex items-center justify-center p-6 md:p-12 select-none font-sans">
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-130 h-130 rounded-full bg-linear-to-br from-[#F4E7E4] to-[#E9C9C3] blur-3xl opacity-80 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-145 h-145 rounded-full bg-linear-to-tl from-[#CBC0D3] to-[#F4E7E4] blur-3xl opacity-75 pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="glass-panel relative z-10 w-full max-w-4xl min-h-140 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/80">
        {/* Left Brand Panel */}
        <div className="relative md:w-5/12 bg-linear-to-br from-[#38152B] via-[#2A0E20] to-[#1E0916] text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 0 L44 22 L22 44 L0 22 Z' fill='none' stroke='%23D4A373' stroke-width='1.2'/%3E%3Ccircle cx='22' cy='22' r='4' fill='%23D4A373'/%3E%3C/svg%3E")`,
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10">
            <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-white leading-tight">
              RS Fashions
            </h1>
            <p className="mt-2 text-xs text-amber-200/90 uppercase tracking-[0.2em] font-medium">
              SiCo Gadwal Sarees<br />Admin Portal
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex flex-col justify-between p-8 md:p-12 overflow-y-auto bg-white/50 backdrop-blur-md">
          <div className="my-auto max-w-sm w-full mx-auto">
            <div className="mb-7">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E3D51]">
                Protected Console
              </span>
              <h2 className="text-2xl font-serif font-medium text-stone-900 tracking-tight mt-0.5">
                Sign in to Dashboard
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Access your Saree inventory, counter POS, sales ledger &amp; CRM.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Email
                </label>
                <div className="group relative flex items-center rounded-xl bg-white/90 border border-stone-200 shadow-xs focus-within:border-[#D4A373] focus-within:ring-2 focus-within:ring-[#D4A373]/20 transition-all duration-200">
                  <Mail size={16} className="absolute left-3.5 text-stone-400 group-focus-within:text-[#8E3D51] transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@rsfashions.in"
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Passkey
                </label>
                <div className="group relative flex items-center rounded-xl bg-white/90 border border-stone-200 shadow-xs focus-within:border-[#D4A373] focus-within:ring-2 focus-within:ring-[#D4A373]/20 transition-all duration-200">
                  <Lock size={16} className="absolute left-3.5 text-stone-400 group-focus-within:text-[#8E3D51] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter administrator passkey"
                    className="w-full pl-10 pr-10 py-2.5 bg-transparent text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 focus:outline-none p-1"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200/80 px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 group relative overflow-hidden rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] active:scale-[0.99] text-amber-100 py-3 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-[#D4A373]" />
                    <span>Verifying Credentials…</span>
                  </>
                ) : (
                  <>
                    <span>Enter Terminal</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform text-[#D4A373]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
            <span>RS Fashions v 1.0.0</span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-[#8E3D51] transition-colors"
            >
              <Store size={13} />
              <span>Back to Store</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Authorize & Add Admin Modal */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-stone-200 animate-in fade-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setIsAddAdminOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-2xl bg-[#2A0E20] text-[#D4A373]">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Authorize New Administrator
                </h3>
                <p className="text-xs text-stone-500">
                  Master administrator authorization is required to register new accounts.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddAdminSubmit} className="space-y-4">
              {/* Section 1: Master Admin Authorization */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                  Step 1: Master Admin Authorization
                </span>
                <div>
                  <input
                    type="email"
                    placeholder="Authorizing Admin Email (e.g. admin@rsfashions.in)"
                    value={masterEmail}
                    onChange={(e) => setMasterEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-amber-200 focus:outline-none focus:border-[#8E3D51]"
                    required
                  />
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showMasterPassword ? "text" : "password"}
                    placeholder="Authorizing Admin Passkey"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-xs bg-white rounded-xl border border-amber-200 focus:outline-none focus:border-[#8E3D51]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterPassword(!showMasterPassword)}
                    className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-1"
                  >
                    {showMasterPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Section 2: New Admin Details */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                  Step 2: New Administrator Details
                </span>
                <div>
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Rajesh Kumar)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-[#D4A373]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Corporate Email (e.g. rajesh@rsfashions.in)"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-[#D4A373]"
                    required
                  />
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Set Security Passkey (Min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-9 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-[#D4A373]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-1"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {addAdminError && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{addAdminError}</span>
                </div>
              )}

              {addAdminSuccess && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{addAdminSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAdminLoading || Boolean(addAdminSuccess)}
                  className="px-5 py-2.5 rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {addAdminLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#D4A373]" />
                      <span>Authorizing…</span>
                    </>
                  ) : (
                    <span>Create Administrator</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
