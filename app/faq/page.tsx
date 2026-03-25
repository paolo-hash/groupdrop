"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

const FAQ_SECTIONS = [
  {
    category: "The Collective Model",
    items: [
      {
        q: "What exactly is Groupdrop?",
        a: "Luxury brands typically require a high Minimum Order Quantity (MoQ) to unlock wholesale pricing — usually a volume far beyond what one person needs. Groupdrop acts as a procurement agent. We aggregate individual member orders into one \"Power Order\" to meet those institutional requirements, passing the 30–40% savings directly to you.",
      },
      {
        q: "What is the \"Power Meter\"?",
        a: "The meter on each Drop represents the collective progress toward the brand's wholesale threshold. Once the meter hits 100%, the order is officially triggered and secured.",
      },
      {
        q: "What happens if a Drop doesn't hit 100%?",
        a: "If a collective goal isn't met by the end of the Drop period, the order is simply canceled. Since we do not charge your card until the goal is reached, no money ever leaves your account.",
      },
    ],
  },
  {
    category: "Membership & Access",
    items: [
      {
        q: "Why do I have to pay a membership fee?",
        a: "To protect our wholesale relationships and keep our pricing private from the general public, we operate as a closed collective. Your membership fee sustains the logistics and sourcing infrastructure required to bypass traditional retail markups.",
      },
      {
        q: "Can I change my membership tier?",
        a: "Yes. You can upgrade to a higher tier at any time to unlock more monthly drops, early access, or complimentary shipping. Downgrades or cancellations will take effect at the end of your current billing cycle.",
      },
    ],
  },
  {
    category: "Payments & Security",
    items: [
      {
        q: "When will my card be charged?",
        a: "When you join a drop, we place a temporary authorization on your card to verify funds. You are only officially charged once the Power Meter hits 100% and the wholesale order is confirmed.",
      },
      {
        q: "Are these products authentic?",
        a: "Unquestionably. We source exclusively from authorized primary distributors. By cutting out the retail storefront, we reduce the cost — but the product remains the exact same \"Iconic\" SKU you find at retail.",
      },
    ],
  },
  {
    category: "Shipping & Logistics",
    items: [
      {
        q: "Why does shipping take longer than traditional retail?",
        a: "To achieve these prices, we move in high-volume cycles. Once a Drop hits 100%, the shipment travels from the distributor to our central hub for sorting before being dispatched to your individual address. This \"Slow Luxury\" model is the secret to our savings.",
      },
      {
        q: "How do shipping fees work?",
        a: "Shipping is calculated at checkout based on your location. Curator members enjoy complimentary shipping on all orders, while Enthusiast members receive free shipping on orders over $150.",
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we focus on the United States to ensure our logistics chain remains efficient and our carbon footprint is minimized through consolidated shipping.",
      },
    ],
  },
  {
    category: "Returns & Cancellations",
    items: [
      {
        q: "Can I cancel my commitment to a Drop?",
        a: "You can withdraw your commitment at any time before the Power Meter hits 100%. Once the goal is reached and the order is placed with the distributor, the commitment is final.",
      },
      {
        q: "What is your return policy?",
        a: "Because of the highly discounted, wholesale nature of our model, all sales are final. However, if an item arrives damaged or incorrect, our concierge team will resolve the issue immediately with a replacement or credit.",
      },
    ],
  },
];

const CONCIERGE_TOPICS = [
  "General Question",
  "Order Issue",
  "Membership & Billing",
  "Shipping & Logistics",
  "Returns & Replacements",
  "Other",
];

