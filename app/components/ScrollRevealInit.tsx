"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    const below = (el: Element) => el.getBoundingClientRect().top >= window.innerHeight * 0.92;

    // <section> elements — skip those whose children animate individually via [data-reveal]
    Array.from(document.querySelectorAll("section")).forEach((el) => {
      if (el.classList.contains("animate-fade-up")) return;
      if (el.querySelector("[data-reveal]")) return;
      if (below(el)) el.classList.add("scroll-reveal");
    });

    // [data-reveal] elements — each animates individually (enables stagger between siblings)
    Array.from(document.querySelectorAll("[data-reveal]")).forEach((el) => {
      if (el.classList.contains("animate-fade-up")) return;
      if (below(el)) el.classList.add("scroll-reveal");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
