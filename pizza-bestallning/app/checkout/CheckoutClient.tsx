"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import jsPDF from "jspdf";

type PendingOrder = {
  createdAt?: string;
  items: { name: string; price: number; comment?: string; qty: number }[];
  total?: number;

  // kunduppgifter
  customerName?: string;
  customerPhone?: string;
};

type ReceiptData = {
  createdAt: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; price: number; comment?: string; qty: number }[];
  subtotal: number;
  serviceFee: number;
  total: number;
  receiptNo: string;
};

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

/**
 * ✅ Lägg din Swish PNG i:
 *   /public/swish-logo.png
 *
 * Då laddas den som: /swish-logo.png
 * Om den inte hittas → fallback till text "Swish" (så du slipper tom kapsel).
 */
function SwishBadge({ className }: { className?: string }) {
  const [ok, setOk] = useState(true);

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md bg-white/90 px-2 py-1",
        className
      )}
    >
      {ok ? (
        <img
          src="/swish-logo.png"
          alt="Swish"
          className="h-5 w-auto"
          draggable={false}
          onError={() => setOk(false)}
        />
      ) : (
        <span className="text-xs font-extrabold text-slate-900">Swish</span>
      )}
    </span>
  );
}

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Enkel normalisering till E.164 för svenska nummer.
 */
function normalizePhoneSE(input: string): string | null {
  const raw = (input || "").trim().replace(/\s+/g, "").replace(/-/g, "");
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const ok = /^\+\d{8,15}$/.test(raw);
    return ok ? raw : null;
  }

  if (raw.startsWith("0046")) {
    const rest = raw.slice(4);
    if (!/^\d+$/.test(rest)) return null;
    return "+46" + rest;
  }

  if (raw.startsWith("46")) {
    const rest = raw.slice(2);
    if (!/^\d+$/.test(rest)) return null;
    return "+46" + rest;
  }

  if (raw.startsWith("07") && /^\d+$/.test(raw)) {
    return "+46" + raw.slice(1);
  }

  return null;
}

const SERVICE_FEE_NAME = "Serviceavgift il forno";
const SERVICE_FEE = 3;

function makeReceiptNo(createdAtISO: string) {
  const d = new Date(createdAtISO);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const da = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const se = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);
  return `${y}${mo}${da}-${h}${mi}${se}-${ms}`;
}

function normalizeOrder(order: PendingOrder) {
  const items = (order.items ?? [])
    .map((it) => ({
      name: String(it?.name ?? "").trim(),
      price: safeNumber(it?.price, 0),
      qty: Math.max(1, Math.floor(safeNumber(it?.qty, 1))),
      comment: String(it?.comment ?? ""),
    }))
    .filter((it) => it.name.length > 0 && it.price > 0 && it.qty > 0);

  const itemsWithoutFee = items.filter((it) => it.name !== SERVICE_FEE_NAME);

  const computedSubtotal = itemsWithoutFee.reduce(
    (sum, it) => sum + it.price * it.qty,
    0
  );

  const computedTotal = computedSubtotal + SERVICE_FEE;

  const createdAt = order.createdAt ?? new Date().toISOString();

  return {
    createdAt,
    items: itemsWithoutFee,
    subtotal: computedSubtotal,
    serviceFee: SERVICE_FEE,
    total: computedTotal,
    customerName: String(order.customerName ?? "").trim(),
    customerPhone: String(order.customerPhone ?? "").trim(),
    receiptNo: makeReceiptNo(createdAt),
  };
}

function formatMoney(n: number) {
  return `${n} kr`;
}

