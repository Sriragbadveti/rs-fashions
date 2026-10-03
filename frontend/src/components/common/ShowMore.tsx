import { useEffect, useState } from "react";

/**
 * Admin lists render a page at a time instead of everything at once.
 * `resetKey` (search text, filters...) sends the list back to its first page.
 */
export function useShowMore(total: number, pageSize: number, resetKey: string) {
  const [visible, setVisible] = useState(pageSize);
  useEffect(() => setVisible(pageSize), [resetKey, pageSize]);
  return {
    visible,
    hasMore: total > visible,
    remaining: Math.max(0, total - visible),
    showMore: () => setVisible((v) => v + pageSize),
  };
}

export function ShowMoreButton({ remaining, onClick, label = "items" }: { remaining: number; onClick: () => void; label?: string }) {
  if (remaining <= 0) return null;
  return (
    <div className="flex justify-center px-4 py-4">
      <button
        type="button"
        onClick={onClick}
        className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 active:scale-[0.98]"
      >
        Show more ({remaining} more {label})
      </button>
    </div>
  );
}
