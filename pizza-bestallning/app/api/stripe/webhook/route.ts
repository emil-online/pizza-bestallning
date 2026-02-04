import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function readRawBody(req: Request): Promise<Buffer> {
  const ab = await req.arrayBuffer();
  return Buffer.from(ab);
}

export async function POST(req: Request) {
  const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"));
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  let event: Stripe.Event;

  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      mustEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err?.message ?? err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  console.log("WEBHOOK HIT:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Bara om betald
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const orderId = session.metadata?.order_id;
    if (!orderId) {
      console.warn("Missing order_id in metadata for session:", session.id);
      return NextResponse.json({ received: true, missing_order_id: true });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    // ✅ Uppdatera ordern som betald (ordernummer räknas i VIEW: orders_with_number)
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
        status: "Ny",
      })
      .eq("id", orderId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ received: true, db_error: true }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