function generateReceiptPdf(receipt: ReceiptData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const left = 15;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("KVITTO - IL FORNO", left, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Kvittonummer: ${receipt.receiptNo}`, left, y);

  y += 5;
  doc.text(
    `Datum: ${new Date(receipt.createdAt).toLocaleString("sv-SE")}`,
    left,
    y
  );

  y += 5;
  if (receipt.customerName) doc.text(`Namn: ${receipt.customerName}`, left, y);
  if (receipt.customerPhone) {
    y += 5;
    doc.text(`Telefon: ${receipt.customerPhone}`, left, y);
  }

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Specifikation", left, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const pageBottom = 280;

  const addLine = (textLeft: string, textRight: string) => {
    if (y > pageBottom) {
      doc.addPage();
      y = 18;
    }
    doc.text(textLeft, left, y);
    doc.text(textRight, 195, y, { align: "right" });
    y += 5;
  };

  receipt.items.forEach((it) => {
    addLine(`${it.qty}× ${it.name}`, formatMoney(it.price * it.qty));
    const c = (it.comment ?? "").trim();
    if (c) addLine(`  Kommentar: ${c}`, "");
  });

  addLine(SERVICE_FEE_NAME, formatMoney(receipt.serviceFee));

  y += 3;
  doc.setDrawColor(200);
  doc.line(left, y, 195, y);
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Totalt", left, y);
  doc.text(formatMoney(receipt.total), 195, y, { align: "right" });

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Tack för din beställning!", left, y);

  doc.save(`kvitto-il-forno-${receipt.receiptNo}.pdf`);
}

function ReceiptPreview({ receipt }: { receipt: ReceiptData }) {
  return (
    <div className="mt-4 rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden">
      <div className="px-4 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Kvitto</div>
            <div className="mt-1 text-xs text-slate-600">
              Kvittonummer:{" "}
              <span className="font-semibold">{receipt.receiptNo}</span>
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Datum:{" "}
              <span className="font-semibold">
                {new Date(receipt.createdAt).toLocaleString("sv-SE")}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-600">Totalt</div>
            <div className="text-lg font-extrabold text-slate-900">
              {formatMoney(receipt.total)}
            </div>
          </div>
        </div>

        {(receipt.customerName || receipt.customerPhone) && (
          <div className="mt-3 grid gap-1 text-xs text-slate-700">
            {receipt.customerName && (
              <div>
                Namn:{" "}
                <span className="font-semibold">{receipt.customerName}</span>
              </div>
            )}
            {receipt.customerPhone && (
              <div>
                Telefon:{" "}
                <span className="font-semibold">{receipt.customerPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <div className="text-xs font-bold text-slate-700 mb-2">
          Specifikation
        </div>

        <div className="divide-y divide-slate-100">
          {receipt.items.map((it, idx) => (
            <div key={idx} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {it.qty}× {it.name}
                  </div>
                  {!!(it.comment ?? "").trim() && (
                    <div className="mt-1 text-xs text-slate-600">
                      Kommentar:{" "}
                      <span className="font-medium">{it.comment}</span>
                    </div>
                  )}
                </div>
                <div className="text-sm font-extrabold text-slate-900 whitespace-nowrap">
                  {formatMoney(it.price * it.qty)}
                </div>
              </div>
            </div>
          ))}

          <div className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">
                {SERVICE_FEE_NAME}
              </div>
              <div className="text-sm font-extrabold text-slate-900 whitespace-nowrap">
                {formatMoney(receipt.serviceFee)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string>("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const success = params.get("success") === "true";
  const canceled = params.get("canceled") === "true";

  useEffect(() => {
    if (success) {
      try {
        const raw = sessionStorage.getItem("pendingOrder");
        if (raw) {
          const parsed = JSON.parse(raw) as PendingOrder;

          const merged: PendingOrder = {
            ...parsed,
            customerName: parsed.customerName ?? customerName,
            customerPhone: parsed.customerPhone ?? customerPhone,
          };

          const r = normalizeOrder(merged);
          sessionStorage.setItem("lastReceipt", JSON.stringify(r));
          setReceipt(r);
        } else {
          const last = sessionStorage.getItem("lastReceipt");
          if (last) setReceipt(JSON.parse(last) as ReceiptData);
        }
      } catch {
        // ignore
      }

      sessionStorage.removeItem("pendingOrder");
      setOrder(null);
      setLoading(false);
      return;
    }

    try {
      const raw = sessionStorage.getItem("pendingOrder");
      if (!raw) {
        setOrder(null);
        setLoading(false);
        return;
      }
      const parsed = JSON.parse(raw) as PendingOrder;
      setOrder(parsed);

      setCustomerName(String(parsed.customerName ?? ""));
      setCustomerPhone(String(parsed.customerPhone ?? ""));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  useEffect(() => {
    if (!order) return;
    const next: PendingOrder = { ...order, customerName, customerPhone };
    setOrder(next);
    try {
      sessionStorage.setItem("pendingOrder", JSON.stringify(next));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerName, customerPhone]);

  function setItemComment(index: number, comment: string) {
    setOrder((prev) => {
      if (!prev) return prev;
      const nextItems = prev.items.map((it, i) =>
        i === index ? { ...it, comment } : it
      );
      const next: PendingOrder = { ...prev, items: nextItems };
      try {
        sessionStorage.setItem("pendingOrder", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const normalized = useMemo(
    () => (order ? normalizeOrder(order) : null),
    [order]
  );

  const subtotal = normalized?.subtotal ?? 0;
  const serviceFee = normalized?.serviceFee ?? SERVICE_FEE;
  const total = normalized?.total ?? 0;

  async function payWithStripe() {
    setError("");

    if (success) {
      setError("Betalningen är redan genomförd. Gör en ny beställning.");
      return;
    }

    if (!order) {
      setError(
        "Ingen order hittades. Gå tillbaka och lägg något i varukorgen först."
      );
      return;
    }

    const payload = normalizeOrder(order);

    if (!payload.items.length) {
      setError("Din order är tom eller saknar giltiga produkter.");
      return;
    }
    if (!payload.total || payload.total <= 0) {
      setError("Totalt belopp saknas.");
      return;
    }

    if (!payload.customerName || payload.customerName.length < 2) {
      setError("Fyll i ditt namn (minst 2 tecken).");
      return;
    }

    const normalizedPhone = normalizePhoneSE(payload.customerPhone);
    if (!normalizedPhone) {
      setError(
        "Fyll i ett giltigt telefonnummer. Ex: 0701234567 eller +46701234567."
      );
      return;
    }

    payload.customerPhone = normalizedPhone;

    const payloadForApi: PendingOrder = {
      createdAt: payload.createdAt,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      items: [
        ...payload.items,
        { name: SERVICE_FEE_NAME, price: SERVICE_FEE, qty: 1 },
      ],
      total: payload.total,
    };

    try {
      setPaying(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadForApi),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // non-json
      }

      if (!res.ok) {
        console.error("Checkout API error:", res.status, data ?? text);
        setError(
          typeof data?.detail === "string"
            ? `Kunde inte starta betalning: ${data.detail}`
            : "Kunde inte starta betalning. Kolla terminal/console."
        );
        return;
      }

      const url = data?.url as string | undefined;
      if (!url) {
        console.error("Missing Stripe url:", data ?? text);
        setError("Stripe gav ingen betalningslänk (url saknas).");
        return;
      }

      window.location.assign(url);
    } catch (e) {
      console.error(e);
      setError("Något gick fel när betalningen startades.");
    } finally {
      setPaying(false);
    }
  }

  function backToShop() {
    router.push("/");
  }

  function downloadReceiptPdf() {
    try {
      const raw = sessionStorage.getItem("lastReceipt");
      if (!raw) {
        alert("Hittade inget kvitto att ladda ner.");
        return;
      }
      const r = JSON.parse(raw) as ReceiptData;
      generateReceiptPdf(r);
    } catch {
      alert("Kunde inte skapa kvitto-PDF.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Checkout
          </h1>
          <p className="mt-2 text-slate-600">
            Bekräfta din beställning och gå vidare till betalning.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6">
        {success && (
          <Card className="p-5 ring-1 ring-emerald-200 bg-emerald-50/50">
            <div className="text-lg font-bold text-emerald-900">
              Tack för din beställning ✅
            </div>
            <div className="mt-1 text-sm text-emerald-900/80">
              Betalningen är genomförd. Här är ditt kvitto.
            </div>

            {receipt ? (
              <>
                <Button
                  type="button"
                  onClick={downloadReceiptPdf}
                  variant="secondary"
                  className="mt-4 w-full py-3 text-base"
                >
                  Ladda ner kvitto (PDF)
                </Button>

                <ReceiptPreview receipt={receipt} />
              </>
            ) : (
              <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 text-sm text-slate-700">
                Hittade inget kvitto att visa. (Om du laddar om sidan kan
                webbläsaren ha rensat data.)
              </div>
            )}

            <Button
              type="button"
              onClick={backToShop}
              variant="primary"
              className="mt-3 w-full py-3 text-base"
            >
              Gör en ny beställning
            </Button>
          </Card>
        )}

        {canceled && (
          <Card className="p-5 ring-1 ring-amber-200 bg-amber-50/50">
            <div className="text-lg font-bold text-amber-900">
              Betalning avbruten
            </div>
            <div className="mt-1 text-sm text-amber-900/80">
              Du kan försöka igen när du vill.
            </div>
          </Card>
        )}

        {!success && (
          <div className="mt-6 grid gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xl font-bold text-slate-900">
                    Din order
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Kontrollera innan du betalar.
                  </div>
                </div>
                <Button onClick={backToShop} variant="secondary">
                  Tillbaka
                </Button>
              </div>

              {loading ? (
                <div className="mt-4 text-slate-600">Laddar…</div>
              ) : !normalized ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                  <div className="font-semibold text-slate-900">
                    Ingen order hittades
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Gå tillbaka och lägg något i varukorgen.
                  </div>
                </div>
              ) : (
                <>
                  {/* ✅ Kontaktuppgifter: NAMN borttaget, bara telefon kvar */}
                  <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-800">
                      Mobilnummer Obligatoriskt för orderstatus via sms
                    </div>

                    <label className="grid gap-1">
                      <span className="text-xs font-semibold text-slate-700">
                        *skriv här*
                      </span>
                      <input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ex: 0701234567 eller +46701234567"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-amber-500"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                      <span className="text-xs text-slate-600">
                        Vi skickar SMS när din order tillagas och när den är
                        klar.
                      </span>
                    </label>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {normalized.items.map((it, idx) => (
                      <li
                        key={idx}
                        className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">
                              {it.qty}× {it.name}
                            </div>

                            <div className="mt-3">
                              <label className="text-xs font-bold text-slate-700">
                                Kommentar (valfritt)
                              </label>
                              <input
                                value={it.comment ?? ""}
                                onChange={(e) =>
                                  setItemComment(idx, e.target.value)
                                }
                                placeholder="Ex: utan lök"
                                className={cx(
                                  "mt-1 w-full rounded-2xl bg-white px-4 py-2 text-base text-slate-900",
                                  "ring-1 ring-slate-300 placeholder:text-slate-400",
                                  "focus:outline-none focus:ring-2 focus:ring-amber-500"
                                )}
                              />
                            </div>
                          </div>

                          <div className="font-extrabold text-slate-900 whitespace-nowrap">
                            {it.price} kr
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                    <div className="px-4 py-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">
                          Delsumma
                        </span>
                        <span className="font-semibold text-slate-900">
                          {subtotal} kr
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">
                          Serviceavgift il forno
                        </span>
                        <span className="font-semibold text-slate-900">
                          {serviceFee} kr
                        </span>
                      </div>

                      <div className="h-px bg-slate-200" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                          Totalt
                        </span>
                        <span className="text-xl font-extrabold text-slate-900">
                          {total} kr
                        </span>
                      </div>


                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-200">
                      {error}
                    </div>
                  )}

                  {/* ✅ KNAPP: Betala med + Swish PNG */}
                  <Button
                    type="button"
                    onClick={payWithStripe}
                    variant="primary"
                    className="mt-4 w-full py-3 text-base"
                    disabled={paying || !normalized}
                    title={paying ? "Öppnar Swish…" : "Betala med Swish"}
                  >
                    {paying ? (
                      "Öppnar Swish…"
                    ) : (
                      <>
                        <span>Betala med</span>
                        <SwishBadge />
                      </>
                    )}
                  </Button>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
