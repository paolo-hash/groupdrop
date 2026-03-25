"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Remove and re-add the class to retrigger the animation on each navigation
    el.classList.remove("page-transition");
    // Force reflow so the browser registers the removal before re-adding
    void el.offsetHeight;
    el.classList.add("page-transition");
  }, [pathname]);

  return (
    <div
      ref={ref}
      className="page-transition"
      onAnimationEnd={() => {
        // Remove the class once the animation finishes so the element no longer
        // has a transform applied via fill-forward — a lingering transform creates
        // a stacking context that breaks position:fixed children (mobile menus, modals)
        ref.current?.classList.remove("page-transition");
      }}
    >
      {children}
    </div>
  );
}
