"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type RawDrop = {
  id: string;
  slug: string;
  name?: string | null;
  title?: string | null;
  target?: number | string | null;
  raised?: number | string | null;
  target_cents?: number | string | null;
  raised_cents?: number | string | null;
};

type NormalizedDrop = {
  id: string;
  slug: string;
  name: string;
  targetCents: number;
  raisedCents: number;
  usesCentsColumns: boolean;
};

type Sku = {
  id: string;
  name: string;
  subtitle: string | null;
  price_cents: number;
  tag?: string | null;
  sort_order: number;
};

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDrop(row: RawDrop): NormalizedDrop {
  const usesCentsColumns =
    row.target_cents !== undefined || row.raised_cents !== undefined;

  const targetCents = usesCentsColumns
    ? toNumber(row.target_cents)
    : Math.round(toNumber(row.target) * 100);

  const raisedCents = usesCentsColumns
    ? toNumber(row.raised_cents)
    : Math.round(toNumber(row.raised) * 100);

  return {
    id: row.id,
    slug: row.slug,
    name: row.title || row.name || "Untitled Drop",
    targetCents,
    raisedCents,
    usesCentsColumns,
  };
}

function moneyFromCents(cents: number) {
  const safe = Number.isFinite(cents) ? cents : 0;
  return `$${(safe / 100).toLocaleString()}`;
}