export default function FaqPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showConcierge, setShowConcierge] = useState(false);
  const [conciergeForm, setConciergeForm] = useState({ name: "", email: "", topic: "General Question", message: "" });
  const [conciergeSent, setConciergeSent] = useState(false);

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

  const openConcierge = () => {
    setConciergeSent(false);
    setConciergeForm({ name: "", email: "", topic: "General Question", message: "" });
    setShowConcierge(true);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--cream)", color: "var(--ink)" }}>
      <style>{`
        :root {
          --cream: #F7F4EE; --parchment: #EDE9E0; --ink: #1A1814;
          --ink-muted: #6B6560; --gold: #B89A6A; --gold-light: #D4B896;
          --border: rgba(26,24,20,0.10);
        }
        body { background: var(--cream); font-family: 'Jost', sans-serif; }
        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .nav-link { position: relative; letter-spacing: 0.12em; font-size: 11px; font-weight: 500; text-transform: uppercase; color: var(--ink-muted); transition: color 0.2s; text-decoration: none; }
        .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--gold); transition: width 0.3s ease; }
        .nav-link:hover { color: var(--ink); }
        .nav-link:hover::after { width: 100%; }
        .gold-rule { border: none; border-top: 1px solid var(--gold); opacity: 0.35; margin: 0; }
        .btn-primary { background: var(--gold); color: var(--ink); letter-spacing: 0.08em; font-size: 11px; font-weight: 500; text-transform: uppercase; padding: 12px 24px; display: inline-block; transition: background 0.2s ease, transform 0.15s ease; }
        .btn-primary:hover { background: var(--gold-light); transform: translateY(-1px); }
        .bar { display: block; width: 22px; height: 1.5px; background: var(--ink); transition: transform 0.25s ease, opacity 0.25s ease; }
        .bar-top-open { transform: translateY(5px) rotate(45deg); }
        .bar-mid-open { opacity: 0; }
        .bar-bot-open { transform: translateY(-5px) rotate(-45deg); }
        .mobile-menu { position: fixed; inset: 0; z-index: 55; background: var(--cream); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: menuFadeIn 0.2s ease forwards; }
        @keyframes menuFadeIn { from { opacity: 0 } to { opacity: 1 } }
        .faq-row { cursor: pointer; border-bottom: 1px solid var(--border); padding: 20px 0; display: flex; justify-content: space-between; align-items: center; gap: 16px; transition: color 0.2s; }
        .faq-row:hover { color: var(--gold); }
        .faq-answer { overflow: hidden; transition: max-height 0.35s ease, opacity 0.3s ease; opacity: 0; max-height: 0; }
        .faq-answer.open { opacity: 1; max-height: 400px; }
        .concierge-input { width: 100%; background: var(--cream); border: 1px solid var(--border); padding: 10px 14px; font-family: inherit; font-size: 13px; font-weight: 300; color: var(--ink); outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .concierge-input:focus { border-color: var(--gold); }
        .concierge-input::placeholder { color: var(--ink-muted); }
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
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>
              About
            </Link>
            <Link href="/faq" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: "36px", fontWeight: 500, color: "var(--gold)", textDecoration: "none", fontStyle: "italic" }}>
              FAQ
            </Link>
            {user ? (
              <>
                <Link href="/account" className="font-display" onClick={() => setMenuOpen(false)}
                  style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", textDecoration: "none", fontStyle: "italic" }}>
                  Account
                </Link>
                <button onClick={handleSignOut} className="font-display"
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

      {/* Concierge modal */}
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
                <button onClick={() => setShowConcierge(false)} className="btn-primary" style={{ marginTop: "32px", borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const subject = encodeURIComponent(`[Groupdrop Concierge] ${conciergeForm.topic}`);
                  const body = encodeURIComponent(`Name: ${conciergeForm.name}\nEmail: ${conciergeForm.email}\nTopic: ${conciergeForm.topic}\n\n${conciergeForm.message}`);
                  window.location.href = `mailto:hello@groupdrop.com?subject=${subject}&body=${body}`;
                  setConciergeSent(true);
                }}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", display: "block", marginBottom: "6px" }}>Full Name</label>
                    <input required className="concierge-input" placeholder="Jane Smith" value={conciergeForm.name} onChange={(e) => setConciergeForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", display: "block", marginBottom: "6px" }}>Email</label>
                    <input required type="email" className="concierge-input" placeholder="jane@example.com" value={conciergeForm.email} onChange={(e) => setConciergeForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", display: "block", marginBottom: "6px" }}>Topic</label>
                  <select required className="concierge-input" value={conciergeForm.topic} onChange={(e) => setConciergeForm((f) => ({ ...f, topic: e.target.value }))}>
                    {CONCIERGE_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-muted)", display: "block", marginBottom: "6px" }}>Message</label>
                  <textarea required className="concierge-input" placeholder="Tell us what's on your mind…" rows={5} value={conciergeForm.message} onChange={(e) => setConciergeForm((f) => ({ ...f, message: e.target.value }))} style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <button type="button" onClick={() => setShowConcierge(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, fontFamily: "inherit" }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Send message →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 65, backdropFilter: "blur(12px)", backgroundColor: "rgba(247,244,238,0.88)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 28px", display: "flex", justifyContent: "space-between", alignItems: "center", height: "68px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="font-display" style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "0.04em", color: "var(--ink)" }}>groupdrop</span>
            <span style={{ fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500, color: "var(--gold)", border: "1px solid var(--gold)", padding: "2px 6px", opacity: 0.8 }}>beta</span>
          </Link>

          <nav style={{ gap: "36px", alignItems: "center" }} className="hidden md:flex">
            <Link href="/" className="nav-link">Drops</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/faq" className="nav-link" style={{ color: "var(--gold)" }}>FAQ</Link>
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

          <button onClick={() => setMenuOpen((o) => !o)} className="flex md:hidden"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", flexDirection: "column", gap: "4.5px", zIndex: 60 }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}>
            <span className={`bar ${menuOpen ? "bar-top-open" : ""}`} />
            <span className={`bar ${menuOpen ? "bar-mid-open" : ""}`} />
            <span className={`bar ${menuOpen ? "bar-bot-open" : ""}`} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "0 28px 120px" }}>

        {/* Hero */}
        <section style={{ paddingTop: "100px", paddingBottom: "64px" }}>
          <div className="animate-fade-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)" }} />
            <span style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>Support</span>
          </div>
          <h1 className="font-display animate-fade-up delay-1" style={{ fontSize: "clamp(44px, 6vw, 68px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: "20px" }}>
            Frequently asked<br /><em style={{ fontStyle: "italic" }}>questions.</em>
          </h1>
          <p className="animate-fade-up delay-2" style={{ fontSize: "16px", fontWeight: 300, color: "var(--ink-muted)", lineHeight: 1.75, maxWidth: "480px" }}>
            Everything you need to know about how Groupdrop works. Can&apos;t find your answer?{" "}
            <button onClick={openConcierge} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--gold)", fontFamily: "inherit", fontSize: "inherit", fontWeight: 400, textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Contact our concierge.
            </button>
          </p>
        </section>

        <hr className="gold-rule" />

        {/* FAQ accordion */}
        <div data-reveal style={{ paddingTop: "64px" }}>
          {FAQ_SECTIONS.map((section, si) => (
            <div key={si} style={{ marginBottom: "52px" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500, color: "var(--gold)", marginBottom: "8px" }}>
                {section.category}
              </p>
              {section.items.map((item, qi) => {
                const key = `${si}-${qi}`;
                const isOpen = openFaq === key;
                return (
                  <div key={qi}>
                    <div className="faq-row" onClick={() => setOpenFaq(isOpen ? null : key)}>
                      <span style={{ fontSize: "16px", fontWeight: 400, lineHeight: 1.5 }}>{item.q}</span>
                      <span style={{ fontSize: "20px", fontWeight: 300, color: "var(--gold)", flexShrink: 0, lineHeight: 1, transition: "transform 0.3s ease", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)", display: "inline-block" }}>+</span>
                    </div>
                    <div className={`faq-answer${isOpen ? " open" : ""}`}>
                      <p style={{ fontSize: "15px", fontWeight: 300, lineHeight: 1.85, color: "var(--ink-muted)", padding: "8px 0 24px", maxWidth: "620px" }}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Concierge CTA */}
        <div data-reveal style={{ marginTop: "24px", padding: "40px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px", backgroundColor: "#FDFAF5" }}>
          <div>
            <p className="font-display" style={{ fontSize: "24px", fontWeight: 500, fontStyle: "italic", marginBottom: "8px" }}>Still have questions?</p>
            <p style={{ fontSize: "14px", fontWeight: 300, color: "var(--ink-muted)", lineHeight: 1.6 }}>Our concierge team typically responds within one business day.</p>
          </div>
          <button onClick={openConcierge} className="btn-primary" style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            Help &amp; Concierge →
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: "16px",
            marginBottom: "20px",
          }}>
            <span className="font-display" style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "0.04em", color: "var(--ink-muted)" }}>groupdrop</span>
            <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
              <Link href="/about" style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, textDecoration: "none" }}>About</Link>
              <Link href="/faq" style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, textDecoration: "none" }}>FAQ</Link>
              <button onClick={openConcierge} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 500, fontFamily: "inherit", padding: 0 }}>Concierge</button>
            </div>
            <span style={{ fontSize: "11px", letterSpacing: "0.08em", color: "var(--ink-muted)", fontWeight: 300 }}>© {new Date().getFullYear()} Groupdrop. All rights reserved.</span>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", paddingTop: "4px" }}>
            <Link href="/terms" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none" }}>Terms of Service</Link>
            <Link href="/terms-of-sale" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none" }}>Terms of Sale</Link>
            <Link href="/privacy" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none" }}>Privacy Policy</Link>
            <Link href="/cookies" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", fontWeight: 300, textDecoration: "none" }}>Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
