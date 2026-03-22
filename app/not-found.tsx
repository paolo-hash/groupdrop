"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHARED_STYLES }} />
      <main style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)", display: "flex", flexDirection: "column" }}>

        {/* ── Nav ─────────────────────────────────────────────── */}
        <header style={{
          borderBottom: "1px solid var(--border)",
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
            </nav>
          </div>
        </header>

        {/* ── 404 Hero ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 28px" }}>
          <div style={{ maxWidth: "560px", width: "100%" }}>

            {/* Decorative numeral */}
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(120px, 20vw, 200px)",
              fontWeight: 400,
              lineHeight: 1,
              WebkitTextStroke: "1px var(--gold)",
              color: "transparent",
              userSelect: "none",
              marginBottom: "0px",
              opacity: 0.25,
            }}>
              404
            </div>

            <div style={{ marginTop: "-20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
                <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                  Page not found
                </span>
              </div>

              <h1 className="font-display" style={{
                fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 500,
                lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: "20px",
              }}>
                <em style={{ fontStyle: "italic" }}>This page</em>
                <br />doesn&apos;t exist.
              </h1>

              <p style={{
                fontSize: "15px", fontWeight: 300, lineHeight: 1.75,
                color: "var(--ink-muted)", marginBottom: "40px", maxWidth: "400px",
              }}>
                The drop may have ended, the link may be broken, or perhaps it was never here to begin with.
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/" className="btn-primary" style={{ borderRadius: "2px", textDecoration: "none" }}>
                  View open drops →
                </Link>
                <Link href="/faq" style={{
                  fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
                  fontWeight: 500, color: "var(--ink-muted)", textDecoration: "none",
                }}>
                  Visit FAQ
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div style={{ maxWidth: "1100px", margin: "0 auto", width: "100%", padding: "0 28px", boxSizing: "border-box" }}>
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
  "::-webkit-scrollbar { width: 4px; }",
  "::-webkit-scrollbar-track { background: var(--cream); }",
  "::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }",
  ".nav-link { position: relative; letter-spacing: 0.12em; font-size: 11px; font-weight: 500; text-transform: uppercase; color: var(--ink-muted); transition: color 0.2s; }",
  ".nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--gold); transition: width 0.3s ease; }",
  ".nav-link:hover { color: var(--ink); }",
  ".nav-link:hover::after { width: 100%; }",
  ".btn-primary { background: var(--gold); color: var(--ink); letter-spacing: 0.08em; font-size: 11px; font-weight: 500; text-transform: uppercase; padding: 12px 24px; display: inline-block; transition: background 0.2s ease, transform 0.15s ease; }",
  ".btn-primary:hover { background: var(--gold-light); transform: translateY(-1px); }",
  ".gold-rule { border: none; border-top: 1px solid var(--gold); opacity: 0.35; margin: 0; }",
].join("\n");
