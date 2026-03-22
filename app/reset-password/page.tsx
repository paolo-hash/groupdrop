"use client";

/*
  File location: app/reset-password/page.tsx

  Users land here after clicking the reset link in their email.
  Supabase automatically sets the session from the URL hash,
  so we just need to let them set a new password.
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    /*
      supabase.auth.updateUser updates the password for the currently
      authenticated session. Supabase sets this session automatically
      from the token in the reset email URL.
    */
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);

    /* Redirect to login after 2 seconds */
    setTimeout(() => router.push("/login"), 2000);
  }

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
          </div>
        </header>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>

          {/* ── Hero ──────────────────────────────────────── */}
          <section style={{ paddingTop: "100px", paddingBottom: "64px" }}>

            <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
              <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
              <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                Account Recovery
              </span>
            </div>

            <h1 className="font-display animate-fade-up delay-1" style={{
              fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 500,
              lineHeight: 1.02, letterSpacing: "-0.01em", marginBottom: "16px",
            }}>
              <em style={{ fontStyle: "italic" }}>Set a new password.</em>
            </h1>

            <p className="animate-fade-up delay-2" style={{
              fontSize: "15px", fontWeight: 300, lineHeight: 1.75,
              color: "var(--ink-muted)", maxWidth: "400px", letterSpacing: "0.01em",
            }}>
              Choose a new password for your groupdrop account.
            </p>

          </section>

          <hr className="gold-rule" />

          {/* ── Form or Success state ──────────────────────── */}
          <section style={{ paddingTop: "64px", paddingBottom: "80px", maxWidth: "480px" }}>

            {success ? (
              <div className="grain" style={{
                backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                borderRadius: "4px", padding: "32px", position: "relative", overflow: "hidden",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "12px", height: "1px", backgroundColor: "var(--gold)" }} />
                  <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                    Password updated
                  </span>
                </div>
                <h2 className="font-display" style={{ fontSize: "24px", fontWeight: 500, marginBottom: "12px" }}>
                  All done.
                </h2>
                <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)" }}>
                  Your password has been updated. Redirecting you to sign in…
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500, marginBottom: "8px" }}>
                  New Password
                </p>
                <h2 className="font-display" style={{ fontSize: "28px", fontWeight: 500, letterSpacing: "-0.01em", marginBottom: "32px" }}>
                  Choose a new password
                </h2>

                <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                  {/* New password */}
                  <div>
                    <label style={{
                      display: "block", fontSize: "10px", letterSpacing: "0.16em",
                      textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "8px",
                    }}>
                      New Password
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
                        fontFamily: "inherit", outline: "none", transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label style={{
                      display: "block", fontSize: "10px", letterSpacing: "0.16em",
                      textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, marginBottom: "8px",
                    }}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        backgroundColor: "#FDFAF5", border: "1px solid var(--border)",
                        borderRadius: "2px", padding: "12px 16px",
                        fontSize: "14px", fontWeight: 300, color: "var(--ink)",
                        fontFamily: "inherit", outline: "none", transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div style={{
                      borderLeft: "2px solid #B85450", backgroundColor: "#FDF5F5",
                      padding: "10px 10px 10px 14px", borderRadius: "0 2px 2px 0",
                    }}>
                      <p style={{ fontSize: "12px", color: "#B85450", fontWeight: 400 }}>{error}</p>
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
                    {loading ? "Updating…" : "Update password →"}
                  </button>

                </form>
              </>
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