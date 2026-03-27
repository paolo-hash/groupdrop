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
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

type ReferralCredit = {
  id: string;
  amount_cents: number;
  used: boolean;
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
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [myCredits, setMyCredits] = useState(0);
  const [referralCredits, setReferralCredits] = useState<ReferralCredit[]>([]);
  const [referralCopied, setReferralCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConcierge, setShowConcierge] = useState(false);
  const [conciergeForm, setConciergeForm] = useState({ name: "", email: "", topic: "General Question", message: "" });
  const [conciergeSent, setConciergeSent] = useState(false);

  const openConcierge = () => {
    setConciergeSent(false);
    setConciergeForm({ name: "", email: "", topic: "General Question", message: "" });
    setShowConcierge(true);
  };

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

      /* Referral code + credit balance + history */
      const [{ data: codeData }, { data: creditsData }] = await Promise.all([
        supabase.rpc("get_or_create_referral_code"),
        supabase.rpc("get_my_referral_credits"),
      ]);
      if (codeData) setReferralCode(codeData as string);
      if (creditsData != null) setMyCredits(creditsData as number);

      const { data: creditHistory } = await supabase
        .from("referral_credits")
        .select("id, amount_cents, used, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (creditHistory) setReferralCredits(creditHistory as ReferralCredit[]);

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

      {/* ── Concierge modal ───────────────────────────────────── */}
      {showConcierge && (
        <div onClick={() => setShowConcierge(false)} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(26,24,20,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#FDFAF5", border: "1px solid var(--border)", borderRadius: "4px", padding: "48px 40px", maxWidth: "520px", width: "100%", position: "relative" }}>
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
                <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>Concierge</span>
              </div>
              <h3 className="font-display" style={{ fontSize: "28px", fontWeight: 500, fontStyle: "italic" }}>How can we help?</h3>
            </div>
            {conciergeSent ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p className="font-display" style={{ fontSize: "24px", fontWeight: 500, fontStyle: "italic", marginBottom: "12px" }}>Message received.</p>
                <p style={{ fontSize: "14px", fontWeight: 300, color: "var(--ink-muted)", lineHeight: 1.7 }}>Our concierge team will be in touch within one business day.</p>
                <button onClick={() => setShowConcierge(false)} style={{ marginTop: "32px", background: "var(--gold)", color: "var(--ink)", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, padding: "12px 24px", borderRadius: "2px" }}>Close</button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const subject = encodeURIComponent(`[Groupdrop Concierge] ${conciergeForm.topic}`);
                const body = encodeURIComponent(`Name: ${conciergeForm.name}\nEmail: ${conciergeForm.email}\nTopic: ${conciergeForm.topic}\n\n${conciergeForm.message}`);
                window.location.href = `mailto:hello@groupdrop.com?subject=${subject}&body=${body}`;
                setConciergeSent(true);
              }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", display: "block", marginBottom: "6px" }}>Full Name</label>
                    <input required placeholder="Jane Smith" value={conciergeForm.name} onChange={(e) => setConciergeForm((f) => ({ ...f, name: e.target.value }))} style={{ width: "100%", background: "var(--cream)", border: "1px solid var(--border)", padding: "10px 14px", fontFamily: "inherit", fontSize: "13px", fontWeight: 300, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", display: "block", marginBottom: "6px" }}>Email</label>
                    <input required type="email" placeholder="jane@example.com" value={conciergeForm.email} onChange={(e) => setConciergeForm((f) => ({ ...f, email: e.target.value }))} style={{ width: "100%", background: "var(--cream)", border: "1px solid var(--border)", padding: "10px 14px", fontFamily: "inherit", fontSize: "13px", fontWeight: 300, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", display: "block", marginBottom: "6px" }}>Topic</label>
                  <select required value={conciergeForm.topic} onChange={(e) => setConciergeForm((f) => ({ ...f, topic: e.target.value }))} style={{ width: "100%", background: "var(--cream)", border: "1px solid var(--border)", padding: "10px 14px", fontFamily: "inherit", fontSize: "13px", fontWeight: 300, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const }}>
                    {["General Question", "Order Issue", "Membership & Billing", "Shipping & Logistics", "Returns & Replacements", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", display: "block", marginBottom: "6px" }}>Message</label>
                  <textarea required placeholder="Tell us what's on your mind…" rows={5} value={conciergeForm.message} onChange={(e) => setConciergeForm((f) => ({ ...f, message: e.target.value }))} style={{ width: "100%", background: "var(--cream)", border: "1px solid var(--border)", padding: "10px 14px", fontFamily: "inherit", fontSize: "13px", fontWeight: 300, color: "var(--ink)", outline: "none", resize: "vertical", boxSizing: "border-box" as const }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <button type="button" onClick={() => setShowConcierge(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, fontFamily: "inherit" }}>Cancel</button>
                  <button type="submit" style={{ background: "var(--gold)", color: "var(--ink)", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, padding: "12px 24px", borderRadius: "2px" }}>Send message →</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile menu ───────────────────────────────────────── */}
      {menuOpen && (
        <div className="mobile-menu md:hidden">
          <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)", marginBottom: "48px" }} />
          <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "36px" }}>
            <Link href="/" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>
              Home
            </Link>
            <Link href="/about" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>
              About
            </Link>
            <Link href="/faq" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>
              FAQ
            </Link>
            <Link href="/account" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--gold)", textDecoration: "none", fontStyle: "italic" }}>
              Account
            </Link>
            <button onClick={handleSignOut} className="font-display"
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", background: "none", border: "none", cursor: "pointer", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Sign out
            </button>
          </nav>
        </div>
      )}

      <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>

        {/* ── Nav ─────────────────────────────────────────── */}
        <header style={{
          borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 65,
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

            <nav style={{ gap: "36px", alignItems: "center" }} className="hidden md:flex">
              <Link href="/#drops" className="nav-link" style={{ textDecoration: "none" }}>Drops</Link>
              <Link href="/about" className="nav-link" style={{ textDecoration: "none" }}>About</Link>
              <Link href="/faq" className="nav-link" style={{ textDecoration: "none" }}>FAQ</Link>
              {email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                <Link href="/admin" className="nav-link" style={{ textDecoration: "none", color: "var(--gold)" }}>Admin</Link>
              )}
              <button
                onClick={handleSignOut}
                className="nav-link"
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                Sign out
              </button>
            </nav>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex md:hidden"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", flexDirection: "column", gap: "4.5px", zIndex: 60 }}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span className={`bar ${menuOpen ? "bar-top-open" : ""}`} />
              <span className={`bar ${menuOpen ? "bar-mid-open" : ""}`} />
              <span className={`bar ${menuOpen ? "bar-bot-open" : ""}`} />
            </button>
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
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", flexShrink: 0 }}>Status</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: (profile?.stripe_customer_id || profile?.stripe_subscription_id) ? "var(--gold)" : "#B85450" }}>
                    {(profile?.stripe_customer_id || profile?.stripe_subscription_id) ? "Active" : "Inactive"}
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

          {/* ── Referrals ─────────────────────────────────── */}
          <section style={{ paddingTop: "20px", paddingBottom: "60px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
                  Referrals
                </p>
                <h2 className="font-display" style={{ fontSize: "28px", fontWeight: 500, letterSpacing: "-0.01em" }}>
                  Invite &amp; earn
                </h2>
              </div>
              {myCredits > 0 && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "4px" }}>
                    Available credit
                  </p>
                  <span className="font-display" style={{ fontSize: "28px", fontWeight: 500, color: "var(--gold)" }}>
                    ${(myCredits / 100).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="grain" style={{ backgroundColor: "#FDFAF5", border: "1px solid var(--border)", borderRadius: "4px", padding: "32px", position: "relative", overflow: "hidden" }}>

              {/* How it works */}
              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", marginBottom: referralCredits.length > 0 ? "28px" : "0", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "10px" }}>
                    How it works
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.8, color: "var(--ink-muted)", marginBottom: "20px" }}>
                    Share your invite link. Your friend gets{" "}
                    <span style={{ fontWeight: 500, color: "var(--ink)" }}>$25 off their first order</span>
                    {" "}— and you earn a{" "}
                    <span style={{ fontWeight: 500, color: "var(--ink)" }}>$25 credit</span>
                    {" "}when they join.
                  </p>

                  {referralCode ? (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{
                        flex: 1, minWidth: "180px",
                        backgroundColor: "var(--parchment)", border: "1px solid var(--border)",
                        borderRadius: "2px", padding: "10px 14px",
                        fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)",
                        letterSpacing: "0.04em", fontFamily: "monospace",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        groupdrop.com?ref={referralCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}?ref=${referralCode}`);
                          setReferralCopied(true);
                          setTimeout(() => setReferralCopied(false), 2000);
                        }}
                        className="btn-primary"
                        style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                      >
                        {referralCopied ? "Copied ✓" : "Copy link →"}
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 300 }}>Loading your referral link…</p>
                  )}
                </div>

                {/* Credit balance widget */}
                <div style={{
                  textAlign: "center", padding: "20px 28px",
                  border: "1px solid var(--border)", borderRadius: "2px",
                  flexShrink: 0,
                }}>
                  <p style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "10px" }}>
                    Balance
                  </p>
                  <span className="font-display" style={{
                    fontSize: "44px", fontWeight: 500, lineHeight: 1,
                    color: myCredits > 0 ? "var(--gold)" : "var(--ink-muted)",
                  }}>
                    ${(myCredits / 100).toLocaleString()}
                  </span>
                  <p style={{ fontSize: "10px", color: "var(--ink-muted)", fontWeight: 300, marginTop: "8px", letterSpacing: "0.02em" }}>
                    {myCredits > 0 ? "Applied at checkout" : "No credits yet"}
                  </p>
                </div>
              </div>

              {/* Credit history */}
              {referralCredits.length > 0 && (
                <>
                  <hr className="gold-rule" style={{ marginBottom: "20px" }} />
                  <p style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "16px" }}>
                    Credit history
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {referralCredits.map((credit) => (
                      <div key={credit.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{
                            width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, display: "inline-block",
                            backgroundColor: credit.used ? "var(--parchment)" : "var(--gold)",
                            border: credit.used ? "1px solid var(--ink-muted)" : "none",
                          }} />
                          <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>
                            {formatDate(credit.created_at)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: credit.used ? "var(--ink-muted)" : "var(--gold)" }}>
                            {credit.used ? "Used" : "Available"}
                          </span>
                          <span className="font-display" style={{ fontSize: "20px", fontWeight: 500, color: credit.used ? "var(--ink-muted)" : "var(--gold)" }}>
                            ${(credit.amount_cents / 100).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

            </div>
          </section>

          {/* ── Order History ─────────────────────────────── */}
          <section style={{ paddingTop: "20px", paddingBottom: "80px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
                  Order History
                </p>
                <h2 className="font-display" style={{ fontSize: "28px", fontWeight: 500, letterSpacing: "-0.01em" }}>
                  Your allocations
                </h2>
              </div>
              {orders.length > 0 && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "4px" }}>
                    Total authorized
                  </p>
                  <span className="font-display" style={{ fontSize: "28px", fontWeight: 500 }}>
                    ${(orders.reduce((sum, o) => sum + o.total_cents, 0) / 100).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {orders.length === 0 ? (
              <div style={{ border: "1px dashed var(--gold)", borderRadius: "4px", backgroundColor: "var(--parchment)", padding: "40px", textAlign: "center" }}>
                <p className="font-display" style={{ fontSize: "20px", fontWeight: 500, fontStyle: "italic", marginBottom: "8px", color: "var(--ink)" }}>
                  No orders yet.
                </p>
                <p style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink-muted)", marginBottom: "24px" }}>
                  Join a drop to see your allocations here.
                </p>
                <Link href="/#drops" className="btn-primary" style={{ display: "inline-block", borderRadius: "2px", textDecoration: "none" }}>
                  View open drops →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {orders.map((order) => {
                  const statusColor = order.status === "delivered" ? "var(--gold)"
                    : order.status === "shipped" ? "#8A7B5A"
                    : order.status === "confirmed" ? "var(--ink-muted)"
                    : order.status === "cancelled" || order.status === "refunded" ? "#B85450"
                    : "var(--ink-muted)";
                  const statusLabel = order.status === "pending" ? "Awaiting confirmation"
                    : order.status === "confirmed" ? "Confirmed"
                    : order.status === "shipped" ? "Shipped"
                    : order.status === "delivered" ? "Delivered"
                    : order.status === "cancelled" ? "Cancelled"
                    : order.status === "refunded" ? "Refunded"
                    : order.status;
                  return (
                    <div key={order.id} className="grain" style={{ backgroundColor: "#FDFAF5", border: "1px solid var(--border)", borderRadius: "4px", padding: "28px 32px", position: "relative", overflow: "hidden" }}>

                      {/* Order header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <h3 className="font-display" style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "4px" }}>
                            {order.drop_name}
                          </h3>
                          <p style={{ fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)", letterSpacing: "0.02em" }}>
                            {formatDate(order.created_at)} · Ref {order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: statusColor, display: "inline-block", flexShrink: 0 }} />
                          <span style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, color: statusColor }}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <hr className="gold-rule" style={{ marginBottom: "16px" }} />

                      {/* Line items */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                        {(order.items as OrderItem[]).map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink-muted)" }}>
                              {item.name} <span style={{ opacity: 0.6 }}>× {item.qty}</span>
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", flexShrink: 0 }}>
                              ${(item.line_total_cents / 100).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer row — total + CTA */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <p style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "2px" }}>
                            Total authorized
                          </p>
                          <span className="font-display" style={{ fontSize: "24px", fontWeight: 500 }}>
                            ${(order.total_cents / 100).toLocaleString()}
                          </span>
                        </div>
                        <Link href={"/drops/" + order.drop_slug} className="btn-primary" style={{ borderRadius: "2px", textDecoration: "none" }}>
                          View drop →
                        </Link>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </section>

          {/* ── Footer ────────────────────────────────────── */}
          <hr className="gold-rule" />
          <footer style={{ padding: "28px 0 40px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: "16px",
              marginBottom: "20px",
            }}>
              <span className="font-display" style={{ fontSize: "15px", fontWeight: 400, letterSpacing: "0.05em", color: "var(--ink-muted)" }}>
                groupdrop
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
                <Link href="/about" className="nav-link" style={{ textDecoration: "none" }}>About</Link>
                <Link href="/faq" className="nav-link" style={{ textDecoration: "none" }}>FAQ</Link>
                <button onClick={openConcierge} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Concierge</button>
              </div>
              <span style={{ fontSize: "10px", letterSpacing: "0.12em", color: "var(--ink-muted)", fontWeight: 300 }}>
                &copy; {new Date().getFullYear()} groupdrop. All rights reserved.
              </span>
            </div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", paddingTop: "4px" }}>
              <Link href="/terms" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none" }}>Terms of Service</Link>
              <Link href="/terms-of-sale" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none" }}>Terms of Sale</Link>
              <Link href="/privacy" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none" }}>Privacy Policy</Link>
              <Link href="/cookies" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none" }}>Cookie Policy</Link>
            </div>
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
  ".bar { display: block; width: 22px; height: 1.5px; background: var(--ink); transition: transform 0.25s ease, opacity 0.25s ease; }",
  ".bar-top-open { transform: translateY(5px) rotate(45deg); }",
  ".bar-mid-open { opacity: 0; }",
  ".bar-bot-open { transform: translateY(-5px) rotate(-45deg); }",
  ".mobile-menu { position: fixed; inset: 0; z-index: 55; background: var(--cream); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: menuFadeIn 0.2s ease forwards; }",
  "@keyframes menuFadeIn { from { opacity: 0 } to { opacity: 1 } }",
].join("\n");