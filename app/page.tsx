"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const AESOP_TARGET = 5000;
const AESOP_RAISED_KEY = "groupdrop:raised:aesop";
const AESOP_DEFAULT_RAISED = 3100;

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function Home() {
  const [aesopRaised, setAesopRaised] = useState<number>(AESOP_DEFAULT_RAISED);

  // Load saved total once on mount
  useEffect(() => {
    const saved = localStorage.getItem(AESOP_RAISED_KEY);
    if (saved) {
      const val = Number(saved);
      if (!Number.isNaN(val)) setAesopRaised(val);
    }
  }, []);

  // Keep in sync across tabs/windows
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === AESOP_RAISED_KEY && e.newValue) {
        const val = Number(e.newValue);
        if (!Number.isNaN(val)) setAesopRaised(val);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const percent = Math.min(Math.round((aesopRaised / AESOP_TARGET) * 100), 100);
  const remaining = Math.max(AESOP_TARGET - aesopRaised, 0);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-5xl px-5 py-14 md:py-16">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="text-lg font-extrabold tracking-tight">groupdrop (beta)</div>

          <nav className="hidden items-center gap-4 text-sm text-neutral-700 md:flex">
            <a href="#drops" className="hover:text-neutral-900">
              Drops
            </a>
            <a href="#how" className="hover:text-neutral-900">
              How it works
            </a>
            <a href="#join" className="hover:text-neutral-900">
              Join
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-14 md:mt-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight">
            Premium group buys, without the chaos.
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-700 md:mt-5 md:text-lg">
            Join curated drops. Watch the total climb. When we hit the target, everyone gets the deal.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="#drops"
              className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-neutral-800 md:w-auto"
            >
              View active drops
            </a>

            <a
              href="#how"
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-extrabold text-neutral-900 hover:bg-neutral-50 md:w-auto"
            >
              How it works
            </a>
          </div>
        </section>

        {/* Drops */}
        <section id="drops" className="mt-14 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-2 md:gap-5">
          {/* Active Drop */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-extrabold tracking-wide text-neutral-600">ACTIVE DROP</div>

            <div className="mt-2 text-2xl font-black">Aesop Hand Wash Bundle</div>

            <div className="mt-1 text-sm text-neutral-700 md:text-base">
              Target: <span className="font-extrabold text-neutral-900">{money(AESOP_TARGET)}</span> • Ends in{" "}
              <span className="font-extrabold text-neutral-900">3 days</span>
            </div>

            <div className="mt-5 h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-neutral-900 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-neutral-700 md:text-base">
              <div>
                Raised: <span className="font-extrabold text-neutral-900">{money(aesopRaised)}</span>
              </div>
              <div>
                {percent}% • <span className="font-extrabold text-neutral-900">{money(remaining)}</span> to go
              </div>
            </div>

            <Link
              href="/drops/aesop"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-neutral-800"
            >
              Join this drop
            </Link>

            <p className="mt-4 text-xs leading-relaxed text-neutral-600">
              You’ll see a temporary authorization. We only charge if the drop completes.
            </p>
          </div>

          {/* Up Next */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-extrabold tracking-wide text-neutral-600">UP NEXT</div>

            <div className="mt-2 text-2xl font-black">Le Labo Discovery Set</div>

            <div className="mt-1 text-sm text-neutral-700 md:text-base">
              Vote to unlock • Target <span className="font-extrabold text-neutral-900">$7,500</span>
            </div>

            <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
              Invite a friend and you both get early access.
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-14 md:mt-16">
          <h2 className="text-2xl font-black tracking-tight">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 md:text-base">
            <li>
              <span className="font-extrabold text-neutral-900">1)</span> We post a curated drop with a target total.
            </li>
            <li>
              <span className="font-extrabold text-neutral-900">2)</span> You join with one checkout.
            </li>
            <li>
              <span className="font-extrabold text-neutral-900">3)</span> If the drop hits the target before the timer ends,
              we charge and fulfill.
            </li>
          </ol>
        </section>

        {/* Join */}
        <section id="join" className="mt-14 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:mt-16">
          <div className="text-lg font-black tracking-tight">Get notified when new drops go live</div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              placeholder="you@email.com"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400 sm:max-w-sm"
            />
            <button className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-neutral-800">
              Notify me
            </button>
          </div>

          <div className="mt-3 text-xs text-neutral-500">(We’ll wire this up to Supabase next.)</div>
        </section>

        <footer className="mt-10 text-xs text-neutral-500">© {new Date().getFullYear()} groupdrop</footer>
      </div>
    </main>
  );
}
