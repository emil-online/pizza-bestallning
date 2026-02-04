import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendSms46elks } from "@/lib/elks";

export const runtime = "nodejs";

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

type Body = {
  orderId: string;
  status: "Ny" | "Tillagas" | "Klar";
  etaMinutes?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // 1) Hämta order + sms-flaggor
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, customer_phone, sms_cooking_sent_at, sms_ready_sent_at")
      .eq("id", body.orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { detail: "Order hittades inte" },
        { status: 404 }
      );
    }

    const normalizedPhone = normalizePhoneSE(String(order.customer_phone ?? ""));

    if (!normalizedPhone) {
      return NextResponse.json(
        {
          detail: "Ogiltigt eller saknat telefonnummer",
          debug_customer_phone_value: order.customer_phone,
        },
        { status: 400 }
      );
    }

    // 2) Hämta ordernummer (51, 52, 53...) från VIEWN
    const { data: nData, error: nErr } = await supabaseAdmin
      .from("orders_with_number")
      .select("order_number")
      .eq("id", body.orderId)
      .maybeSingle();

    const orderNumber =
      !nErr && nData && typeof (nData as any).order_number === "number"
        ? ((nData as any).order_number as number)
        : null;

    const orderPrefix =
      typeof orderNumber === "number" ? `Order #${orderNumber}: ` : "";

    // 3) Spara status (som du redan gör)
    const statusText =
      body.status === "Tillagas" && body.etaMinutes
        ? `Tillagas • ${body.etaMinutes} min`
        : body.status;

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: statusText,
        eta_minutes: body.status === "Tillagas" ? body.etaMinutes ?? null : null,
        customer_phone: normalizedPhone,
      })
      .eq("id", body.orderId);

    if (updateError) {
      return NextResponse.json({ detail: updateError.message }, { status: 500 });
    }

    // 4) SMS: Tillagas
    if (body.status === "Tillagas" && !order.sms_cooking_sent_at) {
      const msg = body.etaMinutes
        ? `${orderPrefix}🍕 Din order tillagas nu. Klar om ca ${body.etaMinutes} min.`
        : `${orderPrefix}🍕 Din order tillagas nu.`;

      await sendSms46elks({ to: normalizedPhone, message: msg });

      await supabaseAdmin
        .from("orders")
        .update({ sms_cooking_sent_at: new Date().toISOString() })
        .eq("id", body.orderId);
    }

    // 5) SMS: Klar
    if (body.status === "Klar" && !order.sms_ready_sent_at) {
      const msg = `${orderPrefix}✅ Din order är klar att hämta. Välkommen!`;

      await sendSms46elks({
        to: normalizedPhone,
        message: msg,
      });

      await supabaseAdmin
        .from("orders")
        .update({ sms_ready_sent_at: new Date().toISOString() })
        .eq("id", body.orderId);
    }

    return NextResponse.json({
      ok: true,
      status: statusText,
      orderNumber,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { detail: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
