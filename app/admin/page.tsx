"use client";

/*
  File location: app/admin/page.tsx

  Internal admin dashboard — shows all orders across every drop.
  Protected by email check against NEXT_PUBLIC_ADMIN_EMAIL env var.
  Set that variable in Vercel (and locally in .env.local) to your email.
*/

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type OrderItem = {
  name: string;
  qty: number;
  price_cents: number;
  line_total_cents: number;
};

type Order = {
  id: string;
  user_email: string;
  user_name: string | null;
  drop_id: string;
  drop_slug: string;
  drop_name: string;
  items: OrderItem[];
  total_cents: number;
  status: string;
  created_at: string;
};

type Drop = {
  id: string;
  slug: string;
  title?: string | null;
  name?: string | null;
  raised_cents?: number | null;
  raised?: number | null;
  target_cents?: number | null;
  target?: number | null;
};

type WaitlistEntry = {
  id: string;
  user_email: string;
  user_name: string | null;
  drop_slug: string;
  drop_name: string;
  created_at: string;
};

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;
type OrderStatus = typeof STATUS_FLOW[number];

function statusColor(status: string): { bg: string; color: string } {
  switch (status) {
    case "confirmed": return { bg: "#EAE4D8", color: "#6B6560" };
    case "shipped":   return { bg: "#D4C9A8", color: "#3D3830" };
    case "delivered": return { bg: "var(--gold)", color: "var(--ink)" };
    default:          return { bg: "var(--parchment)", color: "var(--ink-muted)" };
  }
}

