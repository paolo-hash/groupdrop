"use client";

/*
  File location: app/signup/page.tsx

  Reached from the Join page when a user clicks a tier CTA button.
  URL format: /signup?tier=curator&billing=annual

  Flow:
    1. User arrives with tier + billing pre-selected from the Join page
    2. Fills in name, email, password
    3. Supabase creates the auth user (trigger auto-creates profiles row)
    4. We update profiles with tier, billing_cycle, full_name
    5. Redirect to /#drops on success
*/

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

const TIER_LABELS: Record<string, string> = {
  essentialist: "The Essentialist",
  enthusiast: "The Enthusiast",
  curator: "The Curator",
};

const TIER_PRICES: Record<string, { monthly: number; annual: number }> = {
  essentialist: { monthly: 15, annual: 120 },
  enthusiast:   { monthly: 25, annual: 240 },
  curator:      { monthly: 50, annual: 480 },
};

/* ─────────────────────────────────────────────────────────────
   Inner component — reads search params
───────────────────────────────────────────────────────────── */
function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /*
    Read tier and billing from the URL query params passed in from
    the Join page CTA buttons (e.g. /signup?tier=curator&billing=annual).
    Default to essentialist + monthly if params are missing.
  */
  const tier = (searchParams.get("tier") ?? "essentialist") as string;
  const billing = (searchParams.get("billing") ?? "monthly") as "monthly" | "annual";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tierLabel = TIER_LABELS[tier] ?? "The Essentialist";
  const tierPrices = TIER_PRICES[tier] ?? TIER_PRICES.essentialist;
  const price = billing === "annual"
    ? Math.round(tierPrices.annual / 12)
    : tierPrices.monthly;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    /* Step 1 — Create Supabase auth user */
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, /* stored in auth.users metadata */
      },
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    /*
      Step 2 — Update the profiles row that the Supabase trigger created.
      We write tier, billing_cycle, and full_name here.
      stripe_customer_id and stripe_subscription_id will be added later
      when Stripe is wired up.
    */
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        tier,
        billing_cycle: billing,
      });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
    }

    // Step 3 - Call checkout API
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, billing, userId: data.user.id, email }),
    });

    const { url, error: checkoutError } = await res.json();

    if (checkoutError || !url) {
      setError("Account created but could not start checkout. Please try again.");
      setLoading(false);
      return;
    }

    // Step 4 - Redirect to Stripe checkout
    window.location.href = url;
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{ paddingTop: "100px", paddingBottom: "64px" }}>

        <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
          <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
            Create Account
          </span>
        </div>

        <h1 className="font-display animate-fade-up delay-1" style={{
          fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 500,
          lineHeight: 1.02, letterSpacing: "-0.01em", marginBottom: "16px",
        }}>
          <em style={{ fontStyle: "italic" }}>Join groupdrop.</em>
        </h1>

        <p className="animate-fade-up delay-2" style={{
          fontSize: "15px", fontWeight: 300, lineHeight: 1.75,
          color: "var(--ink-muted)", maxWidth: "400px", letterSpacing: "0.01em",
        }}>
          You&apos;re signing up for{" "}
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{tierLabel}</span>
          {" "}at{" "}
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>${price}/mo</span>
          {billing === "annual" ? " billed annually" : " billed monthly"}.
        </p>

      </section>

      <hr className="gold-rule" />

      {/* ── Form + Summary grid ───────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "48px",
        paddingTop: "64px",
        paddingBottom: "80px",
        alignItems: "start",
      }}>

        {/* ── Signup form ─────────────────────────────────────── */}
        <section>
          <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
            Your Details
          </p>
          <h2 className="font-display" style={{ fontSize: "28px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "32px" }}>
            Create your account
          </h2>

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Full name */}
            <div>
              <label style={{
                display: "block", fontSize: "10px", letterSpacing: "0.16em",
                textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "8px",
              }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                style={{
                  width: "100%", boxSizing: "border-box",
                  backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                  borderRadius: "2px", padding: "12px 16px",
                  fontSize: "14px", fontWeight: 300, color: "var(--ink)",
                  fontFamily: "inherit", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: "block", fontSize: "10px", letterSpacing: "0.16em",
                textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "8px",
              }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%", boxSizing: "border-box",
                  backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                  borderRadius: "2px", padding: "12px 16px",
                  fontSize: "14px", fontWeight: 300, color: "var(--ink)",
                  fontFamily: "inherit", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block", fontSize: "10px", letterSpacing: "0.16em",
                textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "8px",
              }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                style={{
                  width: "100%", boxSizing: "border-box",
                  backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                  borderRadius: "2px", padding: "12px 16px",
                  fontSize: "14px", fontWeight: 300, color: "var(--ink)",
                  fontFamily: "inherit", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                borderLeft: "2px solid #B85450",
                backgroundColor: "#FDF5F5",
                padding: "10px 10px 10px 14px",
                borderRadius: "0 2px 2px 0",
              }}>
                <p style={{ fontSize: "12px", color: "#B85450", fontWeight: 400 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={loading ? "" : "btn-primary"}
              style={{
                width: "100%", borderRadius: "2px", border: "none",
                cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                marginTop: "8px",
                ...(loading ? {
                  backgroundColor: "var(--parchment)", color: "var(--ink-muted)",
                  fontSize: "11px", letterSpacing: "0.08em",
                  textTransform: "uppercase" as const, fontWeight: 500, padding: "14px 24px",
                } : { padding: "14px 24px" }),
              }}
            >
              {loading ? "Creating account…" : "Create account →"}
            </button>

            {/* Sign in link */}
            <p style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", textAlign: "center" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
                Sign in
              </Link>
            </p>

          </form>
        </section>

        {/* ── Order summary ───────────────────────────────────── */}
        <aside style={{ position: "sticky", top: "88px" }}>
          <div className="grain" style={{
            backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
            borderRadius: "4px", padding: "32px", position: "relative", overflow: "hidden",
          }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "6px" }}>
              Your Plan
            </p>
            <h3 className="font-display" style={{ fontSize: "24px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "4px" }}>
              {tierLabel}
            </h3>
            <p style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", marginBottom: "24px", letterSpacing: "0.02em" }}>
              {billing === "annual" ? "Annual billing" : "Monthly billing"}
            </p>

            <hr className="gold-rule" style={{ marginBottom: "24px" }} />

            {/* Price breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>Monthly rate</span>
                <span className="font-display" style={{ fontSize: "18px", fontWeight: 500 }}>${price}/mo</span>
              </div>
              {billing === "annual" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>Billed today</span>
                  <span className="font-display" style={{ fontSize: "18px", fontWeight: 500 }}>${tierPrices.annual}</span>
                </div>
              )}
              {billing === "annual" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)" }}>Annual savings</span>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--gold)" }}>
                    ${tierPrices.monthly * 12 - tierPrices.annual} saved
                  </span>
                </div>
              )}
            </div>

            <hr className="gold-rule" style={{ marginBottom: "20px" }} />

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tier === "essentialist" && (
                <>
                  <FeatureLine text="Save on 2 curated drops per month" />
                  <FeatureLine text="Insider pricing — 30–40% below retail" />
                  <FeatureLine text="Drop previews & early intel" />
                  <FeatureLine text="Member newsletter" />
                </>
              )}
              {tier === "enthusiast" && (
                <>
                  <FeatureLine text="Save on 5 curated drops per month" />
                  <FeatureLine text="Insider pricing — 30–40% below retail" />
                  <FeatureLine text="Drop previews & early intel" />
                  <FeatureLine text="Free shipping on orders over $150" />
                </>
              )}
              {tier === "curator" && (
                <>
                  <FeatureLine text="Unlimited drops per month" />
                  <FeatureLine text="Insider pricing — 30–40% below retail" />
                  <FeatureLine text="24-hour early access to every drop" />
                  <FeatureLine text="Free shipping on all orders" />
                </>
              )}
            </div>

            <p style={{ marginTop: "24px", fontSize: "11px", fontWeight: 300, lineHeight: 1.7, color: "var(--ink-muted)" }}>
              Never charged until a drop funds. Founding member pricing locked in for life. Cancel anytime.
            </p>
          </div>

          {/* Change plan link */}
          <p style={{ marginTop: "16px", textAlign: "center", fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)" }}>
            Wrong plan?{" "}
            <Link href="/join" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
              Change tier
            </Link>
          </p>
        </aside>

      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
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
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/about" style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, textDecoration: "none" }}>About</Link>
            <Link href="/faq" style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, textDecoration: "none" }}>FAQ</Link>
            <a href="mailto:hello@groupdrop.com" style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, textDecoration: "none" }}>Concierge</a>
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
  );
}

/* Small helper component for the feature list in the summary card */
function FeatureLine({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ width: "12px", height: "1px", backgroundColor: "var(--gold)", flexShrink: 0 }} />
      <span style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", lineHeight: 1.5 }}>
        {text}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page — wraps SignupForm in Suspense (required by Next.js when
   using useSearchParams in a client component)
───────────────────────────────────────────────────────────── */
export default function SignupPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />
      <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>

        {/* ── Nav ─────────────────────────────────────────────── */}
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
            <Link href="/join" className="nav-link" style={{ textDecoration: "none" }}>
              ← Back to plans
            </Link>
          </div>
        </header>

        {/*
          Suspense boundary required by Next.js for useSearchParams.
          The fallback shows a minimal loading state in the same design language.
        */}
        <Suspense fallback={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <p style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
              Loading…
            </p>
          </div>
        }>
          <SignupForm />
        </Suspense>

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