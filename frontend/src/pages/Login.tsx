import { useState } from "react";
import {Lock, Mail, ShieldCheck, Loader2, ArrowRight, Eye, EyeOff} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your administrator email and security key.");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: "Becho",
        email: email,
        role: "Superadmin",
      });
    }, 850);
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#F8F6F2] flex items-center justify-center p-6 md:p-12 select-none">
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#F4E3D7] to-[#E9D5C4] blur-3xl opacity-70 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[580px] h-[580px] rounded-full bg-gradient-to-tl from-[#E2D4E0] to-[#F7EFE9] blur-3xl opacity-60 pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="glass-panel relative z-10 w-full max-w-4xl h-[560px] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Left Brand Panel */}
        <div className="relative md:w-5/12 bg-gradient-to-br from-[#38152B] via-[#2A0E20] to-[#1E0916] text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 0 L44 22 L22 44 L0 22 Z' fill='none' stroke='%23D4A373' stroke-width='1.2'/%3E%3Ccircle cx='22' cy='22' r='4' fill='%23D4A373'/%3E%3C/svg%3E")`,
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10">
            <h1 className="font-mona text-4xl font-normal tracking-wide text-white leading-tight">
              RS Fashions
            </h1>
            <p className="mt-2 text-sm text-stone-300 font-light tracking-wide">
              Heritage Silks &bull; Curated Handlooms
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2.5 text-xs text-stone-400 font-light">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
            </div>
            <span>Hardware Token &bull; Encrypted Windows Session</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex flex-col justify-between p-8 md:p-12 overflow-y-auto bg-white/40">
          <div className="my-auto max-w-sm w-full mx-auto">
            <div className="mb-7">
              {/* <img
                src="src/assets/logo/logo.jpeg"
                alt="RS Fashions Logo"
                className="w-52 h-full object-cover"
              /> */}
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">
                Authentication
              </span>
              <h2 className="text-2xl font-display font-semibold text-stone-900 tracking-tight mt-0.5">
                Sign in
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Protected portal for Superadmin and Store Managers.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Corporate Email
                </label>
                <div className="group relative flex items-center rounded-xl bg-white/80 border border-stone-200 shadow-sm focus-within:border-[#D4A373] focus-within:ring-2 focus-within:ring-[#D4A373]/20 transition-all duration-200">
                  <Mail size={16} className="absolute left-3.5 text-stone-400 group-focus-within:text-[#D4A373] transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rsfashions.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Security Key
                </label>
                <div className="group relative flex items-center rounded-xl bg-white/80 border border-stone-200 shadow-sm focus-within:border-[#D4A373] focus-within:ring-2 focus-within:ring-[#D4A373]/20 transition-all duration-200">
                  <Lock size={16} className="absolute left-3.5 text-stone-400 group-focus-within:text-[#D4A373] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
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
                className="w-full mt-2 group relative overflow-hidden rounded-xl bg-[#2A0E20] hover:bg-[#3D142E] active:scale-[0.99] text-amber-100 py-3 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#D4A373]" />
                    <span>Verifying Credentials…</span>
                  </>
                ) : (
                  <>
                    <span>Enter Terminal</span>
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform text-[#D4A373]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-black">
            <span>RS Fashions v1.0.1</span>
            <span className="flex items-center gap-1.5"/>
          </div>
        </div>

      </div>
    </div>
  );
}