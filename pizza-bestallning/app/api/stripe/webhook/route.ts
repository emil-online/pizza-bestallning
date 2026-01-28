import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // viktigt på Vercel

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function reconstructOrder(metadata: Record<string, string>) {
  const n = Number(metadata["chunks"] ?? 0);
  if (!n || n < 1) return null;

  let json = "";
  for (let i = 0; i < n; i++) {
    const part = metadata[`o${i}`];
    if (!part) return null;
    json += part;
  }

  try {
    return JSON.parse(json) as {
      created_at: string;
      items: { name: string; qty: number; comment?: string; price?: number }[];
      total: number;
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

    const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");

    // ✅ skapa Stripe här inne (inte på toppnivå)
    const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"));

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook bad signature:", err?.message ?? err);
      return new NextResponse("Bad signature", { status: 400 });
    }

    // Svara OK för allt vi inte bryr oss om
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ ok: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = (session.metadata ?? {}) as Record<string, string>;
    const order = reconstructOrder(metadata);

    if (!order) {
      console.error("No order metadata on session:", session.id);
      return NextResponse.json({ ok: true, note: "no order metadata" });
    }

    // ✅ skapa Supabase client här inne (inte på toppnivå)
    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    const { error } = await supabase.from("orders").insert({
      status: "Ny",
      customer_name: null,
      customer_phone: null,
      notes: null,
      items: order.items,
      total: order.total,
    });

    if (error) {
      console.error("Supabase insert failed:", error);
      return new NextResponse("DB error", { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook crash:", err?.message ?? err);
    return new NextResponse("Webhook crashed", { status: 500 });
  }
}
