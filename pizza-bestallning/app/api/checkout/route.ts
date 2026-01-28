import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe metadata har storleksgräns → vi chunkar JSON
function chunkString(input: string, size = 450) {
  const chunks: string[] = [];
  for (let i = 0; i < input.length; i += size) chunks.push(input.slice(i, i + size));
  return chunks;
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin") ?? "http://localhost:3000";
    const body = await req.json();

    const items = Array.isArray(body?.items) ? body.items : [];
    const total = Number(body?.total ?? 0);
    const createdAt = body?.createdAt ?? new Date().toISOString();

    if (!items.length) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    // ✅ Packa hela ordern i metadata så webhooken kan spara den
    const orderPayload = JSON.stringify({
      createdAt,
      total,
      items: items.map((it: any) => ({
        name: String(it?.name ?? ""),
        price: Number(it?.price ?? 0),
        qty: Number(it?.qty ?? 1),
        comment: String(it?.comment ?? ""),
      })),
    });

    const chunks = chunkString(orderPayload, 450);
    const metadata: Record<string, string> = { chunks: String(chunks.length) };
    chunks.forEach((c, i) => (metadata[`o${i}`] = c));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "sek",
          product_data: { name: item.name },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: Number(item.qty ?? 1),
      })),
      metadata,
      success_url: `${origin}/checkout?success=true`,
      cancel_url: `${origin}/checkout?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return new NextResponse("Stripe error", { status: 500 });
  }
}
