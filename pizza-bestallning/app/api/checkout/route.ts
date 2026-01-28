import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function chunkString(input: string, size = 450) {
  const chunks: string[] = [];
  for (let i = 0; i < input.length; i += size) chunks.push(input.slice(i, i + size));
  return chunks;
}

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"));

    const origin = req.headers.get("origin") ?? "http://localhost:3000";
    const body = await req.json();

    const items = Array.isArray(body?.items) ? body.items : [];
    const total = Number(body?.total ?? 0);

    if (!items.length) return NextResponse.json({ error: "items saknas" }, { status: 400 });
    if (!Number.isFinite(total) || total <= 0)
      return NextResponse.json({ error: "total saknas" }, { status: 400 });

    // Packa ordern till metadata (för webhook)
    const payload = JSON.stringify({
      created_at: new Date().toISOString(),
      total,
      items: items.map((it: any) => ({
        name: String(it?.name ?? ""),
        qty: Number(it?.qty ?? 1),
        comment: String(it?.comment ?? ""),
        price: Number(it?.price ?? 0),
      })),
    });

    const chunks = chunkString(payload, 450);
    const metadata: Record<string, string> = { chunks: String(chunks.length) };
    chunks.forEach((c, i) => (metadata[`o${i}`] = c));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "sek",
          product_data: { name: String(item?.name ?? "Produkt") },
          unit_amount: Math.round(Number(item?.price ?? 0) * 100),
        },
        quantity: Number(item?.qty ?? 1),
      })),
      metadata,
      success_url: `${origin}/checkout?success=true`,
      cancel_url: `${origin}/checkout?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("/api/checkout error:", err?.message ?? err);
    return NextResponse.json({ error: "Server error", detail: err?.message ?? String(err) }, { status: 500 });
  }
}
