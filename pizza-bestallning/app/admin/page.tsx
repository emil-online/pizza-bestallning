"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type DbOrder = {
  id: string; // uuid
  created_at: string; // timestamptz
  status: "Ny" | "Tillagas" | "Klar" | string;
  customer_name: string | null;
  customer_phone: string | null;
  items: { name: string; qty: number; comment?: string }[] | any; // jsonb
  total: number | null;
  archived_at: string | null;
};

const NEW_ORDER_SOUND =
  "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

// ✅ PIN (MVP)
const ADMIN_PIN = "1234";
const ADMIN_AUTH_KEY = "admin-auth-ok"; // localStorage key

function formatTimeFromIso(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
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
        "backdrop-blur",
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
  type = "button",
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  title?: string;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
    "transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary:
      "bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-600/10",
    secondary:
      "bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(base, variants[variant], className)}
      title={title}
      disabled={disabled}
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
  tone?: "neutral" | "new" | "cooking" | "done" | "comment";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    new: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    cooking: "bg-sky-100 text-sky-900 ring-1 ring-sky-200",
    done: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
    comment: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200",
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

function StatusBadge({ status }: { status: DbOrder["status"] }) {
  const s = String(status ?? "");
  if (s === "Ny" || s.startsWith("Ny ")) return <Badge tone="new">Ny</Badge>;
  if (s === "Klar" || s.startsWith("Klar "))
    return <Badge tone="done">Klar</Badge>;
  if (s === "Tillagas" || s.startsWith("Tillagas"))
    return <Badge tone="cooking">Tillagas</Badge>;
  return <Badge tone="neutral">{s}</Badge>;
}

function parseEtaLabel(status: string) {
  const m = status.match(/Tillagas\s*[•\-]\s*(.+)$/i);
  return m?.[1]?.trim() || "";
}

function EtaSelect({
  value,
  onSelect,
  disabled,
}: {
  value?: string;
  onSelect: (label: string) => void;
  disabled?: boolean;
}) {
  const options = [
    "5 min",
    "10 min",
    "15 min",
    "20 min",
    "25 min",
    "30 min",
    "40 min",
    "45 min",
    "50 min",
    "60 min",
    "1h+",
  ];

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-slate-600">Klar om</label>
      <select
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v) onSelect(v);
        }}
        disabled={disabled}
        className={cx(
          "h-10 rounded-xl bg-white px-3 text-sm font-semibold text-slate-900",
          "ring-1 ring-slate-300 hover:bg-slate-50",
          "focus:outline-none focus:ring-2 focus:ring-amber-500",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <option value="">Välj tid…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/** ------------------------------------------------------ */

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem(ADMIN_AUTH_KEY);
    if (ok === "1") setIsAuthed(true);
  }, []);

  function logout() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthed(false);
  }

  if (!isAuthed) {
    return <AdminLogin onAuthed={() => setIsAuthed(true)} />;
  }

  return <AdminApp onLogout={logout} />;
}

function AdminLogin({ onAuthed }: { onAuthed: () => void }) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  function submitPin() {
    setPinError(null);
    if (pin.trim() !== ADMIN_PIN) {
      setPinError("Fel PIN-kod. Försök igen.");
      return;
    }
    if (remember) localStorage.setItem(ADMIN_AUTH_KEY, "1");
    onAuthed();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
            <span className="text-2xl">🍕</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Adminsida il-forno
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Logga in med PIN för att hantera beställningar.
          </p>
        </div>

        <Card className="p-6">
          <label className="text-sm font-semibold text-slate-800">PIN-kod</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPin();
            }}
            className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-base ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="••••"
          />

          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Kom ihåg mig på den här enheten
            </label>
          </div>

          {pinError && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
              {pinError}
            </div>
          )}

          <Button
            onClick={submitPin}
            variant="primary"
            className="mt-6 w-full py-3 text-base"
          >
            Logga in
          </Button>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          Tips: Lägg gärna admin-URL:en som bokmärke på surfplatta i köket.
        </p>
      </div>
    </main>
  );
}

