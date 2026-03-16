import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/*
  File location: app/api/webhook/route.ts

  Stripe calls this URL automatically after a payment succeeds.
  It writes the stripe_customer_id and stripe_subscription_id
  back to the Supabase profiles table.

  Setup steps (after deploying this file):
    1. Go to Stripe → Developers → Webhooks → Add endpoint
    2. Set the URL to: https://your-domain.vercel.app/api/webhook
    3. Select event: checkout.session.completed
    4. Copy the webhook signing secret (whsec_...) 
    5. Add it to .env.local and Vercel as STRIPE_WEBHOOK_SECRET
*/

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

/*
  Use the Supabase service role key here (not the anon key) so the
  webhook can write to the database without RLS restrictions.
  Add SUPABASE_SERVICE_ROLE_KEY to .env.local and Vercel.
*/
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    /*
      Verify the webhook signature — this confirms the request
      actually came from Stripe and wasn't forged.
    */
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  /* Only handle successful checkout completions */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.supabase_user_id;
    const tier = session.metadata?.tier;
    const billing_cycle = session.metadata?.billing_cycle;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (!userId) {
      console.error("No supabase_user_id in session metadata");
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    /*
      Update the profiles row with the Stripe IDs.
      Using upsert so it works even if the profile row
      wasn't created yet for any reason.
    */
    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        tier,
        billing_cycle,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      });

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    console.log(`Profile updated for user ${userId} — tier: ${tier}, billing: ${billing_cycle}`);
  }

  return NextResponse.json({ received: true });
}