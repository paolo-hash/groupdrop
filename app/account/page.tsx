"use client";

/*
  File location: app/account/page.tsx

  Shows the logged-in user's:
  - Name and email
  - Current tier and billing cycle
  - Drops used this month vs their limit
  - Stripe subscription status
  - Sign out button

  If the user is not logged in, redirects to /login.
*/

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
type Profile = {
  full_name: string | null;
  email: string | null;
  tier: string | null;
  billing_cycle: string | null;
  drops_used_this_month: number;
  stripe_subscription_id: string | null;
  created_at: string;
};

/* CHANGE: Added Order type for order history */
type OrderItem = {
  sku_id: string;
  name: string;
  qty: number;
  price_cents: number;
  line_total_cents: number;
};

type Order = {
  id: string;
  drop_slug: string;
  drop_name: string;
  items: OrderItem[];
  total_cents: number;
  status: string;
  created_at: string;
};

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const TIER_LABELS: Record<string, string> = {
  essentialist: "The Essentialist",
  enthusiast: "The Enthusiast",
  curator: "The Curator",
};

const TIER_LIMITS: Record<string, string> = {
  essentialist: "2 drops / month",
  enthusiast: "5 drops / month",
  curator: "Unlimited drops",
};

const TIER_PRICES: Record<string, { monthly: number; annual: number }> = {
  essentialist: { monthly: 15, annual: 120 },
  enthusiast: { monthly: 25, annual: 240 },
  curator: { monthly: 50, annual: 480 },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  /* CHANGE: Added orders state for order history */
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadProfile() {
      /* Check auth */
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/account");
        return;
      }

      setEmail(user.email ?? null);

      /* Fetch profile */
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        setProfile(data as Profile);
      }

      /* CHANGE: Fetch order history sorted by most recent first */
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (orderError) {
        console.error("Orders fetch error:", orderError);
      } else {
        setOrders((orderData ?? []) as Order[]);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  /* ── Loading state ─────────────────────────────────────── */
  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />
        <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
            Loading…
          </p>
        </main>
      </>
    );
  }

  const tier = profile?.tier ?? null;
  const billing = profile?.billing_cycle ?? null;
  const dropsUsed = profile?.drops_used_this_month ?? 0;
  const tierLabel = tier ? TIER_LABELS[tier] : "No active plan";
  const tierLimit = tier ? TIER_LIMITS[tier] : "—";
  const price = tier && billing ? (
    billing === "annual"
      ? Math.round(TIER_PRICES[tier].annual / 12)
      : TIER_PRICES[tier].monthly
  ) : null;

  /* ── Render ───────────────────────────────────────────── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />
      <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>

        {/* ── Nav ─────────────────────────────────────────── */}
        <header style={{
          borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(12px)", backgroundColor: "rgba(247,244,238,0.88)",
        }}>
          <div style={{
            maxWidth: "1100px", margin: "0 auto", padding: "0 28px",
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
                beta
              </span>
            </Link>

            <nav style={{ display: "flex", gap: "36px", alignItems: "center" }}>
              <Link href="/#drops" className="nav-link" style={{ textDecoration: "none" }}>Drops</Link>
              <button
                onClick={handleSignOut}
                className="nav-link"
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                Sign out
              </button>
            </nav>
          </div>
        </header>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>

          {/* ── Hero ──────────────────────────────────────── */}
          <section style={{ paddingTop: "100px", paddingBottom: "64px" }}>

            <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
              <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
              <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                Your Account
              </span>
            </div>

            <h1 className="font-display animate-fade-up delay-1" style={{
              fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 500,
              lineHeight: 1.02, letterSpacing: "-0.01em", marginBottom: "12px",
            }}>
              {profile?.full_name ? (
                <><em style={{ fontStyle: "italic" }}>Hello,</em> {profile.full_name.split(" ")[0]}.</>
              ) : (
                <em style={{ fontStyle: "italic" }}>Your account.</em>
              )}
            </h1>

            <p className="animate-fade-up delay-2" style={{
              fontSize: "15px", fontWeight: 300, lineHeight: 1.75,
              color: "var(--ink-muted)", letterSpacing: "0.01em",
            }}>
              {email}
            </p>

          </section>

          <hr className="gold-rule" />

          {/* ── Dashboard grid ────────────────────────────── */}
          <section style={{
            paddingTop: "64px", paddingBottom: "80px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}>

            {/* ── Membership card ───────────────────────── */}
            <div className="grain" style={{
              backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
              borderRadius: "4px", padding: "32px", position: "relative", overflow: "hidden",
            }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
                Membership
              </p>
              <h2 className="font-display" style={{ fontSize: "26px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "24px" }}>
                {tierLabel}
              </h2>

              <hr className="gold-rule" style={{ marginBottom: "20px" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {price && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>Rate</span>
                    <span className="font-display" style={{ fontSize: "20px", fontWeight: 500 }}>
                      ${price}/mo
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>Billing</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", textTransform: "capitalize" }}>
                    {billing ?? "—"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>Drop limit</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)" }}>
                    {tierLimit}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>Member since</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)" }}>
                    {profile?.created_at ? formatDate(profile.created_at) : "—"}
                  </span>
                </div>

              </div>

              {/* Upgrade link — only shown for non-curator tiers */}
              {tier && tier !== "curator" && (
                <Link
                  href="/join"
                  className="btn-primary"
                  style={{ display: "block", textAlign: "center", borderRadius: "2px", textDecoration: "none", marginTop: "28px" }}
                >
                  Upgrade plan →
                </Link>
              )}
            </div>

            {/* ── Drop usage card ───────────────────────── */}
            <div className="grain" style={{
              backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
              borderRadius: "4px", padding: "32px", position: "relative", overflow: "hidden",
            }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
                This Month
              </p>
              <h2 className="font-display" style={{ fontSize: "26px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "24px" }}>
                Drop usage
              </h2>

              <hr className="gold-rule" style={{ marginBottom: "24px" }} />

              {/* Large usage number */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
                <span className="font-display" style={{ fontSize: "56px", fontWeight: 500, lineHeight: 1 }}>
                  {dropsUsed}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 300, color: "var(--ink-muted)" }}>
                  {tier === "curator" ? "drops joined" : `of ${tier === "essentialist" ? "2" : "5"} used`}
                </span>
              </div>

              {/* Progress bar — only for limited tiers */}
              {tier && tier !== "curator" && (
                <>
                  <div style={{
                    height: "3px", backgroundColor: "var(--parchment)",
                    borderRadius: "2px", overflow: "hidden", marginBottom: "12px",
                  }}>
                    <div
                      className="progress-fill"
                      style={{
                        height: "100%",
                        width: `${Math.min((dropsUsed / (tier === "essentialist" ? 2 : 5)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>
                    Resets at the start of each month.
                  </p>
                </>
              )}

              {tier === "curator" && (
                <p style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>
                  Unlimited drops — join as many as you like.
                </p>
              )}

              <Link
                href="/#drops"
                className="btn-primary"
                style={{ display: "block", textAlign: "center", borderRadius: "2px", textDecoration: "none", marginTop: "28px" }}
              >
                View open drops →
              </Link>
            </div>

            {/* ── Account details card ──────────────────── */}
            <div className="grain" style={{
              backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
              borderRadius: "4px", padding: "32px", position: "relative", overflow: "hidden",
            }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
                Account
              </p>
              <h2 className="font-display" style={{ fontSize: "26px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "24px" }}>
                Details
              </h2>

              <hr className="gold-rule" style={{ marginBottom: "20px" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", flexShrink: 0 }}>Name</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", textAlign: "right" }}>
                    {profile?.full_name ?? "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", flexShrink: 0 }}>Email</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", textAlign: "right", wordBreak: "break-all" }}>
                    {email ?? "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", flexShrink: 0 }}>Subscription</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: profile?.stripe_subscription_id ? "var(--gold)" : "#B85450" }}>
                    {profile?.stripe_subscription_id ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                style={{
                  width: "100%", borderRadius: "2px", border: "1px solid var(--border)",
                  cursor: "pointer", fontFamily: "inherit", backgroundColor: "var(--parchment)",
                  color: "var(--ink-muted)", fontSize: "11px", letterSpacing: "0.08em",
                  textTransform: "uppercase", fontWeight: 500, padding: "12px 24px",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "var(--gold)";
                  (e.target as HTMLButtonElement).style.color = "var(--ink)";
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.target as HTMLButtonElement).style.color = "var(--ink-muted)";
                }}
              >
                Sign out
              </button>
            </div>

          </section>

          {/* ── Order History ─────────────────────────────── */}
          {/* CHANGE: Full order history section below the dashboard cards */}
          <section style={{ paddingTop: "20px", paddingBottom: "80px" }}>

            <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
              Order History
            </p>
            <h2 className="font-display" style={{ fontSize: "28px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "32px" }}>
              Your allocations
            </h2>

            {orders.length === 0 ? (
              /* Empty state */
              <div style={{
                border: "1px dashed var(--gold)", borderRadius: "4px",
                backgroundColor: "var(--parchment)", padding: "40px",
                textAlign: "center",
              }}>
                <p className="font-display" style={{ fontSize: "20px", fontWeight: 500, fontStyle: "italic", marginBottom: "8px", color: "var(--ink)" }}>
                  No orders yet.
                </p>
                <p style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink-muted)", marginBottom: "24px" }}>
                  Join a drop to see your allocations here.
                </p>
                <Link
                  href="/#drops"
                  className="btn-primary"
                  style={{ display: "inline-block", borderRadius: "2px", textDecoration: "none" }}
                >
                  View open drops →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="grain"
                    style={{
                      backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                      borderRadius: "4px", padding: "28px 32px",
                      position: "relative", overflow: "hidden",
                    }}
                  >
                    {/* Order header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <h3 className="font-display" style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "4px" }}>
                          {order.drop_name}
                        </h3>
                        <p style={{ fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)", letterSpacing: "0.02em" }}>
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      {/* Status badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          width: "6px", height: "6px", borderRadius: "50%",
                          backgroundColor: order.status === "charged" ? "var(--gold)"
                            : order.status === "cancelled" ? "#B85450"
                            : order.status === "refunded" ? "#B85450"
                            : "var(--ink-muted)",
                          display: "inline-block",
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: "9px", letterSpacing: "0.18em",
                          textTransform: "uppercase", fontWeight: 500,
                          color: order.status === "charged" ? "var(--gold)"
                            : order.status === "cancelled" ? "#B85450"
                            : order.status === "refunded" ? "#B85450"
                            : "var(--ink-muted)",
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <hr className="gold-rule" style={{ marginBottom: "16px" }} />

                    {/* Line items */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                      {(order.items as OrderItem[]).map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink-muted)" }}>
                            {item.name} <span style={{ color: "var(--ink-muted)", opacity: 0.6 }}>× {item.qty}</span>
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", flexShrink: 0 }}>
                            ${(item.line_total_cents / 100).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
                        Total authorized
                      </span>
                      <span className="font-display" style={{ fontSize: "22px", fontWeight: 500 }}>
                        ${(order.total_cents / 100).toLocaleString()}
                      </span>
                    </div>

                    {/* View drop link */}
                    <Link
                      href={}
                      className="nav-link"
                      style={{ display: "inline-block", textDecoration: "none", marginTop: "16px" }}
                    >
                      View drop →
                    </Link>

                  </div>
                ))}
              </div>
            )}

          </section>

          {/* ── Footer ────────────────────────────────────── */}
          <hr className="gold-rule" />
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
   SHARED_STYLES — identical to all other pages
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
].join("\n");