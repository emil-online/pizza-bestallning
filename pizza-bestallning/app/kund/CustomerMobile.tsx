"use client";

import { useMemo, useRef } from "react";
import { CATEGORY_ORDER, money, useCustomerOrder } from "./useCustomerOrder";
import { Button, Card, cx, tagBadges } from "./ui";

export default function CustomerMobile() {
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

  const cartRef = useRef<HTMLDivElement | null>(null);

  function scrollToCart() {
    cartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        "min-h-screen bg-gradient-to-b from-amber-50 to-white pb-36"
      )}
      style={{
        fontFamily:
          "Rubik, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'",
      }}
    >
      {/* TOPPDEL (INTE sticky) */}
      <div className="border-b border-slate-200/70 bg-white/90">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <div className="text-base font-extrabold text-slate-900 leading-tight truncate tracking-[-0.01em]">
                  Alsike Pizzeria Il Forno
                </div>

                {/* ✅ NYTT: trust-rad med Swish + inga avgifter */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <img
                      src="/swish-logo.png"
                      alt="Swish"
                      className="h-4 w-4"
                      loading="lazy"
                    />
                    <span className="font-semibold text-slate-700">
                      Betala säkert med Swish
                    </span>
                  </span>

                  <span className="text-slate-300">•</span>

                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-emerald-600">✓</span>
                    <span className="font-semibold text-slate-700">
                      Inga extra avgifter
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Höger: Totalt */}
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-amber-100 px-3 py-2 ring-1 ring-amber-200">
                <div className="text-[10px] font-semibold text-amber-900">
                  Totalt
                </div>
                <div className="text-base font-extrabold text-amber-950 tabular-nums tracking-[-0.01em]">
                  {money(total)}
                </div>
              </div>
            </div>
          </div>

          {/* Kategorier (INTE sticky) */}
          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto pb-1">
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
        </div>
      </div>

      {/* ENDAST SÖKFÄLTET sticky */}
      <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
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

      <div className="px-4 py-4 space-y-4">
        {/* MENY */}
        <Card className="p-4">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-slate-900 truncate tracking-[-0.01em]">
                {isSearching ? "Sökresultat" : activeCategory}
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                {isSearching ? "Träffar i hela menyn." : "Tryck + / − för antal."}
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600 tabular-nums">
              {filteredMenu.length} st
            </div>
          </div>

          {filteredMenu.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200">
              <div className="text-sm font-semibold text-slate-900">
                Inget hittades
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Testa annat ord eller rensa sök.
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredMenu.map((item) => {
                const count = qtyById[item.id] ?? 0;

                return (
                  <li
                    key={item.id}
                    className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {typeof item.no === "number" ? (
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 tabular-nums">
                              {item.no}
                            </span>
                          ) : null}
                          <div className="font-extrabold text-slate-900 truncate tracking-[-0.01em]">
                            {item.name}
                          </div>
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
                        <div className="text-sm font-extrabold text-slate-900 tabular-nums tracking-[-0.01em]">
                          {money(item.price)}
                        </div>

                        <div className="mt-2 flex items-center gap-2 justify-end">
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

                          <div className="w-6 text-center font-extrabold text-slate-900 tabular-nums">
                            {count}
                          </div>

                          <button
                            onClick={() => addToCart(item.id)}
                            className="h-10 w-10 rounded-xl bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 active:scale-[0.98] transition"
                            aria-label={`Lägg till en ${item.name}`}
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

        {/* VARUKORG */}
        <div ref={cartRef}>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-[-0.01em]">
                  Varukorg
                </h2>
                <p className="text-xs text-slate-600">Kommentar per rad.</p>
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
              <div className="rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200">
                <div className="text-sm font-semibold text-slate-900">
                  Tom varukorg
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Lägg till något från menyn.
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
                        <div className="font-extrabold text-slate-900 tracking-[-0.01em]">
                          {line.item.name}
                        </div>
                        <div className="mt-0.5 text-sm text-slate-600 tabular-nums">
                          {money(line.item.price)}
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
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Flytande varukorgsknapp */}
      {cartCount > 0 && (
        <button
          onClick={scrollToCart}
          className={cx(
            "fixed z-50",
            "right-4 bottom-24",
            "h-14 w-14 rounded-full",
            "bg-amber-600 text-white shadow-lg shadow-amber-600/20",
            "ring-1 ring-amber-700/40",
            "flex items-center justify-center",
            "active:scale-[0.98] transition",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ring-offset-white"
          )}
          title="Gå till varukorgen"
          aria-label="Gå till varukorgen"
        >
          <span className="text-xl">🛒</span>
          <span
            className={cx(
              "absolute -top-1 -right-1",
              "min-w-6 h-6 px-1.5",
              "rounded-full bg-white text-amber-700",
              "text-[12px] font-extrabold tabular-nums",
              "flex items-center justify-center",
              "ring-2 ring-amber-600"
            )}
          >
            {cartCount}
          </span>
        </button>
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="flex items-start gap-3">
            {/* Totalt */}
            <div className="shrink-0">
              <div className="text-xs font-semibold text-slate-600">Totalt</div>
              <div className="text-lg font-extrabold text-slate-900 tabular-nums tracking-[-0.01em]">
                {money(total)}
              </div>
            </div>

            {/* Alla varor */}
            <div className="flex-1">
              {cartLines.length === 0 ? (
                <div className="text-[11px] text-slate-500">
                  Varukorgen är tom
                </div>
              ) : (
                <div className="flex flex-wrap items-start gap-x-2 gap-y-1 text-[11px] leading-snug text-slate-700">
                  {cartSummaryParts.map((part, i) => (
                    <span key={`${part}-${i}`} className="whitespace-nowrap">
                      {part}
                      {i < cartSummaryParts.length - 1 ? " •" : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Beställ */}
            <Button
              onClick={goToCheckout}
              variant="primary"
              disabled={cartLines.length === 0}
              className="py-3 px-6 shrink-0"
              title={cartLines.length === 0 ? "Lägg till något först" : "Gå vidare"}
            >
              Beställ
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
