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
      <div className="max-w-5xl mx-auto px-5 py-14">

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
        <section className="mt-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight">
            Premium group buys,<br className="hidden sm:block" />
            without the chaos.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-xl">
            Join curated drops. Watch the total climb. When we hit the target, everyone gets the deal.
          </p>
        </section>

        {/* Drops Section */}
        <section id="drops" className="mt-20 grid md:grid-cols-2 gap-6">
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
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${percent}%` }}
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
        <section id="how" className="mt-20">
          <h2 className="text-2xl font-black">How it works</h2>
          <ol className="mt-6 space-y-3 text-neutral-700">
            <li>1. We post a curated drop with a target total.</li>
            <li>2. You join with one checkout.</li>
            <li>3. If the drop hits the target, we charge and fulfill.</li>
          </ol>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-xs text-neutral-500">
          © {new Date().getFullYear()} groupdrop
        </footer>
      </div>
    </main>
  );
}
