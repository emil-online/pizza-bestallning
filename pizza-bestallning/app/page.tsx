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

/** ---------- UI helpers (enkelt, i samma fil) ---------- */
function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70",
        className
      )}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  className,
  variant = "secondary",
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
    "transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-600/10",
    secondary:
      "bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      onClick={onClick}
      className={cx(base, variants[variant], className)}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
/** ------------------------------------------------------ */

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
    setCart((prev) =>
      prev.map((x) => (x.uid === cartUid ? { ...x, comment } : x))
    );
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
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Pizzeria • Onlinebeställning
              </h1>
              <p className="mt-2 text-slate-600">
                Välj pizza, lägg kommentar per pizza och gå vidare till checkout.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 px-4 py-2 ring-1 ring-amber-200">
                <div className="text-xs font-semibold text-amber-900">
                  Totalt
                </div>
                <div className="text-lg font-extrabold text-amber-950">
                  {total} kr
                </div>
              </div>
              <Button
                onClick={goToCheckout}
                variant="primary"
                disabled={cartLines.length === 0}
                className="py-3"
                title={cartLines.length === 0 ? "Lägg till något först" : "Gå vidare"}
              >
                Beställ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* MENY */}
          <Card className="p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Meny</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tryck “Lägg till” för att lägga en pizza i varukorgen.
                </p>
              </div>
            </div>

            <ul className="space-y-3">
              {MENU.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {item.price} kr
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => addToCart(item.id)}
                      variant="primary"
                      className="whitespace-nowrap"
                    >
                      Lägg till
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* VARUKORG */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Varukorg</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Varje pizza kan ha sin egen kommentar.
                </p>
              </div>

              <Button
                onClick={clearCart}
                variant="ghost"
                className="px-3"
                disabled={cartLines.length === 0}
                title="Töm varukorgen"
              >
                Töm
              </Button>
            </div>

            {cartLines.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
                <div className="text-lg font-semibold text-slate-900">
                  Varukorgen är tom
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Välj en pizza i menyn så dyker den upp här.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visar varje pizza som en egen rad (för egen kommentar) */}
                {cartLines.map(({ uid: lineUid, item, comment }) => (
                  <div
                    key={lineUid}
                    className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {item.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {item.price} kr
                        </div>
                      </div>

                      <Button
                        onClick={() => removeByUid(lineUid)}
                        variant="secondary"
                        className="px-3 py-2"
                        title="Ta bort just denna pizza"
                      >
                        Ta bort
                      </Button>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-semibold text-slate-800">
                        Kommentar (för just denna pizza)
                      </label>
                      <input
                        value={comment}
                        onChange={(e) => updateComment(lineUid, e.target.value)}
                        placeholder="t.ex. ingen lök"
                        className={cx(
                          "mt-2 w-full rounded-xl bg-white px-3 py-2 text-slate-900",
                          "ring-1 ring-slate-300 placeholder:text-slate-400",
                          "focus:outline-none focus:ring-2 focus:ring-amber-500"
                        )}
                      />
                    </div>
                  </div>
                ))}

                {/* Snabb justering */}
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-sm font-bold text-slate-900 mb-3">
                    Snabb justering (antal per sort)
                  </div>
                  <div className="space-y-2">
                    {MENU.filter((m) => (qtyById[m.id] ?? 0) > 0).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="text-sm font-medium text-slate-800">
                          {m.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeOne(m.id)}
                            className="h-10 w-10 rounded-xl bg-white ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            aria-label={`Ta bort en ${m.name}`}
                          >
                            −
                          </button>
                          <div className="w-8 text-center font-extrabold text-slate-900">
                            {qtyById[m.id]}
                          </div>
                          <button
                            onClick={() => addToCart(m.id)}
                            className="h-10 w-10 rounded-xl bg-white ring-1 ring-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            aria-label={`Lägg till en ${m.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                  <div className="text-sm font-semibold text-slate-700">Totalt</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {total} kr
                  </div>
                </div>

                <Button
                  onClick={goToCheckout}
                  variant="primary"
                  className="w-full py-3 text-base"
                >
                  Beställ
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
