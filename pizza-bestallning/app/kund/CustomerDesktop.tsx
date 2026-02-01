"use client";

import {
  CATEGORY_ORDER,
  money,
  slugify,
  useCustomerOrder,
} from "./useCustomerOrder";
import { Button, Card, cx, tagBadges } from "./ui";

export default function CustomerDesktop() {
  const {
    activeCategory,
    q,
    cartLines,
    total,
    qtyById,
    isSearching,
    filteredMenu,
    categoryCounts,
    setActiveCategory,
    setQ,
    addToCart,
    removeOne,
    removeLine,
    setLineComment,
    clearCart,
    goToCheckout,
  } = useCustomerOrder();

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Pizzeria Il Forno • Onlinebeställning
                </h1>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Välj rätter, lägg kommentar per rad och gå vidare till checkout.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 px-4 py-2 ring-1 ring-amber-200">
                <div className="text-xs font-semibold text-amber-900">
                  Totalt
                </div>
                <div className="text-lg font-extrabold text-amber-950">
                  {money(total)}
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

          {/* Sök */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <label className="sr-only">Sök i hela menyn</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Sök i hela menyn…"
                className={cx(
                  "w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-900",
                  "ring-1 ring-slate-300 placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-amber-500"
                )}
              />
            </div>

            <Button
              variant="ghost"
              onClick={() => setQ("")}
              disabled={!q.trim()}
              title="Rensa sök"
            >
              Rensa
            </Button>
          </div>

          {/* Kategori-tabs */}
          <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto pb-1">
            {CATEGORY_ORDER.map((cat) => {
              const active = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setQ("");
                  }}
                  className={cx(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 transition",
                    active
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {cat}
                  <span className={cx("ml-2 text-xs opacity-80")}>
                    {categoryCounts[cat] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
          {/* MENY */}
          <Card className="p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-slate-900 truncate">
                  {isSearching ? "Sökresultat" : activeCategory}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {isSearching
                    ? "Visar träffar i hela menyn."
                    : "Tryck “Lägg till” för att lägga en rad i varukorgen."}
                </p>
              </div>
              <div className="text-sm font-semibold text-slate-600">
                {filteredMenu.length} st
              </div>
            </div>

            {filteredMenu.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
                <div className="text-lg font-semibold text-slate-900">
                  Inget hittades
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Testa att söka på ett annat ord eller rensa sök.
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredMenu.map((item) => {
                  const count = qtyById[item.id] ?? 0;
                  const anchor = `item-${slugify(item.id)}`;

                  return (
                    <li
                      key={item.id}
                      id={anchor}
                      className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {typeof item.no === "number" ? (
                              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
                                {item.no}
                              </span>
                            ) : null}

                            <div className="font-extrabold text-slate-900 truncate">
                              {item.name}
                            </div>

                            {isSearching ? (
                              <span className="ml-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
                                {item.category}
                              </span>
                            ) : null}
                          </div>

                          {item.desc ? (
                            <div className="mt-1 text-sm text-slate-600">
                              {item.desc}
                            </div>
                          ) : null}

                          {tagBadges(item.tags)}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <div className="text-lg font-extrabold text-slate-900">
                            {money(item.price)}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeOne(item.id)}
                              disabled={count === 0}
                              className={cx(
                                "h-10 w-10 rounded-xl bg-white ring-1 ring-slate-300 hover:bg-slate-50",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                                count === 0 && "opacity-50 cursor-not-allowed"
                              )}
                              aria-label={`Ta bort en ${item.name}`}
                              title={count === 0 ? "Inget att ta bort" : "Ta bort en"}
                            >
                              −
                            </button>

                            <div className="w-8 text-center font-extrabold text-slate-900">
                              {count}
                            </div>

                            <button
                              onClick={() => addToCart(item.id)}
                              className="h-10 w-10 rounded-xl bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              aria-label={`Lägg till en ${item.name}`}
                              title="Lägg till"
                            >
                              +
                            </button>
                          </div>

                          <Button
                            onClick={() => addToCart(item.id)}
                            variant="secondary"
                            className="mt-1"
                            title="Lägg en rad i varukorgen"
                          >
                            Lägg till
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* VARUKORG */}
          <Card className="p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-slate-900 truncate">
                  Varukorg
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Varje rad kan ha egen kommentar.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={clearCart}
                disabled={cartLines.length === 0}
                title="Töm varukorgen"
              >
                Töm
              </Button>
            </div>

            {cartLines.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
                <div className="text-lg font-semibold text-slate-900">
                  Tom varukorg
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Lägg till något från menyn så dyker det upp här.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div
                    key={line.uid}
                    className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900">
                          {line.item.name}
                        </div>
                        <div className="mt-0.5 text-sm text-slate-600">
                          {money(line.item.price)}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        onClick={() => removeLine(line.uid)}
                        title="Ta bort raden"
                      >
                        Ta bort
                      </Button>
                    </div>

                    <div className="mt-3">
                      <label className="text-xs font-bold text-slate-700">
                        Kommentar (valfritt)
                      </label>
                      <input
                        value={line.comment}
                        onChange={(e) =>
                          setLineComment(line.uid, e.target.value)
                        }
                        placeholder="Ex: utan lök, extra sås…"
                        className={cx(
                          "mt-1 w-full rounded-2xl bg-white px-4 py-2 text-sm text-slate-900",
                          "ring-1 ring-slate-300 placeholder:text-slate-400",
                          "focus:outline-none focus:ring-2 focus:ring-amber-500"
                        )}
                      />
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-amber-900">
                      Totalt
                    </div>
                    <div className="text-xl font-extrabold text-amber-950">
                      {money(total)}
                    </div>
                  </div>

                  <Button
                    onClick={goToCheckout}
                    variant="primary"
                    className="mt-4 w-full py-3"
                    title="Gå vidare till checkout"
                  >
                    Beställ
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
