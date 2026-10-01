import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mounts its children (and so their data fetching and images) only when the section is about to
 * scroll into view. Keeps the first paint of the landing page light.
 */
export default function LazySection({ children, minHeight = 320, rootMargin = "600px" }: { children: ReactNode; minHeight?: number; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (visible || !ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div
      ref={ref}
      style={
        visible
          ? {
              contentVisibility: "auto",
              containIntrinsicSize: `auto none auto ${minHeight}px`,
            }
          : { minHeight }
      }
    >
      {visible ? children : null}
    </div>
  );
}
