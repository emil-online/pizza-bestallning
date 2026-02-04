// app/api/menu/availability/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/**
 * GET /api/menu/availability
 * Returnerar en map:
 * {
 *   "42-kebabpizza": false,
 *   "1-margherita": true
 * }
 *
 * OBS: Om en produkt saknas i tabellen betyder det "tillgänglig" (true) i frontend.
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("menu_availability")
    .select("item_id, available");

  if (error) {
    console.error("GET menu_availability error:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta tillgänglighet." },
      { status: 500 }
    );
  }

  const map: Record<string, boolean> = {};
  for (const row of data ?? []) {
    map[row.item_id] = Boolean(row.available);
  }

  return NextResponse.json(map, { status: 200 });
}

/**
 * POST /api/menu/availability
 * Body:
 * {
 *   itemId: "42-kebabpizza",
 *   available: false
 * }
 *
 * Skapar raden om den inte finns (upsert).
 */
export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
  }

  const itemId = String(body?.itemId ?? "").trim();
  const available = Boolean(body?.available);

  if (!itemId) {
    return NextResponse.json(
      { error: "itemId saknas." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("menu_availability")
    .upsert(
      {
        item_id: itemId,
        available,
      },
      { onConflict: "item_id" }
    );

  if (error) {
    console.error("POST menu_availability error:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera tillgänglighet." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, itemId, available }, { status: 200 });
}
