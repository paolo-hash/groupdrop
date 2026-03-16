import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/*
  File location: app/api/checkout/route.ts

  Called from the signup page after the Supabase user is created.
  Receives: { tier, billing, userId, email }
  Returns:  { url } — the Stripe Checkout URL to redirect the user to
*/

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

/* ─────────────────────────────────────────────────────────────
   Price ID map — paste your 6 Stripe Price IDs here
───────────────────────────────────────────────────────────── */
const PRICE_IDS: Record<string, Record<string, string>> = {
  essentialist: {
    monthly: "price_1TBSglD5UbV9lbkCqlRhn1C3",
    annual:  "price_1TBSh4D5UbV9lbkC7mA3sDF6",
  },
  enthusiast: {
    monthly: "price_1TBShND5UbV9lbkCbmTEtw83",
    annual:  "price_1TBShZD5UbV9lbkCpHA4bDI1",
  },
  curator: {
    monthly: "price_1TBShrD5UbV9lbkCAMmbYzo9",
    annual:  "price_1TBSi9D5UbV9lbkCry3Ln0jH",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { tier, billing, userId, email } = await req.json();

    /* Validate inputs */
    if (!tier || !billing || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[tier]?.[billing];

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid tier or billing cycle." },
        { status: 400 }
      );
    }

    /*
      Create a Stripe Checkout session.
      - mode: "subscription" sets up recurring billing
      - success_url: where Stripe sends the user after payment
      - cancel_url: where Stripe sends the user if they bail
      - client_reference_id: we store the Supabase userId so the
        webhook can match the payment back to the right profile row
      - customer_email: pre-fills the email on the Stripe checkout page
    */
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://groupdrop-iota.vercel.app/?welcome=true`,
      cancel_url: `https://groupdrop-iota.vercel.app/join`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        supabase_user_id: userId,
        tier,
        billing_cycle: billing,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}