import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, HelpCircle, Trash2 } from "lucide-react";

export interface ConfirmState {
  type: "confirm" | "prompt";
  title: string;
  message: string;
  defaultValue?: string;
  inputValue?: string;
  isDestructive: boolean;
  resolve: (value: any) => void;
}

interface ConfirmDialogProps {
  dialog: ConfirmState | null;
  setDialog: React.Dispatch<React.SetStateAction<ConfirmState | null>>;
}

export default function ConfirmDialog({ dialog, setDialog }: ConfirmDialogProps) {
  if (!dialog) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-stone-950/65 p-4 backdrop-blur-sm select-none"
      onClick={() => dialog.resolve(dialog.type === "prompt" ? null : false)}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-stone-200/80 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
              dialog.isDestructive
                ? "bg-rose-50 text-rose-600 border border-rose-200/70"
                : "bg-amber-50 text-[#D4A373] border border-amber-200/70"
            }`}
          >
            {dialog.isDestructive ? (
              <Trash2 size={20} />
            ) : dialog.type === "prompt" ? (
              <HelpCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-display font-semibold text-base text-stone-950">
              {dialog.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-stone-500 whitespace-pre-line">
              {dialog.message}
            </p>
          </div>
        </div>

        {/* Input field for prompt */}
        {dialog.type === "prompt" && (
          <div className="pt-1">
            <input
              type="text"
              autoFocus
              value={dialog.inputValue}
              onChange={(e) =>
                setDialog((prev) => (prev ? { ...prev, inputValue: e.target.value } : null))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  dialog.resolve(dialog.inputValue || "");
                }
              }}
              className="w-full h-10 px-3.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#D4A373] focus:bg-white"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={() => dialog.resolve(dialog.type === "prompt" ? null : false)}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() =>
              dialog.resolve(dialog.type === "prompt" ? dialog.inputValue || "" : true)
            }
            className={`px-4.5 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all active:scale-[0.98] ${
              dialog.isDestructive
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-[#2A0E20] hover:bg-[#3D142E] text-amber-100"
            }`}
          >
            {dialog.isDestructive ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
