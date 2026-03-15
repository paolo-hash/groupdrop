"use client";

import { useState } from "react";
import Link from "next/link";

/*
  File location: app/join/page.tsx

  Linked from the "Join" nav item on the homepage.
  Uses the exact same SHARED_STYLES design system as the drop pages —
  same fonts, tokens, utility classes, and layout language.
*/

const tiers = [
  {
    id: "essentialist",
    name: "The Essentialist",
    roman: "I",
    monthly: 15,
    annual: 120,
    tagline: "The considered entry.",
    features: [
      "Access to view all drops",
      "Join up to 2 drops per month",
    ],
    cta: "Start with Essentialist",
    featured: false,
  },
  {
    id: "enthusiast",
    name: "The Enthusiast",
    roman: "II",
    monthly: 25,
    annual: 240,
    tagline: "For the discerning regular.",
    features: [
      "Access to view all drops",
      "Join up to 5 drops per month",
      "Free shipping on orders over $150",
    ],
    cta: "Start with Enthusiast",
    featured: true, // highlighted tier
  },
  {
    id: "curator",
    name: "The Curator",
    roman: "III",
    monthly: 55,
    annual: 600,
    tagline: "Unrestricted access, elevated.",
    features: [
      "Access to view all drops",
      "Unlimited drops per month",
      "24-hour early access to every drop",
      "Free shipping on all orders",
    ],
    cta: "Start with Curator",
    featured: false,
  },
];

