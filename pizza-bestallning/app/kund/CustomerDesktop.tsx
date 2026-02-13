"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CATEGORY_ORDER, money, useCustomerOrder } from "./useCustomerOrder";
import { Button, Card, cx, tagBadges } from "./ui";
import { useMenuAvailability } from "./useMenuAvailability";

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

  // ✅ NYTT: hämta "slut/tillgänglig" från admin
  const { availability } = useMenuAvailability();

  function isAvailableNow(itemId: string) {
    // saknas i DB => tillgänglig
    return availability[itemId] !== false;
  }

  const cartSummaryParts = useMemo(() => {
    if (!cartLines.length) return [];
    const counts = new Map<string, number>();
    for (const line of cartLines) {
      const name = line.item?.name ?? "Okänd";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, qty]) => `${qty}× ${name}`);
  }, [cartLines]);

  const cartCount = cartLines.length;

  return (
    <main
      className={cx(
        "font-sans [font-feature-settings:'ss01','cv02','cv03','cv04','cv11']",
        "min-h-screen bg-gradient-to-b from-amber-50 to-white"
      )}
      style={{
        fontFamily:
          "Rubik, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'",
      }}
    >
      {/* TOPPDEL */}
      <div className="border-b border-slate-200/70 bg-white/90">
        <div className="mx-auto max-w-6xl px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="text-2xl font-extrabold text-slate-900 leading-tight tracking-[-0.01em]">
                Alsike Pizzeria Il Forno
              </div>

              {/* trust-rad */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <img
                    src="/swish-logo.png"
                    alt="Swish"
                    className="h-5 w-5"
                    loading="lazy"
                  />
                  <span className="font-semibold text-slate-700">
                    Betala säkert med Swish
                  </span>
                </span>

                <span className="text-slate-300">•</span>

                <span className="inline-flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span className="font-semibold text-slate-700">
                    Inga extra avgifter
                  </span>
                </span>
              </div>
            </div>

            {/* Snabb-info om varukorg */}
            <div className="hidden md:flex items-center gap-3">
              <div className="rounded-2xl bg-white ring-1 ring-slate-200 px-4 py-3">
                <div className="text-xs font-semibold text-slate-600">
                  Varukorg
                </div>
                <div className="mt-1 flex items-end gap-3">
                  <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {money(total)}
                  </div>
                  <div className="text-sm font-semibold text-slate-600">
                    ({cartCount} st)
                  </div>
                </div>
              </div>
              <Button
                onClick={goToCheckout}
                variant="primary"
                disabled={cartLines.length === 0}
                className="py-3 px-6"
                title={
                  cartLines.length === 0 ? "Lägg till något först" : "Gå vidare"
                }
              >
                Beställ
              </Button>
            </div>
          </div>

          {/* Kategorier */}
          <div className="mt-5 flex flex-wrap gap-2">
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
                    "rounded-full px-4 py-2 text-sm font-bold ring-1 transition",
                    "tracking-[-0.01em]",
                    active
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {cat}
                  <span className="ml-2 text-xs opacity-80 tabular-nums">
                    {categoryCounts[cat] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SÖK */}
          <div className="mt-4 flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sök i hela menyn…"
              className={cx(
                "w-full rounded-2xl bg-white px-4 py-3 text-base text-slate-900",
                "ring-1 ring-slate-300 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-amber-500",
                "tracking-[-0.01em]"
              )}
            />
            <Button
              variant="ghost"
              onClick={() => setQ("")}
              disabled={!q.trim()}
              className="px-3"
              title="Rensa sök"
            >
              Rensa
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* MENY */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card className="p-5">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-slate-900 truncate tracking-[-0.01em]">
                    {isSearching ? "Sökresultat" : activeCategory}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {isSearching
                      ? "Träffar i hela menyn."
                      : "Tryck + / − för antal."}
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-600 tabular-nums">
                  {filteredMenu.length} st
                </div>
              </div>

              {filteredMenu.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
                  <div className="text-sm font-semibold text-slate-900">
                    Inget hittades
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Testa annat ord eller rensa sök.
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredMenu.map((item) => {
                    const count = qtyById[item.id] ?? 0;
                    const availableNow = isAvailableNow(item.id);

                    return (
                      <li
                        key={item.id}
                        className={cx(
                          "rounded-2xl p-5 ring-1 ring-slate-200",
                          availableNow ? "bg-white" : "bg-slate-50 opacity-70"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {typeof item.no === "number" ? (
                                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 tabular-nums">
                                  {item.no}
                                </span>
                              ) : null}

                              <div className="text-base font-extrabold text-slate-900 truncate tracking-[-0.01em]">
                                {item.name}
                              </div>

                              {!availableNow && (
                                <span className="shrink-0 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-800 ring-1 ring-rose-200">
                                  Ej tillgänglig
                                </span>
                              )}
                            </div>

                            {item.desc ? (
                              <div className="mt-1 text-sm text-slate-600">
                                {item.desc}
                              </div>
                            ) : null}

                            {tagBadges(item.tags)}
                          </div>

                          {/* Pris + kontroller */}
                          <div className="shrink-0 text-right">
                            <div className="text-base font-extrabold text-slate-900 tabular-nums tracking-[-0.01em]">
                              {money(item.price)}
                            </div>

                            <div className="mt-3 flex items-center gap-2 justify-end">
                              <button
                                onClick={() => removeOne(item.id)}
                                disabled={count === 0}
                                className={cx(
                                  "h-10 w-10 rounded-xl bg-white ring-1 ring-slate-300 hover:bg-slate-50",
                                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                                  "active:scale-[0.98] transition",
                                  count === 0 && "opacity-50 cursor-not-allowed"
                                )}
                                aria-label={`Ta bort en ${item.name}`}
                              >
                                −
                              </button>

                              <div className="w-8 text-center font-extrabold text-slate-900 tabular-nums">
                                {count}
                              </div>

                              <button
                                onClick={() => {
                                  if (!availableNow) return;
                                  addToCart(item.id);
                                }}
                                disabled={!availableNow}
                                className={cx(
                                  "h-10 w-10 rounded-xl text-white transition active:scale-[0.98]",
                                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                                  availableNow
                                    ? "bg-amber-600 hover:bg-amber-700"
                                    : "bg-slate-300 cursor-not-allowed"
                                )}
                                aria-label={`Lägg till en ${item.name}`}
                                title={
                                  availableNow
                                    ? `Lägg till ${item.name}`
                                    : "Produkten är ej tillgänglig just nu"
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* VARUKORG (sticky) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-6">
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-[-0.01em]">
                      Varukorg
                    </h2>
                    <p className="text-sm text-slate-600">
                      Kommentera för specifik produkt
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={clearCart}
                    disabled={cartLines.length === 0}
                    className="px-3"
                    title="Töm varukorgen"
                  >
                    Töm
                  </Button>
                </div>

                {cartLines.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">
                      Tom varukorg
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Lägg till något från menyn.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartLines.map((line) => {
                      const availableNow = isAvailableNow(line.itemId);
                      const isFree = line.item.price === 0;

                      return (
                        <div
                          key={line.uid}
                          className={cx(
                            "rounded-2xl p-4 ring-1 ring-slate-200",
                            !availableNow && !isFree ? "bg-rose-50/40" : "bg-white"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-extrabold text-slate-900 tracking-[-0.01em]">
                                  {line.item.name}
                                </div>

                                {!availableNow && !isFree && (
                                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-extrabold text-rose-800 ring-1 ring-rose-200">
                                    Ej tillgänglig
                                  </span>
                                )}

                                {isFree && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-900 ring-1 ring-emerald-200">
                                    Ingår
                                  </span>
                                )}
                              </div>

                              <div className="mt-0.5 text-sm text-slate-600 tabular-nums">
                                {line.item.price === 0 ? "Gratis" : money(line.item.price)}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              onClick={() => removeLine(line.uid)}
                              className="px-3"
                              title="Ta bort raden"
                            >
                              Ta bort
                            </Button>
                          </div>

                          <div className="mt-3">
                            <label className="text-xs font-bold text-slate-700">
                              Kommentar
                            </label>
                            <input
                              value={line.comment}
                              onChange={(e) =>
                                setLineComment(line.uid, e.target.value)
                              }
                              placeholder="Ex: utan lök"
                              className={cx(
                                "mt-1 w-full rounded-2xl bg-white px-4 py-2 text-base text-slate-900",
                                "ring-1 ring-slate-300 placeholder:text-slate-400",
                                "focus:outline-none focus:ring-2 focus:ring-amber-500",
                                "tracking-[-0.01em]"
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Totalt + beställ */}
                <div className="mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                  <div className="px-4 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Totalt
                      </span>
                      <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                        {money(total)}
                      </span>
                    </div>

                    {/* sammanfattning */}
                    {cartSummaryParts.length > 0 && (
                      <div className="text-xs text-slate-600 leading-snug">
                        {cartSummaryParts.map((part, i) => (
                          <span key={`${part}-${i}`} className="whitespace-nowrap">
                            {part}
                            {i < cartSummaryParts.length - 1 ? " • " : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={goToCheckout}
                      variant="primary"
                      disabled={cartLines.length === 0}
                      className="w-full py-3 text-base"
                      title={
                        cartLines.length === 0
                          ? "Lägg till något först"
                          : "Gå vidare"
                      }
                    >
                      Beställ
                    </Button>

                    <div className="pt-1 flex items-center justify-center">
                      <Link
                        href="/policy"
                        className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-700"
                      >
                        Integritetspolicy
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
