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

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "new" | "cooking" | "done" }) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    new: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    cooking: "bg-sky-100 text-sky-900 ring-1 ring-sky-200",
    done: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200",
  };
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: DbOrder["status"] }) {
  if (status === "Ny") return <Badge tone="new">Ny</Badge>;
  if (status === "Tillagas") return <Badge tone="cooking">Tillagas</Badge>;
  if (status === "Klar") return <Badge tone="done">Klar</Badge>;
  return <Badge tone="neutral">{status}</Badge>;
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
  const [remember, setRemember] = useState(true);
  const [pinError, setPinError] = useState("");

  function submitPin() {
    if (pin === ADMIN_PIN) {
      setPinError("");
      if (remember) localStorage.setItem(ADMIN_AUTH_KEY, "1");
      else localStorage.removeItem(ADMIN_AUTH_KEY);
      setPin("");
      onAuthed();
      return;
    }
    setPinError("Fel PIN. Försök igen.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center">
            <span className="text-xl">🛠️</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Admin
          </h1>
          <p className="mt-2 text-slate-600">
            Logga in med PIN för att se och hantera beställningar.
          </p>
        </div>

        <Card className="p-6">
          <label className="block text-sm font-semibold text-slate-800">
            PIN
          </label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="1234"
            className={cx(
              "mt-2 w-full rounded-xl bg-white px-4 py-3 text-lg text-slate-900",
              "ring-1 ring-slate-300 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-amber-500"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPin();
            }}
          />

          <div className="mt-4 flex items-center gap-3">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="remember" className="text-sm text-slate-700">
              Kom ihåg mig på den här enheten
            </label>
          </div>

          {pinError && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
              {pinError}
            </div>
          )}

          <Button onClick={submitPin} variant="primary" className="mt-6 w-full py-3 text-base">
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

  const visible = useMemo(
    () => (showArchive ? archived : orders),
    [showArchive, archived, orders]
  );

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

    // 🔔 Pling vid NYA ordrar (efter första laddningen)
    if (initialLoadedRef.current) {
      const prevIds = lastSeenIdsRef.current;
      const hasNew = activeSafe.some((o) => !prevIds.has(o.id));
      if (hasNew) {
        const audio = new Audio(NEW_ORDER_SOUND);
        audio.play().catch(() => {});
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
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);

    if (error) {
      alert("Kunde inte uppdatera status: " + error.message);
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setArchived((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
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
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    const t = window.setInterval(fetchOrders, 15000);

    return () => {
      supabase.removeChannel(ch);
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Topbar */}
      <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Admin • Orderlista
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {showArchive ? "Arkiverade ordrar" : "Aktiva ordrar"} • Supabase
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

          {/* Reserverar ALLTID plats så listan inte hoppar */}
          {!loading && (
            <div
              className={cx(
                "mt-3 h-5 text-sm text-slate-500 transition-opacity",
                refreshing ? "opacity-100" : "opacity-0"
              )}
            >
              Uppdaterar…
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
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
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center">
              <span className="text-xl">🧾</span>
            </div>
            <div className="text-slate-700 font-semibold">
              {showArchive ? "Inga arkiverade ordrar ännu." : "Inga ordrar ännu."}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Nya ordrar dyker upp här automatiskt.
            </div>
          </div>
        )}

        <div className="space-y-4">
          {!loading &&
            visible.map((o) => {
              const items: { name: string; qty: number; comment?: string }[] =
                Array.isArray(o.items) ? o.items : [];
              const time = formatTimeFromIso(o.created_at);

              const isNew = !showArchive && o.status === "Ny";

              return (
                <Card
                  key={o.id}
                  className={cx(
                    "p-5",
                    isNew && "ring-2 ring-amber-300 bg-amber-50/40"
                  )}
                >
                  {!showArchive && (
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">Order</span>{" "}
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
                    <div className="text-lg font-bold text-slate-900">
                      Status
                    </div>
                    <StatusBadge status={o.status} />
                    {isNew && <Badge tone="new">NY</Badge>}
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {o.customer_name ?? "Kund"}
                    </span>{" "}
                    <span className="text-slate-400">•</span>{" "}
                    {o.customer_phone ?? "—"}
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <div className="font-semibold text-slate-900">Innehåll</div>

                    <ul className="mt-3 space-y-2">
                      {items.map((it, idx) => (
                        <li
                          key={idx}
                          className="rounded-xl bg-white p-3 ring-1 ring-slate-200"
                        >
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
                        </li>
                      ))}
                    </ul>

                    {typeof o.total === "number" && (
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={() => setStatus(o.id, "Tillagas")} variant="secondary">
                        Tillagas
                      </Button>
                      <Button onClick={() => setStatus(o.id, "Klar")} variant="primary">
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
