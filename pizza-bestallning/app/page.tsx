"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MenuCategory =
  | "Pizzor med skinka"
  | "Köttfärspizzor"
  | "Vegetariska pizzor"
  | "Skaldjurspizzor"
  | "Inbakade pizzor"
  | "Salamipizzor"
  | "Gyrospizzor"
  | "Kebab & rätter"
  | "Kyckling"
  | "Mexikanska pizzor"
  | "Oxfilé & fläskfilé"
  | "Halvinbakad"
  | "Parma & ruccola"
  | "Pasta"
  | "Sallader";

type MenuItem = {
  id: string;
  category: MenuCategory;
  no?: number; // meny-nummer (om det finns)
  name: string;
  desc?: string;
  price: number;
  tags?: Array<"Stark" | "Vegetarisk" | "Skaldjur" | "Kebab" | "Inbakad">;
};

type CartItem = {
  uid: string; // unik per rad (per pizza/rätt)
  itemId: string;
  comment: string; // kommentar per rad
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** -------- UI helpers -------- */
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
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
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
      type={type}
      onClick={onClick}
      className={cx(base, variants[variant], className)}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "veg" | "hot" | "kebab" | "sea";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    veg: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
    hot: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
    kebab: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    sea: "bg-sky-100 text-sky-900 ring-1 ring-sky-200",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function money(n: number) {
  return `${n} kr`;
}
/** ---------------------------- */

/**
 * Meny baserad på pizzeriailfornoialsike.se/pizzor.php
 * (Priser & rubriker) :contentReference[oaicite:1]{index=1}
 */
const MENU: MenuItem[] = [
  // Pizzor med skinka
  {
    id: "1-margherita",
    category: "Pizzor med skinka",
    no: 1,
    name: "Margherita",
    desc: "ost",
    price: 130,
  },
  { id: "2-vesuvio", category: "Pizzor med skinka", no: 2, name: "Vesuvio", desc: "skinka", price: 130 },
  { id: "3-funghi", category: "Pizzor med skinka", no: 3, name: "Funghi", desc: "champinjoner", price: 130 },
  { id: "4-rivuera", category: "Pizzor med skinka", no: 4, name: "Rivuera", desc: "räkor, champinjoner", price: 135, tags: ["Skaldjur"] },
  { id: "5-hawaii", category: "Pizzor med skinka", no: 5, name: "Hawaii", desc: "skinka, ananas", price: 130 },
  { id: "6-la-bussola", category: "Pizzor med skinka", no: 6, name: "La Bussola", desc: "skinka, räkor", price: 135, tags: ["Skaldjur"] },
  { id: "7-opera", category: "Pizzor med skinka", no: 7, name: "Opera", desc: "skinka, tonfisk", price: 130 },
  { id: "8-capricciosa", category: "Pizzor med skinka", no: 8, name: "Capricciosa", desc: "skinka, champinjoner", price: 130 },
  { id: "9-banana", category: "Pizzor med skinka", no: 9, name: "Banana", desc: "skinka, banan, curry", price: 130 },
  { id: "10-florida", category: "Pizzor med skinka", no: 10, name: "Florida", desc: "skinka, banan, ananas, curry", price: 140 },
  { id: "11-vera", category: "Pizzor med skinka", no: 11, name: "Vera", desc: "skinka, champinjoner, räkor, paprika, lök", price: 145, tags: ["Skaldjur"] },
  { id: "12-bella", category: "Pizzor med skinka", no: 12, name: "Bella", desc: "skinka, champinjoner, räkor", price: 140, tags: ["Skaldjur"] },
  { id: "13-husets-gratinerad", category: "Pizzor med skinka", no: 13, name: "Husets (gratinerad)", desc: "skinka, champinjoner, räkor, paprika, lök", price: 145, tags: ["Skaldjur"] },
  { id: "14-gorgonzola", category: "Pizzor med skinka", no: 14, name: "Gorgonzola", desc: "skinka, färska tomater, lök, gorgonzola", price: 140 },
  { id: "15-quatro-stagioni", category: "Pizzor med skinka", no: 15, name: "Quatro Stagioni", desc: "skinka, räkor, champinjoner, musslor, kronärtskocka, oliver", price: 145, tags: ["Skaldjur"] },
  { id: "16-piloten", category: "Pizzor med skinka", no: 16, name: "Piloten", desc: "skinka, bacon, lök, oliver", price: 135 },

  // Köttfärs
  { id: "17-annelis-special", category: "Köttfärspizzor", no: 17, name: "Annelis special", desc: "skinka, köttfärs, ananas", price: 140 },
  { id: "18-caramba", category: "Köttfärspizzor", no: 18, name: "Caramba", desc: "köttfärs, champinjoner, lök, bearnaisesås", price: 145 },
  { id: "19-helins-special", category: "Köttfärspizzor", no: 19, name: "Helins special", desc: "köttfärs, bacon, lök", price: 140 },
  { id: "20-oriantale", category: "Köttfärspizzor", no: 20, name: "Oriantale", desc: "köttfärs, champinjoner, lök, svartpeppar, ägg", price: 140 },
  { id: "21-bolognese", category: "Köttfärspizzor", no: 21, name: "Bolognese", desc: "köttfärs, champinjoner, lök", price: 135 },

  // Vegetariska
  { id: "22-vegetariana", category: "Vegetariska pizzor", no: 22, name: "Pizza vegetariana", desc: "champinjoner, lök, paprika, ananas, oliver, kronärtskocka", price: 140, tags: ["Vegetarisk"] },
  { id: "23-olympos", category: "Vegetariska pizzor", no: 23, name: "Olympos", desc: "fetaost, lök, feferoni, oliver", price: 140, tags: ["Vegetarisk"] },
  { id: "24-treviso", category: "Vegetariska pizzor", no: 24, name: "Treviso", desc: "mozzarella, fetaost, soltorkade tomater, pressad vitlök", price: 145, tags: ["Vegetarisk"] },
  { id: "25-quattro-formaggio", category: "Vegetariska pizzor", no: 25, name: "Quattro Formaggio", desc: "pizzaost, fetaost, mozzarella, gorgonzola", price: 145, tags: ["Vegetarisk"] },
  { id: "26-carpresse", category: "Vegetariska pizzor", no: 26, name: "Carpresse", desc: "mozzarella, lök, oliver, färsk tomat, pesto", price: 145, tags: ["Vegetarisk"] },
  { id: "27-rostica", category: "Vegetariska pizzor", no: 27, name: "Rostica", desc: "mozzarella, feferoni, färsk tomat, pesto", price: 135, tags: ["Vegetarisk"] },
  { id: "28-il-forno-special", category: "Vegetariska pizzor", no: 28, name: "Il Forno special", desc: "ej pizzaost, champinjoner, fetaost, lök, färsk tomat, paprika, ruccola", price: 140, tags: ["Vegetarisk"] },

  // Skaldjur
  { id: "29-al-tono", category: "Skaldjurspizzor", no: 29, name: "Al tono", desc: "tonfisk, lök", price: 130, tags: ["Skaldjur"] },
  { id: "30-torshalla", category: "Skaldjurspizzor", no: 30, name: "Torshälla", desc: "tonfisk, räkor", price: 135, tags: ["Skaldjur"] },
  { id: "31-milos", category: "Skaldjurspizzor", no: 31, name: "Milo`s", desc: "tonfisk, paprika, lök, oliver, pesto", price: 140, tags: ["Skaldjur"] },
  { id: "32-marinara", category: "Skaldjurspizzor", no: 32, name: "Marinara", desc: "räkor, musslor", price: 135, tags: ["Skaldjur"] },
  { id: "33-vastkustspecial", category: "Skaldjurspizzor", no: 33, name: "Västkustspecial", desc: "tonfisk, räkor, musslor, sardeller", price: 145, tags: ["Skaldjur"] },

  // Inbakade pizzor
  { id: "34-calzone", category: "Inbakade pizzor", no: 34, name: "Calzone", desc: "skinka", price: 135, tags: ["Inbakad"] },
  { id: "35-calzone-special", category: "Inbakade pizzor", no: 35, name: "Calzone special", desc: "skinka, räkor, champinjoner", price: 145, tags: ["Inbakad", "Skaldjur"] },

  // Salamipizzor
  { id: "36-salame", category: "Salamipizzor", no: 36, name: "Salame", desc: "salami", price: 135 },
  { id: "37-milano", category: "Salamipizzor", no: 37, name: "Milano", desc: "salami, lök, paprika", price: 140 },
  { id: "38-parma", category: "Salamipizzor", no: 38, name: "Parma", desc: "salami, gorgonzola", price: 140 },
  { id: "39-peperoni", category: "Salamipizzor", no: 39, name: "Peperoni", desc: "salami, feferoni", price: 140 },

  // Gyrospizzor
  { id: "40-gyros", category: "Gyrospizzor", no: 40, name: "Gyros", desc: "gyros, lök, feferoni, tzatziki", price: 145 },
  { id: "41-gyros-special", category: "Gyrospizzor", no: 41, name: "Gyros special", desc: "gyros, champinjoner, lök, feferoni, tzatziki", price: 150 },

  // Kebab & rätter
  { id: "42-kebabpizza", category: "Kebab & rätter", no: 42, name: "Kebabpizza", desc: "kebabkött, lök, feferoni, kebabsås", price: 150, tags: ["Kebab"] },
  { id: "43-kebabpizza-special", category: "Kebab & rätter", no: 43, name: "Kebabpizza special", desc: "kebabkött, champinjoner, lök, feferoni, kebabsås", price: 155, tags: ["Kebab"] },
  { id: "44-kebabrulle", category: "Kebab & rätter", no: 44, name: "Kebabrulle", desc: "kebabkött, sallad, tomat, gurka, lök, feferoni, kebabsås", price: 135, tags: ["Kebab"] },
  { id: "45-kebabtallrik", category: "Kebab & rätter", no: 45, name: "Kebabtallrik", desc: "kebabkött, pommes, sallad, tomat, gurka, lök, feferoni, kebabsås", price: 155, tags: ["Kebab"] },
  { id: "46-kebabrulle-brod", category: "Kebab & rätter", no: 46, name: "Kebabrulle (bröd)", desc: "kebabkött, sallad, tomat, gurka, lök, feferoni, kebabsås", price: 135, tags: ["Kebab"] },

  // Kyckling
  { id: "47-kycklingpizza", category: "Kyckling", no: 47, name: "Kycklingpizza", desc: "kyckling, lök, feferoni, vitlökssås", price: 150 },
  { id: "48-kycklingpizza-special", category: "Kyckling", no: 48, name: "Kycklingpizza special", desc: "kyckling, champinjoner, lök, feferoni, vitlökssås", price: 155 },
  { id: "49-kycklingrulle", category: "Kyckling", no: 49, name: "Kycklingrulle", desc: "kyckling, sallad, tomat, gurka, lök, feferoni, vitlökssås", price: 135 },
  { id: "50-kycklingtallrik", category: "Kyckling", no: 50, name: "Kycklingtallrik", desc: "kyckling, pommes, sallad, tomat, gurka, lök, feferoni, vitlökssås", price: 155 },

  // Mexikanska pizzor
  { id: "51-mexicana", category: "Mexikanska pizzor", no: 51, name: "Mexicana", desc: "taco kryddad köttfärs, lök, jalapeño, tacosås", price: 145, tags: ["Stark"] },
  { id: "52-mexicana-special", category: "Mexikanska pizzor", no: 52, name: "Mexicana special", desc: "taco kryddad köttfärs, lök, jalapeño, tacosås, nachochips", price: 150, tags: ["Stark"] },

  // Oxfilé & fläskfilé
  { id: "53-oxfile", category: "Oxfilé & fläskfilé", no: 53, name: "Oxfilépizza", desc: "oxfilé, lök, champinjoner, bearnaisesås", price: 165 },
  { id: "54-flaskfile", category: "Oxfilé & fläskfilé", no: 54, name: "Fläskfilépizza", desc: "fläskfilé, lök, champinjoner, bearnaisesås", price: 165 },

  // Halvinbakad
  { id: "55-halvinbakad", category: "Halvinbakad", no: 55, name: "Halvinbakad", desc: "skinka, champinjoner, räkor", price: 150, tags: ["Skaldjur"] },

  // Parma & ruccola
  { id: "56-parma-ruccola", category: "Parma & ruccola", no: 56, name: "Parma & ruccola", desc: "parmaskinka, ruccola, färska tomater, parmesan", price: 165 },

  // Pasta
  { id: "57-pasta-bolognese", category: "Pasta", no: 57, name: "Pasta Bolognese", desc: "klassisk köttfärssås", price: 145 },
  { id: "58-pasta-carbonara", category: "Pasta", no: 58, name: "Pasta Carbonara", desc: "bacon, grädde", price: 145 },

  // Sallader
  { id: "59-grekisk-sallad", category: "Sallader", no: 59, name: "Grekisk sallad", desc: "fetaost, oliver, grönsaker", price: 135, tags: ["Vegetarisk"] },
  { id: "60-kycklingsallad", category: "Sallader", no: 60, name: "Kycklingsallad", desc: "kyckling, grönsaker", price: 145 },
];

const CATEGORY_ORDER: MenuCategory[] = [
  "Pizzor med skinka",
  "Köttfärspizzor",
  "Vegetariska pizzor",
  "Skaldjurspizzor",
  "Inbakade pizzor",
  "Salamipizzor",
  "Gyrospizzor",
  "Kebab & rätter",
  "Kyckling",
  "Mexikanska pizzor",
  "Oxfilé & fläskfilé",
  "Halvinbakad",
  "Parma & ruccola",
  "Pasta",
  "Sallader",
];

function tagBadges(tags?: MenuItem["tags"]) {
  if (!tags?.length) return null;

  const mapTone: Record<string, "neutral" | "veg" | "hot" | "kebab" | "sea"> = {
    Stark: "hot",
    Vegetarisk: "veg",
    Skaldjur: "sea",
    Kebab: "kebab",
    Inbakad: "neutral",
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.map((t) => (
        <Badge key={t} tone={mapTone[t] ?? "neutral"}>
          {t}
        </Badge>
      ))}
    </div>
  );
}

