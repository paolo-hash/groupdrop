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
  closes_at?: string | null;
  hero_image_url?: string | null;
  description?: string | null;
};

type NewDropForm = {
  title: string;
  slug: string;
  description: string;
  target: string;
  closes_at: string;
  hero_image_url: string;
};

type Sku = {
  id: string;
  drop_id: string;
  name: string;
  subtitle: string | null;
  price_cents: number;
  tag: string | null;
  sort_order: number;
};

type SkuForm = {
  name: string;
  subtitle: string;
  price: string;
  tag: string;
  sort_order: string;
};

type WaitlistEntry = {
  id: string;
  user_email: string;
  user_name: string | null;
  drop_slug: string;
  drop_name: string;
  created_at: string;
};

type ReferralCode = {
  user_id: string;
  code: string;
};

type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  drop_id: string;
  created_at: string;
};

type ReferralCredit = {
  id: string;
  user_id: string;
  amount_cents: number;
  used: boolean;
  order_id: string | null;
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
  const [activeTab, setActiveTab] = useState<"orders" | "waitlist" | "drops" | "referrals">("orders");
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCredits, setReferralCredits] = useState<ReferralCredit[]>([]);
  const [showNewDrop, setShowNewDrop] = useState(false);
  const [newDropForm, setNewDropForm] = useState<NewDropForm>({
    title: "", slug: "", description: "", target: "", closes_at: "", hero_image_url: "",
  });
  const [newDropSaving, setNewDropSaving] = useState(false);
  const [expandedDrop, setExpandedDrop] = useState<string | null>(null);
  const [skusByDrop, setSkusByDrop] = useState<Record<string, Sku[]>>({});
  const [skusLoading, setSkusLoading] = useState<Record<string, boolean>>({});
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [editSkuForm, setEditSkuForm] = useState<SkuForm>({ name: "", subtitle: "", price: "", tag: "", sort_order: "" });
  const [addingSkuForDrop, setAddingSkuForDrop] = useState<string | null>(null);
  const [newSkuForm, setNewSkuForm] = useState<SkuForm>({ name: "", subtitle: "", price: "", tag: "", sort_order: "" });

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

      const [
        { data: ordersData },
        { data: dropsData },
        { data: waitlistData },
        { data: codesData },
        { data: referralsData },
        { data: creditsData },
      ] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("drops").select("*").order("created_at", { ascending: false }),
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
        supabase.from("referral_codes").select("user_id, code"),
        supabase.from("referrals").select("*").order("created_at", { ascending: false }),
        supabase.from("referral_credits").select("*").order("created_at", { ascending: false }),
      ]);

      setOrders((ordersData ?? []) as Order[]);
      setDrops((dropsData ?? []) as Drop[]);
      setWaitlist((waitlistData ?? []) as WaitlistEntry[]);
      setReferralCodes((codesData ?? []) as ReferralCode[]);
      setReferrals((referralsData ?? []) as Referral[]);
      setReferralCredits((creditsData ?? []) as ReferralCredit[]);
      setLoading(false);
    }

    init();
  }, [router]);

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  }

  async function closeDropNow(dropId: string) {
    const now = new Date().toISOString();
    await supabase.from("drops").update({ closes_at: now }).eq("id", dropId);
    setDrops((prev) => prev.map((d) => d.id === dropId ? { ...d, closes_at: now } : d));
  }

  async function extendDrop(dropId: string, days: number) {
    const drop = drops.find((d) => d.id === dropId);
    const base = drop?.closes_at ? new Date(drop.closes_at) : new Date();
    if (base < new Date()) base.setTime(Date.now());
    base.setDate(base.getDate() + days);
    const newDate = base.toISOString();
    await supabase.from("drops").update({ closes_at: newDate }).eq("id", dropId);
    setDrops((prev) => prev.map((d) => d.id === dropId ? { ...d, closes_at: newDate } : d));
  }

  async function createDrop() {
    if (!newDropForm.title || !newDropForm.slug || !newDropForm.target) return;
    setNewDropSaving(true);
    const { data, error } = await supabase.from("drops").insert({
      title: newDropForm.title,
      slug: newDropForm.slug,
      description: newDropForm.description || null,
      target: parseFloat(newDropForm.target),
      raised: 0,
      closes_at: newDropForm.closes_at || null,
      hero_image_url: newDropForm.hero_image_url || null,
    }).select().single();
    if (!error && data) {
      setDrops((prev) => [data as Drop, ...prev]);
      setShowNewDrop(false);
      setNewDropForm({ title: "", slug: "", description: "", target: "", closes_at: "", hero_image_url: "" });
    } else if (error) {
      alert("Error creating drop: " + error.message);
    }
    setNewDropSaving(false);
  }

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function loadSkus(dropId: string) {
    if (skusByDrop[dropId]) return;
    setSkusLoading((prev) => ({ ...prev, [dropId]: true }));
    const { data } = await supabase
      .from("drop_skus")
      .select("*")
      .eq("drop_id", dropId)
      .order("sort_order", { ascending: true });
    setSkusByDrop((prev) => ({ ...prev, [dropId]: (data ?? []) as Sku[] }));
    setSkusLoading((prev) => ({ ...prev, [dropId]: false }));
  }

  function toggleDropExpand(dropId: string) {
    if (expandedDrop === dropId) {
      setExpandedDrop(null);
    } else {
      setExpandedDrop(dropId);
      loadSkus(dropId);
    }
  }

  async function saveSku(dropId: string) {
    const priceCents = Math.round(parseFloat(editSkuForm.price) * 100);
    await supabase.from("drop_skus").update({
      name: editSkuForm.name,
      subtitle: editSkuForm.subtitle || null,
      price_cents: priceCents,
      tag: editSkuForm.tag || null,
      sort_order: parseInt(editSkuForm.sort_order) || 0,
    }).eq("id", editingSkuId!);
    setSkusByDrop((prev) => ({
      ...prev,
      [dropId]: (prev[dropId] ?? []).map((s) =>
        s.id === editingSkuId
          ? { ...s, name: editSkuForm.name, subtitle: editSkuForm.subtitle || null, price_cents: priceCents, tag: editSkuForm.tag || null, sort_order: parseInt(editSkuForm.sort_order) || 0 }
          : s
      ),
    }));
    setEditingSkuId(null);
  }

  async function deleteSku(dropId: string, skuId: string) {
    if (!confirm("Delete this SKU?")) return;
    await supabase.from("drop_skus").delete().eq("id", skuId);
    setSkusByDrop((prev) => ({
      ...prev,
      [dropId]: (prev[dropId] ?? []).filter((s) => s.id !== skuId),
    }));
  }

  async function createSku(dropId: string) {
    if (!newSkuForm.name || !newSkuForm.price) return;
    const priceCents = Math.round(parseFloat(newSkuForm.price) * 100);
    const { data, error } = await supabase.from("drop_skus").insert({
      drop_id: dropId,
      name: newSkuForm.name,
      subtitle: newSkuForm.subtitle || null,
      price_cents: priceCents,
      tag: newSkuForm.tag || null,
      sort_order: parseInt(newSkuForm.sort_order) || 0,
    }).select().single();
    if (!error && data) {
      setSkusByDrop((prev) => ({
        ...prev,
        [dropId]: [...(prev[dropId] ?? []), data as Sku].sort((a, b) => a.sort_order - b.sort_order),
      }));
      setNewSkuForm({ name: "", subtitle: "", price: "", tag: "", sort_order: "" });
      setAddingSkuForDrop(null);
    } else if (error) {
      alert("Error creating SKU: " + error.message);
    }
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
          borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 65,
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
              {(["orders", "waitlist", "drops", "referrals"] as const).map((tab) => (
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
                  {tab === "orders" ? `Orders (${orders.length})`
                    : tab === "waitlist" ? `Waitlist (${waitlist.length})`
                    : tab === "drops" ? `Drops (${drops.length})`
                    : `Referrals (${referrals.length})`}
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
          {/* ── Drops tab ─────────────────────────────────────── */}
          {activeTab === "drops" && (
            <div style={{ paddingBottom: "80px" }}>

              {/* New drop button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                <button
                  onClick={() => setShowNewDrop((v) => !v)}
                  className="btn-primary"
                  style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {showNewDrop ? "Cancel" : "+ New drop"}
                </button>
              </div>

              {/* New drop form */}
              {showNewDrop && (
                <div className="grain" style={{
                  backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                  borderRadius: "4px", padding: "32px", marginBottom: "32px",
                  position: "relative", overflow: "hidden",
                }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "24px" }}>
                    New drop
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    <div>
                      <label style={labelStyle}>Title</label>
                      <input
                        style={inputStyle}
                        placeholder="Byredo Essentials"
                        value={newDropForm.title}
                        onChange={(e) => setNewDropForm((f) => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Slug</label>
                      <input
                        style={inputStyle}
                        placeholder="byredo-essentials"
                        value={newDropForm.slug}
                        onChange={(e) => setNewDropForm((f) => ({ ...f, slug: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Target ($)</label>
                      <input
                        style={inputStyle}
                        type="number"
                        placeholder="10000"
                        value={newDropForm.target}
                        onChange={(e) => setNewDropForm((f) => ({ ...f, target: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Closes at</label>
                      <input
                        style={inputStyle}
                        type="datetime-local"
                        value={newDropForm.closes_at}
                        onChange={(e) => setNewDropForm((f) => ({ ...f, closes_at: e.target.value }))}
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>Hero image URL (optional)</label>
                      <input
                        style={inputStyle}
                        placeholder="https://..."
                        value={newDropForm.hero_image_url}
                        onChange={(e) => setNewDropForm((f) => ({ ...f, hero_image_url: e.target.value }))}
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>Description (optional)</label>
                      <textarea
                        style={{ ...inputStyle, resize: "vertical" }}
                        rows={3}
                        placeholder="Brand story and drop details…"
                        value={newDropForm.description}
                        onChange={(e) => setNewDropForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    onClick={createDrop}
                    disabled={newDropSaving || !newDropForm.title || !newDropForm.slug || !newDropForm.target}
                    className="btn-primary"
                    style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit", opacity: (!newDropForm.title || !newDropForm.slug || !newDropForm.target) ? 0.5 : 1 }}
                  >
                    {newDropSaving ? "Saving…" : "Create drop →"}
                  </button>
                </div>
              )}

              {/* Existing drops list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {drops.map((drop) => {
                  const raised = raisedCents(drop);
                  const target = targetCents(drop);
                  const pct = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0;
                  const isClosed = drop.closes_at ? new Date(drop.closes_at) < new Date() : false;
                  const isExpanded = expandedDrop === drop.id;
                  const skus = skusByDrop[drop.id] ?? [];
                  const isLoadingSkus = skusLoading[drop.id] ?? false;
                  const isAddingSkus = addingSkuForDrop === drop.id;

                  return (
                    <div key={drop.id} style={{ border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" }}>

                      {/* Drop header row */}
                      <div
                        onClick={() => toggleDropExpand(drop.id)}
                        style={{
                          display: "grid", gridTemplateColumns: "1fr 100px 140px 1fr auto",
                          gap: "16px", padding: "16px 20px",
                          backgroundColor: "#FDFAF5", cursor: "pointer",
                          alignItems: "center",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F1")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FDFAF5")}
                      >
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>
                            {isExpanded ? "▾" : "▸"} {dropDisplayName(drop)}
                          </p>
                          <p style={{ fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)" }}>{drop.slug}</p>
                        </div>
                        <p className="font-display" style={{ fontSize: "18px", fontWeight: 500, color: pct >= 100 ? "var(--gold)" : "var(--ink)" }}>
                          {pct}%
                        </p>
                        <p style={{ fontSize: "11px", fontWeight: 300, color: isClosed ? "#B85450" : "var(--ink-muted)" }}>
                          {isClosed ? "Closed" : drop.closes_at ? new Date(drop.closes_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </p>
                        <div style={{ height: "3px", backgroundColor: "var(--parchment)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--gold), var(--gold-light))", borderRadius: "2px" }} />
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                          {!isClosed && (
                            <button onClick={() => closeDropNow(drop.id)}
                              style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", padding: "5px 10px", borderRadius: "2px", border: "1px solid #B85450", backgroundColor: "transparent", color: "#B85450" }}>
                              Close now
                            </button>
                          )}
                          {[7, 14, 30].map((days) => (
                            <button key={days} onClick={() => extendDrop(drop.id, days)}
                              style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", padding: "5px 10px", borderRadius: "2px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--ink-muted)" }}>
                              +{days}d
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SKU panel */}
                      {isExpanded && (
                        <div style={{ backgroundColor: "var(--parchment)", borderTop: "1px solid var(--border)", padding: "20px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <p style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)" }}>
                              SKUs {!isLoadingSkus && `(${skus.length})`}
                            </p>
                            <button
                              onClick={() => { setAddingSkuForDrop(isAddingSkus ? null : drop.id); setNewSkuForm({ name: "", subtitle: "", price: "", tag: "", sort_order: String(skus.length) }); }}
                              style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", padding: "5px 12px", borderRadius: "2px", border: "1px solid var(--gold)", backgroundColor: "transparent", color: "var(--gold)" }}>
                              {isAddingSkus ? "Cancel" : "+ Add SKU"}
                            </button>
                          </div>

                          {/* Add SKU form */}
                          {isAddingSkus && (
                            <div style={{ backgroundColor: "#FDFAF5", border: "1px solid var(--border)", borderRadius: "4px", padding: "16px", marginBottom: "16px" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px 80px", gap: "10px", marginBottom: "10px" }}>
                                <div>
                                  <label style={labelStyle}>Name *</label>
                                  <input style={inputStyle} placeholder="Classic Tote" value={newSkuForm.name} onChange={(e) => setNewSkuForm((f) => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Subtitle</label>
                                  <input style={inputStyle} placeholder="Natural leather" value={newSkuForm.subtitle} onChange={(e) => setNewSkuForm((f) => ({ ...f, subtitle: e.target.value }))} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Price ($) *</label>
                                  <input style={inputStyle} type="number" placeholder="250" value={newSkuForm.price} onChange={(e) => setNewSkuForm((f) => ({ ...f, price: e.target.value }))} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Tag</label>
                                  <input style={inputStyle} placeholder="Best seller" value={newSkuForm.tag} onChange={(e) => setNewSkuForm((f) => ({ ...f, tag: e.target.value }))} />
                                </div>
                                <div>
                                  <label style={labelStyle}>Order</label>
                                  <input style={inputStyle} type="number" placeholder="0" value={newSkuForm.sort_order} onChange={(e) => setNewSkuForm((f) => ({ ...f, sort_order: e.target.value }))} />
                                </div>
                              </div>
                              <button
                                onClick={() => createSku(drop.id)}
                                disabled={!newSkuForm.name || !newSkuForm.price}
                                className="btn-primary"
                                style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "10px", padding: "8px 18px", opacity: (!newSkuForm.name || !newSkuForm.price) ? 0.5 : 1 }}>
                                Add SKU →
                              </button>
                            </div>
                          )}

                          {/* SKU list */}
                          {isLoadingSkus ? (
                            <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 300 }}>Loading…</p>
                          ) : skus.length === 0 ? (
                            <p style={{ fontSize: "11px", color: "var(--ink-muted)", fontWeight: 300 }}>No SKUs yet — add one above.</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                              {/* Header */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 120px 60px 80px", gap: "12px", padding: "6px 12px" }}>
                                {["Name", "Subtitle", "Price", "Tag", "Order", ""].map((h) => (
                                  <span key={h} style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)" }}>{h}</span>
                                ))}
                              </div>
                              {skus.map((sku) => {
                                const isEditing = editingSkuId === sku.id;
                                return (
                                  <div key={sku.id} style={{ backgroundColor: "#FDFAF5", border: "1px solid var(--border)", borderRadius: "2px", padding: "10px 12px" }}>
                                    {isEditing ? (
                                      <div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 120px 60px", gap: "10px", marginBottom: "10px" }}>
                                          <input style={inputStyle} value={editSkuForm.name} onChange={(e) => setEditSkuForm((f) => ({ ...f, name: e.target.value }))} />
                                          <input style={inputStyle} placeholder="Subtitle" value={editSkuForm.subtitle} onChange={(e) => setEditSkuForm((f) => ({ ...f, subtitle: e.target.value }))} />
                                          <input style={inputStyle} type="number" placeholder="Price ($)" value={editSkuForm.price} onChange={(e) => setEditSkuForm((f) => ({ ...f, price: e.target.value }))} />
                                          <input style={inputStyle} placeholder="Tag" value={editSkuForm.tag} onChange={(e) => setEditSkuForm((f) => ({ ...f, tag: e.target.value }))} />
                                          <input style={inputStyle} type="number" placeholder="0" value={editSkuForm.sort_order} onChange={(e) => setEditSkuForm((f) => ({ ...f, sort_order: e.target.value }))} />
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                          <button onClick={() => saveSku(drop.id)} className="btn-primary" style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "10px", padding: "7px 16px" }}>Save</button>
                                          <button onClick={() => setEditingSkuId(null)} style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", padding: "7px 16px", borderRadius: "2px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--ink-muted)" }}>Cancel</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 120px 60px 80px", gap: "12px", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 500 }}>{sku.name}</span>
                                        <span style={{ fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)" }}>{sku.subtitle || "—"}</span>
                                        <span className="font-display" style={{ fontSize: "14px", fontWeight: 500 }}>${(sku.price_cents / 100).toFixed(0)}</span>
                                        <span style={{ fontSize: "10px", color: "var(--ink-muted)" }}>{sku.tag || "—"}</span>
                                        <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>{sku.sort_order}</span>
                                        <div style={{ display: "flex", gap: "6px" }}>
                                          <button
                                            onClick={() => { setEditingSkuId(sku.id); setEditSkuForm({ name: sku.name, subtitle: sku.subtitle ?? "", price: String(sku.price_cents / 100), tag: sku.tag ?? "", sort_order: String(sku.sort_order) }); }}
                                            style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", padding: "4px 8px", borderRadius: "2px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--ink-muted)" }}>
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => deleteSku(drop.id, sku.id)}
                                            style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", padding: "4px 8px", borderRadius: "2px", border: "1px solid #B85450", backgroundColor: "transparent", color: "#B85450" }}>
                                            Del
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Referrals tab ─────────────────────────────────── */}
          {activeTab === "referrals" && (() => {
            // Build a lookup: user_id → referral code
            const codeByUser = Object.fromEntries(referralCodes.map((r) => [r.user_id, r.code]));

            // Build a lookup: order_id → order (for referred user email)
            const orderById = Object.fromEntries(orders.map((o) => [o.id, o]));

            const totalCreditsIssued = referralCredits.reduce((s, c) => s + c.amount_cents, 0);
            const totalCreditsUsed = referralCredits.filter((c) => c.used).reduce((s, c) => s + c.amount_cents, 0);
            const totalCreditsOutstanding = totalCreditsIssued - totalCreditsUsed;

            // Top referrers: group credits by user_id
            const creditsByUser: Record<string, { count: number; total: number; code: string }> = {};
            referralCredits.forEach((c) => {
              if (!creditsByUser[c.user_id]) {
                creditsByUser[c.user_id] = { count: 0, total: 0, code: codeByUser[c.user_id] ?? "—" };
              }
              creditsByUser[c.user_id].count += 1;
              creditsByUser[c.user_id].total += c.amount_cents;
            });
            const topReferrers = Object.entries(creditsByUser)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 10);

            return (
              <div style={{ paddingBottom: "80px" }}>

                {/* Summary stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "40px" }}>
                  {[
                    { label: "Total referrals", value: String(referrals.length) },
                    { label: "Credits issued", value: money(totalCreditsIssued) },
                    { label: "Credits used", value: money(totalCreditsUsed) },
                    { label: "Outstanding liability", value: money(totalCreditsOutstanding), highlight: totalCreditsOutstanding > 0 },
                    { label: "Unique referrers", value: String(Object.keys(creditsByUser).length) },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="grain" style={{
                      backgroundColor: "#FDFAF5", border: `1px solid ${highlight ? "var(--gold)" : "var(--border)"}`,
                      borderRadius: "4px", padding: "20px 24px", position: "relative", overflow: "hidden",
                    }}>
                      <p style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: highlight ? "var(--gold)" : "var(--ink-muted)", fontWeight: 500, marginBottom: "8px" }}>
                        {label}
                      </p>
                      <p className="font-display" style={{ fontSize: "28px", fontWeight: 500, lineHeight: 1, color: highlight ? "var(--gold)" : "var(--ink)" }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>

                  {/* Credit history table */}
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "16px" }}>
                      Credit log ({referralCredits.length})
                    </p>
                    {referralCredits.length === 0 ? (
                      <p style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink-muted)" }}>No credits issued yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        {/* Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 70px", gap: "12px", padding: "8px 16px" }}>
                          {["Ref code", "Amount", "Status", "Date"].map((h) => (
                            <span key={h} style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>{h}</span>
                          ))}
                        </div>
                        {referralCredits.map((credit) => {
                          const code = codeByUser[credit.user_id] ?? credit.user_id.slice(0, 8);
                          const triggerOrder = credit.order_id ? orderById[credit.order_id] : null;
                          return (
                            <div key={credit.id} style={{
                              display: "grid", gridTemplateColumns: "1fr 80px 80px 70px", gap: "12px",
                              padding: "10px 16px", backgroundColor: "#FDFAF5",
                              border: "1px solid var(--border)", borderRadius: "2px",
                            }}>
                              <div>
                                <span style={{ fontSize: "11px", fontWeight: 400, fontFamily: "monospace", color: "var(--ink)" }}>{code}</span>
                                {triggerOrder && (
                                  <p style={{ fontSize: "10px", fontWeight: 300, color: "var(--ink-muted)", marginTop: "2px" }}>
                                    {triggerOrder.user_email}
                                  </p>
                                )}
                              </div>
                              <span className="font-display" style={{ fontSize: "16px", fontWeight: 500 }}>{money(credit.amount_cents)}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: credit.used ? "var(--ink-muted)" : "var(--gold)", display: "inline-block", flexShrink: 0 }} />
                                <span style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: credit.used ? "var(--ink-muted)" : "var(--gold)" }}>
                                  {credit.used ? "Used" : "Live"}
                                </span>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)" }}>{formatDate(credit.created_at)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top referrers */}
                  <div>
                    <p style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "16px" }}>
                      Top referrers
                    </p>
                    {topReferrers.length === 0 ? (
                      <p style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink-muted)" }}>No referrals yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px", gap: "12px", padding: "8px 16px" }}>
                          {["Code", "Referrals", "Credits"].map((h) => (
                            <span key={h} style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>{h}</span>
                          ))}
                        </div>
                        {topReferrers.map(([userId, data], i) => (
                          <div key={userId} style={{
                            display: "grid", gridTemplateColumns: "1fr 60px 80px", gap: "12px",
                            padding: "12px 16px", backgroundColor: "#FDFAF5",
                            border: `1px solid ${i === 0 ? "var(--gold)" : "var(--border)"}`,
                            borderRadius: "2px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {i === 0 && <span style={{ fontSize: "9px", color: "var(--gold)" }}>★</span>}
                              <span style={{ fontSize: "11px", fontWeight: 400, fontFamily: "monospace", color: "var(--ink)" }}>{data.code}</span>
                            </div>
                            <span className="font-display" style={{ fontSize: "18px", fontWeight: 500 }}>{data.count}</span>
                            <span className="font-display" style={{ fontSize: "18px", fontWeight: 500 }}>{money(data.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Referral events */}
                    {referrals.length > 0 && (
                      <>
                        <p style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginTop: "32px", marginBottom: "16px" }}>
                          Referral events ({referrals.length})
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          {referrals.map((ref) => {
                            const code = codeByUser[ref.referrer_id] ?? ref.referrer_id.slice(0, 8);
                            const drop = drops.find((d) => d.id === ref.drop_id);
                            // Find the referred user's email from orders
                            const referredOrder = orders.find((o) => o.drop_id === ref.drop_id && ref.referred_id);
                            return (
                              <div key={ref.id} style={{
                                padding: "10px 16px", backgroundColor: "#FDFAF5",
                                border: "1px solid var(--border)", borderRadius: "2px",
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                                  <div>
                                    <span style={{ fontSize: "11px", fontWeight: 400, fontFamily: "monospace", color: "var(--ink)" }}>{code}</span>
                                    {referredOrder && <span style={{ fontSize: "10px", fontWeight: 300, color: "var(--ink-muted)", marginLeft: "10px" }}>→ {referredOrder.user_email}</span>}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {drop && <span style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 300 }}>{dropDisplayName(drop)}</span>}
                                    <span style={{ fontSize: "10px", fontWeight: 300, color: "var(--ink-muted)" }}>{formatDate(ref.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          </section>

        </div>
      </main>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "10px", letterSpacing: "0.14em",
  textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", backgroundColor: "var(--cream)", border: "1px solid var(--border)",
  padding: "10px 14px", fontFamily: "inherit", fontSize: "13px", fontWeight: 300,
  color: "var(--ink)", outline: "none", boxSizing: "border-box",
};

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
