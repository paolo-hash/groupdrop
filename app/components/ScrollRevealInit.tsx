"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    const below = (el: Element) => el.getBoundingClientRect().top >= window.innerHeight * 0.92;

    Array.from(document.querySelectorAll("section")).forEach((el) => {
      if (el.classList.contains("animate-fade-up")) return;
      if (el.querySelector("[data-reveal]")) return;
      if (below(el)) el.setAttribute("data-sr", "pending");
    });

    Array.from(document.querySelectorAll("[data-reveal]")).forEach((el) => {
      if (el.classList.contains("animate-fade-up")) return;
      if (below(el)) el.setAttribute("data-sr", "pending");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-sr", "revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );

    document.querySelectorAll("[data-sr='pending']").forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      document.querySelectorAll("[data-sr='pending']").forEach((el) => {
        el.removeAttribute("data-sr");
      });
    };
  }, [pathname]);

  return null;
}
