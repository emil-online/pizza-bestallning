"use client";

import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type MenuItem = {
  id: string;
  name: string;
  price: number;
};

const MENU: MenuItem[] = [
  { id: "vesuvio", name: "Vesuvio (skinka)", price: 110 },
  { id: "capricciosa", name: "Capricciosa", price: 120 },
  { id: "kebabpizza", name: "Kebabpizza", price: 130 },
  { id: "margherita", name: "Margherita", price: 100 },
];

export default function Home() {
  const [cart, setCart] = useState<Record<string, number>>({});

  const itemsById = useMemo(() => {
    const map: Record<string, MenuItem> = {};
    for (const item of MENU) map[item.id] = item;
    return map;
  }, []);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ item: itemsById[id], qty }));
  }, [cart, itemsById]);

  const total = useMemo(
    () => cartLines.reduce((s, l) => s + l.item.price * l.qty, 0),
    [cartLines]
  );

  function addToCart(id: string) {
    setCart((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  }

  function removeFromCart(id: string) {
    setCart((p) => {
      const n = { ...p };
      const v = (n[id] ?? 0) - 1;
      if (v <= 0) delete n[id];
      else n[id] = v;
      return n;
    });
  }

  function clearCart() {
    setCart({});
  }

  return (
    <main className="min-h-screen bg-amber-50">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🍕 Pizzeria – Onlinebeställning
          </h1>
          <p className="mt-1 text-slate-600">
            Välj din pizza och skicka beställningen direkt.
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
                    <div className="font-medium text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {item.price} kr
                    </div>
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
              <h2 className="text-xl font-semibold text-gray-900">
                Varukorg
              </h2>
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
                {cartLines.map(({ item, qty }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-slate-600">
                        {item.price} kr/st
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="h-9 w-9 rounded-xl border border-slate-300 text-gray-800 hover:bg-slate-100"
                      >
                        −
                      </button>
                      <div className="w-6 text-center font-semibold text-gray-900">
                        {qty}
                      </div>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="h-9 w-9 rounded-xl border border-slate-300 text-gray-800 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-lg font-semibold text-gray-900">
                    Totalt
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {total} kr
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const { error } = await supabase.from("orders").insert({
                      status: "Ny",
                      customer_name: "Kund",
                      customer_phone: "",
                      items: cartLines.map(({ item, qty }) => ({
                        name: item.name,
                        qty,
                      })),
                      total,
                    });

                    if (error) {
                      alert(error.message);
                      return;
                    }

                    alert("Beställning skickad!");
                    clearCart();
                  }}
                  className="w-full rounded-2xl bg-amber-600 px-4 py-3 text-white font-semibold hover:bg-amber-700"
                >
                  Skicka beställning
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
