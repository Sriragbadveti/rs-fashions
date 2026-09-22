import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { setUserSession, type UserSession } from "../utils/userSession";
import { API_BASE } from "../config/api";
import { supabase } from "../services/supabase";
import logo from "../assets/logo/logo1.png";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      const error = searchParams.get("error");
      const success = searchParams.get("success");
      const userParam = searchParams.get("user");
      const redirect = searchParams.get("redirect") || "/shop";

      if (error) {
        setStatus("error");
        setErrorMessage(decodeURIComponent(error));
        return;
      }

      if (userParam) {
        try {
          const parsedUser: Partial<UserSession> & { name: string; email: string } = JSON.parse(
            decodeURIComponent(userParam)
          );

          if (!parsedUser.email) {
            throw new Error("Invalid user information received from Google");
          }

          // Save active user session
          const session = setUserSession({
            id: parsedUser.id || `user-g-${Date.now().toString(36)}`,
            name: parsedUser.name || "Google Patron",
            email: parsedUser.email,
            phone: parsedUser.phone || "",
            role: "user",
            authProvider: "google",
            birthday: parsedUser.birthday,
          });

          // Also sync to CRM storage
          try {
            const adminCustStr = localStorage.getItem("rs_admin_customers");
            const adminCusts = adminCustStr ? JSON.parse(adminCustStr) : [];
            const cleanEmail = parsedUser.email.toLowerCase().trim();
            const existingIdx = adminCusts.findIndex(
              (c: any) => c.email && c.email.toLowerCase() === cleanEmail
            );
            const nowIso = new Date().toISOString();
            const newCust = {
              id: session.id,
              name: session.name,
              email: cleanEmail,
              phone: session.phone || "",
              city: "Hyderabad",
              address: "Hyderabad, Telangana",
              state: "Telangana",
              totalSpent: 0,
              ordersCount: 0,
              birthday: session.birthday,
              notes: "Google Auth Registered Patron",
              authProvider: "google",
              status: "active",
              lastActiveAt: nowIso,
              joinedAt: nowIso,
            };
            if (existingIdx >= 0) {
              adminCusts[existingIdx] = { ...adminCusts[existingIdx], ...newCust };
            } else {
              adminCusts.unshift(newCust);
            }
            localStorage.setItem("rs_admin_customers", JSON.stringify(adminCusts));
          } catch {}

          // Notify backend CRM endpoint
          try {
            fetch(`${API_BASE}/crm/customers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: session.id,
                name: session.name,
                email: session.email,
                phone: session.phone,
                city: "Hyderabad",
                address: "Hyderabad, Telangana",
                notes: "Google Auth Registered Patron",
                authProvider: "google",
              }),
            }).catch(() => {});
          } catch {}

          setStatus("success");

          setTimeout(() => {
            const destination = redirect.startsWith("/") ? redirect : `/${redirect}`;
            navigate(destination, { replace: true });
          }, 600);
        } catch (err: any) {
          console.error("Failed to process Google user data:", err);
          setStatus("error");
          setErrorMessage(err.message || "Failed to process Google sign-in response.");
        }
      } else if (success === "true") {
        setStatus("success");
        setTimeout(() => {
          navigate(redirect, { replace: true });
        }, 500);
      } else {
        // Check if Supabase client auth session exists from redirect
        try {
          if (supabase) {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user) {
              const u = data.session.user;
              setUserSession({
                id: `user-g-${u.id.slice(-12)}`,
                name: u.user_metadata?.full_name || u.user_metadata?.name || "Google Patron",
                email: u.email || "",
                phone: u.phone || "",
                role: "user",
                authProvider: "google",
              });
              setStatus("success");
              setTimeout(() => {
                navigate(redirect, { replace: true });
              }, 500);
              return;
            }
          }
        } catch {}

        setStatus("error");
        setErrorMessage("No authentication details received from Google.");
      }
    }

    processCallback();
  }, [searchParams, navigate]);

  return (
    <main className="min-h-screen bg-[#FAF7F2] font-sans text-[#2A2421] flex flex-col justify-center items-center py-12 px-4 sm:px-6 select-none">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/80 bg-white/70 p-8 sm:p-10 shadow-[0_20px_50px_rgba(42,36,33,0.08)] backdrop-blur-[24px] text-center">
        <div className="mx-auto flex flex-col items-center justify-center p-2 mb-4">
          <img src={logo} alt="RS Fashions" className="h-14 w-auto object-contain" />
          <span className="mt-1 font-serif text-xs font-semibold uppercase tracking-[0.3em] text-[#8E3D51]">
            Fashion
          </span>
        </div>

        {status === "loading" && (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 text-[#8E3D51] animate-spin" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-stone-900">
              Verifying Google Account...
            </h2>
            <p className="text-xs text-stone-500">
              Please wait while we secure your RS Fashions session.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-stone-900">
              Authentication Successful!
            </h2>
            <p className="text-xs text-stone-500">
              Redirecting you to our boutique collections...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-stone-900">
              Sign In Note
            </h2>
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 leading-relaxed">
              {errorMessage || "Unable to complete Google authentication."}
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#2A2421] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#8E3D51] transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
