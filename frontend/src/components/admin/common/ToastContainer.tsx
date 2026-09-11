import React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastNotice {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface ToastContainerProps {
  toasts: ToastNotice[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-3 max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isWarning = toast.type === "warning";
        const isError = toast.type === "error";

        let borderBgClass = "border-amber-200/80 bg-white/95 text-stone-900";
        let iconBgClass = "bg-amber-50 text-[#D4A373] border-amber-200/60";

        if (isSuccess) {
          borderBgClass = "border-emerald-200/80 bg-white/95 text-stone-900";
          iconBgClass = "bg-emerald-50 text-emerald-600 border-emerald-200/60";
        } else if (isWarning) {
          borderBgClass = "border-amber-300/80 bg-amber-50/95 text-amber-950";
          iconBgClass = "bg-amber-100 text-amber-700 border-amber-300/60";
        } else if (isError) {
          borderBgClass = "border-rose-300/80 bg-rose-50/95 text-rose-950";
          iconBgClass = "bg-rose-100 text-rose-700 border-rose-300/60";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl backdrop-blur-md border ${borderBgClass} transition-all duration-300 animate-in fade-in slide-in-from-bottom-5`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconBgClass}`}
            >
              {isSuccess ? (
                <CheckCircle2 size={18} />
              ) : isWarning || isError ? (
                <AlertTriangle size={18} />
              ) : (
                <Info size={18} />
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h4 className="font-semibold text-xs tracking-wide">
                {toast.title}
              </h4>
              <p className="mt-0.5 text-[11px] leading-relaxed opacity-80 whitespace-pre-line">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/40 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
