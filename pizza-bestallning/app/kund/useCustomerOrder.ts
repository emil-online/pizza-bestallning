"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type MenuCategory =
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

export type MenuItem = {
  id: string;
  category: MenuCategory;
  no?: number;
  name: string;
  desc?: string;
  price: number;
  tags?: Array<"Stark" | "Vegetarisk" | "Skaldjur" | "Kebab" | "Inbakad">;
};

export type CartItem = {
  uid: string;
  itemId: string;
  comment: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function money(n: number) {
  return `${n} kr`;
}

export const MENU: MenuItem[] = [
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

export const CATEGORY_ORDER: MenuCategory[] = [
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

export function useCustomerOrder() {
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
      return prev.filter((_, i) => i !== index);
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

  const qtyById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of cart) m[c.itemId] = (m[c.itemId] ?? 0) + 1;
    return m;
  }, [cart]);

  const isSearching = q.trim().length > 0;

  const filteredMenu = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query ? MENU : MENU.filter((it) => it.category === activeCategory);
    if (!query) return base;

    return base.filter((it) => {
      const hay = `${it.no ?? ""} ${it.name} ${it.desc ?? ""} ${it.category}`.toLowerCase();
      return hay.includes(query);
    });
  }, [activeCategory, q]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of MENU) m[it.category] = (m[it.category] ?? 0) + 1;
    return m;
  }, []);

  return {
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
  };
}