function money(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dropDisplayName(d: Drop) {
  return d.title || d.name || d.slug;
}

function raisedCents(d: Drop) {
  if (d.raised_cents != null) return Number(d.raised_cents);
  if (d.raised != null) return Math.round(Number(d.raised) * 100);
  return 0;
}

function targetCents(d: Drop) {
  if (d.target_cents != null) return Number(d.target_cents);
  if (d.target != null) return Math.round(Number(d.target) * 100);
  return 0;
}

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "waitlist">("orders");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/admin");
        return;
      }

      if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
        router.push("/");
        return;
      }

      setAuthorized(true);

      const [{ data: ordersData }, { data: dropsData }, { data: waitlistData }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("drops").select("*").order("created_at", { ascending: false }),
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
      ]);

      setOrders((ordersData ?? []) as Order[]);
      setDrops((dropsData ?? []) as Drop[]);
      setWaitlist((waitlistData ?? []) as WaitlistEntry[]);
      setLoading(false);
    }

    init();
  }, [router]);

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  }

  if (!authorized || loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />
        <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
            {authorized ? "Loading…" : "Checking access…"}
          </p>
        </main>
      </>
    );
  }

  const filteredOrders = selectedSlug === "all"
    ? orders
    : orders.filter((o) => o.drop_slug === selectedSlug);

  const totalAuthorized = filteredOrders.reduce((s, o) => s + o.total_cents, 0);
  const uniqueMembers = new Set(filteredOrders.map((o) => o.user_email)).size;
  const allAuthorized = orders.reduce((s, o) => s + o.total_cents, 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />
      <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>

        {/* ── Nav ───────────────────────────────────────────── */}
        <header style={{
          borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(12px)", backgroundColor: "rgba(247,244,238,0.88)",
        }}>
          <div style={{
            maxWidth: "1200px", margin: "0 auto", padding: "0 28px",
            display: "flex", justifyContent: "space-between", alignItems: "center", height: "68px",
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
                admin
              </span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <Link href="/" className="nav-link" style={{ textDecoration: "none" }}>← Site</Link>
              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                className="nav-link"
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 28px" }}>

          {/* ── Hero ──────────────────────────────────────────── */}
          <section style={{ paddingTop: "64px", paddingBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
              <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                Admin
              </span>
            </div>
            <h1 className="font-display" style={{
              fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 500,
              lineHeight: 1.02, letterSpacing: "-0.01em", marginBottom: "0",
            }}>
              <em style={{ fontStyle: "italic" }}>Order overview.</em>
            </h1>
          </section>

          <hr className="gold-rule" />

          {/* ── Summary metrics ───────────────────────────────── */}
          <section style={{ paddingTop: "40px", paddingBottom: "40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              {[
                { label: "Total orders", value: String(orders.length) },
                { label: "Total authorized", value: money(allAuthorized) },
                { label: "Unique members", value: String(new Set(orders.map((o) => o.user_email)).size) },
                { label: "Waitlisted", value: String(waitlist.length) },
                { label: "Active drops", value: String(drops.length) },
              ].map(({ label, value }) => (
                <div key={label} className="grain" style={{
                  backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                  borderRadius: "4px", padding: "24px 28px",
                  position: "relative", overflow: "hidden",
                }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "10px" }}>
                    {label}
                  </p>
                  <p className="font-display" style={{ fontSize: "32px", fontWeight: 500, lineHeight: 1 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr className="gold-rule" />

          {/* ── View tabs ─────────────────────────────────────── */}
          <section style={{ paddingTop: "40px", paddingBottom: "0" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
              {(["orders", "waitlist"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase",
                    fontWeight: 500, fontFamily: "inherit", cursor: "pointer", background: "none",
                    border: "none", padding: "10px 4px",
                    borderBottom: activeTab === tab ? "2px solid var(--gold)" : "2px solid transparent",
                    color: activeTab === tab ? "var(--ink)" : "var(--ink-muted)",
                    marginBottom: "-1px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab === "orders" ? `Orders (${orders.length})` : `Waitlist (${waitlist.length})`}
                </button>
              ))}
            </div>

          {/* ── Waitlist view ─────────────────────────────────── */}
          {activeTab === "waitlist" && (
            <>
              {/* Drop filter for waitlist */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                {[{ slug: "all", label: `All drops (${waitlist.length})` }, ...drops.map((d) => ({
                  slug: d.slug,
                  label: `${dropDisplayName(d)} (${waitlist.filter((w) => w.drop_slug === d.slug).length})`,
                }))].map(({ slug, label }) => (
                  <button
                    key={slug}
                    onClick={() => setSelectedSlug(slug)}
                    style={{
                      fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase",
                      fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
                      padding: "8px 16px", borderRadius: "2px", border: "1px solid",
                      transition: "all 0.15s ease",
                      backgroundColor: selectedSlug === slug ? "var(--gold)" : "transparent",
                      color: selectedSlug === slug ? "var(--ink)" : "var(--ink-muted)",
                      borderColor: selectedSlug === slug ? "var(--gold)" : "var(--border)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {(() => {
                const filtered = selectedSlug === "all" ? waitlist : waitlist.filter((w) => w.drop_slug === selectedSlug);
                if (filtered.length === 0) return (
                  <div style={{
                    border: "1px dashed var(--gold)", borderRadius: "2px",
                    backgroundColor: "var(--parchment)", padding: "40px", textAlign: "center",
                    marginBottom: "80px",
                  }}>
                    <p style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>
                      No waitlist entries yet.
                    </p>
                  </div>
                );
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginBottom: "80px" }}>
                    <div style={{
                      display: "grid", gridTemplateColumns: "140px 1fr 1fr",
                      gap: "16px", padding: "10px 20px",
                      backgroundColor: "var(--parchment)", borderRadius: "2px",
                    }}>
                      {["Joined", "Member", "Drop"].map((h) => (
                        <span key={h} style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)" }}>
                          {h}
                        </span>
                      ))}
                    </div>
                    {filtered.map((entry) => (
                      <div key={entry.id} style={{
                        display: "grid", gridTemplateColumns: "140px 1fr 1fr",
                        gap: "16px", padding: "16px 20px",
                        backgroundColor: "#FDFAF5",
                        border: "1px solid var(--border)", borderRadius: "2px",
                      }}>
                        <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", alignSelf: "center" }}>
                          {formatDate(entry.created_at)}
                        </span>
                        <div style={{ alignSelf: "center", minWidth: 0 }}>
                          {entry.user_name && (
                            <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {entry.user_name}
                            </p>
                          )}
                          <p style={{ fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {entry.user_email}
                          </p>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 400, alignSelf: "center", color: "var(--ink-muted)" }}>
                          {entry.drop_name}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}

          {/* ── Orders view ───────────────────────────────────── */}
          {activeTab === "orders" && (
            <>
          {/* ── Drop filter tabs ───────────────────────────────── */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
              {[{ slug: "all", label: `All drops (${orders.length})` }, ...drops.map((d) => ({
                slug: d.slug,
                label: `${dropDisplayName(d)} (${orders.filter((o) => o.drop_slug === d.slug).length})`,
              }))].map(({ slug, label }) => (
                <button
                  key={slug}
                  onClick={() => setSelectedSlug(slug)}
                  style={{
                    fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase",
                    fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
                    padding: "8px 16px", borderRadius: "2px", border: "1px solid",
                    transition: "all 0.15s ease",
                    backgroundColor: selectedSlug === slug ? "var(--gold)" : "transparent",
                    color: selectedSlug === slug ? "var(--ink)" : "var(--ink-muted)",
                    borderColor: selectedSlug === slug ? "var(--gold)" : "var(--border)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Selected drop progress — shown when a specific drop is selected */}
            {selectedSlug !== "all" && (() => {
              const drop = drops.find((d) => d.slug === selectedSlug);
              if (!drop) return null;
              const raised = raisedCents(drop);
              const target = targetCents(drop);
              const pct = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0;
              return (
                <div style={{
                  backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                  borderRadius: "4px", padding: "20px 28px", marginBottom: "24px",
                  display: "flex", gap: "40px", alignItems: "center", flexWrap: "wrap",
                }}>
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "4px" }}>Raised</p>
                    <p className="font-display" style={{ fontSize: "24px", fontWeight: 500 }}>{money(raised)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "4px" }}>Target</p>
                    <p className="font-display" style={{ fontSize: "24px", fontWeight: 500 }}>{money(target)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "4px" }}>Funded</p>
                    <p className="font-display" style={{ fontSize: "24px", fontWeight: 500, color: pct >= 100 ? "var(--gold)" : "var(--ink)" }}>{pct}%</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "4px" }}>Orders</p>
                    <p className="font-display" style={{ fontSize: "24px", fontWeight: 500 }}>{filteredOrders.length}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "4px" }}>Authorized</p>
                    <p className="font-display" style={{ fontSize: "24px", fontWeight: 500 }}>{money(totalAuthorized)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "4px" }}>Members</p>
                    <p className="font-display" style={{ fontSize: "24px", fontWeight: 500 }}>{uniqueMembers}</p>
                  </div>
                </div>
              );
            })()}

            {/* ── Orders list ───────────────────────────────────── */}
            {filteredOrders.length === 0 ? (
              <div style={{
                border: "1px dashed var(--gold)", borderRadius: "2px",
                backgroundColor: "var(--parchment)", padding: "40px", textAlign: "center",
                marginBottom: "80px",
              }}>
                <p style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>
                  No orders yet for this drop.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginBottom: "80px" }}>

                {/* Table header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr 1fr 120px 90px 80px",
                  gap: "16px", padding: "10px 20px",
                  backgroundColor: "var(--parchment)", borderRadius: "2px",
                }}>
                  {["Date", "Member", "Drop", "Items", "Total", "Status"].map((h) => (
                    <span key={h} style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)" }}>
                      {h}
                    </span>
                  ))}
                </div>

                {filteredOrders.map((order) => (
                  <div key={order.id}>
                    <div
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "140px 1fr 1fr 120px 90px 80px",
                        gap: "16px", padding: "16px 20px",
                        backgroundColor: "#FDFAF5",
                        border: "1px solid var(--border)",
                        borderRadius: expandedOrder === order.id ? "2px 2px 0 0" : "2px",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F1")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FDFAF5")}
                    >
                      {/* Date */}
                      <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", alignSelf: "center" }}>
                        {formatDate(order.created_at)}
                      </span>

                      {/* Member */}
                      <div style={{ alignSelf: "center", minWidth: 0 }}>
                        {order.user_name && (
                          <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {order.user_name}
                          </p>
                        )}
                        <p style={{ fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {order.user_email}
                        </p>
                      </div>

                      {/* Drop */}
                      <span style={{ fontSize: "12px", fontWeight: 400, alignSelf: "center", color: "var(--ink-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {order.drop_name}
                      </span>

                      {/* Items summary */}
                      <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", alignSelf: "center" }}>
                        {Array.isArray(order.items)
                          ? order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")
                          : "—"}
                      </span>

                      {/* Total */}
                      <span className="font-display" style={{ fontSize: "18px", fontWeight: 500, alignSelf: "center" }}>
                        {money(order.total_cents)}
                      </span>

                      {/* Status */}
                      <div style={{ alignSelf: "center" }}>
                        <span style={{
                          fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase",
                          fontWeight: 500, padding: "3px 8px", borderRadius: "2px",
                          ...statusColor(order.status),
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Expanded item detail */}
                    {expandedOrder === order.id && Array.isArray(order.items) && (
                      <div style={{
                        backgroundColor: "var(--parchment)",
                        border: "1px solid var(--border)", borderTop: "none",
                        borderRadius: "0 0 2px 2px", padding: "20px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>

                          {/* Items list */}
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <p style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", marginBottom: "12px" }}>
                              Order items
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {order.items.map((item, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink)" }}>
                                    {item.qty}× {item.name}
                                  </span>
                                  <span className="font-display" style={{ fontSize: "16px", fontWeight: 500 }}>
                                    {money(item.line_total_cents)}
                                  </span>
                                </div>
                              ))}
                              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                                <span style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)" }}>Total</span>
                                <span className="font-display" style={{ fontSize: "20px", fontWeight: 500 }}>
                                  {money(order.total_cents)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status updater */}
                          <div style={{ minWidth: "200px" }}>
                            <p style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", marginBottom: "12px" }}>
                              Update status
                            </p>
                            {/* Progress steps */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                              {STATUS_FLOW.map((s, i) => {
                                const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
                                const isPast = i <= currentIdx;
                                return (
                                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{
                                      width: "8px", height: "8px", borderRadius: "50%",
                                      backgroundColor: isPast ? "var(--gold)" : "var(--border)",
                                      flexShrink: 0,
                                    }} />
                                    {i < STATUS_FLOW.length - 1 && (
                                      <div style={{ width: "16px", height: "1px", backgroundColor: isPast && i < currentIdx ? "var(--gold)" : "var(--border)" }} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {STATUS_FLOW.map((s) => {
                                const isCurrent = order.status === s;
                                return (
                                  <button
                                    key={s}
                                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, s); }}
                                    disabled={isCurrent}
                                    style={{
                                      fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase",
                                      fontWeight: 500, fontFamily: "inherit", cursor: isCurrent ? "default" : "pointer",
                                      padding: "5px 10px", borderRadius: "2px", border: "1px solid",
                                      transition: "all 0.15s ease",
                                      ...( isCurrent
                                        ? { ...statusColor(s), borderColor: "transparent" }
                                        : { backgroundColor: "transparent", color: "var(--ink-muted)", borderColor: "var(--border)" }
                                      ),
                                    }}
                                  >
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </>
          )}
          </section>

        </div>
      </main>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   SHARED_STYLES
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
  ".gold-rule { border: none; border-top: 1px solid var(--gold); opacity: 0.35; margin: 0; }",
  ".btn-primary { background: var(--gold); color: var(--ink); letter-spacing: 0.08em; font-size: 11px; font-weight: 500; text-transform: uppercase; padding: 12px 24px; display: inline-block; transition: background 0.2s ease, transform 0.15s ease; }",
  ".btn-primary:hover { background: var(--gold-light); transform: translateY(-1px); }",
].join("\n");
