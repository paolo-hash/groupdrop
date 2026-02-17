"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Sku = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  tag?: string;
};

const LE_LABO_RAISED_KEY = "groupdrop:raised:lelabo";
const TARGET = 7500;
const DEFAULT_RAISED = 900;

const SKUS: Sku[] = [
  { id: "discovery-set", name: "Discovery Set", subtitle: "17 samples • Best intro", price: 79, tag: "Popular" },
  { id: "santal-33", name: "Santal 33", subtitle: "15mL • Travel spray", price: 89, tag: "Icon" },
  { id: "another-13", name: "Another 13", subtitle: "15mL • Travel spray", price: 89 },
  { id: "the-matcha-26", name: "Thé Matcha 26", subtitle: "15mL • Travel spray", price: 89 },
  { id: "hand-pomade", name: "Hand Pomade", subtitle: "55mL • Light hydration", price: 29 },
  { id: "shipping-protection", name: "Shipping Protection", subtitle: "Optional • Peace of mind", price: 4 },
];

function money(n: number) {
  return `$${n.toLocaleString()}`;
}

/* ---------- Countdown Utilities ---------- */

// Next Friday at 5:00 PM (local time)
function getNextFriday5pm(): Date {
  const now = new Date();
  const end = new Date(now);
  const day = end.getDay(); // Sun=0 ... Fri=5
  const daysUntilFriday = (5 - day + 7) % 7;

  end.setDate(end.getDate() + daysUntilFriday);
  end.setHours(17, 0, 0, 0);

  if (end.getTime() <= now.getTime()) {
    end.setDate(end.getDate() + 7);
  }

  return end;
}

function formatJoinBy(end: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(end);
}

