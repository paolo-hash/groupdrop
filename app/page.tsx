"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

/* ===============================
   Supabase Client
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
  closes_at: string;
};

/* ===============================
   Page
================================ */
export default function Home() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  /* ===============================
     Fetch Drops
  ================================= */
  useEffect(() => {
    async function fetchDrops() {
      const { data, error } = await supabase
        .from("drops")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setDrops(data);
      }

      setLoading(false);
    }

    fetchDrops();
  }, []);

  /* trigger progress animation */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  /* ===============================
     Helpers
  ================================= */
  function getPercent(raised: number, target: number) {
    return Math.min(Math.round((raised / target) * 100), 100);
  }

  function getRemaining(raised: number, target: number) {
    return Math.max(target - raised, 0);
  }

  /* ===============================
     Render
  ================================= */
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="max-w-6xl mx-auto px-5 py-16">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="font-black text-lg">groupdrop (beta)</div>

          <div className="hidden md:flex gap-6 text-sm">
            <a href="#drops" className="hover:opacity-60">Drops</a>
            <a href="#how" className="hover:opacity-60">How it works</a>
            <a href="#join" className="hover:opacity-60">Join</a>
          </div>
        </div>

        {/* Hero */}
        <section className="mt-24">

          <h1 className="font-black tracking-tight leading-[1.03] text-[34px] sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
            <span className="whitespace-nowrap">Luxury essentials,</span>{" "}
            <span className="sm:block">at the price the industry pays.</span>
          </h1>

          <p className="mt-7 text-[15px] sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
            Stop paying the retail markup. We aggregate individual demand to unlock insider pricing on brands that never go on sale.
          </p>

        </section>

        {/* Drops Section */}
        <section id="drops" className="mt-28 grid md:grid-cols-2 gap-6">

          {loading && <div>Loading drops...</div>}

          {!loading && drops.map((drop) => {

            const percent = getPercent(drop.raised, drop.target);
            const remaining = getRemaining(drop.raised, drop.target);

            return (
              <div
                key={drop.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm"
              >

                <div className="text-xs font-bold text-neutral-500">
                  {drop.raised >= drop.target ? "COMPLETED" : "ACTIVE DROP"}
                </div>

                <h2 className="mt-2 text-xl sm:text-2xl font-black">
                  {drop.title}
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  Target:{" "}
                  <span className="font-bold">
                    ${drop.target.toLocaleString()}
                  </span>
                </p>

                {/* Progress Bar */}
                <div className="mt-6 h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-1000 ease-out"
                    style={{
                      width: mounted ? `${percent}%` : "0%"
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-sm text-neutral-600">
                  <span>
                    Raised:{" "}
                    <span className="font-bold">
                      ${drop.raised.toLocaleString()}
                    </span>
                  </span>

                  <span>
                    {percent}% •{" "}
                    <span className="font-bold">
                      ${remaining.toLocaleString()}
                    </span>{" "}
                    to go
                  </span>
                </div>

                <Link
                  href={`/drops/${drop.slug}`}
                  className="mt-6 px-5 py-3 rounded-xl font-bold bg-black text-white hover:opacity-90 transition inline-block"
                >
                  View drop
                </Link>

              </div>
            );
          })}

        </section>

        {/* How it Works */}
        <section id="how" className="mt-28">

          <h2 className="text-2xl font-black">How it works</h2>

          <ol className="mt-6 space-y-3 text-neutral-700 max-w-xl">

            <li>
              1. The Allocation: We curate a weekly drop from premium brands like Aesop and Le Labo.
            </li>

            <li>
              2. The Commitment: Secure your items at insider prices. We won't charge you until the collective order is met.
            </li>

            <li>
              3. The Fulfillment: Once the target is hit, we authorize payments and ship the goods directly to your door.
            </li>

          </ol>

        </section>

        {/* Footer */}
        <footer className="mt-20 text-xs text-neutral-500">
          © {new Date().getFullYear()} groupdrop
        </footer>

      </div>
    </main>
  );
}
