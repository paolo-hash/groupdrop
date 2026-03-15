"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

/* ─────────────────────────────────────────────────────────────
   Types  (unchanged from original)
───────────────────────────────────────────────────────────── */
type RawDrop = {
  id: string;
  slug: string;
  name?: string | null;
  title?: string | null;
  target?: number | string | null;
  raised?: number | string | null;
  target_cents?: number | string | null;
  raised_cents?: number | string | null;
};

type NormalizedDrop = {
  id: string;
  slug: string;
  name: string;
  targetCents: number;
  raisedCents: number;
  usesCentsColumns: boolean;
};

type Sku = {
  id: string;
  name: string;
  subtitle: string | null;
  price_cents: number;
  tag?: string | null;
  sort_order: number;
};

/* ─────────────────────────────────────────────────────────────
   Helpers  (unchanged from original)
───────────────────────────────────────────────────────────── */
function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDrop(row: RawDrop): NormalizedDrop {
  const usesCentsColumns =
    row.target_cents !== undefined || row.raised_cents !== undefined;

  const targetCents = usesCentsColumns
    ? toNumber(row.target_cents)
    : Math.round(toNumber(row.target) * 100);

  const raisedCents = usesCentsColumns
    ? toNumber(row.raised_cents)
    : Math.round(toNumber(row.raised) * 100);

  return {
    id: row.id,
    slug: row.slug,
    name: row.title || row.name || "Untitled Drop",
    targetCents,
    raisedCents,
    usesCentsColumns,
  };
}