function formatTimeLeft(msLeft: number) {
  if (msLeft <= 0) return "0h";

  const totalMinutes = Math.floor(msLeft / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default function DropPage() {
  const [raised, setRaised] = useState<number>(DEFAULT_RAISED);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [statusMsg, setStatusMsg] = useState<string>("");

  /* ---------- Countdown State ---------- */

  const [nowTick, setNowTick] = useState<number>(Date.now());
  const endDate = useMemo(() => getNextFriday5pm(), []);
  const joinByText = useMemo(() => formatJoinBy(endDate), [endDate]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const timeLeftText = useMemo(() => {
    const ms = endDate.getTime() - nowTick;
    return formatTimeLeft(ms);
  }, [endDate, nowTick]);

  /* ---------- Load + Persist Raised ---------- */

  useEffect(() => {
    const saved = localStorage.getItem(LE_LABO_RAISED_KEY);
    if (saved) {
      const val = Number(saved);
      if (!Number.isNaN(val)) setRaised(val);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LE_LABO_RAISED_KEY, String(raised));
  }, [raised]);

  /* ---------- Cart Logic ---------- */

  const cartItems = useMemo(() => {
    return SKUS.map((s) => {
      const qty = qtyById[s.id] ?? 0;
      return { sku: s, qty, lineTotal: qty * s.price };
    }).filter((x) => x.qty > 0);
  }, [qtyById]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, x) => sum + x.lineTotal, 0);
  }, [cartItems]);

  const percent = useMemo(() => Math.min(Math.round((raised / TARGET) * 100), 100), [raised]);
  const remaining = useMemo(() => Math.max(TARGET - raised, 0), [raised]);

  const previewRaised = Math.min(raised + cartTotal, TARGET);
  const previewPercent = Math.min(Math.round((previewRaised / TARGET) * 100), 100);

  function inc(id: string) {
    setQtyById((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setStatusMsg("");
  }

  function dec(id: string) {
    setQtyById((prev) => {
      const next = { ...prev };
      const current = next[id] ?? 0;
      const newVal = Math.max(current - 1, 0);
      if (newVal === 0) delete next[id];
      else next[id] = newVal;
      return next;
    });
    setStatusMsg("");
  }

  function clearCart() {
    setQtyById({});
    setStatusMsg("");
  }

  function handleJoin() {
    if (raised >= TARGET) return;

    if (cartTotal <= 0) {
      setStatusMsg("Add items to your cart to join.");
      return;
    }

    const nextRaised = Math.min(raised + cartTotal, TARGET);
    const delta = nextRaised - raised;

    setRaised(nextRaised);
    clearCart();

    setStatusMsg(
      nextRaised >= TARGET
        ? `Joined. ${money(delta)} added. Target reached.`
        : `Joined. ${money(delta)} added to the drop total.`
    );
  }

  function resetDemo() {
    setRaised(DEFAULT_RAISED);
    setQtyById({});
    setStatusMsg("Demo reset to the starting amount.");
    localStorage.setItem(LE_LABO_RAISED_KEY, String(DEFAULT_RAISED));
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="font-black text-lg tracking-tight hover:opacity-70">
            groupdrop <span className="font-semibold text-neutral-500">(beta)</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/#drops"
              className="hidden sm:inline-flex rounded-xl px-3 py-2 text-sm font-bold text-neutral-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 transition"
            >
              Back to drops
            </Link>
            <a
              href="#cart"
              className="inline-flex rounded-xl px-3 py-2 text-sm font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition"
            >
              View cart
            </a>
          </div>
        </div>

        {/* Header */}
        <header className="mt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600 shadow-sm">
            UP NEXT
            <span className="h-1 w-1 rounded-full bg-neutral-300" />
            Time left <span className="text-neutral-900">{timeLeftText}</span>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Le Labo Discovery Set
          </h1>

          <p className="mt-3 max-w-2xl text-sm sm:text-base text-neutral-600 leading-relaxed">
            Build your cart. Your total is what you’re authorizing if the drop completes and what pushes the progress forward.
          </p>

          <div className="mt-2 text-xs text-neutral-500">
            Join by <span className="font-bold text-neutral-700">{joinByText}</span>
          </div>

          {/* Progress */}
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-neutral-500">DROP PROGRESS</div>
                <div className="mt-1 text-sm text-neutral-700">
                  Target: <span className="font-black text-neutral-900">{money(TARGET)}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-neutral-500">RAISED</div>
                <div className="mt-1 text-sm text-neutral-700">
                  <span className="font-black text-neutral-900">{money(raised)}</span>{" "}
                  <span className="text-neutral-500">({percent}%)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full bg-neutral-900 transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-neutral-600">
              <span>{money(remaining)} to go</span>
              <span>Time left: {timeLeftText}</span>
            </div>

            <div className="mt-4 text-xs text-neutral-600">
              {cartTotal > 0 ? (
                <>
                  If you join with this cart:{" "}
                  <span className="font-extrabold text-neutral-900">+{money(cartTotal)}</span> →{" "}
                  <span className="font-extrabold text-neutral-900">{previewPercent}%</span> ({money(previewRaised)})
                </>
              ) : (
                <>Add items to see how your join affects progress.</>
              )}
            </div>
          </div>
        </header>

        {/* Content grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* SKU grid */}
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-black tracking-tight">Available SKUs</h2>
              <div className="text-xs text-neutral-500">Tap + / − to adjust quantity</div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {SKUS.map((sku) => {
                const qty = qtyById[sku.id] ?? 0;

                return (
                  <div
                    key={sku.id}
                    className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="relative h-32 rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-50 border border-neutral-200 overflow-hidden">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-neutral-200/60" />
                        <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-neutral-200/50" />
                      </div>

                      {sku.tag && (
                        <div className="absolute left-3 top-3 inline-flex rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-bold text-white">
                          {sku.tag}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black leading-snug">{sku.name}</div>
                        <div className="mt-1 text-xs text-neutral-600">{sku.subtitle}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black">{money(sku.price)}</div>
                        <div className="text-[11px] text-neutral-500">each</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                        <button
                          onClick={() => dec(sku.id)}
                          className="h-9 w-10 rounded-lg text-sm font-black text-neutral-700 hover:bg-white disabled:opacity-40"
                          disabled={qty === 0}
                        >
                          −
                        </button>
                        <div className="w-10 text-center text-sm font-black">{qty}</div>
                        <button
                          onClick={() => inc(sku.id)}
                          className="h-9 w-10 rounded-lg text-sm font-black text-neutral-700 hover:bg-white"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-xs text-neutral-500">
                        Line: <span className="font-bold text-neutral-800">{money(qty * sku.price)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Cart */}
          <aside id="cart" className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-black tracking-tight">Your cart</h3>
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-900"
                  disabled={cartItems.length === 0}
                >
                  Clear
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                    Add items to see your cart total.
                  </div>
                ) : (
                  cartItems.map(({ sku, qty, lineTotal }) => (
                    <div key={sku.id} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold">{sku.name}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {qty} × {money(sku.price)}
                        </div>
                      </div>
                      <div className="text-sm font-black">{money(lineTotal)}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-neutral-700">Total</div>
                  <div className="text-lg font-black">{money(cartTotal)}</div>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={raised >= TARGET}
                  className={[
                    "mt-4 w-full rounded-xl px-4 py-3 text-sm font-black transition",
                    raised >= TARGET
                      ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                      : "bg-neutral-900 text-white hover:bg-neutral-800",
                  ].join(" ")}
                >
                  {raised >= TARGET
                    ? "Target reached"
                    : cartTotal <= 0
                    ? "Join this drop"
                    : `Join this drop (authorize ${money(cartTotal)})`}
                </button>

                {statusMsg && (
                  <div className="mt-3 rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-700">
                    {statusMsg}
                  </div>
                )}

                <button
                  onClick={resetDemo}
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Reset demo
                </button>

                <p className="mt-4 text-xs leading-relaxed text-neutral-500">
                  You’ll see a temporary authorization. We only charge if the drop completes.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-14 text-xs text-neutral-500">© {new Date().getFullYear()} groupdrop</footer>
      </div>
    </main>
  );
}
