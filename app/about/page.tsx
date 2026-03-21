"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function AboutPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>
      <style>{`
        :root {
          --cream: #F7F4EE;
          --parchment: #EDE9E0;
          --ink: #1A1814;
          --ink-muted: #6B6560;
          --gold: #B89A6A;
          --gold-light: #D4B896;
          --border: rgba(26,24,20,0.10);
        }
        body { background: var(--cream); font-family: 'Jost', sans-serif; }
        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .nav-link { position: relative; letter-spacing: 0.12em; font-size: 11px; font-weight: 500; text-transform: uppercase; color: var(--ink-muted); transition: color 0.2s; text-decoration: none; }
        .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--gold); transition: width 0.3s ease; }
        .nav-link:hover { color: var(--ink); }
        .nav-link:hover::after { width: 100%; }
        .gold-rule { border: none; border-top: 1px solid var(--gold); opacity: 0.35; margin: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.25s; }
        .delay-3 { animation-delay: 0.4s; }
        .delay-4 { animation-delay: 0.55s; }
        .bar { display: block; width: 22px; height: 1.5px; background: var(--ink); transition: transform 0.25s ease, opacity 0.25s ease; }
        .bar-top-open { transform: translateY(5px) rotate(45deg); }
        .bar-mid-open { opacity: 0; }
        .bar-bot-open { transform: translateY(-5px) rotate(-45deg); }
        .mobile-menu {
          position: fixed; inset: 0; z-index: 55;
          background: var(--cream);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          animation: menuFadeIn 0.2s ease forwards;
        }
        @keyframes menuFadeIn { from { opacity: 0 } to { opacity: 1 } }
        .promise-card {
          border: 1px solid var(--border);
          padding: 32px 28px;
          background: #FDFAF5;
          transition: border-color 0.3s ease;
        }
        .promise-card:hover { border-color: var(--gold); }
      `}</style>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu md:hidden">
          <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)", marginBottom: "48px" }} />
          <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "36px" }}>
            <Link href="/" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>
              Home
            </Link>
            <Link href="/about" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--gold)", textDecoration: "none", fontStyle: "italic" }}>
              About
            </Link>
            {user ? (
              <>
                <Link href="/account" className="font-display" onClick={() => setMenuOpen(false)}
                  style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>
                  Account
                </Link>
                <button onClick={handleSignOut}
                  className="font-display"
                  style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", background: "none", border: "none", cursor: "pointer", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="font-display" onClick={() => setMenuOpen(false)}
                  style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>
                  Sign in
                </Link>
                <Link href="/join" className="font-display" onClick={() => setMenuOpen(false)}
                  style={{ fontSize: "36px", fontWeight: 500, color: "var(--gold)", textDecoration: "none", fontStyle: "italic" }}>
                  Join
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(247,244,238,0.88)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px", display: "flex", justifyContent: "space-between", alignItems: "center", height: "68px" }}>

          {/* Wordmark */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="font-display" style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "0.04em", color: "var(--ink)" }}>
              groupdrop
            </span>
            <span style={{ fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500, color: "var(--gold)", border: "1px solid var(--gold)", padding: "2px 6px", opacity: 0.8 }}>
              beta
            </span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: "flex", gap: "36px", alignItems: "center" }} className="hidden md:flex">
            <Link href="/" className="nav-link">Drops</Link>
            <Link href="/about" className="nav-link" style={{ color: "var(--gold)" }}>About</Link>
            {user ? (
              <>
                <Link href="/account" className="nav-link" style={{ textDecoration: "none" }}>Account</Link>
                <button onClick={handleSignOut} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link" style={{ textDecoration: "none" }}>Sign in</Link>
                <Link href="/join" className="nav-link" style={{ textDecoration: "none", color: "var(--gold)" }}>Join</Link>
              </>
            )}
          </nav>

          {/* Hamburger — mobile only */}
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

      {/* Page content */}
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "0 28px 120px" }}>

        {/* ── Hero ─────────────────────────────────────────── */}
        <section style={{ paddingTop: "100px", paddingBottom: "72px" }}>
          <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
            <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
              Our Story
            </span>
          </div>

          <h1 className="font-display animate-fade-up delay-1" style={{
            fontSize: "clamp(48px, 7vw, 76px)",
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            marginBottom: "28px",
          }}>
            Luxury at the<br /><em style={{ fontStyle: "italic" }}>price it should be.</em>
          </h1>

          <p className="animate-fade-up delay-2" style={{
            fontSize: "17px",
            fontWeight: 300,
            lineHeight: 1.85,
            color: "var(--ink-muted)",
            letterSpacing: "0.01em",
            maxWidth: "560px",
          }}>
            Luxury isn&apos;t a price tag — it&apos;s a standard of quality. Brands like Le Labo, Aesop, and Byredo
            represent the pinnacle of personal care, but their pricing models are built for traditional retail
            where the customer pays for the storefront, the staff, and the marketing before they ever pay for the product.
          </p>

          <p className="animate-fade-up delay-3" style={{
            fontSize: "17px",
            fontWeight: 300,
            lineHeight: 1.85,
            color: "var(--ink-muted)",
            letterSpacing: "0.01em",
            maxWidth: "560px",
            marginTop: "20px",
          }}>
            We believe that those who appreciate these brands shouldn&apos;t have to wait for a &ldquo;sale&rdquo; that never comes.
          </p>
        </section>

        <hr className="gold-rule" />

        {/* ── The Collective Model ─────────────────────────── */}
        <section style={{ paddingTop: "72px", paddingBottom: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
              The Model
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            marginBottom: "28px",
          }}>
            <em style={{ fontStyle: "italic" }}>The Collective</em> Model
          </h2>

          <p style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.85, color: "var(--ink-muted)", marginBottom: "20px" }}>
            Groupdrop is a private procurement collective. We don&apos;t operate like a typical store because we aren&apos;t one.
          </p>

          <p style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.85, color: "var(--ink-muted)", marginBottom: "20px" }}>
            We utilize a Group Buy architecture to unlock wholesale pricing usually reserved for high-end boutiques and
            five-star hotels. By aggregating the individual demand of our members into a single, high-volume{" "}
            <span style={{ color: "var(--ink)", fontWeight: 400 }}>&ldquo;Power Order,&rdquo;</span>{" "}
            we meet the strict Minimum Order Quantities (MoQ) required by primary distributors.
          </p>

          {/* Callout stat */}
          <div style={{
            border: "1px solid var(--gold)",
            padding: "32px 36px",
            marginTop: "40px",
            marginBottom: "0",
            display: "flex",
            alignItems: "baseline",
            gap: "20px",
          }}>
            <span className="font-display" style={{ fontSize: "clamp(52px, 8vw, 80px)", fontWeight: 500, color: "var(--gold)", lineHeight: 1, letterSpacing: "-0.02em" }}>
              30–40%
            </span>
            <span style={{ fontSize: "14px", fontWeight: 300, color: "var(--ink-muted)", lineHeight: 1.6, maxWidth: "220px" }}>
              savings on the staples of a well-lived life
            </span>
          </div>
        </section>

        <hr className="gold-rule" />

        {/* ── How We Curate ────────────────────────────────── */}
        <section style={{ paddingTop: "72px", paddingBottom: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
              Curation
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            marginBottom: "28px",
          }}>
            How We <em style={{ fontStyle: "italic" }}>Curate</em>
          </h2>

          <p style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.85, color: "var(--ink-muted)", marginBottom: "20px" }}>
            We don&apos;t believe in endless scrolling. Each week, our team selects a focused{" "}
            <span style={{ color: "var(--ink)", fontWeight: 400 }}>&ldquo;Drop&rdquo;</span> — a curated
            archive of non-seasonal, classic SKUs. These are the essentials you already use and love.
          </p>

          <p style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.85, color: "var(--ink-muted)" }}>
            By narrowing our focus to these specific{" "}
            <span style={{ color: "var(--ink)", fontWeight: 400 }}>&ldquo;Iconic&rdquo;</span>{" "}
            products, we ensure our collective buying power is concentrated exactly where it matters most —
            hitting our targets faster and shipping more efficiently.
          </p>
        </section>

        <hr className="gold-rule" />

        {/* ── Why Membership ───────────────────────────────── */}
        <section style={{ paddingTop: "72px", paddingBottom: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
              Membership
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            marginBottom: "28px",
          }}>
            Why <em style={{ fontStyle: "italic" }}>Membership?</em>
          </h2>

          <p style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.85, color: "var(--ink-muted)", marginBottom: "20px" }}>
            To protect our wholesale relationships and maintain the integrity of our pricing, Groupdrop is a members-only platform.
          </p>

          <p style={{ fontSize: "16px", fontWeight: 300, lineHeight: 1.85, color: "var(--ink-muted)" }}>
            Your membership fee isn&apos;t just a ticket to the club. It&apos;s an investment in the infrastructure that makes
            these prices possible. Most members find that their annual fee pays for itself within their very first order.
          </p>

          {!user && (
            <div style={{ marginTop: "40px" }}>
              <Link href="/join" style={{
                display: "inline-block",
                backgroundColor: "var(--gold)",
                color: "var(--ink)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "14px 32px",
                transition: "background 0.2s ease",
              }}>
                Become a member →
              </Link>
            </div>
          )}
        </section>

        <hr className="gold-rule" />

        {/* ── The Promise ──────────────────────────────────── */}
        <section style={{ paddingTop: "72px", paddingBottom: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
              Our Commitment
            </span>
          </div>

          <h2 className="font-display" style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            marginBottom: "48px",
          }}>
            The <em style={{ fontStyle: "italic" }}>Promise</em>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>

            <div className="promise-card">
              <div style={{ width: "20px", height: "1px", backgroundColor: "var(--gold)", marginBottom: "20px" }} />
              <h3 className="font-display" style={{ fontSize: "22px", fontWeight: 500, fontStyle: "italic", marginBottom: "12px", lineHeight: 1.2 }}>
                100% Authenticity
              </h3>
              <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)" }}>
                We source exclusively from authorized primary distributors.
              </p>
            </div>

            <div className="promise-card">
              <div style={{ width: "20px", height: "1px", backgroundColor: "var(--gold)", marginBottom: "20px" }} />
              <h3 className="font-display" style={{ fontSize: "22px", fontWeight: 500, fontStyle: "italic", marginBottom: "12px", lineHeight: 1.2 }}>
                Radical Transparency
              </h3>
              <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)" }}>
                You see the Power Meter in real-time. You know exactly when the order is triggered.
              </p>
            </div>

            <div className="promise-card">
              <div style={{ width: "20px", height: "1px", backgroundColor: "var(--gold)", marginBottom: "20px" }} />
              <h3 className="font-display" style={{ fontSize: "22px", fontWeight: 500, fontStyle: "italic", marginBottom: "12px", lineHeight: 1.2 }}>
                Intentional Consumption
              </h3>
              <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)" }}>
                No impulse buys. Just the best products, sourced together.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <span className="font-display" style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "0.04em", color: "var(--ink-muted)" }}>
            groupdrop
          </span>
          <span style={{ fontSize: "11px", letterSpacing: "0.08em", color: "var(--ink-muted)", fontWeight: 300 }}>
            © {new Date().getFullYear()} Groupdrop. All rights reserved.
          </span>
        </div>
      </footer>

    </div>
  );
}