export default function AesopPage() {
  const [drop, setDrop] = useState<NormalizedDrop | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    setStatusMsg("");

    const { data: dropData, error: dropError } = await supabase
      .from("drops")
      .select("*")
      .eq("slug", "aesop")
      .maybeSingle();

    if (dropError || !dropData) {
      console.error("Could not load Aesop drop:", dropError);
      setStatusMsg("Could not load drop.");
      setLoading(false);
      return;
    }

    const normalizedDrop = normalizeDrop(dropData as RawDrop);
    setDrop(normalizedDrop);

    const { data: skuData, error: skuError } = await supabase
      .from("drop_skus")
      .select("id,name,subtitle,price_cents,tag,sort_order")
      .eq("drop_id", normalizedDrop.id)
      .order("sort_order", { ascending: true });

    if (skuError) {
      console.error("Could not load Aesop SKUs:", skuError);
      setStatusMsg("Could not load SKUs.");
      setLoading(false);
      return;
    }

    setSkus((skuData ?? []) as Sku[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const cartItems = useMemo(() => {
    return skus
      .map((s) => {
        const qty = qtyById[s.id] ?? 0;
        return {
          sku: s,
          qty,
          lineTotal: qty * toNumber(s.price_cents),
        };
      })
      .filter((x) => x.qty > 0);
  }, [skus, qtyById]);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, x) => sum + x.lineTotal, 0),
    [cartItems]
  );

  const percent = useMemo(() => {
    if (!drop || drop.targetCents <= 0) return 0;
    return Math.min(
      Math.round((drop.raisedCents / drop.targetCents) * 100),
      100
    );
  }, [drop]);

  const remaining = useMemo(() => {
    if (!drop) return 0;
    return Math.max(drop.targetCents - drop.raisedCents, 0);
  }, [drop]);

  function inc(id: string) {
    setQtyById((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
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

  async function handleJoin() {
    if (!drop) return;

    if (cartTotal <= 0) {
      setStatusMsg("Add items to your cart to join.");
      return;
    }

    const nextRaisedCents = Math.min(
      drop.raisedCents + cartTotal,
      drop.targetCents
    );

    const previousDrop = drop;

    setDrop({
      ...drop,
      raisedCents: nextRaisedCents,
    });

    clearCart();

    const updatePayload = drop.usesCentsColumns
      ? { raised_cents: nextRaisedCents }
      : { raised: nextRaisedCents / 100 };

    const { error } = await supabase
      .from("drops")
      .update(updatePayload)
      .eq("id", drop.id);

    if (error) {
      console.error(error);
      setDrop(previousDrop);
      setStatusMsg("Something went wrong. Try again.");
      return;
    }

    setStatusMsg("Joined successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading drop…</div>
      </main>
    );
  }

  if (!drop) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
        <div className="text-sm text-neutral-500">
          {statusMsg || "Drop not found."}
        </div>
      </main>
    );
  }

  const reachedTarget = drop.raisedCents >= drop.targetCents;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-black text-lg tracking-tight hover:opacity-70"
          >
            groupdrop <span className="font-semibold text-neutral-500">(beta)</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/#drops"
              className="inline-flex rounded-xl px-3 py-2 text-sm font-bold text-neutral-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 transition"
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

        <header className="mt-10">
          <div className="text-xs font-black tracking-wide text-neutral-500">
            ACTIVE DROP
          </div>

          <h1 className="mt-2 text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            {drop.name}
          </h1>

          <p className="mt-4 max-w-2xl text-sm sm:text-base text-neutral-600 leading-relaxed">
            Build your cart. Your total is what you’re authorizing if the drop completes and what pushes the progress forward.
          </p>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-neutral-500">DROP PROGRESS</div>
                <div className="mt-1 text-sm text-neutral-700">
                  Target:{" "}
                  <span className="font-black text-neutral-900">
                    {moneyFromCents(drop.targetCents)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-neutral-500">RAISED</div>
                <div className="mt-1 text-sm text-neutral-700">
                  <span className="font-black text-neutral-900">
                    {moneyFromCents(drop.raisedCents)}
                  </span>{" "}
                  <span className="text-neutral-500">({percent}%)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-neutral-900 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-neutral-600">
              <span>{moneyFromCents(remaining)} to go</span>
              <span>{reachedTarget ? "Target reached" : "Design mode"}</span>
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-black tracking-tight">Available SKUs</h2>
              <div className="text-xs text-neutral-500">
                Tap + / − to adjust quantity
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {skus.map((sku) => {
                const qty = qtyById[sku.id] ?? 0;

                return (
                  <div
                    key={sku.id}
                    className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="relative h-28 rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-50 border border-neutral-200 overflow-hidden">
                      {sku.tag ? (
                        <div className="absolute left-3 top-3 inline-flex rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-bold text-white">
                          {sku.tag}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black leading-snug">{sku.name}</div>
                        <div className="mt-1 text-xs text-neutral-600">{sku.subtitle}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black">
                          {moneyFromCents(sku.price_cents)}
                        </div>
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

                        <div className="w-10 text-center text-sm font-black">
                          {qty}
                        </div>

                        <button
                          onClick={() => inc(sku.id)}
                          className="h-9 w-10 rounded-lg text-sm font-black text-neutral-700 hover:bg-white"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-xs text-neutral-500">
                        Line:{" "}
                        <span className="font-bold text-neutral-800">
                          {moneyFromCents(qty * sku.price_cents)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside id="cart" className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-black tracking-tight">Your cart</h3>
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
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
                          {qty} × {moneyFromCents(sku.price_cents)}
                        </div>
                      </div>
                      <div className="text-sm font-black">
                        {moneyFromCents(lineTotal)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-neutral-700">Total</div>
                  <div className="text-lg font-black">{moneyFromCents(cartTotal)}</div>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={reachedTarget}
                  className={[
                    "mt-4 w-full rounded-xl px-4 py-3 text-sm font-black transition",
                    reachedTarget
                      ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                      : "bg-neutral-900 text-white hover:bg-neutral-800",
                  ].join(" ")}
                >
                  {reachedTarget
                    ? "Target reached"
                    : cartTotal <= 0
                    ? "Join this drop"
                    : `Join this drop (authorize ${moneyFromCents(cartTotal)})`}
                </button>

                {statusMsg ? (
                  <div className="mt-3 rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-700">
                    {statusMsg}
                  </div>
                ) : null}

                <p className="mt-4 text-xs leading-relaxed text-neutral-500">
                  Design mode: this simulates joining. In the real flow, we’ll authorize your card now and only charge if the drop completes.
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
