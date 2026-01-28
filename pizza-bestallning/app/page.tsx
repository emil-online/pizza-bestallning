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
  { id: "34-napolitana", category: "Skaldjurspizzor", no: 34, name: "Napolitana", desc: "sardeller, oliver", price: 130, tags: ["Skaldjur"] },

  // Inbakade
  { id: "35-calzone", category: "Inbakade pizzor", no: 35, name: "Calzone", desc: "skinka", price: 135, tags: ["Inbakad"] },
  { id: "36-calzone-bussola", category: "Inbakade pizzor", no: 36, name: "Calzone bussola", desc: "skinka, räkor", price: 140, tags: ["Inbakad", "Skaldjur"] },
  { id: "37-calzone-capricciose", category: "Inbakade pizzor", no: 37, name: "Calzone capricciose", desc: "skinka, champinjoner", price: 140, tags: ["Inbakad"] },
  { id: "38-calzone-marinara", category: "Inbakade pizzor", no: 38, name: "Calzone marinara", desc: "räkor, musslor", price: 140, tags: ["Inbakad", "Skaldjur"] },
  { id: "39-calzone-special", category: "Inbakade pizzor", no: 39, name: "Calzone special", desc: "skinka, räkor, champinjoner", price: 145, tags: ["Inbakad", "Skaldjur"] },
  { id: "40-ararat", category: "Inbakade pizzor", no: 40, name: "Ararat", desc: "köttfärs, skinka, räkor", price: 145, tags: ["Inbakad", "Skaldjur"] },
  { id: "41-ufo", category: "Inbakade pizzor", no: 41, name: "Ufo (dubbelinbakad)", desc: "skinka, räkor, champinjoner", price: 150, tags: ["Inbakad", "Skaldjur"] },
  { id: "42-calzone-dubbel", category: "Inbakade pizzor", no: 42, name: "Calzone (dubbelinbakad)", desc: "skinka", price: 140, tags: ["Inbakad"] },

  // Salami
  { id: "43-kanon", category: "Salamipizzor", no: 43, name: "Kanon", desc: "salami, bacon, ägg", price: 140 },
  { id: "44-campanjola", category: "Salamipizzor", no: 44, name: "Campanjola", desc: "salami, lök", price: 130 },
  { id: "45-cacciatore", category: "Salamipizzor", no: 45, name: "Cacciatore", desc: "salami, mozzarella, champinjoner, lök, paprika", price: 140 },
  { id: "46-felino", category: "Salamipizzor", no: 46, name: "Felino", desc: "salami, mozzarella, färsk tomat, pesto", price: 140 },
  { id: "47-peperoni", category: "Salamipizzor", no: 47, name: "Peperoni", desc: "peperonikorv, mozzarella", price: 150 },
  { id: "48-specialla", category: "Salamipizzor", no: 48, name: "Specialla", desc: "salami, mozzarella, feferoni, färsk tomat, lök", price: 140 },
  { id: "49-buffalo", category: "Salamipizzor", no: 49, name: "Buffalo", desc: "peperonikorv, mozzarella, lök, champinjoner, jalapeño, paprika, oliver", price: 155 },

  // Gyros (listan på sidan börjar om från 1)
  { id: "gyros-1-alsike-if", category: "Gyrospizzor", no: 1, name: "Alsike IF", desc: "kebabkött, isberg, lök, tomat, feferoni, vitlökssås", price: 155, tags: ["Kebab"] },
  { id: "gyros-2-disco", category: "Gyrospizzor", no: 2, name: "Disco", desc: "kebabkött, färsk tomat, paprika, stark krydda, vitlökssås", price: 145, tags: ["Kebab", "Stark"] },
  { id: "gyros-3-alsike-lagga", category: "Gyrospizzor", no: 3, name: "Alsike lagga & långhundra special", desc: "kebabkött, skinka, lök, vitlökssås", price: 145, tags: ["Kebab"] },
  { id: "gyros-4-mezopotamya", category: "Gyrospizzor", no: 4, name: "Mezopotamya", desc: "kebabkött, färsk tomat, feferoni, vitlökssås", price: 145, tags: ["Kebab"] },
  { id: "gyros-5-gyrostallrik", category: "Gyrospizzor", no: 5, name: "Gyrostallrik", desc: "gyroskebab, färsk tomat, feferoni, lök, isberg, vitlökssås", price: 145, tags: ["Kebab"] },
  { id: "gyros-6-gyrosrulle", category: "Gyrospizzor", no: 6, name: "Gyrosrulle", desc: "gyroskebab, färsk tomat, feferoni, lök, isberg, vitlökssås", price: 155, tags: ["Kebab"] },

  // Kebab & rätter
  { id: "50-kebab-i-brod", category: "Kebab & rätter", no: 50, name: "Kebab i nybakat bröd", desc: "kebabkött, isberg, tomat, lök, feferoni & såser", price: 120, tags: ["Kebab"] },
  { id: "51-kebabrulle", category: "Kebab & rätter", no: 51, name: "Kebabrulle", desc: "nybakat bröd (tunnbröd), kebabkött, isberg, lök, tomat, feferoni, såser", price: 145, tags: ["Kebab"] },
  { id: "52-kebabtallrik", category: "Kebab & rätter", no: 52, name: "Kebabtallrik", desc: "pommes eller ris, kebabkött, isberg, lök, feferoni, färsk tomat, såser", price: 145, tags: ["Kebab"] },
  { id: "53-ubat", category: "Kebab & rätter", no: 53, name: "Ubåt (halvinbakad)", desc: "kebabkött, kebabsåser, isberg, lök, feferoni, färsk tomat", price: 155, tags: ["Kebab", "Inbakad"] },
  { id: "54-kebab-viking", category: "Kebab & rätter", no: 54, name: "Kebab Viking (Inbakad)", desc: "kebabkött, kebabsåser, isberg, lök, färsk tomat, feferoni", price: 155, tags: ["Kebab", "Inbakad"] },
  { id: "55-kebabspecial", category: "Kebab & rätter", no: 55, name: "Kebabspecial", desc: "kebabkött, kebabsås, lök, färsk tomat, feferoni, isberg", price: 155, tags: ["Kebab"] },
  { id: "56-trekronor", category: "Kebab & rätter", no: 56, name: "Trekronor", desc: "kebabkött, såser, pommes", price: 160, tags: ["Kebab"] },
  { id: "57-kebabpizza", category: "Kebab & rätter", no: 57, name: "Kebabpizza", desc: "kebabkött, såser, färsk tomat, lök, feferoni", price: 145, tags: ["Kebab"] },

  // Kyckling
  { id: "58-kycklingpizza", category: "Kyckling", no: 58, name: "Kycklingpizza", desc: "kyckling, ananas, curry", price: 145 },
  { id: "59-pollo", category: "Kyckling", no: 59, name: "Pollo", desc: "kyckling, mozzarella, champinjoner, lök", price: 145 },
  { id: "60-barbeque-chicken", category: "Kyckling", no: 60, name: "Barbeque Chicken", desc: "kyckling, paprika, lök, mozzarella, barbequesås", price: 145 },
  { id: "61-tropicana", category: "Kyckling", no: 61, name: "Tropicana", desc: "kyckling, paprika, ananas, banan, curry", price: 150 },
  { id: "62-laggaspecial", category: "Kyckling", no: 62, name: "Laggaspecial", desc: "kyckling, paprika, curry, jordnötter, ananas, banan", price: 150 },
  { id: "63-kycklingrulle", category: "Kyckling", no: 63, name: "Kycklingrulle", desc: "kycklingfilé, lök, paprika, färsk tomat, isberg, sås", price: 145 },

  // Mexikanska
  { id: "64-azteka", category: "Mexikanska pizzor", no: 64, name: "Azteka", desc: "skinka, jalapeño, tacosås, kryddmix, vitlökssås", price: 145, tags: ["Stark"] },
  { id: "65-la-mare", category: "Mexikanska pizzor", no: 65, name: "La Mare", desc: "kyckling, ananas, jalapeño, kryddmix, tacosås", price: 145, tags: ["Stark"] },
  { id: "66-mexicana", category: "Mexikanska pizzor", no: 66, name: "Mexicana", desc: "köttfärs, lök, vitlök, tacosås, jalapeño, kryddmix", price: 145, tags: ["Stark"] },
  { id: "67-acapulco", category: "Mexikanska pizzor", no: 67, name: "Acapulco", desc: "oxfilé, lök, champinjoner, vitlök, jalapeño, kryddmix, tacosås", price: 160, tags: ["Stark"] },
  { id: "68-fireworks", category: "Mexikanska pizzor", no: 68, name: "Fireworks", desc: "fläskfilé, champinjoner, lök, kryddmix, tacosås, jalapeño, vitlökssås", price: 160, tags: ["Stark"] },

  // Oxfilé & fläskfilé
  { id: "69-oxfilepizza", category: "Oxfilé & fläskfilé", no: 69, name: "Oxfilépizza", desc: "oxfilé, champinjoner, färsk tomat, bearnaisesås", price: 160 },
  { id: "70-siciliana", category: "Oxfilé & fläskfilé", no: 70, name: "Siciliana", desc: "oxfilé, skinka, gorgonzola, färsk tomat, bearnaisesås", price: 160 },
  { id: "71-erkans-special", category: "Oxfilé & fläskfilé", no: 71, name: "Erkans special", desc: "oxfilé, gorgonzola, paprika, lök, bearnaisesås", price: 160 },
  { id: "72-andersson", category: "Oxfilé & fläskfilé", no: 72, name: "Andersson", desc: "oxfilé, champinjoner, räkor, bearnaisesås", price: 160, tags: ["Skaldjur"] },
  { id: "73-mafioza", category: "Oxfilé & fläskfilé", no: 73, name: "Mafioza", desc: "oxfilé, soltorkade tomater, mozzarella, färsk vitlök", price: 160 },
  { id: "74-black-white", category: "Oxfilé & fläskfilé", no: 74, name: "Black & White", desc: "oxfilé, fläskfilé, bearnaisesås", price: 160 },
  { id: "75-alsikespecial", category: "Oxfilé & fläskfilé", no: 75, name: "Alsikespecial", desc: "fläskfilé, gorgonzola, banan, curry", price: 160 },
  { id: "76-knivstaspecial", category: "Oxfilé & fläskfilé", no: 76, name: "Knivstaspecial", desc: "fläskfilé, färska champinjoner, färsk tomat, bearnaisesås", price: 160 },
  { id: "77-robins", category: "Oxfilé & fläskfilé", no: 77, name: "Robins", desc: "fläskfilé, banan, ananas, curry, jordnötter, vitlökssås", price: 160 },
  { id: "78-chefens", category: "Oxfilé & fläskfilé", no: 78, name: "Chefens", desc: "fläskfilé, champinjoner, räkor, färsk tomat, paprika, bearnaisesås", price: 160, tags: ["Skaldjur"] },

  // Halvinbakad
  { id: "79-ciao-ciao", category: "Halvinbakad", no: 79, name: "Ciao Ciao", desc: "oxfilé, champinjoner, färsk tomat, bearnaisesås", price: 160, tags: ["Inbakad"] },
  { id: "80-aladdin", category: "Halvinbakad", no: 80, name: "Aladdin", desc: "fläskfilé, champinjoner, färsk tomat, bearnaisesås", price: 160, tags: ["Inbakad"] },
  { id: "81-mezaluna", category: "Halvinbakad", no: 81, name: "Mezaluna", desc: "inbakad del: skinka & mozzarella, utbakad del: parma, ruccola, havssalt, olivolja", price: 160, tags: ["Inbakad"] },

  // Parma & ruccola
  { id: "82-parma", category: "Parma & ruccola", no: 82, name: "Parma", desc: "parmaskinka, champinjoner, färsk tomat, mozzarella", price: 160 },
  { id: "83-coxenaza", category: "Parma & ruccola", no: 83, name: "Coxenaza", desc: "parmaskinka, fetaost, oliver, soltorkade tomater", price: 160 },
  { id: "84-bagarens", category: "Parma & ruccola", no: 84, name: "Bagarens special", desc: "blåmusslor, scampi, mozzarella, vitlök, ruccola", price: 160, tags: ["Skaldjur"] },
  { id: "85-karas", category: "Parma & ruccola", no: 85, name: "Karas", desc: "scampi, kronärtskocka, sparris, oliver, mozzarella, ruccola", price: 160, tags: ["Skaldjur"] },
  { id: "86-malins", category: "Parma & ruccola", no: 86, name: "Malins special", desc: "parmaskinka, ruccola, soltorkade tomater, oliver, svartpeppar", price: 160 },
  { id: "87-diyars", category: "Parma & ruccola", no: 87, name: "Diyars special", desc: "parmaskinka, champinjoner, oliver, ruccola", price: 160 },

  // Pasta
  { id: "pasta-lasagne", category: "Pasta", name: "Lasagne al forno (hemlagad)", price: 135 },
  { id: "pasta-penne-pollo", category: "Pasta", name: "Penne Pollo", desc: "kyckling, curry, paprika, ost, grädde", price: 135 },
  { id: "pasta-gorgonzola", category: "Pasta", name: "Gorgonzola pasta", desc: "skinka, lök, gorgonzola, ost, grädde", price: 135 },
  { id: "pasta-bacon", category: "Pasta", name: "Bacon pasta", desc: "bacon, lök, svartpeppar, ost, grädde", price: 135 },
  { id: "pasta-vegetarisk", category: "Pasta", name: "Vegetarisk pasta", desc: "champinjoner, paprika, lök, ananas, kronärtskocka, ost, grädde", price: 135, tags: ["Vegetarisk"] },

  // Sallader
  { id: "sallad-1-tonfisk", category: "Sallader", no: 1, name: "Tonfisksallad", desc: "tonfisk, rödlök, oliver, citron", price: 140, tags: ["Skaldjur"] },
  { id: "sallad-2-ost-skinka", category: "Sallader", no: 2, name: "Ost- & skinksallad", desc: "ost, skinka, sparris, lök", price: 140 },
  { id: "sallad-3-grekisk", category: "Sallader", no: 3, name: "Grekisk sallad", desc: "grekisk ost, oliver, rödlök, feferoni", price: 140, tags: ["Vegetarisk"] },
  { id: "sallad-4-hawaii", category: "Sallader", no: 4, name: "Hawaii sallad", desc: "ost, skinka, ananas, sparris", price: 140 },
  { id: "sallad-5-amerikansk", category: "Sallader", no: 5, name: "Amerikansk sallad", desc: "ost, ananas, räkor, skinka, citron", price: 145, tags: ["Skaldjur"] },
  { id: "sallad-6-kyckling", category: "Sallader", no: 6, name: "Kycklingsallad", desc: "kyckling, ananas, rödlök", price: 145 },
  { id: "sallad-7-kebab", category: "Sallader", no: 7, name: "Kebabsallad", desc: "kebabkött, rödlök, feferoni", price: 145, tags: ["Kebab"] },
  { id: "sallad-8-gyros", category: "Sallader", no: 8, name: "Gyrossallad", desc: "gyroskött, rödlök, feferoni", price: 145, tags: ["Kebab"] },
  { id: "sallad-9-vastkust", category: "Sallader", no: 9, name: "Västkust sallad", desc: "ost, räkor, musslor, ägg, citron, sparris", price: 145, tags: ["Skaldjur"] },
  { id: "sallad-10-rakor", category: "Sallader", no: 10, name: "Räksallad", desc: "räkor, ägg, ost, citron", price: 145, tags: ["Skaldjur"] },
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
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.includes("Vegetarisk") && <Badge tone="veg">Vegetarisk</Badge>}
      {tags.includes("Stark") && <Badge tone="hot">Stark</Badge>}
      {tags.includes("Kebab") && <Badge tone="kebab">Kebab</Badge>}
      {tags.includes("Skaldjur") && <Badge tone="sea">Skaldjur</Badge>}
      {tags.includes("Inbakad") && <Badge>Inbakad</Badge>}
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("Pizzor med skinka");
  const [q, setQ] = useState("");

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

  const filteredMenu = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = MENU.filter((it) => it.category === activeCategory);

    if (!query) return base;

    return base.filter((it) => {
      const hay = `${it.no ?? ""} ${it.name} ${it.desc ?? ""}`.toLowerCase();
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
              <label className="sr-only">Sök i kategorin</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Sök i "${activeCategory}"…`}
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
                  {activeCategory}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tryck “Lägg till” för att lägga en rad i varukorgen.
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
                            className="px-3 py-2"
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
          <div className="space-y-4">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Varukorg</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Varje rad kan ha sin egen kommentar.
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
                    Lägg till från menyn så visas det här.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartLines.map(({ uid: lineUid, item, comment }) => (
                    <div
                      key={lineUid}
                      className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 truncate">
                            {item.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {money(item.price)}
                            {item.desc ? (
                              <>
                                <span className="mx-2 text-slate-300">•</span>
                                <span className="truncate">{item.desc}</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <Button
                          onClick={() => removeByUid(lineUid)}
                          variant="secondary"
                          className="px-3 py-2"
                          title="Ta bort just denna rad"
                        >
                          Ta bort
                        </Button>
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-800">
                          Kommentar (för just denna)
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

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-700">Totalt</div>
                    <div className="text-xl font-extrabold text-slate-900">
                      {money(total)}
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

            <Card className="p-5">
              <div className="text-sm font-extrabold text-slate-900 mb-3">
                Snabb justering (antal per sort)
              </div>

              {Object.keys(qtyById).filter((k) => (qtyById[k] ?? 0) > 0).length === 0 ? (
                <div className="text-sm text-slate-600">
                  När du lagt till något dyker det upp här för snabb +/−.
                </div>
              ) : (
                <div className="space-y-2">
                  {MENU.filter((m) => (qtyById[m.id] ?? 0) > 0).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">
                          {m.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {m.category}
                        </div>
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
              )}
            </Card>
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500">
          Priser och meny baserade på pizzerians menylista.
        </div>
      </div>
    </main>
  );
}
