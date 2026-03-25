"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "./lib/supabaseClient";

/* ===============================
   Types
================================ */
type Drop = {
  id: string;
  slug: string;
  title: string;
  target: number;
  raised: number | null;
  closes_at: string;
  hero_image_url: string | null;
};

/* ===============================
   Page
================================ */
const TIER_META: Record<string, { name: string; benefit: string; detail: string }> = {
  essentialist: {
    name: "The Essentialist",
    benefit: "2 drops per month at insider pricing.",
    detail: "Your founding member rate is locked in for life — regardless of future price changes.",
  },
  enthusiast: {
    name: "The Enthusiast",
    benefit: "5 drops per month, free shipping over $150.",
    detail: "Your founding member rate is locked in for life — regardless of future price changes.",
  },
  curator: {
    name: "The Curator",
    benefit: "Unlimited drops, 24-hour early access, free shipping on every order.",
    detail: "Your founding member rate is locked in for life — regardless of future price changes.",
  },
};

export default function Home() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  /*
    CHANGE: Added user state to track auth status.
    Used to swap "Sign in" / "Sign out" in the nav.
  */
  const [user, setUser] = useState<{ id: string } | null>(null);
  /*
    CHANGE: tick state — increments every second to force the countdown
    to re-render without needing to refetch the drops data.
  */
  const [tick, setTick] = useState(0);

  /* Welcome modal state */
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeTier, setWelcomeTier] = useState<string>("essentialist");
  const [welcomeStep, setWelcomeStep] = useState(1);

  const [tier, setTier] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Concierge modal */
  const [showConcierge, setShowConcierge] = useState(false);
  const [conciergeForm, setConciergeForm] = useState({ name: "", email: "", topic: "General Question", message: "" });
  const [conciergeSent, setConciergeSent] = useState(false);

  /* Member counts — number of orders per drop */
  const [memberCountMap, setMemberCountMap] = useState<Record<string, number>>({});


  /* Animated raised amounts — per-drop smooth count-up on realtime updates */
  const displayRaisedRef = useRef<Record<string, number>>({});
  const [displayRaisedMap, setDisplayRaisedMap] = useState<Record<string, number>>({});
  const rafMapRef = useRef<Record<string, number>>({});

  /* ===============================
     Fetch Drops
  ================================= */
  useEffect(() => {
    async function fetchDrops() {
      const { data, error } = await supabase
        .from("drops")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setDrops(data);
        const initial: Record<string, number> = {};
        data.forEach((d: Drop) => { initial[d.id] = d.raised ?? 0; });
        displayRaisedRef.current = initial;
        setDisplayRaisedMap(initial);

        /* Fetch member counts via security definer function (bypasses RLS) */
        const { data: countRows } = await supabase.rpc("drop_member_counts");
        const counts: Record<string, number> = {};
        data.forEach((d: Drop) => { counts[d.id] = 0; }); // init all to 0
        countRows?.forEach((row: { drop_id: string; member_count: number }) => {
          counts[row.drop_id] = row.member_count;
        });
        setMemberCountMap(counts);
      }

      setLoading(false);
    }

    fetchDrops();
  }, []);

  /* ===============================
     Realtime — animate progress bar
     when raised updates in Supabase
  ================================= */
  useEffect(() => {
    const animateRaised = (id: string, to: number) => {
      if (rafMapRef.current[id]) cancelAnimationFrame(rafMapRef.current[id]);
      const from = displayRaisedRef.current[id] ?? 0;
      const duration = 1000;
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + (to - from) * eased);
        displayRaisedRef.current[id] = current;
        setDisplayRaisedMap((prev) => ({ ...prev, [id]: current }));
        if (progress < 1) {
          rafMapRef.current[id] = requestAnimationFrame(tick);
        }
      };
      rafMapRef.current[id] = requestAnimationFrame(tick);
    };

    const channel = supabase
      .channel("drops-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "drops" },
        (payload) => {
          const updated = payload.new as Drop;
          setDrops((prev) =>
            prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
          );
          animateRaised(updated.id, updated.raised ?? 0);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new as { drop_id: string };
          setMemberCountMap((prev) => ({
            ...prev,
            [newOrder.drop_id]: (prev[newOrder.drop_id] ?? 0) + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /*
    CHANGE: Check auth state on mount and listen for changes.
    onAuthStateChange fires when the user logs in or out,
    keeping the nav in sync without a page reload.
  */
  useEffect(() => {
    async function fetchTier(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", userId)
        .single();
      setTier(profile?.tier ?? null);
    }

    /* getSession reads from localStorage instantly — no network round-trip */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTier(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchTier(session.user.id);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* trigger progress animation */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(t);
  }, []);

  /* Detect ?welcome=true after Stripe checkout and show the welcome modal */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") !== "true") return;

    const tier = params.get("tier") ?? "essentialist";
    setWelcomeTier(tier in TIER_META ? tier : "essentialist");
    setWelcomeStep(1);
    setShowWelcome(true);
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    window.history.replaceState({}, "", "/");
  }

  /*
    CHANGE: Countdown ticker — updates tick every second so the
    countdown display stays live without a page reload.
  */
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  /* ===============================
     Helpers
  ================================= */
  function getPercent(raised: number, target: number) {
    return Math.min(Math.round((raised / target) * 100), 100);
  }

  function getRemaining(raised: number, target: number) {
    return Math.max(target - raised, 0);
  }

  /*
    CHANGE: Countdown helper — returns a live { days, hours, minutes, seconds }
    object from a closes_at ISO string. Returns null if the date has passed.
  */
  function getCountdown(closesAt: string) {
    const diff = new Date(closesAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  }

  /*
    CHANGE: Sign out handler — clears the Supabase session
    and reloads the page so the nav updates immediately.
  */
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  /* ===============================
     Render
  ================================= */
  return (
    <>
      {/*
        CHANGE: Added a <style> block for global font imports and custom CSS.
        - Importing "Cormorant Garamond" (display serif) from Google Fonts for headlines —
          gives an editorial, luxury-magazine feel.
        - Importing "Jost" (geometric sans) for body/UI text — clean and modern without
          feeling generic like Inter or system fonts.
        - Defining CSS custom properties for the brand color palette so they're
          reusable and easy to update in one place.
        - Added a subtle grain/noise overlay via SVG filter to give surfaces texture,
          which is a hallmark of premium brand sites.
        - Custom scrollbar styling for a refined, on-brand touch.
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap');

        :root {
          --cream: #F7F4EE;        /* warm off-white — replaces neutral-50 */
          --parchment: #EDE9E0;    /* slightly deeper warm surface */
          --ink: #1A1814;          /* near-black with warmth — replaces neutral-900 */
          --ink-muted: #6B6560;    /* warm muted text — replaces neutral-500/600 */
          --gold: #B89A6A;         /* muted antique gold accent */
          --gold-light: #D4B896;   /* lighter gold for hover states */
          --border: rgba(26,24,20,0.10); /* subtle warm border */
        }

        /* CHANGE: Apply warm cream background and Jost as default body font */
        body {
          background: var(--cream);
          font-family: 'Jost', sans-serif;
        }

        /* CHANGE: Cormorant Garamond utility class for display headings */
        .font-display {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }

        /* CHANGE: Grain texture overlay — adds depth and luxury feel to card surfaces */
        .grain::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          border-radius: inherit;
          pointer-events: none;
          opacity: 0.4;
        }

        /* CHANGE: Slim custom scrollbar — refined detail on desktop */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--cream); }
        ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

        /* CHANGE: Animated gold underline for nav links on hover */
        .nav-link {
          position: relative;
          letter-spacing: 0.12em;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          color: var(--ink-muted);
          transition: color 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--gold);
          transition: width 0.3s ease;
        }
        .nav-link:hover { color: var(--ink); }
        .nav-link:hover::after { width: 100%; }

        /* CHANGE: Gold progress bar fill — replaces plain black */
        .progress-fill {
          background: linear-gradient(90deg, var(--gold), var(--gold-light));
          transition: width 1.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* CHANGE: Drop card hover — subtle lift + border brightening */
        .drop-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .drop-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(26,24,20,0.08);
          border-color: var(--gold);
        }

        /* CHANGE: CTA button — gold fill with ink text, refined hover */
        .btn-primary {
          background: var(--gold);
          color: var(--ink);
          letter-spacing: 0.08em;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          padding: 12px 24px;
          display: inline-block;
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .btn-primary:hover {
          background: var(--gold-light);
          transform: translateY(-1px);
        }

        /* CHANGE: Fade-up entrance animation for hero text */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.25s; }
        .delay-3 { animation-delay: 0.4s; }

        /* CHANGE: Horizontal rule in gold — used as a section divider */
        .gold-rule {
          border: none;
          border-top: 1px solid var(--gold);
          opacity: 0.35;
          margin: 0;
        }

        /* CHANGE: Status badge — small caps treatment for "ACTIVE DROP" / "COMPLETED" */
        .status-badge {
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 500;
          font-family: 'Jost', sans-serif;
        }

        /* Urgency pulse — animates the "Closing soon" label */
        @keyframes urgencyPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        .urgency-pulse { animation: urgencyPulse 1.8s ease-in-out infinite; }
        .concierge-input { width: 100%; background: var(--cream); border: 1px solid var(--border); padding: 10px 14px; font-family: inherit; font-size: 13px; font-weight: 300; color: var(--ink); outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .concierge-input:focus { border-color: var(--gold); }
        .concierge-input::placeholder { color: var(--ink-muted); }

        /* Mobile menu overlay */
        .mobile-menu {
          position: fixed;
          inset: 0;
          z-index: 40;
          background: var(--cream);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          animation: menuFadeIn 0.2s ease forwards;
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Hamburger bars */
        .bar { display: block; width: 22px; height: 1.5px; background: var(--ink); transition: transform 0.25s ease, opacity 0.25s ease; }
        .bar-top-open    { transform: translateY(5px) rotate(45deg); }
        .bar-mid-open    { opacity: 0; }
        .bar-bot-open    { transform: translateY(-5px) rotate(-45deg); }

        /* CHANGE: Step number styling for How it Works — large italic serif numeral */
        .step-num {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 52px;
          font-weight: 400;
          line-height: 1;
          color: var(--parchment);
          /* Rendered large and faint so it acts as a decorative background element */
          -webkit-text-stroke: 1px var(--gold);
          text-stroke: 1px var(--gold);
        }
      `}</style>

      {/*
        CHANGE: Background changed from bg-neutral-50 to var(--cream) via body rule.
        Text color changed from neutral-900 to var(--ink) — warmer and more refined.
      */}
      {/* ── Concierge modal ──────────────────────────────────────── */}
      {showConcierge && (
        <div onClick={() => setShowConcierge(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(26,24,20,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#FDFAF5', border: '1px solid var(--border)', borderRadius: '4px', padding: '48px 40px', maxWidth: '520px', width: '100%', position: 'relative' }}>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '1px', backgroundColor: 'var(--gold)' }} />
                <span style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Concierge</span>
              </div>
              <h3 className="font-display" style={{ fontSize: '28px', fontWeight: 500, fontStyle: 'italic' }}>How can we help?</h3>
            </div>
            {conciergeSent ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p className="font-display" style={{ fontSize: '24px', fontWeight: 500, fontStyle: 'italic', marginBottom: '12px' }}>Message received.</p>
                <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--ink-muted)', lineHeight: 1.7 }}>Our concierge team will be in touch within one business day.</p>
                <button onClick={() => setShowConcierge(false)} className="btn-primary" style={{ marginTop: '32px', borderRadius: '2px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const subject = encodeURIComponent(`[Groupdrop Concierge] ${conciergeForm.topic}`);
                const body = encodeURIComponent(`Name: ${conciergeForm.name}\nEmail: ${conciergeForm.email}\nTopic: ${conciergeForm.topic}\n\n${conciergeForm.message}`);
                window.location.href = `mailto:hello@groupdrop.com?subject=${subject}&body=${body}`;
                setConciergeSent(true);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                    <input required className="concierge-input" placeholder="Jane Smith" value={conciergeForm.name} onChange={(e) => setConciergeForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>Email</label>
                    <input required type="email" className="concierge-input" placeholder="jane@example.com" value={conciergeForm.email} onChange={(e) => setConciergeForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>Topic</label>
                  <select required className="concierge-input" value={conciergeForm.topic} onChange={(e) => setConciergeForm((f) => ({ ...f, topic: e.target.value }))}>
                    {['General Question', 'Order Issue', 'Membership & Billing', 'Shipping & Logistics', 'Returns & Replacements', 'Other'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>Message</label>
                  <textarea required className="concierge-input" placeholder="Tell us what's on your mind…" rows={5} value={conciergeForm.message} onChange={(e) => setConciergeForm((f) => ({ ...f, message: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowConcierge(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500, fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ borderRadius: '2px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Send message →</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Welcome modal ─────────────────────────────────────────── */}
      {showWelcome && (() => {
        const meta = TIER_META[welcomeTier] ?? TIER_META.essentialist;

        const steps = [
          /* Step 1 — Membership confirmed */
          <div key={1} style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginBottom: "28px" }}>
              <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
              <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                Membership active
              </span>
              <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
            </div>
            <h2 className="font-display" style={{ fontSize: "clamp(36px, 6vw, 52px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: "12px" }}>
              <em style={{ fontStyle: "italic" }}>Welcome,{"\u00A0"}{meta.name}.</em>
            </h2>
            <p style={{ fontSize: "15px", fontWeight: 400, color: "var(--gold)", letterSpacing: "0.01em", marginBottom: "16px" }}>
              {meta.benefit}
            </p>
            <p style={{ fontSize: "13px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)", letterSpacing: "0.01em", marginBottom: "40px" }}>
              {meta.detail}
            </p>
            <button onClick={() => setWelcomeStep(2)} className="btn-primary" style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              How it works →
            </button>
          </div>,

          /* Step 2 — How drops work */
          <div key={2} style={{ textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
              <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
              <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                How it works
              </span>
            </div>
            <h2 className="font-display" style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: "32px" }}>
              <em style={{ fontStyle: "italic" }}>Three steps.</em>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "40px" }}>
              {[
                { n: "1", title: "Browse open drops", body: "Each drop is a curated selection from a single brand — available exclusively to members." },
                { n: "2", title: "Add items and authorize", body: "Select what you want and authorize a total. Your card is not charged yet — just reserved." },
                { n: "3", title: "Drop funds, we fulfill", body: "If the drop hits its collective target, your card is charged and we ship. If it doesn't fund, you owe nothing." },
              ].map(({ n, title, body }) => (
                <div key={n} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                  <span className="font-display" style={{ fontSize: "32px", fontWeight: 500, color: "var(--gold)", lineHeight: 1, flexShrink: 0, width: "24px" }}>{n}</span>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.02em", marginBottom: "4px" }}>{title}</p>
                    <p style={{ fontSize: "13px", fontWeight: 300, lineHeight: 1.7, color: "var(--ink-muted)" }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setWelcomeStep(3)} className="btn-primary" style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              See open drops →
            </button>
          </div>,

          /* Step 3 — First drop nudge */
          <div key={3} style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginBottom: "28px" }}>
              <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
              <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 500 }}>
                You&apos;re ready
              </span>
              <div style={{ width: "24px", height: "1px", backgroundColor: "var(--gold)" }} />
            </div>
            <h2 className="font-display" style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: "16px" }}>
              <em style={{ fontStyle: "italic" }}>Make your first allocation.</em>
            </h2>
            <p style={{ fontSize: "14px", fontWeight: 300, lineHeight: 1.75, color: "var(--ink-muted)", letterSpacing: "0.01em", marginBottom: "40px", maxWidth: "340px", margin: "0 auto 40px" }}>
              Browse the drops below, select your items, and authorize your total. You won&apos;t be charged unless the drop fully funds.
            </p>
            <button onClick={dismissWelcome} className="btn-primary" style={{ borderRadius: "2px", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Browse open drops →
            </button>
          </div>,
        ];

        return (
          <div
            onClick={dismissWelcome}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              backgroundColor: "rgba(26,24,20,0.55)",
              backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px",
            }}
          >
            <div
              className="grain"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#FDFAF5", border: "1px solid var(--gold)",
                borderRadius: "4px", padding: "52px 48px",
                position: "relative", overflow: "hidden",
                maxWidth: "500px", width: "100%",
              }}
            >
              {steps[welcomeStep - 1]}

              {/* Step indicator */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "36px" }}>
                {[1, 2, 3].map((s) => (
                  <div key={s} style={{
                    width: s === welcomeStep ? "20px" : "6px", height: "6px",
                    borderRadius: "3px", backgroundColor: "var(--gold)",
                    opacity: s === welcomeStep ? 1 : 0.3,
                    transition: "all 0.3s ease",
                  }} />
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="mobile-menu md:hidden">
          <div style={{ width: '32px', height: '1px', backgroundColor: 'var(--gold)', marginBottom: '48px' }} />

          <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px' }}>
            <a href="#drops" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: '36px', fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', fontStyle: 'italic' }}>
              Drops
            </a>
            <a href="#how" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: '36px', fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', fontStyle: 'italic' }}>
              How it works
            </a>
            <Link href="/about" className="font-display" onClick={() => setMenuOpen(false)}
              style={{ fontSize: '36px', fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', fontStyle: 'italic' }}>
              About
            </Link>
            {user ? (
              <>
                <Link href="/account" className="font-display" onClick={() => setMenuOpen(false)}
                  style={{ fontSize: '36px', fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', fontStyle: 'italic' }}>
                  Account
                </Link>
                <button onClick={() => { setMenuOpen(false); handleSignOut(); }}
                  style={{ fontSize: '36px', fontWeight: 500, color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="font-display" onClick={() => setMenuOpen(false)}
                  style={{ fontSize: '36px', fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', fontStyle: 'italic' }}>
                  Sign in
                </Link>
                <Link href="/join" className="font-display" onClick={() => setMenuOpen(false)}
                  style={{ fontSize: '36px', fontWeight: 500, color: 'var(--gold)', textDecoration: 'none', fontStyle: 'italic' }}>
                  Join
                </Link>
              </>
            )}
          </nav>

          <div style={{ width: '32px', height: '1px', backgroundColor: 'var(--gold)', marginTop: '48px' }} />
        </div>
      )}

      <main style={{ minHeight: '100vh', backgroundColor: 'var(--cream)', color: 'var(--ink)' }}>

        {/*
          CHANGE: Nav — added a thin gold border-bottom to act as a grounding line.
          Wordmark changed to use Cormorant Garamond with tracked small-caps styling.
          Added a subtle "beta" pill beside the wordmark rather than inline text.
          Increased top/bottom padding for a more airy, premium feel.
        */}
        <header style={{
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 65,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(247,244,238,0.88)', /* semi-transparent cream for scroll */
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '68px' }}>

            {/* Wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/*
                CHANGE: Wordmark now uses Cormorant Garamond for a luxury editorial feel.
                "groupdrop" set in tracking-widened small-caps style.
              */}
              <span className="font-display" style={{ fontSize: '22px', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--ink)' }}>
                groupdrop
              </span>
              {/*
                CHANGE: "beta" moved to a small pill badge beside the wordmark
                instead of being appended inline — cleaner and more intentional.
              */}
              <span style={{
                fontSize: '8px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'var(--gold)',
                border: '1px solid var(--gold)',
                padding: '2px 6px',
                opacity: 0.8,
              }}>
                beta
              </span>
            </div>

            {/* Desktop nav */}
            <nav style={{ gap: '36px', alignItems: 'center' }} className="hidden md:flex">
              <a href="#drops" className="nav-link">Drops</a>
              <a href="#how" className="nav-link">How it works</a>
              <Link href="/about" className="nav-link" style={{ textDecoration: 'none' }}>About</Link>
              <Link href="/faq" className="nav-link" style={{ textDecoration: 'none' }}>FAQ</Link>
              {user ? (
                <>
                  <Link href="/account" className="nav-link" style={{ textDecoration: 'none' }}>Account</Link>
                  <button onClick={handleSignOut} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="nav-link" style={{ textDecoration: 'none' }}>Sign in</Link>
                  <Link href="/join" className="nav-link" style={{ textDecoration: 'none', color: 'var(--gold)' }}>Join</Link>
                </>
              )}
            </nav>

            {/* Hamburger button — mobile only */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexDirection: 'column', gap: '4.5px', zIndex: 60 }}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span className={`bar ${menuOpen ? 'bar-top-open' : ''}`} />
              <span className={`bar ${menuOpen ? 'bar-mid-open' : ''}`} />
              <span className={`bar ${menuOpen ? 'bar-bot-open' : ''}`} />
            </button>

          </div>
        </header>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 28px' }}>

          {/*
            CHANGE: Hero section — much more editorial.
            - Headline uses Cormorant Garamond at a large size for drama.
            - Italic treatment on "Luxury essentials" adds elegance.
            - Fade-up entrance animations staggered across the three elements.
            - Subheadline uses Jost Light (300) for contrast against the heavy serif headline.
            - Added a thin gold horizontal rule above the headline as a decorative opener.
            - More top padding (120px vs 96px) for greater breathing room.
          */}
          <section style={{ paddingTop: '120px', paddingBottom: '20px' }}>

            {/* Decorative gold rule + overline label */}
            <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div style={{ width: '32px', height: '1px', backgroundColor: 'var(--gold)' }} />
              <span style={{
                fontSize: '10px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                fontWeight: 500,
              }}>
                Insider Access
              </span>
            </div>

            {/*
              CHANGE: H1 uses Cormorant Garamond at ~90px on large screens.
              Line 1 is italic to create typographic tension with the roman line 2.
              This two-tone italic/roman pairing is a staple of luxury brand typography.
            */}
            <h1
              className="font-display animate-fade-up delay-1"
              style={{
                fontSize: 'clamp(44px, 8vw, 92px)',
                fontWeight: 500,
                lineHeight: 1.02,
                letterSpacing: '-0.01em',
                maxWidth: '820px',
                marginBottom: '28px',
              }}
            >
              <em style={{ fontStyle: 'italic', color: 'var(--ink)' }}>Luxury essentials,</em>
              <br />
              <span style={{ fontStyle: 'normal' }}>at the price the industry pays.</span>
            </h1>

            {/*
              CHANGE: Body copy uses Jost 300 (light weight) — the contrast between
              the heavy serif headline and the light sans body is a premium typographic move.
              Max-width tightened to create a more intentional text column.
            */}
            <p
              className="animate-fade-up delay-2"
              style={{
                fontSize: '16px',
                fontWeight: 300,
                lineHeight: 1.75,
                color: 'var(--ink-muted)',
                maxWidth: '480px',
                letterSpacing: '0.01em',
              }}
            >
              Stop paying the retail markup. We aggregate individual demand to unlock
              insider pricing on brands that never go on sale.
            </p>

          </section>

          {/*
            CHANGE: Section divider — thin gold rule replacing the raw gap between sections.
            Adds visual structure and reinforces the gold accent language.
          */}
          <hr className="gold-rule" style={{ marginTop: '72px' }} />

          {/* ── Drops Section ─────────────────────────────── */}
          {/*
            CHANGE: Section label added above the grid — small-caps uppercase
            with a number indicator, mimicking luxury editorial layouts.
            Grid gap increased slightly for more breathing room between cards.
          */}
          <section id="drops" style={{ paddingTop: '72px', paddingBottom: '20px' }}>

            <div data-reveal style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
              <div>
                <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: '8px' }}>
                  Current Drops
                </p>
                {/*
                  CHANGE: Section heading uses Cormorant Garamond for consistency
                  with the hero headline — keeps the typography system cohesive.
                */}
                <h2 className="font-display" style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.01em' }}>
                  Open allocations
                </h2>
              </div>
            </div>

            {loading && (
              /*
                CHANGE: Loading state is now a refined single line in small
                tracked caps rather than a plain "Loading drops..." text.
              */
              <p style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
                Loading drops…
              </p>
            )}

            {!loading && drops.length === 0 && (
              <div className="grain" style={{
                backgroundColor: '#FDFAF5', border: '1px solid var(--border)',
                borderRadius: '4px', padding: 'clamp(40px, 6vw, 72px) clamp(32px, 6vw, 72px)',
                position: 'relative', overflow: 'hidden',
                marginBottom: '40px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              }}>
                {/* Gold dot — top right */}
                <div style={{ position: 'absolute', top: '32px', right: '32px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--gold)', opacity: 0.5 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ width: '28px', height: '1px', backgroundColor: 'var(--gold)' }} />
                  <span style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: 'var(--gold)', fontWeight: 500 }}>
                    Coming soon
                  </span>
                </div>

                <h3 className="font-display" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: '20px' }}>
                  The next drop is<br /><em style={{ fontStyle: 'italic' }}>being curated.</em>
                </h3>

                <p style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.8, color: 'var(--ink-muted)', marginBottom: '36px', maxWidth: '440px' }}>
                  Our team is sourcing the next collective. Leave your email and you&apos;ll be the first to know when it goes live.
                </p>

                {notifySubmitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--gold)', flexShrink: 0 }} />
                    <p style={{ fontSize: '13px', fontWeight: 400, color: 'var(--ink)', letterSpacing: '0.01em' }}>
                      You&apos;re on the list. We&apos;ll be in touch.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setNotifySubmitted(true);
                    }}
                    style={{ display: 'flex', gap: '0', width: '100%', maxWidth: '400px' }}
                  >
                    <input
                      name="notify-email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      style={{ flex: 1, backgroundColor: 'var(--cream)', border: '1px solid var(--border)', borderRight: 'none', padding: '11px 16px', fontSize: '13px', fontWeight: 300, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}
                    />
                    <button type="submit" className="btn-primary" style={{ borderRadius: '0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                      Notify me →
                    </button>
                  </form>
                )}
              </div>
            )}

            <div data-reveal style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {!loading && drops.map((drop) => {

                const raised = drop.raised ?? 0;
                const displayRaised = displayRaisedMap[drop.id] ?? raised;
                const percent = getPercent(raised, drop.target);
                const remaining = getRemaining(raised, drop.target);
                const isComplete = raised >= drop.target;
                /* CHANGE: Calculate countdown from closes_at — tick dependency keeps it live */
                const countdown = drop.closes_at ? getCountdown(drop.closes_at) : null;
                void tick; // consumed to trigger re-render each second

                return (
                  /*
                    CHANGE: Cards redesigned from rounded-2xl white boxes with shadow
                    to a flatter, architectural card with:
                    - Warm white background (not pure white) using var(--cream)
                    - A sharper rectangular shape (border-radius: 4px) — luxury brands
                      tend toward rectilinear geometry, not soft pill shapes.
                    - Thinner 1px border using var(--border)
                    - Relative positioning for the grain overlay pseudo-element
                    - Hover animation via .drop-card class
                    - More generous internal padding
                  */
                  <div
                    key={drop.id}
                    className="drop-card grain"
                    style={{
                      backgroundColor: '#FDFAF5',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >

                    {/* Hero image */}
                    {drop.hero_image_url && (
                      <div style={{ height: '200px', overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          src={drop.hero_image_url}
                          alt={drop.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                        />
                      </div>
                    )}

                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                    {/*
                      CHANGE: Status badge — uses .status-badge class for small-caps treatment.
                      Completed drops get a gold color; active drops get muted ink.
                      The small decorative dot before the text is a luxury detail.
                    */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <div className="status-badge" style={{
                        color: isComplete ? 'var(--gold)' : 'var(--ink-muted)',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <span style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          backgroundColor: isComplete ? 'var(--gold)' : 'var(--ink-muted)',
                          display: 'inline-block', opacity: isComplete ? 1 : 0.5,
                        }} />
                        {isComplete ? "Completed" : "Active Drop"}
                      </div>

                      {tier === "curator" && !isComplete && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase',
                          fontWeight: 500, color: 'var(--gold)',
                          border: '1px solid var(--gold)', padding: '3px 8px', borderRadius: '2px',
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--gold)', display: 'inline-block' }} />
                          Early Access
                        </span>
                      )}
                    </div>

                    {/*
                      CHANGE: Drop title uses Cormorant Garamond for an editorial headline feel.
                      Larger, more commanding presence with tighter line-height.
                    */}
                    <h2 className="font-display" style={{
                      fontSize: '26px',
                      fontWeight: 500,
                      lineHeight: 1.15,
                      letterSpacing: '-0.01em',
                      marginBottom: '24px',
                    }}>
                      {drop.title}
                    </h2>

                    {/*
                      CHANGE: Target amount displayed more prominently with label/value split.
                      The value is set larger and in a warmer tone to draw the eye.
                    */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
                        Raised
                      </span>
                      <span style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
                        Target
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                      <span className="font-display" style={{ fontSize: '22px', fontWeight: 500 }}>
                        ${displayRaised.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '14px', color: 'var(--ink-muted)', fontWeight: 300 }}>
                        ${drop.target.toLocaleString()}
                      </span>
                    </div>

                    {/*
                      CHANGE: Progress bar redesigned —
                      - Thinner (4px vs 12px) for elegance
                      - Gold gradient fill via .progress-fill class
                      - Background uses parchment instead of neutral-200
                      - Longer, smoother animation (1.2s vs 1s) with a premium easing curve
                    */}
                    <div style={{
                      height: '3px',
                      backgroundColor: 'var(--parchment)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      marginBottom: '10px',
                    }}>
                      <div
                        className="progress-fill"
                        style={{ height: '100%', width: mounted ? `${percent}%` : '0%' }}
                      />
                    </div>

                    {/*
                      CHANGE: Percentage and remaining amount row — refined typography.
                      Percent shown in gold when high (>= 80%) to signal urgency subtly.
                    */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: percent >= 80 ? 'var(--gold)' : 'var(--ink-muted)',
                        letterSpacing: '0.04em',
                      }}>
                        {percent}% funded
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 300 }}>
                        ${remaining.toLocaleString()} to go
                      </span>
                    </div>

                    {/*
                      CHANGE: CTA button redesigned —
                      - Gold fill, ink text (replaces black fill)
                      - Sharp rectangular shape (no border-radius) for a luxury/architectural feel
                      - Uppercase tracked label via .btn-primary
                      - Full width so it anchors the card bottom
                    */}
                    {/* CHANGE: Countdown timer — shows days/hours/mins/secs until drop closes */}
                    {!isComplete && countdown && (() => {
                      const isUrgent = countdown.days === 0;
                      return (
                        <div style={{ marginBottom: '20px' }}>
                          <p className={isUrgent ? 'urgency-pulse' : ''} style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: isUrgent ? 'var(--gold)' : 'var(--ink-muted)', fontWeight: 500, marginBottom: '10px' }}>
                            {isUrgent ? 'Closing soon' : 'Closes in'}
                          </p>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                              { value: countdown.days, label: 'Days' },
                              { value: countdown.hours, label: 'Hrs' },
                              { value: countdown.minutes, label: 'Min' },
                              { value: countdown.seconds, label: 'Sec' },
                            ].map(({ value, label }) => (
                              <div key={label} style={{ textAlign: 'center', minWidth: '40px' }}>
                                <div className="font-display" style={{ fontSize: '28px', fontWeight: 500, lineHeight: 1, color: isUrgent ? 'var(--gold)' : value === 0 ? 'var(--ink-muted)' : 'var(--ink)' }}>
                                  {String(value).padStart(2, '0')}
                                </div>
                                <div style={{ fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500, marginTop: '4px' }}>
                                  {label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Drop closed label if closes_at has passed */}
                    {!isComplete && !countdown && (
                      <p style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500, marginBottom: '20px' }}>
                        Drop closed
                      </p>
                    )}

                    {/* Member count */}
                    {memberCountMap[drop.id] !== undefined && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--ink-muted)', flexShrink: 0 }}>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 300, letterSpacing: '0.02em' }}>
                          {memberCountMap[drop.id] === 0
                            ? 'Be the first to join'
                            : `${memberCountMap[drop.id]} member${memberCountMap[drop.id] === 1 ? '' : 's'} joined`}
                        </span>
                      </div>
                    )}

                    <Link
                      href={`/drops/${drop.slug}`}
                      className="btn-primary"
                      style={{ display: 'block', textAlign: 'center', borderRadius: '2px', marginTop: 'auto' }}
                    >
                      View allocation →
                    </Link>

                    </div>{/* end content wrapper */}
                  </div>
                );
              })}
            </div>

          </section>

          <hr className="gold-rule" style={{ marginTop: '80px' }} />

          {/* ── How it Works ───────────────────────────────── */}
          {/*
            CHANGE: "How it Works" section completely redesigned from a plain <ol>
            into a three-column editorial layout with large italic serif step numbers
            as decorative elements. Each step has:
            - A large faint outlined numeral (I, II, III in Roman numerals for luxury feel)
            - A concise headline in Cormorant Garamond
            - A short body in Jost Light
            This transforms a plain list into a branded editorial moment.
          */}
          <section id="how" style={{ paddingTop: '72px', paddingBottom: '20px' }}>

            <div data-reveal>
            <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: '8px' }}>
              The Process
            </p>
            <h2 className="font-display" style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: '56px' }}>
              How it works
            </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '40px' }}>

              {[
                {
                  num: "I",
                  title: "The Allocation",
                  body: "We curate a weekly drop from premium brands like Aesop and Le Labo — sourced directly from excess inventory channels.",
                },
                {
                  num: "II",
                  title: "The Commitment",
                  body: "Secure your items at insider prices. We won't charge you until the collective order threshold is met.",
                },
                {
                  num: "III",
                  title: "The Fulfillment",
                  body: "Once the target is hit, we authorize payments and ship the goods directly to your door.",
                },
              ].map((step) => (
                <div data-reveal key={step.num} style={{ position: 'relative', paddingTop: '8px' }}>

                  {/*
                    CHANGE: Large Roman numeral as a background decorative element.
                    Uses -webkit-text-stroke so only the outline shows in gold —
                    this is a signature luxury typography technique.
                  */}
                  <div className="step-num" aria-hidden="true" style={{ marginBottom: '8px' }}>
                    {step.num}
                  </div>

                  {/*
                    CHANGE: Step title in Cormorant Garamond for serif consistency.
                  */}
                  <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 500, marginBottom: '12px', marginTop: '-8px' }}>
                    {step.title}
                  </h3>

                  <p style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.8, color: 'var(--ink-muted)' }}>
                    {step.body}
                  </p>

                </div>
              ))}

            </div>

          </section>

          {/*
            CHANGE: Footer redesigned with a gold rule above, wordmark repeated in small
            Cormorant Garamond, and the copyright line pushed right. More breathing room
            above the footer (120px vs 80px). The wordmark in the footer is a common
            luxury brand pattern (think Bottega Veneta, Celine websites).
          */}
          <hr className="gold-rule" style={{ marginTop: '120px' }} />

          <footer style={{ padding: '28px 0 40px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '16px',
              marginBottom: '20px',
            }}>
              <span className="font-display" style={{ fontSize: '15px', fontWeight: 400, letterSpacing: '0.05em', color: 'var(--ink-muted)' }}>
                groupdrop
              </span>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <Link href="/about" style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500, textDecoration: 'none' }}>About</Link>
                <Link href="/faq" style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500, textDecoration: 'none' }}>FAQ</Link>
                <button onClick={() => { setConciergeSent(false); setConciergeForm({ name: '', email: '', topic: 'General Question', message: '' }); setShowConcierge(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500, fontFamily: 'inherit', padding: 0 }}>Concierge</button>
              </div>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--ink-muted)', fontWeight: 300 }}>
                © {new Date().getFullYear()} groupdrop. All rights reserved.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '4px' }}>
              <Link href="/terms" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 300, textDecoration: 'none' }}>Terms of Service</Link>
              <Link href="/terms-of-sale" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 300, textDecoration: 'none' }}>Terms of Sale</Link>
              <Link href="/privacy" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 300, textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/cookies" style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 300, textDecoration: 'none' }}>Cookie Policy</Link>
            </div>
          </footer>

        </div>
      </main>
    </>
  );
}