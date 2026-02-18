"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

/* ===============================
   Supabase Client
   (Uses your .env.local values)
================================ */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ===============================
   Types
================================ */
type Drop = {
  id: string;
  slug: string;
  title: string;
  target: number;
  raised: number;
  closes_at: string | null;
};

type SKU = {
  id: string;
  name: string;
  price: number; // cents or dollars? We'll treat as dollars for now (simple).
};

/* ===============================
   Page
================================ */
export default function AesopDropPage() {
  // --- This page is hardcoded to the "aesop" slug for now ---
  const slug = "aesop";

  const [drop, setDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ===============================
     Fake SKUs for now (Phase plan)
     Later: pull these from Supabase too.
  ================================= */
  const skus: SKU[] = useMemo(
    () => [
      { id: "aesop-1", name: "Aesop Resurrection Hand Wash (500ml)", price: 45 },
      { id: "aesop-2", name: "Aesop Resurrection Hand Balm (75ml)", price: 33 },
      { id: "aesop-3", name: "Aesop Hand Care Duo (Bundle)", price: 72 },
    ],
    []
  );

  // quantity map: skuId -> qty
  const [qty, setQty] = useState<Record<string, number>>({
    "aesop-1": 1,
    "aesop-2": 0,
    "aesop-3": 0,
  });

  /* ===============================
     Fetch Drop from Supabase
================================ */
  async function fetchDrop() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("drops")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      setError(error.message);
      setDrop(null);
      setLoading(false);
      return;
    }

    setDrop(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchDrop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===============================
     Cart
================================ */
  const cartTotal = useMemo(() => {
    return skus.reduce((sum, item) => {
      const q = qty[item.id] ?? 0;
      return sum + item.price * q;
    }, 0);
  }, [qty, skus]);

  const percent = useMemo(() => {
    if (!drop) return 0;
    return Math.min(Math.round((drop.raised / drop.target) * 100), 100);
  }, [drop]);

  const remaining = useMemo(() => {
    if (!drop) return 0;
    return Math.max(drop.target - drop.raised, 0);
  }, [drop]);

  function inc(id: string) {
    setQty((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function dec(id: string) {
    setQty((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 0) - 1, 0) }));
  }

  /* ===============================
     Join Flow
     IMPORTANT:
     This writes raised += cartTotal to Supabase.
     It uses a "read current -> update" approach.

     Later (more robust):
     use an RPC function in Supabase to do atomic increment.
================================ */
  async function handleJoin() {
    if (!drop) return;
    if (cartTotal <= 0) return;
    if (drop.raised >= drop.target) return;

    setJoining(true);
    setError(null);

    // 1) Re-read latest value to reduce stale updates
    const { data: fresh, error: freshErr } = await supabase
      .from("drops")
      .select("id, raised, target")
      .eq("id", drop.id)
      .single();

    if (freshErr || !fresh) {
      setError(freshErr?.message ?? "Could not load latest drop data.");
      setJoining(false);
      return;
    }

    const newRaised = Math.min(fresh.raised + cartTotal, fresh.target);

    // 2) Update raised in Supabase
    const { error: updateErr } = await supabase
      .from("drops")
      .update({ raised: newRaised })
      .eq("id", drop.id);

    if (updateErr) {
      setError(updateErr.message);
      setJoining(false);
      return;
    }

    // 3) Re-fetch so UI reflects new raised
    await fetchDrop();
    setJoining(false);
  }

  /* ===============================
     UI
================================ */
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link href="/" className="font-black text-lg hover:opacity-70">
            groupdrop
          </Link>
          <div className="text-xs text-neutral-500">drop</div>
        </div>

        {/* Page Header */}
        <div className="mt-10">
          <div className="text-xs font-bold text-neutral-500">ACTIVE DROP</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            {loading ? "Loading..." : drop?.title ?? "Drop not found"}
          </h1>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          {/* Left: SKU list */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">Choose items</div>
              <div className="text-xs text-neutral-500">Add to cart</div>
            </div>

            <div className="mt-6 space-y-4">
              {skus.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 p-4"
                >
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      ${item.price.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => dec(item.id)}
                      className="h-9 w-9 rounded-full border border-neutral-300 font-bold hover:bg-neutral-100"
                    >
                      −
                    </button>
                    <div className="w-6 text-center font-bold">
                      {qty[item.id] ?? 0}
                    </div>
                    <button
                      onClick={() => inc(item.id)}
                      className="h-9 w-9 rounded-full border border-neutral-300 font-bold hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Summary / Join */}
          <aside className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="text-sm font-bold">Drop status</div>

            {/* Progress Bar */}
            <div className="mt-5 h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-3 flex justify-between text-sm text-neutral-600">
              <span>
                Raised:{" "}
                <span className="font-bold">
                  ${drop?.raised?.toLocaleString() ?? "—"}
                </span>
              </span>
              <span>
                {percent}% •{" "}
                <span className="font-bold">${remaining.toLocaleString()}</span>{" "}
                to go
              </span>
            </div>

            <div className="mt-6 rounded-xl border border-neutral-200 p-4">
              <div className="text-xs text-neutral-500">Cart total</div>
              <div className="mt-1 text-2xl font-black">
                ${cartTotal.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                This amount will be added to the drop total when you join.
              </div>
            </div>

            {/* Join Button */}
            <button
              onClick={handleJoin}
              disabled={
                joining ||
                loading ||
                !drop ||
                cartTotal <= 0 ||
                drop.raised >= drop.target
              }
              className={`mt-6 w-full px-5 py-3 rounded-xl font-bold transition ${
                joining || loading || !drop || cartTotal <= 0 || (drop && drop.raised >= drop.target)
                  ? "bg-neutral-300 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-90"
              }`}
            >
              {drop && drop.raised >= drop.target
                ? "Target reached"
                : cartTotal <= 0
                ? "Add items to join"
                : joining
                ? "Joining..."
                : `Join this drop (authorize $${cartTotal.toLocaleString()})`}
            </button>

            <p className="mt-4 text-xs text-neutral-500 leading-relaxed">
              Design mode: this simulates joining. In the real flow, we’ll
              authorize your card now and only charge if the drop completes.
            </p>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-xs text-neutral-500">
          © {new Date().getFullYear()} groupdrop
        </footer>
      </div>
    </main>
  );
}
