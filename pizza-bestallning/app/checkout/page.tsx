"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type PendingItem = {
  name: string;
  price: number;
  comment: string;
  qty: number; // vi använder 1 per rad
};

type PendingOrder = {
  createdAt: string; // ISO
  items: PendingItem[];
  total: number;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingOrder");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as PendingOrder;
      if (!parsed?.items?.length) {
        router.replace("/");
        return;
      }
      setPending(parsed);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const total = useMemo(() => pending?.total ?? 0, [pending]);

  async function submitOrder() {
    if (!pending) return;

    const n = name.trim();
    const p = phone.trim();

    if (!n) {
      alert("Skriv ditt namn.");
      return;
    }
    if (!p) {
      alert("Skriv ditt telefonnummer.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("orders").insert({
      status: "Ny",
      customer_name: n,
      customer_phone: p,
      items: pending.items.map((it) => ({
        name: it.name,
        qty: it.qty,
        comment: it.comment || "",
      })),
      total: pending.total,
    });

    setSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    sessionStorage.removeItem("pendingOrder");
    alert("Tack! Din beställning är skickad.");
    router.replace("/");
  }

  if (!pending) return null;

  return (
    <main className="min-h-screen bg-amber-50">
      <div className="mx-auto max-w-xl p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Kvitto</h1>
          <p className="mt-1 text-slate-600">
            Kontrollera din beställning och fyll i namn + telefonnummer.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm border border-amber-100">
          <div className="space-y-3">
            {pending.items.map((it, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">{it.name}</div>
                    {it.comment?.trim() ? (
                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-semibold">Kommentar:</span>{" "}
                        {it.comment}
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-slate-500">
                        Ingen kommentar
                      </div>
                    )}
                  </div>
                  <div className="font-semibold text-gray-900">{it.price} kr</div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-lg font-semibold text-gray-900">Totalt</div>
              <div className="text-lg font-bold text-gray-900">{total} kr</div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm border border-amber-100">
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-gray-800">Namn</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ditt namn"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">
                Telefon
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07X-XXX XX XX"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting}
              className="w-full rounded-2xl bg-amber-600 px-4 py-3 text-white font-semibold hover:bg-amber-700 disabled:opacity-60"
            >
              {submitting ? "Skickar..." : "Bekräfta beställning"}
            </button>

            <button
              onClick={() => router.back()}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-gray-900 font-semibold hover:bg-slate-50"
            >
              Tillbaka
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
