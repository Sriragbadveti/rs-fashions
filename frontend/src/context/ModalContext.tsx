import React, {createContext,useContext,useState,useEffect,useRef,useCallback} from "react";
import { createPortal } from "react-dom";
import {AlertTriangle,Trash2,XCircle,CheckCircle2,Info,X,} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ConfirmDialogState extends ConfirmOptions {
  resolve: (val: boolean) => void;
}

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

export interface ModalContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  toast: (
    titleOrOptions: string | ToastOptions,
    message?: string,
    type?: ToastType
  ) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [confirmState, setConfirmState] = useState<ConfirmDialogState | null>(
    null
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // --------------------------------------------------------------------------
  // TOAST DISPATCHER
  // --------------------------------------------------------------------------
  const toast = useCallback(
    (
      titleOrOptions: string | ToastOptions,
      message?: string,
      type: ToastType = "success"
    ) => {
      let finalTitle = "";
      let finalMessage = "";
      let finalType: ToastType = "success";
      let finalDuration = 3200;

      if (typeof titleOrOptions === "object") {
        finalTitle = titleOrOptions.title;
        finalMessage = titleOrOptions.message || "";
        finalType = titleOrOptions.type || "success";
        finalDuration = titleOrOptions.duration || 3200;
      } else {
        finalTitle = titleOrOptions;
        finalMessage = message || "";
        finalType = type;
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [
        ...prev,
        { id, title: finalTitle, message: finalMessage, type: finalType },
      ]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, finalDuration);
    },
    []
  );

  const toastRef = useRef(toast);
  toastRef.current = toast;

  // --------------------------------------------------------------------------
  // CONFIRMATION DISPATCHER
  // --------------------------------------------------------------------------
  const confirm = useCallback(
    (options: ConfirmOptions | string): Promise<boolean> => {
      const opts: ConfirmOptions =
        typeof options === "string" ? { message: options } : options;

      const normalized = opts.message.toLowerCase();
      const isDelete =
        opts.destructive !== undefined
          ? opts.destructive
          : normalized.includes("delete") ||
            normalized.includes("remove") ||
            normalized.includes("revoke") ||
            normalized.includes("clear");

      return new Promise<boolean>((resolve) => {
        setConfirmState({
          title: opts.title || (isDelete ? "Confirm Deletion" : "Please Confirm"),
          message: opts.message,
          confirmText: opts.confirmText || (isDelete ? "Delete" : "Confirm"),
          cancelText: opts.cancelText || "Cancel",
          destructive: isDelete,
          resolve: (result) => {
            setConfirmState(null);
            resolve(result);
          },
        });
      });
    },
    []
  );

  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;

  // --------------------------------------------------------------------------
  // GLOBAL WINDOW INTERCEPTION (intercepts alert & confirm)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    window.alert = (message?: any) => {
      const msg = String(message ?? "");
      const isWarn =
        msg.toLowerCase().includes("please") ||
        msg.toLowerCase().includes("required") ||
        msg.toLowerCase().includes("maximum") ||
        msg.toLowerCase().includes("invalid");

      toastRef.current({
        title: isWarn ? "Attention" : "Notification",
        message: msg,
        type: isWarn ? "warning" : "info",
      });
    };

    window.confirm = (message?: string) => {
      return confirmRef.current(message || "Are you sure you want to proceed?") as unknown as boolean;
    };

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  return (
    <ModalContext.Provider value={{ confirm, toast }}>
      {children}

      {/* =================================================================== */}
      {/* 1. CONFIRMATION MODAL (PORTAL)                                      */}
      {/* =================================================================== */}
      {confirmState &&
        createPortal(
          <div
            className="fixed inset-0 z-99999 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm select-none animate-modal-overlay"
            onClick={() => confirmState.resolve(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-105 overflow-hidden rounded-[26px] border border-white/80 bg-white p-6 shadow-2xl backdrop-blur-2xl animate-modal-enter"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-[#D4A373]/50 to-transparent" />

              {/* Body */}
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                    confirmState.destructive
                      ? "border border-rose-200 bg-rose-50 text-rose-600"
                      : "border border-amber-200 bg-amber-50 text-[#D4A373]"
                  }`}
                >
                  {confirmState.destructive ? (
                    <Trash2 size={20} strokeWidth={2} />
                  ) : (
                    <AlertTriangle size={20} strokeWidth={2} />
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="font-display text-base font-semibold text-stone-950 leading-tight">
                    {confirmState.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-stone-500 leading-relaxed whitespace-pre-line">
                    {confirmState.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => confirmState.resolve(false)}
                  className="h-10 rounded-xl px-4 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all active:scale-[0.97]"
                >
                  {confirmState.cancelText}
                </button>

                <button
                  type="button"
                  onClick={() => confirmState.resolve(true)}
                  className={`h-10 rounded-xl px-5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ${
                    confirmState.destructive
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                      : "bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100 shadow-[#2A0E20]/20"
                  }`}
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* =================================================================== */}
      {/* 2. TOAST NOTIFICATIONS (PORTAL)                                     */}
      {/* =================================================================== */}
      {toasts.length > 0 &&
        createPortal(
          <div className="fixed top-5 right-5 z-99999 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => {
              const Icon =
                t.type === "error"
                  ? XCircle
                  : t.type === "warning"
                  ? AlertTriangle
                  : t.type === "info"
                  ? Info
                  : CheckCircle2;

              const accentColor =
                t.type === "error"
                  ? "text-rose-600 bg-rose-50 border-rose-100"
                  : t.type === "warning"
                  ? "text-amber-600 bg-amber-50 border-amber-100"
                  : t.type === "info"
                  ? "text-blue-600 bg-blue-50 border-blue-100"
                  : "text-emerald-600 bg-emerald-50 border-emerald-100";

              return (
                <div
                  key={t.id}
                  className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-xl animate-toast-enter text-stone-800"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${accentColor}`}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-xs font-semibold text-stone-950 truncate">
                      {t.title}
                    </p>
                    {t.message && (
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed line-clamp-2">
                        {t.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setToasts((prev) => prev.filter((item) => item.id !== t.id))
                    }
                    className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
                    aria-label="Dismiss toast"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}

      <style>{`
        @keyframes modalOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastEnter {
          from { opacity: 0; transform: translateX(18px) scale(0.98); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-modal-overlay {
          animation: modalOverlayIn 160ms ease-out both;
        }
        .animate-modal-enter {
          animation: modalEnter 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-toast-enter {
          animation: toastEnter 220ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used inside a ModalProvider");
  }
  return context;
};