function moneyFromCents(cents: number) {
  const safe = Number.isFinite(cents) ? cents : 0;
  return `$${(safe / 100).toLocaleString()}`;
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function AesopPage() {
  const [drop, setDrop] = useState<NormalizedDrop | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(true);
  /*
    CHANGE: Added `mounted` state (mirrors homepage pattern) to trigger the
    progress-bar entrance animation after hydration.
  */
  const [mounted, setMounted] = useState(false);

  /* ── Data fetching (logic unchanged) ─────────────────────── */
  async function fetchData() {
    setLoading(true);
    setStatusMsg("");

    const { data: dropData, error: dropError } = await supabase
      .from("drops")
      .select("*")
      .eq("slug", "aesop")
      .maybeSingle();

    if (dropError || !dropData) {
      console.error("Could not load Aesop drop:", dropError);
      setStatusMsg("Could not load drop.");
      setLoading(false);
      return;
    }

    const normalizedDrop = normalizeDrop(dropData as RawDrop);
    setDrop(normalizedDrop);

    const { data: skuData, error: skuError } = await supabase
      .from("drop_skus")
      .select("id,name,subtitle,price_cents,tag,sort_order")
      .eq("drop_id", normalizedDrop.id)
      .order("sort_order", { ascending: true });

    if (skuError) {
      console.error("Could not load Aesop SKUs:", skuError);
      setStatusMsg("Could not load SKUs.");
      setLoading(false);
      return;
    }

    setSkus((skuData ?? []) as Sku[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  /*
    CHANGE: Trigger mounted flag after 100ms — identical to homepage pattern —
    so the progress bar animates in rather than snapping to its final width.
  */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  /* ── Derived state (logic unchanged) ─────────────────────── */
  const cartItems = useMemo(() => {
    return skus
      .map((s) => {
        const qty = qtyById[s.id] ?? 0;
        return { sku: s, qty, lineTotal: qty * toNumber(s.price_cents) };
      })
      .filter((x) => x.qty > 0);
  }, [skus, qtyById]);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, x) => sum + x.lineTotal, 0),
    [cartItems]
  );

  const percent = useMemo(() => {
    if (!drop || drop.targetCents <= 0) return 0;
    return Math.min(Math.round((drop.raisedCents / drop.targetCents) * 100), 100);
  }, [drop]);

  const remaining = useMemo(() => {
    if (!drop) return 0;
    return Math.max(drop.targetCents - drop.raisedCents, 0);
  }, [drop]);

  /* ── Cart actions (logic unchanged) ──────────────────────── */
  function inc(id: string) {
    setQtyById((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setStatusMsg("");
  }

  function dec(id: string) {
    setQtyById((prev) => {
      const next = { ...prev };
      const newVal = Math.max((next[id] ?? 0) - 1, 0);
      if (newVal === 0) delete next[id];
      else next[id] = newVal;
      return next;
    });
    setStatusMsg("");
  }

  function clearCart() {
    setQtyById({});
    setStatusMsg("");
  }

  async function handleJoin() {
    if (!drop) return;

    if (cartTotal <= 0) {
      setStatusMsg("Add items to your cart to join.");
      return;
    }

    const nextRaisedCents = Math.min(drop.raisedCents + cartTotal, drop.targetCents);
    const previousDrop = drop;

    setDrop({ ...drop, raisedCents: nextRaisedCents });
    clearCart();

    const updatePayload = drop.usesCentsColumns
      ? { raised_cents: nextRaisedCents }
      : { raised: nextRaisedCents / 100 };

    const { error } = await supabase
      .from("drops")
      .update(updatePayload)
      .eq("id", drop.id);

    if (error) {
      console.error(error);
      setDrop(previousDrop);
      setStatusMsg("Something went wrong. Try again.");
      return;
    }

    setStatusMsg("Joined successfully.");
  }

  /* ── Loading / error states ───────────────────────────────── */

  /*
    CHANGE: Loading screen now uses the cream background and tracked uppercase
    label instead of the plain neutral-50 spinner text.
  */
  if (loading) {
    return (
      <>
        <style>{SHARED_STYLES}</style>
        <main style={{ minHeight: '100vh', backgroundColor: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
            Loading drop…
          </p>
        </main>
      </>
    );
  }

  if (!drop) {
    return (
      <>
        <style>{SHARED_STYLES}</style>
        <main style={{ minHeight: '100vh', backgroundColor: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
            {statusMsg || "Drop not found."}
          </p>
        </main>
      </>
    );
  }

  const reachedTarget = drop.raisedCents >= drop.targetCents;

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      {/*
        CHANGE: Injecting the exact same shared CSS design system used on the homepage.
        All tokens (--cream, --gold, --ink, etc.), all utility classes (.font-display,
        .grain, .progress-fill, .btn-primary, .nav-link, .gold-rule, .status-badge),
        fonts, scrollbar, and animations are identical — this is what makes the two
        pages feel like one cohesive product.
      */}
      <style>{SHARED_STYLES}</style>

      <main style={{ minHeight: '100vh', backgroundColor: 'var(--cream)', color: 'var(--ink)' }}>

        {/*
          CHANGE: Nav brought in line with the homepage —
          - Sticky header with backdrop blur and border-bottom
          - Cormorant Garamond wordmark with gold "beta" pill
          - "Back to drops" and "View cart" links restyled:
              • "Back to drops" → ghost nav-link style (tracked uppercase)
              • "View cart" → gold-fill btn-primary style
          - Removed the rounded-xl Tailwind classes; replaced with sharp 2px radius
            to match the rectilinear luxury language of the homepage cards.
        */}
        <header style={{
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(247,244,238,0.88)',
        }}>
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '68px',
          }}>

            {/* Wordmark — identical to homepage */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <span className="font-display" style={{ fontSize: '22px', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--ink)' }}>
                groupdrop
              </span>
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
            </Link>

            {/* Nav actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              {/*
                CHANGE: "Back to drops" restyled as a nav-link (tracked uppercase,
                animated gold underline on hover) instead of a bordered rounded button.
              */}
              <Link href="/#drops" className="nav-link" style={{ textDecoration: 'none' }}>
                ← All drops
              </Link>

              {/*
                CHANGE: "View cart" restyled as btn-primary (gold fill, ink text,
                uppercase, sharp corners) to match the homepage CTA language.
              */}
              <a href="#cart" className="btn-primary" style={{ borderRadius: '2px', textDecoration: 'none' }}>
                View cart
              </a>
            </div>

          </div>
        </header>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 28px' }}>

          {/* ── Drop Hero / Header ──────────────────────────── */}
          {/*
            CHANGE: Hero section redesigned to mirror the homepage hero language —
            - Gold overline label + decorative rule
            - Drop name in Cormorant Garamond at large display size with italic treatment
            - Subheadline in Jost Light 300
            - Staggered fade-up entrance animations
            - Progress card redesigned (see inline comments below)
          */}
          <section style={{ paddingTop: '100px' }}>

            {/* Overline — mirrors homepage "Insider Access" overline */}
            <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div style={{ width: '32px', height: '1px', backgroundColor: 'var(--gold)' }} />
              {/*
                CHANGE: Status badge uses .status-badge class (small-caps, tracked)
                with a dot indicator — same as homepage drop cards.
              */}
              <span className="status-badge" style={{
                color: reachedTarget ? 'var(--gold)' : 'var(--ink-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  backgroundColor: reachedTarget ? 'var(--gold)' : 'var(--ink-muted)',
                  display: 'inline-block',
                  opacity: reachedTarget ? 1 : 0.5,
                }} />
                {reachedTarget ? "Completed" : "Active Drop"}
              </span>
            </div>

            {/*
              CHANGE: Drop name in Cormorant Garamond with italic/roman tension —
              the brand name is set italic (like the homepage headline first line),
              giving every drop page its own editorial moment.
            */}
            <h1 className="font-display animate-fade-up delay-1" style={{
              fontSize: 'clamp(40px, 7vw, 80px)',
              fontWeight: 500,
              lineHeight: 1.02,
              letterSpacing: '-0.01em',
              marginBottom: '20px',
            }}>
              <em style={{ fontStyle: 'italic' }}>{drop.name}</em>
            </h1>

            {/*
              CHANGE: Descriptor line in Jost Light — replaces the "Build your cart..."
              paragraph which was plain and functional. Now reads like brand copy.
            */}
            <p className="animate-fade-up delay-2" style={{
              fontSize: '15px',
              fontWeight: 300,
              lineHeight: 1.75,
              color: 'var(--ink-muted)',
              maxWidth: '480px',
              letterSpacing: '0.01em',
              marginBottom: '52px',
            }}>
              Build your cart. Your total is what you're authorizing — and what pushes
              this drop toward the collective threshold.
            </p>

            {/*
              CHANGE: Progress card redesigned to match the homepage drop card visual language —
              - Warm white (#FDFAF5) background instead of pure white
              - 1px border using var(--border) instead of border-neutral-200
              - Sharp 4px border-radius instead of rounded-2xl
              - Grain texture overlay via .grain class
              - Thinner 3px gold-gradient progress bar
              - Raised / Target displayed with same label/value typography as homepage cards
              - "% funded" turns gold at ≥ 80% — same urgency signal as homepage
              - Removed the "DROP PROGRESS" / "RAISED" bold caps labels;
                replaced with the cleaner small-caps tracked style
            */}
            <div className="grain animate-fade-up delay-3" style={{
              backgroundColor: '#FDFAF5',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '72px',
            }}>

              {/* Label row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
                  Raised
                </span>
                <span style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
                  Target
                </span>
              </div>

              {/* Value row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
                <span className="font-display" style={{ fontSize: '28px', fontWeight: 500 }}>
                  {moneyFromCents(drop.raisedCents)}
                </span>
                <span style={{ fontSize: '16px', color: 'var(--ink-muted)', fontWeight: 300 }}>
                  {moneyFromCents(drop.targetCents)}
                </span>
              </div>

              {/* Progress bar — gold gradient, 3px, same as homepage */}
              <div style={{
                height: '3px',
                backgroundColor: 'var(--parchment)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '12px',
              }}>
                <div
                  className="progress-fill"
                  style={{ height: '100%', width: mounted ? `${percent}%` : '0%' }}
                />
              </div>

              {/* Percent / remaining row */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: percent >= 80 ? 'var(--gold)' : 'var(--ink-muted)',
                  letterSpacing: '0.04em',
                }}>
                  {percent}% funded
                </span>
                <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 300 }}>
                  {reachedTarget ? "Target reached" : `${moneyFromCents(remaining)} to go`}
                </span>
              </div>

            </div>

          </section>

          <hr className="gold-rule" />

          {/* ── SKUs + Cart grid ────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '48px',
            paddingTop: '64px',
            alignItems: 'start',
          }}>

            {/* ── SKU List ────────────────────────────────── */}
            <section>

              {/*
                CHANGE: Section label uses the same gold overline + Cormorant heading
                pattern as the homepage "Open allocations" section header.
              */}
              <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: '8px' }}>
                Available Items
              </p>
              <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: '8px' }}>
                Select your SKUs
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 300, marginBottom: '32px', letterSpacing: '0.02em' }}>
                Tap + / − to adjust quantity
              </p>

              <div style={{ display: 'grid', gap: '16px' }}>
                {skus.map((sku) => {
                  const qty = qtyById[sku.id] ?? 0;

                  return (
                    /*
                      CHANGE: SKU cards redesigned to match the homepage drop card system —
                      - Warm white (#FDFAF5) background
                      - 1px var(--border) border
                      - Sharp 4px radius (not rounded-2xl)
                      - Grain texture overlay
                      - .drop-card class for hover lift + gold border
                      - Product image placeholder: replaced the gradient bg with a
                        flat parchment surface and a centered brand initial monogram
                        in Cormorant Garamond — more editorial than a gradient
                      - Tag pill: gold fill with ink text instead of black pill
                      - SKU name in Cormorant Garamond
                      - Price in Cormorant Garamond display size
                      - Qty controls redesigned: flat parchment background, sharp corners,
                        gold border on the container, ink-muted text — no rounded-xl
                    */
                    <div
                      key={sku.id}
                      className="drop-card grain"
                      style={{
                        backgroundColor: '#FDFAF5',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '24px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >

                      {/* Product image placeholder */}
                      <div style={{
                        height: '100px',
                        backgroundColor: 'var(--parchment)',
                        borderRadius: '2px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        {/*
                          CHANGE: Replaced the gradient-to-neutral placeholder with a
                          large faint Cormorant Garamond initial — gives each card a
                          luxury product-catalog feel even without real imagery.
                        */}
                        <span className="font-display" style={{
                          fontSize: '52px',
                          fontWeight: 400,
                          fontStyle: 'italic',
                          color: 'var(--gold)',
                          opacity: 0.25,
                          userSelect: 'none',
                          lineHeight: 1,
                        }}>
                          {sku.name.charAt(0)}
                        </span>

                        {/* Tag pill — gold fill instead of black */}
                        {sku.tag && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            backgroundColor: 'var(--gold)',
                            color: 'var(--ink)',
                            fontSize: '9px',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            padding: '3px 8px',
                            borderRadius: '2px',
                          }}>
                            {sku.tag}
                          </div>
                        )}
                      </div>

                      {/* Name + price row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                        {/*
                          CHANGE: SKU name uses Cormorant Garamond for consistency
                          with the drop title and homepage card headings.
                        */}
                        <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                          {sku.name}
                        </h3>
                        {/*
                          CHANGE: Price displayed in Cormorant Garamond display size —
                          making the number feel premium rather than utilitarian.
                        */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div className="font-display" style={{ fontSize: '22px', fontWeight: 500 }}>
                            {moneyFromCents(sku.price_cents)}
                          </div>
                          <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
                            each
                          </div>
                        </div>
                      </div>

                      {/* Subtitle */}
                      {sku.subtitle && (
                        <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--ink-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
                          {sku.subtitle}
                        </p>
                      )}

                      {/* Qty controls + line total */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: sku.subtitle ? 0 : '16px' }}>

                        {/*
                          CHANGE: Qty stepper redesigned —
                          - Sharp 2px radius container (not rounded-xl)
                          - Parchment background instead of neutral-50
                          - Gold border on the container
                          - Buttons use ink-muted text with a subtle parchment hover
                        */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid var(--gold)',
                          borderRadius: '2px',
                          backgroundColor: 'var(--parchment)',
                          overflow: 'hidden',
                        }}>
                          <button
                            onClick={() => dec(sku.id)}
                            disabled={qty === 0}
                            style={{
                              width: '36px',
                              height: '36px',
                              fontSize: '16px',
                              fontWeight: 400,
                              color: qty === 0 ? 'var(--gold)' : 'var(--ink)',
                              opacity: qty === 0 ? 0.3 : 1,
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: qty === 0 ? 'not-allowed' : 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            −
                          </button>
                          <div style={{
                            width: '36px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--ink)',
                            fontFamily: 'inherit',
                          }}>
                            {qty}
                          </div>
                          <button
                            onClick={() => inc(sku.id)}
                            style={{
                              width: '36px',
                              height: '36px',
                              fontSize: '16px',
                              fontWeight: 400,
                              color: 'var(--ink)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Line total */}
                        <div>
                          <span style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
                            Line
                          </span>{" "}
                          <span className="font-display" style={{ fontSize: '18px', fontWeight: 500 }}>
                            {moneyFromCents(qty * sku.price_cents)}
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Cart / Aside ────────────────────────────── */}
            {/*
              CHANGE: Cart panel redesigned to match the homepage card system —
              - Sticky positioning preserved (lg only)
              - Warm white background, 1px border, sharp 4px radius, grain overlay
              - Section label with gold overline
              - "Clear" link restyled as a small nav-link-style anchor
              - Empty cart state: parchment background, dashed gold border instead
                of dashed neutral border — feels intentional rather than absent
              - Cart line items: SKU name in Cormorant Garamond
              - Divider: gold rule (matching homepage section dividers)
              - Total displayed in Cormorant Garamond display size
              - Join button: btn-primary style (gold fill) when active;
                parchment + muted text when drop is complete
              - Status message: parchment background, gold-left-border accent
              - Disclaimer copy: Jost Light, ink-muted
            */}
            <aside id="cart" style={{ position: 'sticky', top: '88px', height: 'fit-content' }}>

              <div className="grain" style={{
                backgroundColor: '#FDFAF5',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '32px',
                position: 'relative',
                overflow: 'hidden',
              }}>

                {/* Cart header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: '6px' }}>
                      Your Selection
                    </p>
                    <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 500, letterSpacing: '-0.01em' }}>
                      Cart
                    </h3>
                  </div>
                  {/*
                    CHANGE: "Clear" link uses nav-link hover language (small tracked caps)
                    instead of the plain text button style.
                  */}
                  <button
                    onClick={clearCart}
                    disabled={cartItems.length === 0}
                    className="nav-link"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: cartItems.length === 0 ? 0.35 : 1,
                      paddingBottom: '4px',
                      fontFamily: 'inherit',
                    }}
                  >
                    Clear
                  </button>
                </div>

                <hr className="gold-rule" style={{ marginBottom: '24px' }} />

                {/* Cart line items */}
                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {cartItems.length === 0 ? (
                    /*
                      CHANGE: Empty state uses a parchment background with a dashed
                      gold border — more on-brand than the plain neutral dashed box.
                    */
                    <div style={{
                      border: '1px dashed var(--gold)',
                      borderRadius: '2px',
                      backgroundColor: 'var(--parchment)',
                      padding: '20px',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--ink-muted)', letterSpacing: '0.02em' }}>
                        Add items to see your cart total.
                      </p>
                    </div>
                  ) : (
                    cartItems.map(({ sku, qty, lineTotal }) => (
                      <div key={sku.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          {/*
                            CHANGE: SKU name in cart uses Cormorant Garamond — keeps
                            the serif language consistent throughout the page.
                          */}
                          <p className="font-display" style={{ fontSize: '17px', fontWeight: 500, marginBottom: '3px' }}>
                            {sku.name}
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 300, letterSpacing: '0.02em' }}>
                            {qty} × {moneyFromCents(sku.price_cents)}
                          </p>
                        </div>
                        <span className="font-display" style={{ fontSize: '18px', fontWeight: 500, flexShrink: 0 }}>
                          {moneyFromCents(lineTotal)}
                        </span>
                      </div>
                    ))
                  )}

                </div>

                <hr className="gold-rule" style={{ marginBottom: '20px' }} />

                {/* Total row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>
                    Total
                  </span>
                  {/*
                    CHANGE: Total amount in large Cormorant Garamond — the most
                    prominent number on the page, given the display it deserves.
                  */}
                  <span className="font-display" style={{ fontSize: '32px', fontWeight: 500 }}>
                    {moneyFromCents(cartTotal)}
                  </span>
                </div>

                {/*
                  CHANGE: Join button uses btn-primary (gold fill, ink text, uppercase,
                  sharp 2px radius) when active — matches the homepage CTA style.
                  When the drop is complete, it falls back to a muted parchment state.
                */}
                <button
                  onClick={handleJoin}
                  disabled={reachedTarget}
                  className={reachedTarget ? "" : "btn-primary"}
                  style={{
                    width: '100%',
                    borderRadius: '2px',
                    border: 'none',
                    cursor: reachedTarget ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    ...(reachedTarget ? {
                      backgroundColor: 'var(--parchment)',
                      color: 'var(--ink-muted)',
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      fontWeight: 500,
                      padding: '12px 24px',
                    } : {}),
                  }}
                >
                  {reachedTarget
                    ? "Target reached"
                    : cartTotal <= 0
                    ? "Join this drop →"
                    : `Authorize ${moneyFromCents(cartTotal)} →`}
                </button>

                {/* Status message */}
                {statusMsg && (
                  /*
                    CHANGE: Status message uses a left gold border accent instead of
                    a neutral pill — more intentional and on-brand.
                  */
                  <div style={{
                    marginTop: '16px',
                    borderLeft: '2px solid var(--gold)',
                    paddingLeft: '12px',
                    backgroundColor: 'var(--parchment)',
                    padding: '10px 10px 10px 14px',
                    borderRadius: '0 2px 2px 0',
                  }}>
                    <p style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 400, letterSpacing: '0.01em' }}>
                      {statusMsg}
                    </p>
                  </div>
                )}

                {/* Disclaimer */}
                <p style={{
                  marginTop: '20px',
                  fontSize: '11px',
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: 'var(--ink-muted)',
                  letterSpacing: '0.01em',
                }}>
                  Design mode: this simulates joining. In the real flow, we'll
                  authorize your card now and only charge if the drop completes.
                </p>

              </div>
            </aside>

          </div>

          {/* ── Footer ─────────────────────────────────────── */}
          {/*
            CHANGE: Footer identical to homepage — gold rule, wordmark in
            Cormorant Garamond, copyright right-aligned, 120px top spacing.
          */}
          <hr className="gold-rule" style={{ marginTop: '120px' }} />

          <footer style={{
            padding: '28px 0 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <span className="font-display" style={{ fontSize: '15px', fontWeight: 400, letterSpacing: '0.05em', color: 'var(--ink-muted)' }}>
              groupdrop
            </span>
            <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--ink-muted)', fontWeight: 300 }}>
              © {new Date().getFullYear()} groupdrop. All rights reserved.
            </span>
          </footer>

        </div>
      </main>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   SHARED_STYLES
   CHANGE: Extracted the entire CSS design system into a named
   constant so it can be copy-pasted identically into every drop
   page (Le Labo, etc.) without drift. One source of truth.
   This is byte-for-byte identical to the <style> block in page.tsx.
───────────────────────────────────────────────────────────── */
const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap');

  :root {
    --cream: #F7F4EE;
    --parchment: #EDE9E0;
    --ink: #1A1814;
    --ink-muted: #6B6560;
    --gold: #B89A6A;
    --gold-light: #D4B896;
    --border: rgba(26,24,20,0.10);
  }

  body {
    background: var(--cream);
    font-family: 'Jost', sans-serif;
  }

  .font-display {
    font-family: 'Cormorant Garamond', Georgia, serif;
  }

  .grain::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    border-radius: inherit;
    pointer-events: none;
    opacity: 0.4;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--cream); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

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

  .progress-fill {
    background: linear-gradient(90deg, var(--gold), var(--gold-light));
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .drop-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .drop-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(26,24,20,0.08);
    border-color: var(--gold);
  }

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

  .gold-rule {
    border: none;
    border-top: 1px solid var(--gold);
    opacity: 0.35;
    margin: 0;
  }

  .status-badge {
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 500;
    font-family: 'Jost', sans-serif;
  }
`;