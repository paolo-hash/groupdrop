"use client";

/*
  File location: app/confirm-email/page.tsx

  Shown after signup to prompt users to confirm their email address.
  Reads the email from the ?email= URL param so we can display it
  and use it for the resend action.

  Supabase sends a confirmation link — once clicked, the user's
  account is fully active and they can sign in.
*/

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

/* ─────────────────────────────────────────────────────────────
   Inner component — reads search params
───────────────────────────────────────────────────────────── */
function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState("");

  async function handleResend() {
    if (!email) return;
    setResendState("sending");
    setResendError("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      setResendError(error.message);
      setResendState("error");
      return;
    }

    setResendState("sent");
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section style={{ paddingTop: "100px", paddingBottom: "64px" }}>

        <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
          <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
            One more step
          </span>
        </div>

        <h1 className="font-display animate-fade-up delay-1" style={{
          fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 500,
          lineHeight: 1.02, letterSpacing: "-0.01em", marginBottom: "16px",
        }}>
          <em style={{ fontStyle: "italic" }}>Check your inbox.</em>
        </h1>

        <p className="animate-fade-up delay-2" style={{
          fontSize: "15px", fontWeight: 300, lineHeight: 1.75,
          color: "var(--ink-muted)", maxWidth: "440px", letterSpacing: "0.01em",
        }}>
          We sent a confirmation link to verify your email address.
        </p>

      </section>

      <hr className="gold-rule" />

      {/* ── Content ────────────────────────────────────────── */}
      <section style={{ paddingTop: "64px", paddingBottom: "80px", maxWidth: "560px" }}>

        {/* Main card */}
        <div className="grain" style={{
          backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
          borderRadius: "4px", padding: "40px", position: "relative", overflow: "hidden",
          marginBottom: "32px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ width: "12px", height: "1px", backgroundColor: "var(--gold)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
              Confirmation sent
            </span>
          </div>

          {email && (
            <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)", marginBottom: "20px" }}>
              We sent a link to{" "}
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>{email}</span>.
              Click the link in that email to activate your account.
            </p>
          )}

          <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)" }}>
            Once confirmed, you can sign in and complete your membership. Drop access, curated allocations, and member pricing will all be waiting.
          </p>
        </div>

        {/* Didn't receive it? */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "28px" }}>
          <p style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "16px" }}>
            Didn&apos;t receive it?
          </p>

          <p style={{ fontSize: "13px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)", marginBottom: "20px" }}>
            Check your spam folder first. If it&apos;s not there, you can resend the confirmation below.
          </p>

          {resendState === "sent" ? (
            <div style={{
              borderLeft: "2px solid var(--gold)", backgroundColor: "#FDFAF5",
              padding: "10px 10px 10px 14px", borderRadius: "0 2px 2px 0",
            }}>
              <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 400 }}>
                Confirmation resent — check your inbox.
              </p>
            </div>
          ) : (
            <>
              {resendState === "error" && resendError && (
                <div style={{
                  borderLeft: "2px solid #B85450", backgroundColor: "#FDF5F5",
                  padding: "10px 10px 10px 14px", borderRadius: "0 2px 2px 0",
                  marginBottom: "16px",
                }}>
                  <p style={{ fontSize: "12px", color: "#B85450", fontWeight: 400 }}>{resendError}</p>
                </div>
              )}
              <button
                onClick={handleResend}
                disabled={resendState === "sending" || !email}
                className={resendState === "sending" || !email ? "" : "btn-primary"}
                style={{
                  borderRadius: "2px", border: "none",
                  cursor: resendState === "sending" || !email ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  ...(resendState === "sending" || !email ? {
                    backgroundColor: "var(--parchment)", color: "var(--ink-muted)",
                    fontSize: "11px", letterSpacing: "0.08em",
                    textTransform: "uppercase" as const, fontWeight: 500, padding: "14px 24px",
                  } : { padding: "14px 24px" }),
                }}
              >
                {resendState === "sending" ? "Sending…" : "Resend confirmation →"}
              </button>
            </>
          )}
        </div>

        {/* Sign in link */}
        <p style={{ fontSize: "12px", fontWeight: 300, color: "var(--ink-muted)", marginTop: "32px" }}>
          Already confirmed?{" "}
          <Link href="/login" style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}>
            Sign in
          </Link>
        </p>

      </section>

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

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function ConfirmEmailPage() {
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

            <Link href="/login" className="nav-link" style={{ textDecoration: "none" }}>
              Sign in
            </Link>
          </div>
        </header>

        <Suspense fallback={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <p style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500 }}>
              Loading…
            </p>
          </div>
        }>
          <ConfirmEmailContent />
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
