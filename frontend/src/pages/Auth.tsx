import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiLock,
  FiMail,
  FiArrowRight,
  FiShield,
  FiUser,
  FiEye,
  FiEyeOff,
  FiKey,
} from "react-icons/fi";

type AuthRole = "user" | "admin";

export default function Auth() {
  const navigate = useNavigate();
  const [role, setRole] = useState<AuthRole>("user");
  const [email, setEmail] = useState("ananya.sharma@example.com");
  const [password, setPassword] = useState("pass123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSwitch = (selectedRole: AuthRole) => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === "admin") {
      setEmail("admin@rsfashions.com");
      setPassword("admin2026");
    } else {
      setEmail("ananya.sharma@example.com");
      setPassword("user123");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const userSession = {
        email,
        role,
        name: role === "admin" ? "Admin Curator" : "Ananya Sharma",
        loggedInAt: new Date().toISOString(),
      };

      localStorage.setItem("rs_fashions_current_user", JSON.stringify(userSession));

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/shop");
      }
    }, 800);
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="font-serif text-3xl sm:text-4xl font-light tracking-[0.24em] text-[#8E3D51]"
        >
          BECHO
        </Link>
        <p className="mt-2 text-xs font-light uppercase tracking-[0.2em] text-[#8C7A6B]">
          Artisanal Vault & Atelier Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-black/8 bg-white p-7 sm:p-9 shadow-xl">
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
              <span>Admin Atelier</span>
            </button>
          </div>

          {/* Quick Dummy Credentials Info Pill */}
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

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#8C7A6B] mb-1">
                {role === "admin" ? "Admin Email Address" : "Account Email"}
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

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#8C7A6B]">
                  Password
                </label>
                <span className="text-[10px] text-[#8C7A6B]">Dummy / Any value</span>
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
                >
                  {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`group mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md transition-all active:scale-95 ${
                role === "admin"
                  ? "bg-[#8E3D51] hover:bg-[#722F40]"
                  : "bg-[#2A2421] hover:bg-[#8E3D51]"
              }`}
            >
              <span>{loading ? "Authenticating..." : role === "admin" ? "Enter Admin Atelier" : "Sign In to Vault"}</span>
              <FiArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </form>

          {/* Quick Links */}
          <div className="mt-6 border-t border-black/6 pt-4 text-center">
            <Link
              to="/shop"
              className="text-xs font-medium text-[#8C7A6B] hover:text-[#8E3D51] transition-colors"
            >
              Continue shopping as guest →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
