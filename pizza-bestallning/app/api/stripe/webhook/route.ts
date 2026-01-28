import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function reassembleMetadata(metadata: Record<string, string> | null | undefined) {
  if (!metadata) return null;
  const n = Number(metadata.chunks ?? 0);
  if (!Number.isFinite(n) || n <= 0) return null;

  let s = "";
  for (let i = 0; i < n; i++) {
    const part = metadata[`o${i}`];
    if (typeof part !== "string") return null;
    s += part;
  }
  return s;
}

export async function POST(req: Request) {
  const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"));
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      mustEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Vi bryr oss främst om att Checkout-sessionen är klar:
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Återskapa din order som du packade i metadata
    const json = reassembleMetadata(session.metadata);
    if (!json) return new NextResponse("Missing order metadata", { status: 400 });

    let order: any;
    try {
      order = JSON.parse(json);
    } catch {
      return new NextResponse("Bad order metadata JSON", { status: 400 });
    }

    // (Valfritt men bra) idempotens: undvik dubbletter om Stripe skickar webhook fler gånger
    const stripeSessionId = session.id;

    const insertPayload = {
      status: "Ny",
      created_at: order.created_at ?? new Date().toISOString(),
      total: Number(order.total ?? 0),
      items: Array.isArray(order.items) ? order.items : [],
      // om du vill spara koppling till Stripe:
      // stripe_session_id: stripeSessionId,
      // customer_name: null,
      // customer_phone: null,
    };

    // Om du inte har en kolumn för stripe_session_id kan du skippa idempotens,
    // men rekommenderas starkt att lägga till den.
    const { error } = await supabaseAdmin.from("orders").insert(insertPayload);

    if (error) {
      // Logga så du ser exakt varför (RLS, schema, etc)
      console.error("Supabase insert error:", error);
      return new NextResponse("Supabase insert failed", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