export default function JoinPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />

      <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>

        {/* ── Nav — identical to drop pages ─────────────────── */}
        <header style={{
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(247,244,238,0.88)",
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
              <Link href="/#how" className="nav-link" style={{ textDecoration: "none" }}>How it works</Link>
              <Link href="/join" className="nav-link" style={{ textDecoration: "none", color: "var(--gold)" }}>Join</Link>
            </nav>
          </div>
        </header>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>

          {/* ── Hero ──────────────────────────────────────────── */}
          <section style={{ paddingTop: "100px", paddingBottom: "72px" }}>

            {/* Overline */}
            <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
              <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
              <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                Membership
              </span>
            </div>

            <h1 className="font-display animate-fade-up delay-1" style={{
              fontSize: "clamp(44px, 8vw, 92px)", fontWeight: 500,
              lineHeight: 1.02, letterSpacing: "-0.01em", maxWidth: "720px", marginBottom: "28px",
            }}>
              <em style={{ fontStyle: "italic" }}>Choose your</em>
              <br />
              <span>level of access.</span>
            </h1>

            <p className="animate-fade-up delay-2" style={{
              fontSize: "16px", fontWeight: 300, lineHeight: 1.75,
              color: "var(--ink-muted)", maxWidth: "440px", letterSpacing: "0.01em",
              marginBottom: "48px",
            }}>
              Every tier unlocks insider pricing on brands that never go on sale.
              Choose how often you want to participate.
            </p>

            {/* ── Billing toggle ────────────────────────────── */}
            {/*
              Toggle between monthly and annual billing.
              Annual shows a savings callout to nudge toward higher LTV.
            */}
            <div className="animate-fade-up delay-3" style={{ display: "flex", alignItems: "center", gap: "0px" }}>
              <div style={{
                display: "inline-flex",
                border: "1px solid var(--gold)",
                borderRadius: "2px",
                overflow: "hidden",
                backgroundColor: "var(--parchment)",
              }}>
                <button
                  onClick={() => setBilling("monthly")}
                  style={{
                    padding: "10px 20px",
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                    fontFamily: "inherit",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s, color 0.2s",
                    backgroundColor: billing === "monthly" ? "var(--gold)" : "transparent",
                    color: billing === "monthly" ? "var(--ink)" : "var(--ink-muted)",
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  style={{
                    padding: "10px 20px",
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                    fontFamily: "inherit",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s, color 0.2s",
                    backgroundColor: billing === "annual" ? "var(--gold)" : "transparent",
                    color: billing === "annual" ? "var(--ink)" : "var(--ink-muted)",
                  }}
                >
                  Annual
                </button>
              </div>
              {/* Savings callout — only shown when annual is selected */}
              {billing === "annual" && (
                <span style={{
                  marginLeft: "16px",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  fontWeight: 500,
                }}>
                  Save up to 2 months
                </span>
              )}
            </div>

          </section>

          <hr className="gold-rule" />

          {/* ── Tier Cards ────────────────────────────────────── */}
          <section style={{ paddingTop: "64px", paddingBottom: "80px" }}>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              alignItems: "stretch",
            }}>
              {tiers.map((tier, i) => {
                const price = billing === "monthly" ? tier.monthly : Math.round(tier.annual / 12);
                const annualTotal = tier.annual;
                const monthlySavings = tier.monthly * 12 - annualTotal;

                return (
                  <div
                    key={tier.id}
                    className="animate-fade-up"
                    style={{ animationDelay: i * 0.12 + "s" }}
                  >
                    <div
                      className="grain"
                      style={{
                        backgroundColor: tier.featured ? "var(--ink)" : "#FDFAF5",
                        border: tier.featured ? "1px solid var(--gold)" : "1px solid var(--border)",
                        borderRadius: "4px",
                        padding: "36px 32px",
                        position: "relative",
                        overflow: "hidden",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Featured badge */}
                      {tier.featured && (
                        <div style={{
                          position: "absolute",
                          top: "0",
                          right: "32px",
                          backgroundColor: "var(--gold)",
                          color: "var(--ink)",
                          fontSize: "8px",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: "0 0 4px 4px",
                        }}>
                          Most Popular
                        </div>
                      )}

                      {/* Roman numeral — decorative, same as homepage "How it works" */}
                      <div style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontStyle: "italic",
                        fontSize: "48px",
                        fontWeight: 400,
                        lineHeight: 1,
                        marginBottom: "8px",
                        WebkitTextStroke: "1px var(--gold)",
                        color: "transparent",
                        userSelect: "none",
                        opacity: tier.featured ? 0.6 : 0.3,
                      }}>
                        {tier.roman}
                      </div>

                      {/* Tier name */}
                      <h2 className="font-display" style={{
                        fontSize: "24px",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        marginBottom: "6px",
                        color: tier.featured ? "var(--cream)" : "var(--ink)",
                      }}>
                        {tier.name}
                      </h2>

                      {/* Tagline */}
                      <p style={{
                        fontSize: "12px",
                        fontWeight: 300,
                        letterSpacing: "0.03em",
                        color: tier.featured ? "var(--gold-light)" : "var(--ink-muted)",
                        marginBottom: "28px",
                      }}>
                        {tier.tagline}
                      </p>

                      {/* Price */}
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                          <span className="font-display" style={{
                            fontSize: "48px",
                            fontWeight: 500,
                            lineHeight: 1,
                            color: tier.featured ? "var(--cream)" : "var(--ink)",
                          }}>
                            ${price}
                          </span>
                          <span style={{
                            fontSize: "11px",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: tier.featured ? "var(--gold-light)" : "var(--ink-muted)",
                            fontWeight: 500,
                            paddingBottom: "6px",
                          }}>
                            / mo
                          </span>
                        </div>

                        {/* Annual total + savings line */}
                        {billing === "annual" ? (
                          <p style={{
                            fontSize: "11px",
                            fontWeight: 300,
                            color: tier.featured ? "var(--gold-light)" : "var(--ink-muted)",
                            letterSpacing: "0.02em",
                            marginTop: "4px",
                          }}>
                            ${annualTotal} billed annually — saves ${monthlySavings}
                          </p>
                        ) : (
                          <p style={{
                            fontSize: "11px",
                            fontWeight: 300,
                            color: tier.featured ? "var(--gold-light)" : "var(--ink-muted)",
                            letterSpacing: "0.02em",
                            marginTop: "4px",
                          }}>
                            or ${annualTotal}/yr — save ${monthlySavings}
                          </p>
                        )}
                      </div>

                      {/* Divider */}
                      <div style={{
                        height: "1px",
                        backgroundColor: tier.featured ? "rgba(184,154,106,0.35)" : "var(--parchment)",
                        margin: "24px 0",
                      }} />

                      {/* Features list */}
                      <ul style={{
                        listStyle: "none",
                        padding: 0,
                        margin: "0 0 32px 0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        flexGrow: 1,
                      }}>
                        {tier.features.map((feature) => (
                          <li key={feature} style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            fontSize: "13px",
                            fontWeight: 300,
                            lineHeight: 1.6,
                            color: tier.featured ? "rgba(247,244,238,0.85)" : "var(--ink-muted)",
                          }}>
                            {/* Gold dash bullet — more refined than a checkmark */}
                            <span style={{
                              width: "12px",
                              height: "1px",
                              backgroundColor: "var(--gold)",
                              flexShrink: 0,
                              marginTop: "10px",
                              display: "inline-block",
                            }} />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* CTA button */}
                      {/*
                        Featured tier: cream fill on dark card.
                        Other tiers: standard gold btn-primary.
                      */}
                      <button
                        className={tier.featured ? "" : "btn-primary"}
                        style={{
                          width: "100%",
                          borderRadius: "2px",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          ...(tier.featured ? {
                            backgroundColor: "var(--gold)",
                            color: "var(--ink)",
                            fontSize: "11px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase" as const,
                            fontWeight: 500,
                            padding: "14px 24px",
                            transition: "background 0.2s ease",
                          } : {
                            padding: "14px 24px",
                          }),
                        }}
                      >
                        {tier.cta} →
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="gold-rule" />

          {/* ── Comparison note ───────────────────────────────── */}
          {/*
            A simple reassurance line below the cards — common on pricing pages.
            Keeps the luxury tone: no hard sell, just a quiet guarantee.
          */}
          <section style={{ paddingTop: "56px", paddingBottom: "80px", maxWidth: "560px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "16px" }}>
              Good to know
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                "Cancel or change your plan at any time.",
                "You are never charged until a drop reaches its collective target.",
                "Unused drop slots do not roll over month to month.",
              ].map((note) => (
                <div key={note} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ width: "16px", height: "1px", backgroundColor: "var(--gold)", flexShrink: 0, marginTop: "10px" }} />
                  <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.7, color: "var(--ink-muted)" }}>
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Footer ────────────────────────────────────────── */}
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
   SHARED_STYLES — identical to drop page, single source of truth
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