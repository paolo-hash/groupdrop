"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { use } from "react";
import { supabase } from "../../lib/supabaseClient";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
type RawDrop = {
  id: string;
  slug: string;
  name?: string | null;
  title?: string | null;
  target?: number | string | null;
  raised?: number | string | null;
  target_cents?: number | string | null;
  raised_cents?: number | string | null;
  /* CHANGE: Added closes_at for countdown */
  closes_at?: string | null;
};

type NormalizedDrop = {
  id: string;
  slug: string;
  name: string;
  targetCents: number;
  raisedCents: number;
  usesCentsColumns: boolean;
  /* CHANGE: Added closes_at for countdown */
  closesAt: string | null;
};

type Sku = {
  id: string;
  name: string;
  subtitle: string | null;
  price_cents: number;
  tag?: string | null;
  sort_order: number;
};

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
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
    /* CHANGE: Pass through closes_at for countdown */
    closesAt: row.closes_at ?? null,
  };
}

function moneyFromCents(cents: number) {
  const safe = Number.isFinite(cents) ? cents : 0;
  return "$" + (safe / 100).toLocaleString();
}

/* CHANGE: Countdown helper — returns live days/hours/mins/secs */
function getCountdown(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   Tier drop limits
───────────────────────────────────────────────────────────── */
const TIER_LIMITS: Record<string, number> = {
  essentialist: 2,
  enthusiast: 5,
  curator: Infinity,
};

type Profile = {
  tier: string | null;
  drops_used_this_month: number;
};

export default function DropPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [drop, setDrop] = useState<NormalizedDrop | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  /* CHANGE: Added profile state to track tier and drops used this month */
  const [profile, setProfile] = useState<Profile | null>(null);
  /* CHANGE: tick state for live countdown */
  const [tick, setTick] = useState(0);

  /* Member count — number of orders placed for this drop */
  const [memberCount, setMemberCount] = useState<number | null>(null);

  /* Animated raised amount — smoothly counts up when raisedCents changes */
  const [animatedRaisedCents, setAnimatedRaisedCents] = useState(0);
  const animRafRef = useRef<number>(0);
  const prevRaisedRef = useRef(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setStatusMsg("");
      setDrop(null);
      setSkus([]);
      setQtyById({});

      const { data: dropData, error: dropError } = await supabase
        .from("drops")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (dropError || !dropData) {
        console.error("Could not load drop:", dropError);
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
        console.error("Could not load SKUs:", skuError);
        setStatusMsg("Could not load SKUs.");
        setLoading(false);
        return;
      }

      setSkus((skuData ?? []) as Sku[]);

      /* Fetch member count — number of orders placed for this drop */
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("drop_id", normalizedDrop.id);
      setMemberCount(count ?? 0);

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  /* CHANGE: Fetch user profile to get tier and drops used this month */
  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("tier, drops_used_this_month")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data as Profile);
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  /* CHANGE: Countdown ticker — updates every second */
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  /* Realtime — update raised amount and member count live */
  useEffect(() => {
    if (!drop) return;
    const channel = supabase
      .channel(`drop-${drop.id}-realtime`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "drops", filter: `id=eq.${drop.id}` },
        (payload) => {
          const updated = normalizeDrop(payload.new as RawDrop);
          setDrop((prev) =>
            prev ? { ...prev, raisedCents: updated.raisedCents } : prev
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `drop_id=eq.${drop.id}` },
        () => {
          setMemberCount((prev) => (prev ?? 0) + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [drop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Animate the raised cents number when it changes (initial load + realtime updates) */
  useEffect(() => {
    if (!drop) return;
    const from = prevRaisedRef.current;
    const to = drop.raisedCents;
    cancelAnimationFrame(animRafRef.current);
    const duration = 1000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedRaisedCents(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        animRafRef.current = requestAnimationFrame(animate);
      } else {
        prevRaisedRef.current = to;
      }
    };
    animRafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRafRef.current);
  }, [drop?.raisedCents]); // eslint-disable-line react-hooks/exhaustive-deps

  const cartItems = useMemo(() => {
    return skus
      .map((s) => {
        const qty = qtyById[s.id] ?? 0;
        return { sku: s, qty, lineTotal: qty * toNumber(s.price_cents) };
      })
      .filter((x) => x.qty > 0);
  }, [skus, qtyById]);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, x) => sum + x.lineTotal, 0),
    [cartItems]
  );

  const percent = useMemo(() => {
    if (!drop || drop.targetCents <= 0) return 0;
    return Math.min(Math.round((drop.raisedCents / drop.targetCents) * 100), 100);
  }, [drop]);

  const remaining = useMemo(() => {
    if (!drop) return 0;
    return Math.max(drop.targetCents - drop.raisedCents, 0);
  }, [drop]);

  function inc(id: string) {
    setQtyById((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setStatusMsg("");
  }

  function dec(id: string) {
    setQtyById((prev) => {
      const next = { ...prev };
      const newVal = Math.max((next[id] ?? 0) - 1, 0);
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

    /*
      CHANGE: Drop slot enforcement.
      Check the user has not exceeded their tier limit before joining.
      Curators have Infinity limit so always pass.
    */
    if (profile) {
      const tier = profile.tier ?? "essentialist";
      const limit = TIER_LIMITS[tier] ?? 2;
      const used = profile.drops_used_this_month ?? 0;

      if (used >= limit) {
        setStatusMsg(
          tier === "essentialist"
            ? "You have reached your 2 drop limit for this month. Upgrade to Enthusiast for 5 drops, or Curator for unlimited."
            : "You have reached your 5 drop limit for this month. Upgrade to Curator for unlimited drops."
        );
        return;
      }
    }

    const nextRaisedCents = Math.min(drop.raisedCents + cartTotal, drop.targetCents);
    const previousDrop = drop;
    const previousProfile = profile;

    setDrop({ ...drop, raisedCents: nextRaisedCents });
    /*
      CHANGE: Optimistically increment drops_used_this_month in local state
      so the UI updates immediately without waiting for the DB call.
    */
    if (profile) {
      setProfile({ ...profile, drops_used_this_month: (profile.drops_used_this_month ?? 0) + 1 });
    }
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
      setProfile(previousProfile);
      setStatusMsg("Something went wrong. Try again.");
      return;
    }

    /*
      CHANGE: Increment drops_used_this_month in Supabase after successful join.
    */
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ drops_used_this_month: (profile?.drops_used_this_month ?? 0) + 1 })
        .eq("id", user.id);

      /*
        CHANGE: Write an order record to the orders table.
        Captures a snapshot of what the user ordered, the total,
        and links back to the user and drop for the order history.
      */
      const orderItems = cartItems.map((x) => ({
        sku_id: x.sku.id,
        name: x.sku.name,
        qty: x.qty,
        price_cents: x.sku.price_cents,
        line_total_cents: x.lineTotal,
      }));

      await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          drop_id: drop.id,
          drop_slug: drop.slug,
          drop_name: drop.name,
          items: orderItems,
          total_cents: cartTotal,
          status: "pending",
        });
    }

    setStatusMsg("Joined successfully.");
  }

  /* ── Loading / error states ───────────────────────────────── */
  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />
        <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
            Loading drop…
          </p>
        </main>
      </>
    );
  }

  if (!drop) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />
        <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
            {statusMsg || "Drop not found."}
          </p>
        </main>
      </>
    );
  }

  const reachedTarget = drop.raisedCents >= drop.targetCents;

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      {/*
        FIX: Changed from <style>{SHARED_STYLES}</style> to
        <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />.
        This is the correct React pattern for injecting a CSS string into a
        <style> tag and avoids Turbopack trying to parse the CSS content as
        ECMAScript. The @import line in SHARED_STYLES is also removed since
        fonts are now loaded in layout.tsx.
      */}
      <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />

      <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>

        {/* ── Nav ───────────────────────────────────────────── */}
        <header style={{
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(247,244,238,0.88)",
        }}>
          <div style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "68px",
          }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <span className="font-display" style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "0.04em", color: "var(--ink)" }}>
                groupdrop
              </span>
              <span style={{
                fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase",
                fontWeight: 500, color: "var(--gold)", border: "1px solid var(--gold)",
                padding: "2px 6px", opacity: 0.8,
              }}>
                beta
              </span>
            </Link>

            {/* CHANGE: Auth-aware nav — shows Account + Sign out when logged in */}
            <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <Link href="/#drops" className="nav-link" style={{ textDecoration: "none" }}>
                ← All drops
              </Link>
              {profile ? (
                <>
                  <Link href="/account" className="nav-link" style={{ textDecoration: "none" }}>
                    Account
                  </Link>
                  <button
                    onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                    className="nav-link"
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <a href="#cart" className="btn-primary" style={{ borderRadius: "2px", textDecoration: "none" }}>
                  View cart
                </a>
              )}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>

          {/* ── Drop Hero ─────────────────────────────────────── */}
          <section style={{ paddingTop: "100px" }}>

            <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
              <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)", flexShrink: 0 }} />
              <span className="status-badge" style={{
                color: reachedTarget ? "var(--gold)" : "var(--ink-muted)",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  backgroundColor: reachedTarget ? "var(--gold)" : "var(--ink-muted)",
                  display: "inline-block", opacity: reachedTarget ? 1 : 0.5,
                }} />
                {reachedTarget ? "Completed" : "Active Drop"}
              </span>

              {/* Early access badge — Curator tier only */}
              {profile?.tier === "curator" && !reachedTarget && (
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "9px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  color: "var(--gold)",
                  border: "1px solid var(--gold)",
                  padding: "3px 8px",
                  borderRadius: "2px",
                }}>
                  <span style={{
                    width: "5px", height: "5px", borderRadius: "50%",
                    backgroundColor: "var(--gold)", display: "inline-block",
                  }} />
                  Early Access
                </span>
              )}
            </div>

            <h1 className="font-display animate-fade-up delay-1" style={{
              fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 500,
              lineHeight: 1.02, letterSpacing: "-0.01em", marginBottom: "20px",
            }}>
              <em style={{ fontStyle: "italic" }}>{drop.name}</em>
            </h1>

            <p className="animate-fade-up delay-2" style={{
              fontSize: "15px", fontWeight: 300, lineHeight: 1.75,
              color: "var(--ink-muted)", maxWidth: "480px",
              letterSpacing: "0.01em", marginBottom: "52px",
            }}>
              Build your cart. Your total is what you&apos;re authorizing — and what pushes
              this drop toward the collective threshold.
            </p>

            {/* Progress card */}
            <div className="grain animate-fade-up delay-3" style={{
              backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
              borderRadius: "4px", padding: "32px", position: "relative",
              overflow: "hidden", marginBottom: "72px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>Raised</span>
                <span style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>Target</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
                <span className="font-display" style={{ fontSize: "28px", fontWeight: 500 }}>
                  {moneyFromCents(animatedRaisedCents)}
                </span>
                <span style={{ fontSize: "16px", color: "var(--ink-muted)", fontWeight: 300 }}>
                  {moneyFromCents(drop.targetCents)}
                </span>
              </div>
              <div style={{ height: "3px", backgroundColor: "var(--parchment)", borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
                <div className="progress-fill" style={{ height: "100%", width: mounted ? percent + "%" : "0%" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: "12px", fontWeight: 500, letterSpacing: "0.04em",
                  color: percent >= 80 ? "var(--gold)" : "var(--ink-muted)",
                }}>
                  {percent}% funded
                </span>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 300 }}>
                  {reachedTarget ? "Target reached" : moneyFromCents(remaining) + " to go"}
                </span>
              </div>

              {/* CHANGE: Countdown — shown inside the progress card below the bar */}
              {!reachedTarget && drop.closesAt && (() => {
                void tick;
                const cd = getCountdown(drop.closesAt);
                if (!cd) return (
                  <div style={{ marginTop: "20px", borderTop: "1px solid var(--parchment)", paddingTop: "16px" }}>
                    <p style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
                      Drop closed
                    </p>
                  </div>
                );
                const isUrgent = cd.days === 0;
                return (
                  <div style={{ marginTop: "20px", borderTop: "1px solid var(--parchment)", paddingTop: "16px" }}>
                    <p className={isUrgent ? "urgency-pulse" : ""} style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: isUrgent ? "var(--gold)" : "var(--ink-muted)", fontWeight: 500, marginBottom: "12px" }}>
                      {isUrgent ? "Closing soon" : "Closes in"}
                    </p>
                    <div style={{ display: "flex", gap: "16px" }}>
                      {[
                        { value: cd.days, label: "Days" },
                        { value: cd.hours, label: "Hrs" },
                        { value: cd.minutes, label: "Min" },
                        { value: cd.seconds, label: "Sec" },
                      ].map(({ value, label }) => (
                        <div key={label} style={{ textAlign: "center", minWidth: "44px" }}>
                          <div className="font-display" style={{ fontSize: "32px", fontWeight: 500, lineHeight: 1, color: isUrgent ? "var(--gold)" : value === 0 ? "var(--ink-muted)" : "var(--ink)" }}>
                            {String(value).padStart(2, "0")}
                          </div>
                          <div style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginTop: "4px" }}>
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Member count */}
              {memberCount !== null && (
                <div style={{ marginTop: "20px", borderTop: "1px solid var(--parchment)", paddingTop: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--ink-muted)", flexShrink: 0 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 300, letterSpacing: "0.02em" }}>
                    {memberCount === 0
                      ? "Be the first to join this drop"
                      : `${memberCount} member${memberCount === 1 ? "" : "s"} joined`}
                  </span>
                </div>
              )}

            </div>

          </section>

          <hr className="gold-rule" />

          {/* ── SKUs + Cart grid ───────────────────────────────── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "48px", paddingTop: "64px", alignItems: "start",
          }}>

            {/* ── SKU List ────────────────────────────────────── */}
            <section>
              <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
                Available Items
              </p>
              <h2 className="font-display" style={{ fontSize: "28px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "8px" }}>
                Select your SKUs
              </h2>
              <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 300, marginBottom: "32px", letterSpacing: "0.02em" }}>
                Tap + / − to adjust quantity
              </p>

              <div style={{ display: "grid", gap: "16px" }}>
                {skus.map((sku) => {
                  const qty = qtyById[sku.id] ?? 0;
                  return (
                    <div key={sku.id} className="drop-card grain" style={{
                      backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                      borderRadius: "4px", padding: "24px", position: "relative", overflow: "hidden",
                    }}>
                      {/* Image placeholder */}
                      <div style={{
                        height: "100px", backgroundColor: "var(--parchment)", borderRadius: "2px",
                        marginBottom: "20px", display: "flex", alignItems: "center",
                        justifyContent: "center", position: "relative", overflow: "hidden",
                      }}>
                        <span className="font-display" style={{
                          fontSize: "52px", fontWeight: 400, fontStyle: "italic",
                          color: "var(--gold)", opacity: 0.25, userSelect: "none", lineHeight: 1,
                        }}>
                          {sku.name.charAt(0)}
                        </span>
                        {sku.tag && (
                          <div style={{
                            position: "absolute", top: "10px", left: "10px",
                            backgroundColor: "var(--gold)", color: "var(--ink)",
                            fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase",
                            fontWeight: 500, padding: "3px 8px", borderRadius: "2px",
                          }}>
                            {sku.tag}
                          </div>
                        )}
                      </div>

                      {/* Name + price */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                        <h3 className="font-display" style={{ fontSize: "20px", fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                          {sku.name}
                        </h3>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="font-display" style={{ fontSize: "22px", fontWeight: 500 }}>
                            {moneyFromCents(sku.price_cents)}
                          </div>
                          <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
                            each
                          </div>
                        </div>
                      </div>

                      {sku.subtitle && (
                        <p style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink-muted)", marginBottom: "20px", lineHeight: 1.6 }}>
                          {sku.subtitle}
                        </p>
                      )}

                      {/* Qty stepper + line total */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: sku.subtitle ? 0 : "16px" }}>
                        <div style={{
                          display: "inline-flex", alignItems: "center",
                          border: "1px solid var(--gold)", borderRadius: "2px",
                          backgroundColor: "var(--parchment)", overflow: "hidden",
                        }}>
                          <button onClick={() => dec(sku.id)} disabled={qty === 0} style={{
                            width: "36px", height: "36px", fontSize: "16px", fontWeight: 400,
                            color: qty === 0 ? "var(--gold)" : "var(--ink)",
                            opacity: qty === 0 ? 0.3 : 1, backgroundColor: "transparent",
                            border: "none", cursor: qty === 0 ? "not-allowed" : "pointer", fontFamily: "inherit",
                          }}>−</button>
                          <div style={{ width: "36px", textAlign: "center", fontSize: "14px", fontWeight: 500, color: "var(--ink)", fontFamily: "inherit" }}>
                            {qty}
                          </div>
                          <button onClick={() => inc(sku.id)} style={{
                            width: "36px", height: "36px", fontSize: "16px", fontWeight: 400,
                            color: "var(--ink)", backgroundColor: "transparent", border: "none",
                            cursor: "pointer", fontFamily: "inherit",
                          }}>+</button>
                        </div>
                        <div>
                          <span style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>Line</span>{" "}
                          <span className="font-display" style={{ fontSize: "18px", fontWeight: 500 }}>
                            {moneyFromCents(qty * sku.price_cents)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Cart / Aside ──────────────────────────────────── */}
            <aside id="cart" style={{ position: "sticky", top: "88px", height: "fit-content" }}>
              <div className="grain" style={{
                backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                borderRadius: "4px", padding: "32px", position: "relative", overflow: "hidden",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "6px" }}>
                      Your Selection
                    </p>
                    <h3 className="font-display" style={{ fontSize: "24px", fontWeight: 500, letterSpacing: "-0.01em" }}>Cart</h3>
                  </div>
                  <button onClick={clearCart} disabled={cartItems.length === 0} className="nav-link" style={{
                    background: "none", border: "none",
                    cursor: cartItems.length === 0 ? "not-allowed" : "pointer",
                    opacity: cartItems.length === 0 ? 0.35 : 1,
                    paddingBottom: "4px", fontFamily: "inherit",
                  }}>
                    Clear
                  </button>
                </div>

                <hr className="gold-rule" style={{ marginBottom: "24px" }} />

                <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {cartItems.length === 0 ? (
                    <div style={{
                      border: "1px dashed var(--gold)", borderRadius: "2px",
                      backgroundColor: "var(--parchment)", padding: "20px", textAlign: "center",
                    }}>
                      <p style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", letterSpacing: "0.02em" }}>
                        Add items to see your cart total.
                      </p>
                    </div>
                  ) : (
                    cartItems.map(({ sku, qty, lineTotal }) => (
                      <div key={sku.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <div>
                          <p className="font-display" style={{ fontSize: "17px", fontWeight: 500, marginBottom: "3px" }}>{sku.name}</p>
                          <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 300, letterSpacing: "0.02em" }}>
                            {qty} × {moneyFromCents(sku.price_cents)}
                          </p>
                        </div>
                        <span className="font-display" style={{ fontSize: "18px", fontWeight: 500, flexShrink: 0 }}>
                          {moneyFromCents(lineTotal)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <hr className="gold-rule" style={{ marginBottom: "20px" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px" }}>
                  <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>Total</span>
                  <span className="font-display" style={{ fontSize: "32px", fontWeight: 500 }}>
                    {moneyFromCents(cartTotal)}
                  </span>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={reachedTarget}
                  className={reachedTarget ? "" : "btn-primary"}
                  style={{
                    width: "100%", borderRadius: "2px", border: "none",
                    cursor: reachedTarget ? "not-allowed" : "pointer", fontFamily: "inherit",
                    ...(reachedTarget ? {
                      backgroundColor: "var(--parchment)", color: "var(--ink-muted)",
                      fontSize: "11px", letterSpacing: "0.08em",
                      textTransform: "uppercase" as const, fontWeight: 500, padding: "12px 24px",
                    } : {}),
                  }}
                >
                  {reachedTarget
                    ? "Target reached"
                    : cartTotal <= 0
                    ? "Join this drop \u2192"
                    : "Authorize " + moneyFromCents(cartTotal) + " \u2192"}
                </button>

                {statusMsg && (
                  <div style={{
                    marginTop: "16px", borderLeft: "2px solid var(--gold)",
                    backgroundColor: "var(--parchment)", padding: "10px 10px 10px 14px",
                    borderRadius: "0 2px 2px 0",
                  }}>
                    <p style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 400, letterSpacing: "0.01em" }}>
                      {statusMsg}
                    </p>
                  </div>
                )}

                <p style={{ marginTop: "20px", fontSize: "11px", fontWeight: 300, lineHeight: 1.7, color: "var(--ink-muted)", letterSpacing: "0.01em" }}>
                  Design mode: this simulates joining. In the real flow, we&apos;ll
                  authorize your card now and only charge if the drop completes.
                </p>
              </div>
            </aside>

          </div>

          {/* ── Footer ──────────────────────────────────────────── */}
          <hr className="gold-rule" style={{ marginTop: "120px" }} />
          <footer style={{
            padding: "28px 0 40px", display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: "12px",
          }}>
            <span className="font-display" style={{ fontSize: "15px", fontWeight: 400, letterSpacing: "0.05em", color: "var(--ink-muted)" }}>
              groupdrop
            </span>
            <span style={{ fontSize: "10px", letterSpacing: "0.12em", color: "var(--ink-muted)", fontWeight: 300 }}>
              &copy; {new Date().getFullYear()} groupdrop. All rights reserved.
            </span>
          </footer>

        </div>
      </main>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   SHARED_STYLES
   FIX: Converted from a backtick template literal to a plain
   string concatenation. Turbopack's ECMAScript parser was
   choking on the special characters in the @import URL when
   it appeared inside a template literal. Using a regular
   string (or dangerouslySetInnerHTML as above) sidesteps this.

   The @import line is also removed — fonts are now loaded
   via <link> tags in app/layout.tsx where they belong.
───────────────────────────────────────────────────────────── */
const SHARED_STYLES = [
  ":root {",
  "  --cream: #F7F4EE;",
  "  --parchment: #EDE9E0;",
  "  --ink: #1A1814;",
  "  --ink-muted: #6B6560;",
  "  --gold: #B89A6A;",
  "  --gold-light: #D4B896;",
  "  --border: rgba(26,24,20,0.10);",
  "}",
  "body { background: var(--cream); font-family: 'Jost', sans-serif; }",
  ".font-display { font-family: 'Cormorant Garamond', Georgia, serif; }",
  ".grain::after {",
  "  content: '';",
  "  position: absolute;",
  "  inset: 0;",
  "  background-image: url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\");",
  "  border-radius: inherit;",
  "  pointer-events: none;",
  "  opacity: 0.4;",
  "}",
  "::-webkit-scrollbar { width: 4px; }",
  "::-webkit-scrollbar-track { background: var(--cream); }",
  "::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }",
  ".nav-link { position: relative; letter-spacing: 0.12em; font-size: 11px; font-weight: 500; text-transform: uppercase; color: var(--ink-muted); transition: color 0.2s; }",
  ".nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--gold); transition: width 0.3s ease; }",
  ".nav-link:hover { color: var(--ink); }",
  ".nav-link:hover::after { width: 100%; }",
  ".progress-fill { background: linear-gradient(90deg, var(--gold), var(--gold-light)); transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); }",
  ".drop-card { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }",
  ".drop-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(26,24,20,0.08); border-color: var(--gold); }",
  ".btn-primary { background: var(--gold); color: var(--ink); letter-spacing: 0.08em; font-size: 11px; font-weight: 500; text-transform: uppercase; padding: 12px 24px; display: inline-block; transition: background 0.2s ease, transform 0.15s ease; }",
  ".btn-primary:hover { background: var(--gold-light); transform: translateY(-1px); }",
  "@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }",
  ".animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }",
  ".delay-1 { animation-delay: 0.1s; }",
  ".delay-2 { animation-delay: 0.25s; }",
  ".delay-3 { animation-delay: 0.4s; }",
  ".gold-rule { border: none; border-top: 1px solid var(--gold); opacity: 0.35; margin: 0; }",
  ".status-badge { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 500; font-family: 'Jost', sans-serif; }",
  "@keyframes urgencyPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }",
  ".urgency-pulse { animation: urgencyPulse 1.8s ease-in-out infinite; }",
].join("\n");