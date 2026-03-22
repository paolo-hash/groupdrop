"use client";

import { useState } from "react";
import Link from "next/link";

const tiers = [
  {
    id: "essentialist",
    name: "The Essentialist",
    roman: "I",
    monthly: 15,
    annual: 120,
    tagline: "The considered entry.",
    features: [
      "Save on 2 curated drops per month",
      "Insider pricing — 30–40% below retail",
      "Drop previews & early intel",
      "Member newsletter",
    ],
    cta: "Join as Essentialist",
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
      "Save on 5 curated drops per month",
      "Insider pricing — 30–40% below retail",
      "Drop previews & early intel",
      "Free shipping on orders over $150",
    ],
    cta: "Join as Enthusiast",
    featured: true,
  },
  {
    id: "curator",
    name: "The Curator",
    roman: "III",
    monthly: 50,
    annual: 480,
    tagline: "Unrestricted access, elevated.",
    features: [
      "Unlimited drops per month",
      "Insider pricing — 30–40% below retail",
      "24-hour early access to every drop",
      "Free shipping on all orders",
    ],
    cta: "Join as Curator",
    featured: false,
  },
];

export default function JoinPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />

      <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>

        {/* ── Nav ─────────────────────────────────────────────── */}
        <header style={{
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 50,
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
            <nav style={{ gap: "36px", alignItems: "center" }} className="hidden md:flex">
              <Link href="/#drops" className="nav-link" style={{ textDecoration: "none" }}>Drops</Link>
              <Link href="/about" className="nav-link" style={{ textDecoration: "none" }}>About</Link>
              <Link href="/faq" className="nav-link" style={{ textDecoration: "none" }}>FAQ</Link>
              <Link href="/join" className="nav-link" style={{ textDecoration: "none", color: "var(--gold)" }}>Join</Link>
            </nav>
          </div>
        </header>

        {/* ── Founding member banner ───────────────────────────── */}
        <div style={{
          backgroundColor: "var(--ink)", color: "var(--cream)",
          textAlign: "center", padding: "12px 24px",
        }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500 }}>
            <span style={{ color: "var(--gold)" }}>Founding member pricing</span>
            {" "}— lock in your rate for the life of your membership.
          </p>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>

          {/* ── Hero ──────────────────────────────────────────── */}
          <section style={{ paddingTop: "80px", paddingBottom: "64px" }}>

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
              color: "var(--ink-muted)", maxWidth: "480px", letterSpacing: "0.01em",
              marginBottom: "32px",
            }}>
              Every tier unlocks 30–40% off brands that never go on sale — Aesop,
              Le Labo, Byredo, Diptyque. Choose how often you want to participate.
            </p>

            {/* Savings example pill */}
            <div className="animate-fade-up delay-2" style={{
              display: "inline-flex", alignItems: "center", gap: "16px",
              border: "1px solid var(--gold)", borderRadius: "2px",
              padding: "14px 20px", marginBottom: "40px",
              backgroundColor: "var(--parchment)",
            }}>
              <div style={{ width: "20px", height: "1px", backgroundColor: "var(--gold)", flexShrink: 0 }} />
              <p style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink)", lineHeight: 1.5 }}>
                An Aesop order that retails for{" "}
                <span style={{ textDecoration: "line-through", color: "var(--ink-muted)" }}>$180</span>
                {" "}— members pay{" "}
                <span className="font-display" style={{ fontSize: "16px", fontWeight: 500, color: "var(--gold)" }}>$115.</span>
              </p>
            </div>

            {/* Billing toggle */}
            <div className="animate-fade-up delay-3" style={{ display: "flex", alignItems: "center", gap: "0px" }}>
              <div style={{
                display: "inline-flex", border: "1px solid var(--gold)",
                borderRadius: "2px", overflow: "hidden", backgroundColor: "var(--parchment)",
              }}>
                <button
                  onClick={() => setBilling("monthly")}
                  style={{
                    padding: "10px 20px", fontSize: "10px", letterSpacing: "0.14em",
                    textTransform: "uppercase", fontWeight: 500, fontFamily: "inherit",
                    border: "none", cursor: "pointer", transition: "background 0.2s, color 0.2s",
                    backgroundColor: billing === "monthly" ? "var(--gold)" : "transparent",
                    color: billing === "monthly" ? "var(--ink)" : "var(--ink-muted)",
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  style={{
                    padding: "10px 20px", fontSize: "10px", letterSpacing: "0.14em",
                    textTransform: "uppercase", fontWeight: 500, fontFamily: "inherit",
                    border: "none", cursor: "pointer", transition: "background 0.2s, color 0.2s",
                    backgroundColor: billing === "annual" ? "var(--gold)" : "transparent",
                    color: billing === "annual" ? "var(--ink)" : "var(--ink-muted)",
                  }}
                >
                  Annual
                </button>
              </div>
              {billing === "annual" && (
                <span style={{
                  marginLeft: "16px", fontSize: "10px", letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--gold)", fontWeight: 500,
                }}>
                  Save up to 2 months
                </span>
              )}
            </div>

          </section>

          <hr className="gold-rule" />

          {/* ── Tier Cards ────────────────────────────────────── */}
          <section style={{ paddingTop: "64px", paddingBottom: "48px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px", alignItems: "stretch",
            }}>
              {tiers.map((tier, i) => {
                const price = billing === "monthly" ? tier.monthly : Math.round(tier.annual / 12);
                const annualTotal = tier.annual;
                const monthlySavings = tier.monthly * 12 - annualTotal;

                return (
                  <div key={tier.id} className="animate-fade-up" style={{ animationDelay: i * 0.12 + "s" }}>
                    <div
                      className="grain"
                      style={{
                        backgroundColor: tier.featured ? "var(--ink)" : "#FDFAF5",
                        border: tier.featured ? "1px solid var(--gold)" : "1px solid var(--border)",
                        borderRadius: "4px", padding: "36px 32px",
                        position: "relative", overflow: "hidden",
                        height: "100%", display: "flex", flexDirection: "column",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Featured badge */}
                      {tier.featured && (
                        <div style={{
                          position: "absolute", top: "0", right: "32px",
                          backgroundColor: "var(--gold)", color: "var(--ink)",
                          fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase",
                          fontWeight: 500, padding: "4px 10px", borderRadius: "0 0 4px 4px",
                        }}>
                          Most Popular
                        </div>
                      )}

                      {/* Roman numeral */}
                      <div style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontStyle: "italic", fontSize: "48px", fontWeight: 400,
                        lineHeight: 1, marginBottom: "8px",
                        WebkitTextStroke: "1px var(--gold)", color: "transparent",
                        userSelect: "none", opacity: tier.featured ? 0.6 : 0.3,
                      }}>
                        {tier.roman}
                      </div>

                      {/* Tier name */}
                      <h2 className="font-display" style={{
                        fontSize: "24px", fontWeight: 500, letterSpacing: "-0.01em",
                        marginBottom: "6px",
                        color: tier.featured ? "var(--cream)" : "var(--ink)",
                      }}>
                        {tier.name}
                      </h2>

                      {/* Tagline */}
                      <p style={{
                        fontSize: "12px", fontWeight: 300, letterSpacing: "0.03em",
                        color: tier.featured ? "var(--gold-light)" : "var(--ink-muted)",
                        marginBottom: "28px",
                      }}>
                        {tier.tagline}
                      </p>

                      {/* Price */}
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                          <span className="font-display" style={{
                            fontSize: "48px", fontWeight: 500, lineHeight: 1,
                            color: tier.featured ? "var(--cream)" : "var(--ink)",
                          }}>
                            ${price}
                          </span>
                          <span style={{
                            fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
                            color: tier.featured ? "var(--gold-light)" : "var(--ink-muted)",
                            fontWeight: 500, paddingBottom: "6px",
                          }}>
                            / mo
                          </span>
                        </div>
                        {billing === "annual" ? (
                          <p style={{
                            fontSize: "11px", fontWeight: 300,
                            color: tier.featured ? "var(--gold-light)" : "var(--ink-muted)",
                            letterSpacing: "0.02em", marginTop: "4px",
                          }}>
                            ${annualTotal} billed annually — saves ${monthlySavings}
                          </p>
                        ) : (
                          <p style={{
                            fontSize: "11px", fontWeight: 300,
                            color: tier.featured ? "var(--gold-light)" : "var(--ink-muted)",
                            letterSpacing: "0.02em", marginTop: "4px",
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
                        listStyle: "none", padding: 0, margin: "0 0 28px 0",
                        display: "flex", flexDirection: "column", gap: "12px", flexGrow: 1,
                      }}>
                        {tier.features.map((feature) => (
                          <li key={feature} style={{
                            display: "flex", alignItems: "flex-start", gap: "10px",
                            fontSize: "13px", fontWeight: 300, lineHeight: 1.6,
                            color: tier.featured ? "rgba(247,244,238,0.85)" : "var(--ink-muted)",
                          }}>
                            <span style={{
                              width: "12px", height: "1px", backgroundColor: "var(--gold)",
                              flexShrink: 0, marginTop: "10px", display: "inline-block",
                            }} />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Reassurance line — right above CTA */}
                      <p style={{
                        fontSize: "11px", fontWeight: 300, lineHeight: 1.6,
                        color: tier.featured ? "rgba(247,244,238,0.5)" : "var(--ink-muted)",
                        letterSpacing: "0.01em", marginBottom: "16px",
                      }}>
                        Never charged until a drop funds. Cancel anytime.
                      </p>

                      {/* CTA */}
                      <Link
                        href={`/signup?tier=${tier.id}&billing=${billing}`}
                        className={tier.featured ? "" : "btn-primary"}
                        style={{
                          width: "100%", borderRadius: "2px", display: "block",
                          textAlign: "center", textDecoration: "none",
                          fontFamily: "inherit", boxSizing: "border-box",
                          ...(tier.featured ? {
                            backgroundColor: "var(--gold)", color: "var(--ink)",
                            fontSize: "11px", letterSpacing: "0.08em",
                            textTransform: "uppercase" as const,
                            fontWeight: 500, padding: "14px 24px",
                            transition: "background 0.2s ease",
                          } : { padding: "14px 24px" }),
                        }}
                      >
                        {tier.cta} →
                      </Link>

                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="gold-rule" />

          {/* ── Good to know ─────────────────────────────────── */}
          <section style={{ paddingTop: "56px", paddingBottom: "80px", maxWidth: "560px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "16px" }}>
              Good to know
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                "Your card is never charged until a drop reaches its collective target. If it doesn't fund, you owe nothing.",
                "Cancel or change your plan at any time — no penalties, no questions.",
                "Unused drop slots do not roll over month to month.",
                "Founding member pricing is locked in for the life of your membership.",
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
      </main>
    </>
  );
}

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
  ".btn-primary { background: var(--gold); color: var(--ink); letter-spacing: 0.08em; font-size: 11px; font-weight: 500; text-transform: uppercase; padding: 12px 24px; display: inline-block; transition: background 0.2s ease, transform 0.15s ease; }",
  ".btn-primary:hover { background: var(--gold-light); transform: translateY(-1px); }",
  "@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }",
  ".animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }",
  ".delay-1 { animation-delay: 0.1s; }",
  ".delay-2 { animation-delay: 0.25s; }",
  ".delay-3 { animation-delay: 0.4s; }",
  ".gold-rule { border: none; border-top: 1px solid var(--gold); opacity: 0.35; margin: 0; }",
].join("\n");
