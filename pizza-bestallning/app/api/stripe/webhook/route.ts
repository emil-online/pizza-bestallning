import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
      createdAt: string;
      total: number;
      items: { name: string; price: number; qty: number; comment?: string }[];
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !whsec) return new NextResponse("Missing signature/secret", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whsec);
  } catch (e: any) {
    console.error("Bad signature:", e?.message);
    return new NextResponse("Bad signature", { status: 400 });
  }

  // ✅ svara OK för alla events vi inte bryr oss om
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const order = reconstructOrder(metadata);

  if (!order) {
    console.error("No order in metadata (session:", session.id, ")");
    return NextResponse.json({ ok: true });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return new NextResponse("Missing Supabase env", { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  // ✅ Spara i orders-tabellen (minimalt)
  const { error } = await supabaseAdmin.from("orders").insert({
    status: "Ny",
    items: order.items,
    total: order.total,
  });

  if (error) {
    console.error("Supabase insert failed:", error.message);
    return new NextResponse("DB error", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
