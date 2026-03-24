"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function PrivacyPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConcierge, setShowConcierge] = useState(false);
  const [conciergeForm, setConciergeForm] = useState({ name: "", email: "", topic: "General Question", message: "" });
  const [conciergeSent, setConciergeSent] = useState(false);
  const openConcierge = () => { setConciergeSent(false); setConciergeForm({ name: "", email: "", topic: "General Question", message: "" }); setShowConcierge(true); };

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
      <style>{STYLES}</style>

      {showConcierge && <ConciergeModal form={conciergeForm} sent={conciergeSent} onChange={(f) => setConciergeForm(f)} onSent={() => setConciergeSent(true)} onClose={() => setShowConcierge(false)} />}

      {menuOpen && (
        <div className="mobile-menu md:hidden">
          <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)", marginBottom: "48px" }} />
          <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "36px" }}>
            <Link href="/" className="font-display" onClick={() => setMenuOpen(false)} style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>Home</Link>
            <Link href="/about" className="font-display" onClick={() => setMenuOpen(false)} style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>About</Link>
            <Link href="/faq" className="font-display" onClick={() => setMenuOpen(false)} style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>FAQ</Link>
            {user ? (
              <>
                <Link href="/account" className="font-display" onClick={() => setMenuOpen(false)} style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>Account</Link>
                <button onClick={handleSignOut} className="font-display" style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", background: "none", border: "none", cursor: "pointer", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="font-display" onClick={() => setMenuOpen(false)} style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>Sign in</Link>
                <Link href="/join" className="font-display" onClick={() => setMenuOpen(false)} style={{ fontSize: "36px", fontWeight: 500, color: "var(--gold)", textDecoration: "none", fontStyle: "italic" }}>Join</Link>
              </>
            )}
          </nav>
        </div>
      )}

      <header style={{ borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)", backgroundColor: "rgba(247,244,238,0.88)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px", display: "flex", justifyContent: "space-between", alignItems: "center", height: "68px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="font-display" style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "0.04em", color: "var(--ink)" }}>groupdrop</span>
            <span style={{ fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500, color: "var(--gold)", border: "1px solid var(--gold)", padding: "2px 6px", opacity: 0.8 }}>beta</span>
          </Link>
          <nav style={{ gap: "36px", alignItems: "center" }} className="hidden md:flex">
            <Link href="/" className="nav-link">Drops</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/faq" className="nav-link">FAQ</Link>
            {user ? (
              <>
                <Link href="/account" className="nav-link">Account</Link>
                <button onClick={handleSignOut} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">Sign in</Link>
                <Link href="/join" className="nav-link" style={{ color: "var(--gold)" }}>Join</Link>
              </>
            )}
          </nav>
          <button onClick={() => setMenuOpen((o) => !o)} className="flex md:hidden" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", flexDirection: "column", gap: "4.5px", zIndex: 60 }} aria-label={menuOpen ? "Close menu" : "Open menu"}>
            <span className={`bar ${menuOpen ? "bar-top-open" : ""}`} />
            <span className={`bar ${menuOpen ? "bar-mid-open" : ""}`} />
            <span className={`bar ${menuOpen ? "bar-bot-open" : ""}`} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "0 28px" }}>
        <section style={{ paddingTop: "100px", paddingBottom: "72px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
            <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>Legal</span>
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: "28px" }}>
            Privacy <em style={{ fontStyle: "italic" }}>Policy.</em>
          </h1>
          <p style={{ fontSize: "13px", fontWeight: 300, color: "var(--ink-muted)", letterSpacing: "0.01em" }}>
            Last updated: —
          </p>
        </section>

        <hr className="gold-rule" />

        {SECTIONS.map(({ heading, placeholder }) => (
          <section key={heading} style={{ paddingTop: "56px", paddingBottom: "56px" }}>
            <h2 className="font-display" style={{ fontSize: "28px", fontWeight: 500, fontStyle: "italic", letterSpacing: "-0.01em", marginBottom: "20px" }}>
              {heading}
            </h2>
            <p style={{ fontSize: "15px", fontWeight: 300, lineHeight: 1.85, color: "var(--ink-muted)" }}>
              {placeholder}
            </p>
            <hr className="gold-rule" style={{ marginTop: "56px" }} />
          </section>
        ))}
      </main>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px" }}>
        <footer style={{ padding: "28px 0 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <span className="font-display" style={{ fontSize: "15px", fontWeight: 400, letterSpacing: "0.05em", color: "var(--ink-muted)" }}>groupdrop</span>
            <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <Link href="/about" className="nav-link" style={{ textDecoration: "none" }}>About</Link>
              <Link href="/faq" className="nav-link" style={{ textDecoration: "none" }}>FAQ</Link>
              <button onClick={openConcierge} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Concierge</button>
            </div>
            <span style={{ fontSize: "10px", letterSpacing: "0.12em", color: "var(--ink-muted)", fontWeight: 300 }}>&copy; {new Date().getFullYear()} groupdrop. All rights reserved.</span>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", paddingTop: "4px" }}>
            <Link href="/terms" style={legalLinkStyle}>Terms of Service</Link>
            <Link href="/terms-of-sale" style={legalLinkStyle}>Terms of Sale</Link>
            <Link href="/privacy" style={legalLinkStyle}>Privacy Policy</Link>
            <Link href="/cookies" style={legalLinkStyle}>Cookie Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

const SECTIONS = [
  { heading: "Information We Collect", placeholder: "Content coming soon." },
  { heading: "How We Use Your Information", placeholder: "Content coming soon." },
  { heading: "Information Sharing", placeholder: "Content coming soon." },
  { heading: "Data Retention", placeholder: "Content coming soon." },
  { heading: "Your Rights", placeholder: "Content coming soon." },
  { heading: "Cookies & Tracking", placeholder: "Content coming soon." },
  { heading: "Security", placeholder: "Content coming soon." },
  { heading: "Changes to This Policy", placeholder: "Content coming soon." },
  { heading: "Contact", placeholder: "Content coming soon." },
];

const legalLinkStyle: React.CSSProperties = {
  fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
  color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none",
};

type ConciergeForm = { name: string; email: string; topic: string; message: string };
function ConciergeModal({ form, sent, onChange, onSent, onClose }: { form: ConciergeForm; sent: boolean; onChange: (f: ConciergeForm) => void; onSent: () => void; onClose: () => void }) {
  const TOPICS = ["General Question", "Order Issue", "Membership & Billing", "Shipping & Logistics", "Returns & Replacements", "Other"];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(26,24,20,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#FDFAF5", border: "1px solid rgba(26,24,20,0.10)", borderRadius: "4px", padding: "48px 40px", maxWidth: "520px", width: "100%" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ width: "24px", height: "1px", backgroundColor: "#B89A6A" }} />
            <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#B89A6A", fontWeight: 500 }}>Concierge</span>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: 500, fontStyle: "italic", margin: 0 }}>How can we help?</h3>
        </div>
        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", fontWeight: 500, fontStyle: "italic", marginBottom: "12px" }}>Message received.</p>
            <p style={{ fontSize: "14px", fontWeight: 300, color: "#6B6560", lineHeight: 1.7 }}>Our concierge team will be in touch within one business day.</p>
            <button onClick={onClose} style={{ marginTop: "32px", background: "#B89A6A", color: "#1A1814", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" as const, fontWeight: 500, padding: "12px 24px", borderRadius: "2px" }}>Close</button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); const s = encodeURIComponent(`[Groupdrop Concierge] ${form.topic}`); const b = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nTopic: ${form.topic}\n\n${form.message}`); window.location.href = `mailto:hello@groupdrop.com?subject=${s}&body=${b}`; onSent(); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div><label style={labelStyle}>Full Name</label><input required placeholder="Jane Smith" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Email</label><input required type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} style={inputStyle} /></div>
            </div>
            <div><label style={labelStyle}>Topic</label><select required value={form.topic} onChange={(e) => onChange({ ...form, topic: e.target.value })} style={inputStyle}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Message</label><textarea required placeholder="Tell us what's on your mind…" rows={5} value={form.message} onChange={(e) => onChange({ ...form, message: e.target.value })} style={{ ...inputStyle, resize: "vertical" as const }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#6B6560", fontWeight: 500, fontFamily: "inherit" }}>Cancel</button>
              <button type="submit" style={{ background: "#B89A6A", color: "#1A1814", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" as const, fontWeight: 500, padding: "12px 24px", borderRadius: "2px" }}>Send message →</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
const labelStyle: React.CSSProperties = { fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "#6B6560", display: "block", marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", background: "#F7F4EE", border: "1px solid rgba(26,24,20,0.10)", padding: "10px 14px", fontFamily: "inherit", fontSize: "13px", fontWeight: 300, color: "#1A1814", outline: "none", boxSizing: "border-box" };

const STYLES = `
  :root { --cream: #F7F4EE; --parchment: #EDE9E0; --ink: #1A1814; --ink-muted: #6B6560; --gold: #B89A6A; --gold-light: #D4B896; --border: rgba(26,24,20,0.10); }
  body { background: var(--cream); font-family: 'Jost', sans-serif; }
  .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
  .nav-link { position: relative; letter-spacing: 0.12em; font-size: 11px; font-weight: 500; text-transform: uppercase; color: var(--ink-muted); transition: color 0.2s; text-decoration: none; }
  .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--gold); transition: width 0.3s ease; }
  .nav-link:hover { color: var(--ink); }
  .nav-link:hover::after { width: 100%; }
  .gold-rule { border: none; border-top: 1px solid var(--gold); opacity: 0.35; margin: 0; }
  .bar { display: block; width: 22px; height: 1.5px; background: var(--ink); transition: transform 0.25s ease, opacity 0.25s ease; }
  .bar-top-open { transform: translateY(5px) rotate(45deg); }
  .bar-mid-open { opacity: 0; }
  .bar-bot-open { transform: translateY(-5px) rotate(-45deg); }
  .mobile-menu { position: fixed; inset: 0; z-index: 55; background: var(--cream); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: menuFadeIn 0.2s ease forwards; }
  @keyframes menuFadeIn { from { opacity: 0 } to { opacity: 1 } }
`;
