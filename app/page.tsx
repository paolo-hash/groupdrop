"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const AESOP = {
  title: "Aesop Hand Wash Bundle",
  href: "/drops/aesop",
  target: 5000,
  storageKey: "groupdrop:raised:aesop",
  defaultRaised: 3100,
  badge: "ACTIVE DROP",
};

const LELABO = {
  title: "Le Labo Discovery Set",
  href: "/drops/lelabo",
  target: 7500,
  storageKey: "groupdrop:raised:lelabo",
  defaultRaised: 900,
  badge: "UP NEXT",
};

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

function clampPercent(raised: number, target: number) {
  return Math.min(Math.round((raised / target) * 100), 100);
}

// Next Friday at 5:00 PM (local time)
// If it's already past Friday 5pm this week, it uses next week.
function getNextFriday5pm(): Date {
  const now = new Date();
  const end = new Date(now);
  const day = end.getDay(); // Sun=0 ... Fri=5
  const daysUntilFriday = (5 - day + 7) % 7;

  end.setDate(end.getDate() + daysUntilFriday);
  end.setHours(17, 0, 0, 0);

  // If we're already past Fri 5pm today, move to next Friday
  if (end.getTime() <= now.getTime()) {
    end.setDate(end.getDate() + 7);
  }

  return end;
}

function formatJoinBy(end: Date) {
  // Example: "Fri 5:00 PM PT" (will show local TZ name)
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(end);

  return parts;
}

function formatTimeLeft(msLeft: number) {
  if (msLeft <= 0) return "0h";

  const totalMinutes = Math.floor(msLeft / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default function Home() {
  const [aesopRaised, setAesopRaised] = useState<number>(AESOP.defaultRaised);
  const [lelaboRaised, setLelaboRaised] = useState<number>(LELABO.defaultRaised);

  // Countdown state (same deadline across site)
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const endDate = useMemo(() => getNextFriday5pm(), []);
  const joinByText = useMemo(() => formatJoinBy(endDate), [endDate]);

  useEffect(() => {
    // update once per minute (premium feel without being noisy)
    const t = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const timeLeftText = useMemo(() => {
    const ms = endDate.getTime() - nowTick;
    return formatTimeLeft(ms);
  }, [endDate, nowTick]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedA = localStorage.getItem(AESOP.storageKey);
    if (savedA) {
      const val = Number(savedA);
      if (!Number.isNaN(val)) setAesopRaised(val);
    }

    const savedL = localStorage.getItem(LELABO.storageKey);
    if (savedL) {
      const val = Number(savedL);
      if (!Number.isNaN(val)) setLelaboRaised(val);
    }
  }, []);

  // Sync across tabs/windows
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === AESOP.storageKey && e.newValue) {
        const val = Number(e.newValue);
        if (!Number.isNaN(val)) setAesopRaised(val);
      }
      if (e.key === LELABO.storageKey && e.newValue) {
        const val = Number(e.newValue);
        if (!Number.isNaN(val)) setLelaboRaised(val);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const aesopPercent = clampPercent(aesopRaised, AESOP.target);
  const aesopRemaining = Math.max(AESOP.target - aesopRaised, 0);

  const lelaboPercent = clampPercent(lelaboRaised, LELABO.target);
  const lelaboRemaining = Math.max(LELABO.target - lelaboRaised, 0);

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
              View drops
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
          {/* Aesop */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-extrabold tracking-wide text-neutral-600">{AESOP.badge}</div>
            <div className="mt-2 text-2xl font-black">{AESOP.title}</div>

            <div className="mt-2 flex items-center justify-between text-sm text-neutral-700">
              <div>
                Target: <span className="font-extrabold text-neutral-900">{money(AESOP.target)}</span>
              </div>
              <div className="text-neutral-600">
                Time left: <span className="font-extrabold text-neutral-900">{timeLeftText}</span>
              </div>
            </div>

            <div className="mt-1 text-xs text-neutral-500">
              Join by <span className="font-bold text-neutral-700">{joinByText}</span>
            </div>

            <div className="mt-5 h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-neutral-900 transition-all duration-500"
                style={{ width: `${aesopPercent}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-neutral-700">
              <div>
                Raised: <span className="font-extrabold text-neutral-900">{money(aesopRaised)}</span>
              </div>
              <div>
                {aesopPercent}% • <span className="font-extrabold text-neutral-900">{money(aesopRemaining)}</span> to go
              </div>
            </div>

            <Link
              href={AESOP.href}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-extrabold text-white hover:bg-neutral-800"
            >
              Join this drop
            </Link>

            <p className="mt-4 text-xs leading-relaxed text-neutral-600">
              You’ll see a temporary authorization. We only charge if the drop completes.
            </p>
          </div>

          {/* Le Labo */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-extrabold tracking-wide text-neutral-600">{LELABO.badge}</div>
            <div className="mt-2 text-2xl font-black">{LELABO.title}</div>

            <div className="mt-2 flex items-center justify-between text-sm text-neutral-700">
              <div>
                Target: <span className="font-extrabold text-neutral-900">{money(LELABO.target)}</span>
              </div>
              <div className="text-neutral-600">
                Time left: <span className="font-extrabold text-neutral-900">{timeLeftText}</span>
              </div>
            </div>

            <div className="mt-1 text-xs text-neutral-500">
              Join by <span className="font-bold text-neutral-700">{joinByText}</span>
            </div>

            <div className="mt-5 h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-neutral-900 transition-all duration-500"
                style={{ width: `${lelaboPercent}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-neutral-700">
              <div>
                Raised: <span className="font-extrabold text-neutral-900">{money(lelaboRaised)}</span>
              </div>
              <div>
                {lelaboPercent}% • <span className="font-extrabold text-neutral-900">{money(lelaboRemaining)}</span> to go
              </div>
            </div>

            <Link
              href={LELABO.href}
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-extrabold text-neutral-900 hover:bg-neutral-50"
            >
              View this drop
            </Link>

            <p className="mt-4 text-xs leading-relaxed text-neutral-600">
              Join early to help unlock the drop. When the target hits, everyone gets the deal.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-14 md:mt-16">
          <h2 className="text-2xl font-black tracking-tight">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-700 md:text-base">
            <li>
              <span className="font-extrabold text-neutral-900">1)</span> We post curated drops with a target total.
            </li>
            <li>
              <span className="font-extrabold text-neutral-900">2)</span> You build a cart and join with one checkout.
            </li>
            <li>
              <span className="font-extrabold text-neutral-900">3)</span> If the drop hits the target, we charge and fulfill.
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
