"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MenuItem = {
  id: string;
  name: string;
  price: number;
};

type CartItem = {
  uid: string; // unik per pizza i varukorgen
  itemId: string;
  comment: string; // kommentar per pizza
};

const MENU: MenuItem[] = [
  { id: "vesuvio", name: "Vesuvio (skinka)", price: 110 },
  { id: "capricciosa", name: "Capricciosa", price: 120 },
  { id: "kebabpizza", name: "Kebabpizza", price: 130 },
  { id: "margherita", name: "Margherita", price: 100 },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const router = useRouter();

  // 🔁 Viktigt: nu är varukorgen en lista av “pizzor”, inte qty per id
  const [cart, setCart] = useState<CartItem[]>([]);

  const itemsById = useMemo(() => {
    const map: Record<string, MenuItem> = {};
    for (const item of MENU) map[item.id] = item;
    return map;
  }, []);

  const cartLines = useMemo(() => {
    return cart
      .map((c) => ({
        uid: c.uid,
        item: itemsById[c.itemId],
        comment: c.comment,
      }))
      .filter((x) => Boolean(x.item));
  }, [cart, itemsById]);

  const total = useMemo(() => {
    return cartLines.reduce((sum, line) => sum + line.item.price, 0);
  }, [cartLines]);

  function addToCart(itemId: string) {
    setCart((prev) => [...prev, { uid: uid(), itemId, comment: "" }]);
  }

  function removeOne(itemId: string) {
    setCart((prev) => {
      const idx = [...prev].reverse().findIndex((x) => x.itemId === itemId);
      if (idx === -1) return prev;
      const realIndex = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== realIndex);
    });
  }

  function removeByUid(cartUid: string) {
    setCart((prev) => prev.filter((x) => x.uid !== cartUid));
  }

  function updateComment(cartUid: string, comment: string) {
    setCart((prev) => prev.map((x) => (x.uid === cartUid ? { ...x, comment } : x)));
  }

  function clearCart() {
    setCart([]);
  }

  function goToCheckout() {
    if (cartLines.length === 0) return;

    // Spara “pending order” till checkout (sessionStorage => försvinner när fliken stängs)
    const payload = {
      createdAt: new Date().toISOString(),
      items: cartLines.map((l) => ({
        name: l.item.name,
        price: l.item.price,
        comment: l.comment?.trim() || "",
        qty: 1,
      })),
      total,
    };

    sessionStorage.setItem("pendingOrder", JSON.stringify(payload));
    router.push("/checkout");
  }

  // group för +/- UI
  const qtyById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of cart) m[c.itemId] = (m[c.itemId] ?? 0) + 1;
    return m;
  }, [cart]);

  return (
    <main className="min-h-screen bg-amber-50">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🍕 Pizzeria – Onlinebeställning
          </h1>
          <p className="mt-1 text-slate-600">
            Välj din pizza, skriv kommentar per pizza och gå vidare till kvitto.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* MENY */}
          <section className="rounded-2xl bg-white p-5 shadow-sm border border-amber-100">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Meny</h2>
            <ul className="space-y-3">
              {MENU.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-slate-600">{item.price} kr</div>
                  </div>

                  <button
                    onClick={() => addToCart(item.id)}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-white font-medium hover:bg-amber-700"
                  >
                    Lägg till
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* VARUKORG */}
          <section className="rounded-2xl bg-white p-5 shadow-sm border border-amber-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Varukorg</h2>
              <button
                onClick={clearCart}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Töm
              </button>
            </div>

            {cartLines.length === 0 ? (
              <p className="text-slate-600">Varukorgen är tom.</p>
            ) : (
              <div className="space-y-3">
                {/* Visar varje pizza som en egen rad (för egen kommentar) */}
                {cartLines.map(({ uid: lineUid, item, comment }) => (
                  <div
                    key={lineUid}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-slate-600">{item.price} kr</div>
                      </div>

                      <button
                        onClick={() => removeByUid(lineUid)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                        title="Ta bort just denna pizza"
                      >
                        Ta bort
                      </button>
                    </div>

                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-800">
                        Kommentar (för just denna pizza)
                      </label>
                      <input
                        value={comment}
                        onChange={(e) => updateComment(lineUid, e.target.value)}
                        placeholder="t.ex. ingen lök"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-gray-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ))}

                {/* En liten “+/- per sort” (valfritt men smidigt) */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-2">
                    Snabb justering (antal per sort)
                  </div>
                  <div className="space-y-2">
                    {MENU.filter((m) => (qtyById[m.id] ?? 0) > 0).map((m) => (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="text-sm text-slate-700">
                          {m.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeOne(m.id)}
                            className="h-9 w-9 rounded-xl border border-slate-300 hover:bg-slate-50"
                            aria-label={`Ta bort en ${m.name}`}
                          >
                            −
                          </button>
                          <div className="w-6 text-center font-semibold">
                            {qtyById[m.id]}
                          </div>
                          <button
                            onClick={() => addToCart(m.id)}
                            className="h-9 w-9 rounded-xl border border-slate-300 hover:bg-slate-50"
                            aria-label={`Lägg till en ${m.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-lg font-semibold text-gray-900">Totalt</div>
                  <div className="text-lg font-bold text-gray-900">{total} kr</div>
                </div>

                <button
                  onClick={goToCheckout}
                  className="w-full rounded-2xl bg-amber-600 px-4 py-3 text-white font-semibold hover:bg-amber-700"
                >
                  Beställ
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
