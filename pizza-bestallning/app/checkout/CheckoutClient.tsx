"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PendingOrder = {
  createdAt?: string;
  items: { name: string; price: number; comment?: string; qty: number }[];
  total?: number;
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

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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

  // total kan ligga i order, men vi räknar om ifall den saknas eller är fel
  const computedTotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const givenTotal = safeNumber(order.total, computedTotal);

  return {
    createdAt: order.createdAt ?? new Date().toISOString(),
    items,
    total: givenTotal > 0 ? givenTotal : computedTotal,
  };
}

export default function CheckoutClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string>("");

  const success = params.get("success") === "true";
  const canceled = params.get("canceled") === "true";

  useEffect(() => {
    // Om betalningen lyckats: töm pending order direkt så man inte kan betala igen
    if (success) {
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
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [success]);

  const normalized = useMemo(() => (order ? normalizeOrder(order) : null), [order]);
  const total = normalized?.total ?? 0;

  async function payWithStripe() {
    setError("");

    if (success) {
      setError("Betalningen är redan genomförd. Gör en ny beställning.");
      return;
    }

    if (!order) {
      setError("Ingen order hittades. Gå tillbaka och lägg något i varukorgen först.");
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

    try {
      setPaying(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Läs text först så vi får tydlig info vid fel (inte bara {})
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // non-json svar
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
              Betalning lyckades ✅
            </div>
            <div className="mt-1 text-sm text-emerald-900/80">
              Din order är mottagen. Du kan göra en ny beställning nedan.
            </div>

            <Button
              type="button"
              onClick={backToShop}
              variant="primary"
              className="mt-4 w-full py-3 text-base"
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
                  <div className="text-xl font-bold text-slate-900">Din order</div>
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
                  <div className="font-semibold text-slate-900">Ingen order hittades</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Gå tillbaka och lägg något i varukorgen.
                  </div>
                </div>
              ) : (
                <>
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
                            {it.comment?.trim() ? (
                              <div className="mt-1 text-sm text-slate-600">
                                Kommentar:{" "}
                                <span className="text-slate-800">{it.comment}</span>
                              </div>
                            ) : (
                              <div className="mt-1 text-sm text-slate-400">
                                Ingen kommentar
                              </div>
                            )}
                          </div>
                          <div className="font-extrabold text-slate-900 whitespace-nowrap">
                            {it.price} kr
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-700">Totalt</div>
                    <div className="text-xl font-extrabold text-slate-900">
                      {total} kr
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900 ring-1 ring-rose-200">
                      {error}
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={payWithStripe}
                    variant="primary"
                    className="mt-4 w-full py-3 text-base"
                    disabled={paying || !normalized}
                    title={paying ? "Startar betalning…" : "Gå till betalning"}
                  >
                    {paying ? "Startar betalning…" : "Bekräfta beställning"}
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