function AdminApp({ onLogout }: { onLogout: () => void }) {
  const [showArchive, setShowArchive] = useState(false);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [archived, setArchived] = useState<DbOrder[]>([]);

  // Första laddningen
  const [loading, setLoading] = useState(true);
  // Bakgrundsuppdatering (utan layout shift)
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const lastSeenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadedRef = useRef(false);

  // ⭐ Nytt: vilka ordrar ska "glowa" just nu (nyinkomna)
  const [glowIds, setGlowIds] = useState<Set<string>>(new Set());
  const glowTimersRef = useRef<Record<string, number>>({});

  const visible = useMemo(
    () => (showArchive ? archived : orders),
    [showArchive, archived, orders]
  );

  function addGlow(id: string) {
    setGlowIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const existing = glowTimersRef.current[id];
    if (existing) window.clearTimeout(existing);

    glowTimersRef.current[id] = window.setTimeout(() => {
      setGlowIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      delete glowTimersRef.current[id];
    }, 20000);
  }

  async function fetchOrders() {
    const firstLoad = !hasLoadedOnceRef.current;
    if (firstLoad) setLoading(true);
    else setRefreshing(true);

    const activeQ = supabase
      .from("orders")
      .select(
        "id, created_at, status, customer_name, customer_phone, items, total, archived_at"
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    const archivedQ = supabase
      .from("orders")
      .select(
        "id, created_at, status, customer_name, customer_phone, items, total, archived_at"
      )
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });

    const [{ data: active, error: activeErr }, { data: arc, error: arcErr }] =
      await Promise.all([activeQ, archivedQ]);

    if (activeErr)
      console.log("Kunde inte hämta aktiva ordrar:", activeErr.message);
    if (arcErr) console.log("Kunde inte hämta arkiv:", arcErr.message);

    const activeSafe = (active ?? []) as DbOrder[];
    const arcSafe = (arc ?? []) as DbOrder[];

    // 🔔 Pling + glow vid NYA ordrar (efter första laddningen)
    if (initialLoadedRef.current) {
      const prevIds = lastSeenIdsRef.current;
      const newOnes = activeSafe.filter((o) => !prevIds.has(o.id));

      if (newOnes.length > 0) {
        const audio = new Audio(NEW_ORDER_SOUND);
        audio.play().catch(() => {});
        newOnes.forEach((o) => addGlow(o.id));
      }
    }

    lastSeenIdsRef.current = new Set(activeSafe.map((o) => o.id));
    initialLoadedRef.current = true;

    setOrders(activeSafe);
    setArchived(arcSafe);

    hasLoadedOnceRef.current = true;
    setLoading(false);
    setRefreshing(false);
  }

  async function setStatus(id: string, status: DbOrder["status"]) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Kunde inte uppdatera status: " + error.message);
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setArchived((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  async function archiveOrder(id: string) {
    const { error } = await supabase
      .from("orders")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Kunde inte arkivera: " + error.message);
      return;
    }

    fetchOrders();
  }

  useEffect(() => {
    fetchOrders();

    const ch = supabase
      .channel("orders-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const t = window.setInterval(fetchOrders, 15000);

    return () => {
      supabase.removeChannel(ch);
      window.clearInterval(t);
      Object.values(glowTimersRef.current).forEach((id) =>
        window.clearTimeout(id)
      );
      glowTimersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <style jsx global>{`
        @keyframes orderGlow {
          0% {
            box-shadow: 0 0 0 rgba(251, 191, 36, 0);
          }
          35% {
            box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.22),
              0 0 28px rgba(251, 191, 36, 0.35);
          }
          70% {
            box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.18),
              0 0 22px rgba(251, 191, 36, 0.28);
          }
          100% {
            box-shadow: 0 0 0 rgba(251, 191, 36, 0);
          }
        }
        .order-glow {
          animation: orderGlow 1.4s ease-in-out infinite;
        }
      `}</style>

      <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                Adminsida il-forno
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {showArchive ? "Arkiverade ordrar" : "Aktiva ordrar"} •
                Orderhantering
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowArchive((s) => !s)}
                variant="secondary"
              >
                {showArchive ? "Visa aktiva" : "Visa arkiv"}
              </Button>
              <Button onClick={onLogout} variant="secondary" title="Logga ut">
                Logga ut
              </Button>
            </div>
          </div>

          {!loading && (
            <div
              className={cx(
                "mt-2 h-5 text-sm text-slate-500 transition-opacity",
                refreshing ? "opacity-100" : "opacity-0"
              )}
            >
              Uppdaterar…
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-5">
        {loading && (
          <Card className="p-5 text-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-72 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </Card>
        )}

        {!loading && visible.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
              <span className="text-xl">🧾</span>
            </div>
            <div className="font-semibold text-slate-700">
              {showArchive ? "Inga arkiverade ordrar ännu." : "Inga ordrar ännu."}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Nya ordrar dyker upp här automatiskt.
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {!loading &&
            visible.map((o) => {
              const items: { name: string; qty: number; comment?: string }[] =
                Array.isArray(o.items) ? o.items : [];
              const time = formatTimeFromIso(o.created_at);

              const isNewStatus = !showArchive && o.status === "Ny";
              const hasAnyComment = items.some((it) => !!it.comment?.trim());
              const eta = String(o.status ?? "").startsWith("Tillagas")
                ? parseEtaLabel(String(o.status))
                : "";

              const shouldGlow = !showArchive && glowIds.has(o.id);

              return (
                <Card
                  key={o.id}
                  className={cx(
                    "p-4",
                    isNewStatus && "ring-2 ring-amber-300 bg-amber-50/50",
                    shouldGlow && "order-glow"
                  )}
                >
                  {!showArchive && (
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Order
                        </span>{" "}
                        <span className="text-slate-400">•</span> {time}
                      </div>

                      <Button
                        onClick={() => archiveOrder(o.id)}
                        variant="secondary"
                        className="px-3 py-1.5"
                        title="Arkivera order"
                      >
                        Arkivera
                      </Button>
                    </div>
                  )}

                  {showArchive && (
                    <div className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">Order</span>{" "}
                      <span className="text-slate-400">•</span> {time}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="text-base font-bold text-slate-900">
                      Status
                    </div>
                    <StatusBadge status={o.status} />
                    {isNewStatus && <Badge tone="new">NY</Badge>}
                    {hasAnyComment && <Badge tone="comment">💬 Kommentar</Badge>}
                    {eta ? <Badge tone="cooking">⏱ {eta}</Badge> : null}
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {o.customer_name ?? "Kund"}
                    </span>{" "}
                    <span className="text-slate-400">•</span>{" "}
                    {o.customer_phone ?? "—"}
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <div className="font-semibold text-slate-900">Innehåll</div>

                    {/* ✅ ÄNDRING: Ingen scroll / ingen max-höjd */}
                    <ul className="mt-3 space-y-2">
                      {items.map((it, idx) => {
                        const c = it.comment?.trim();
                        return (
                          <li
                            key={idx}
                            className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                          >
                            <div className="font-semibold text-slate-900">
                              {it.qty}× {it.name}
                            </div>

                            {c ? (
                              <div className="mt-2 rounded-xl bg-yellow-50 px-3 py-2 ring-1 ring-yellow-200">
                                <div className="flex items-start gap-2">
                                  <span className="mt-0.5">💬</span>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-yellow-900">
                                      Kundkommentar
                                    </div>
                                    <div className="mt-0.5 text-sm font-semibold text-slate-900 break-words">
                                      {c}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1 text-sm text-slate-400">
                                Ingen kommentar
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {typeof o.total === "number" && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                        <span className="text-sm font-semibold text-slate-700">
                          Totalt
                        </span>
                        <span className="text-lg font-extrabold text-slate-900">
                          {o.total} kr
                        </span>
                      </div>
                    )}
                  </div>

                  {!showArchive && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <EtaSelect
                        value={eta || ""}
                        onSelect={(label) =>
                          setStatus(o.id, `Tillagas • ${label}`)
                        }
                      />
                      <Button
                        onClick={() => setStatus(o.id, "Klar")}
                        variant="primary"
                        className="h-10"
                      >
                        Klar
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      </div>
    </main>
  );
}
