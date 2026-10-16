import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { extractBundle, shouldReloadForUpdate } from "../../utils/appVersion";

const CHECK_EVERY_MS = 5 * 60 * 1000;
const RELOADED_KEY = "rs_reloaded_for_release";

/** Loads a newer release (if one went live) on the next page change. Live site only. */
export default function UpdateOnNavigate() {
  const location = useLocation();
  const latestRef = useRef<string | null>(null);
  const firstRender = useRef(true);
  const enabled = Boolean((import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/", { cache: "no-store", credentials: "omit" });
        if (!res.ok) return;
        const latest = extractBundle(await res.text());
        if (!cancelled && latest) latestRef.current = latest;
      } catch {
        // offline or blocked: try again later
      }
    };
    check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    const onFocus = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [enabled]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!enabled) return;
    const current = extractBundle(
      [...document.querySelectorAll<HTMLScriptElement>("script[src]")].map((s) => s.getAttribute("src")).join(" ")
    );
    let alreadyReloadedFor: string | null = null;
    try { alreadyReloadedFor = sessionStorage.getItem(RELOADED_KEY); } catch { /* storage blocked */ }
    if (shouldReloadForUpdate({ current, latest: latestRef.current, nextPath: location.pathname, alreadyReloadedFor })) {
      try { sessionStorage.setItem(RELOADED_KEY, latestRef.current || ""); } catch { /* storage blocked */ }
      window.location.reload();
    }
  }, [location.pathname, enabled]);

  return null;
}