export default function Page() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<MenuCategory>(
    CATEGORY_ORDER[0]
  );
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const cartLines = useMemo(() => {
    return cart
      .map((c) => ({
        ...c,
        item: MENU.find((m) => m.id === c.itemId),
      }))
      .filter((x) => Boolean(x.item)) as Array<CartItem & { item: MenuItem }>;
  }, [cart]);

  const total = useMemo(() => {
    return cartLines.reduce((sum, l) => sum + l.item.price, 0);
  }, [cartLines]);

  function addToCart(itemId: string) {
    setCart((prev) => [...prev, { uid: uid(), itemId, comment: "" }]);
  }

  function removeOne(itemId: string) {
    setCart((prev) => {
      const index = prev.findIndex((c) => c.itemId === itemId);
      if (index === -1) return prev;
      const realIndex = index;
      return prev.filter((_, i) => i !== realIndex);
    });
  }

  function removeLine(cartUid: string) {
    setCart((prev) => prev.filter((x) => x.uid !== cartUid));
  }

  function setLineComment(cartUid: string, comment: string) {
    setCart((prev) =>
      prev.map((x) => (x.uid === cartUid ? { ...x, comment } : x))
    );
  }

  function clearCart() {
    setCart([]);
  }

  function goToCheckout() {
    if (cartLines.length === 0) return;

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

  // Snabb justering (+/- per sort)
  const qtyById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of cart) m[c.itemId] = (m[c.itemId] ?? 0) + 1;
    return m;
  }, [cart]);

  const isSearching = q.trim().length > 0;

  const filteredMenu = useMemo(() => {
    const query = q.trim().toLowerCase();

    // Om du inte söker: visa bara aktuell kategori.
    // Om du söker: sök i hela menyn (alla kategorier).
    const base = query
      ? MENU
      : MENU.filter((it) => it.category === activeCategory);

    if (!query) return base;

    return base.filter((it) => {
      // Inkludera även kategori i sökningen så man kan söka på t.ex. "pasta"
      const hay = `${it.no ?? ""} ${it.name} ${it.desc ?? ""} ${it.category}`.toLowerCase();
      return hay.includes(query);
    });
  }, [activeCategory, q]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of MENU) m[it.category] = (m[it.category] ?? 0) + 1;
    return m;
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                  🍕
                </div>
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
                <div className="text-xs font-semibold text-amber-900">Totalt</div>
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
                {cartLines.map((line, idx) => (
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
                        onChange={(e) => setLineComment(line.uid, e.target.value)}
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

            {/* Enkel sammanställning längst ned */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-sm font-extrabold text-slate-900">
                Snabböversikt
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {Object.keys(qtyById).filter((k) => (qtyById[k] ?? 0) > 0).length === 0 ? (
                  "Inget valt än."
                ) : (
                  <ul className="space-y-1">
                    {MENU.filter((m) => (qtyById[m.id] ?? 0) > 0).map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate">
                          {m.name}
                        </span>
                        <span className="shrink-0 font-bold">
                          x{qtyById[m.id] ?? 0}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
