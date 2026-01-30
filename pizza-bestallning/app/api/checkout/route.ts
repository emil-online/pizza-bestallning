import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function normalizePhoneSE(input: string): string | null {
  const raw = (input || "").trim().replace(/\s+/g, "").replace(/-/g, "");
  if (!raw) return null;

  if (raw.startsWith("+")) return /^\+\d{8,15}$/.test(raw) ? raw : null;
  if (raw.startsWith("0046"))
    return /^\d+$/.test(raw.slice(4)) ? "+46" + raw.slice(4) : null;
  if (raw.startsWith("46"))
    return /^\d+$/.test(raw.slice(2)) ? "+46" + raw.slice(2) : null;
  if (raw.startsWith("07") && /^\d+$/.test(raw)) return "+46" + raw.slice(1);

  return null;
}

function safeItems(items: any) {
  const arr = Array.isArray(items) ? items : [];
  return arr
    .map((it) => ({
      name: String(it?.name ?? "").trim(),
      qty: Math.max(1, Number(it?.qty ?? 1)),
      comment: String(it?.comment ?? ""),
      price: Number(it?.price ?? 0),
    }))
    .filter(
      (it) =>
        it.name &&
        it.qty > 0 &&
        Number.isFinite(it.price) &&
        it.price >= 0
    );
}

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"));
    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    const body = await req.json();

    const items = safeItems(body?.items);
    const total = Number(body?.total ?? 0);

    const customerName = String(body?.customerName ?? "").trim();
    const customerPhoneRaw = String(body?.customerPhone ?? "").trim();
    const customerPhone = normalizePhoneSE(customerPhoneRaw);

    if (!items.length) {
      return NextResponse.json({ error: "items saknas" }, { status: 400 });
    }
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: "total saknas" }, { status: 400 });
    }
    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: "customerName saknas" },
        { status: 400 }
      );
    }
    if (!customerPhone) {
      return NextResponse.json(
        { error: "customerPhone saknas/ogiltigt. Använd +46... eller 070..." },
        { status: 400 }
      );
    }

    // 1) Skapa order som PENDING (syns inte i admin förrän webhook sätter paid_at)
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("orders")
      .insert({
        status: "Pending",
        paid_at: null,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: items.map((it) => ({
          name: it.name,
          qty: it.qty,
          comment: it.comment,
        })),
        total: Math.round(total),
      })
      .select("id")
      .single();

    if (insertErr || !created?.id) {
      console.error("Supabase insert error:", insertErr);
      return NextResponse.json(
        { error: "Kunde inte skapa order i databasen", detail: insertErr?.message },
        { status: 500 }
      );
    }

    const orderId = created.id as string;

    // 2) Skapa Stripe Checkout Session + metadata med order_id
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "sek",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      })),

      metadata: {
        order_id: orderId,
        customer_name: customerName,
        customer_phone: customerPhone,
      },

      success_url: `${origin}/checkout?success=true`,
      cancel_url: `${origin}/checkout?canceled=true`,
    });

    return NextResponse.json({ url: session.url, orderId });
  } catch (err: any) {
    console.error("/api/checkout error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Server error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
