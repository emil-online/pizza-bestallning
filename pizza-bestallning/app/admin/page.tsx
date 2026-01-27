"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type DbOrder = {
  id: string; // uuid
  created_at: string; // timestamptz
  status: "Ny" | "Tillagas" | "Klar" | string;
  customer_name: string | null;
  customer_phone: string | null;
  items: { name: string; qty: number }[] | any; // jsonb
  total: number | null;
  archived_at: string | null;
};

const ADMIN_PIN = "12345";
const NEW_ORDER_SOUND =
  "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

function formatTimeFromIso(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  function tryLogin() {
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setPinError("Fel kod");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h1 className="mb-1 text-2xl font-bold text-center text-gray-900">
          Admininloggning
        </h1>
        <p className="mb-5 text-center text-sm text-slate-600">
          Ange din kod för att se orderlistan.
        </p>

        <label className="mb-2 block text-sm font-medium text-gray-800">
          Kod
        </label>
        <input
          type="password"
          placeholder="•••••"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            if (pinError) setPinError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") tryLogin();
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />

        {pinError && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {pinError}
          </div>
        )}

        <button
          onClick={tryLogin}
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-800"
        >
          Logga in
        </button>

        <div className="mt-4 text-center text-xs text-slate-500">
          Tips: koden är 12345 (MVP)
        </div>
      </div>
    </main>
  );
}

function AdminInner() {
  const [showArchive, setShowArchive] = useState(false);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [archived, setArchived] = useState<DbOrder[]>([]);

  // Första laddningen (visar "Laddar...")
  const [loading, setLoading] = useState(true);
  // Bakgrundsuppdatering (visar diskret text utan layout shift)
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

    // Pling vid NYA ordrar (bara efter första laddningen)
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

    // Fallback: poll mer sällan
    const t = window.setInterval(fetchOrders, 15000);

    return () => {
      supabase.removeChannel(ch);
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function statusBadge(status: DbOrder["status"]) {
    if (status === "Ny") {
      return (
        <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-1 text-xs font-bold border border-blue-200">
          NY
        </span>
      );
    }
    if (status === "Tillagas") {
      return (
        <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-1 text-xs font-bold border border-amber-200">
          TILLAGAS
        </span>
      );
    }
    if (status === "Klar") {
      return (
        <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-1 text-xs font-bold border border-emerald-200">
          KLAR
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 text-slate-800 px-2.5 py-1 text-xs font-bold border border-slate-200">
        {status}
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin – Orderlista
            </h1>
            <p className="mt-1 text-slate-600">
              {showArchive ? "Arkiverade ordrar" : "Aktiva ordrar"} (Supabase)
            </p>
          </div>

          <button
            onClick={() => setShowArchive((s) => !s)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-slate-50"
          >
            {showArchive ? "Visa aktiva" : "Visa arkiv"}
          </button>
        </div>

        {/* Reserv: listan hoppar inte */}
        {!loading && (
          <div
            className={`mt-3 h-5 text-sm text-slate-600 transition-opacity ${
              refreshing ? "opacity-100" : "opacity-0"
            }`}
          >
            Uppdaterar…
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-2xl bg-white p-4 text-slate-700 shadow-sm border border-slate-200">
            Laddar...
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="mt-10 text-center text-slate-600">
            {showArchive ? "Inga arkiverade ordrar ännu." : "Inga ordrar ännu."}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {visible.map((o) => {
            const items: { name: string; qty: number }[] = Array.isArray(o.items)
              ? o.items
              : [];
            const time = formatTimeFromIso(o.created_at);

            const isNew = !showArchive && o.status === "Ny";

            return (
              <div
                key={o.id}
                className={`relative rounded-2xl p-5 shadow-sm border ${
                  isNew
                    ? "bg-white border-blue-200"
                    : "bg-white border-slate-200"
                }`}
              >
                {!showArchive && (
                  <button
                    onClick={() => archiveOrder(o.id)}
                    className="absolute right-3 top-3 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm text-gray-900 hover:bg-slate-50"
                    title="Arkivera order"
                  >
                    Arkivera
                  </button>
                )}

                <div className="text-sm text-slate-600">Order • {time}</div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="text-lg font-semibold text-gray-900">
                    Status: {o.status}
                  </div>
                  {statusBadge(o.status)}
                </div>

                <div className="mt-2 text-sm text-slate-700">
                  <span className="font-medium text-gray-900">
                    {o.customer_name ?? "Kund"}
                  </span>{" "}
                  • {o.customer_phone ?? "—"}
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="font-semibold text-gray-900">Innehåll</div>
                  <ul className="mt-2 space-y-1 text-slate-800">
                    {items.map((it, idx) => (
                      <li key={idx}>
                        <span className="font-semibold text-gray-900">
                          {it.qty}×
                        </span>{" "}
                        {it.name}
                      </li>
                    ))}
                  </ul>

                  {typeof o.total === "number" && (
                    <div className="mt-3 text-sm text-slate-700">
                      Totalt:{" "}
                      <span className="font-semibold text-gray-900">
                        {o.total} kr
                      </span>
                    </div>
                  )}
                </div>

                {!showArchive && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatus(o.id, "Tillagas")}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-gray-900 font-medium hover:bg-slate-50"
                    >
                      Tillagas
                    </button>
                    <button
                      onClick={() => setStatus(o.id, "Klar")}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-gray-900 font-medium hover:bg-slate-50"
                    >
                      Klar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <AdminLogin onSuccess={() => setIsLoggedIn(true)} />;
  }

  return <AdminInner />;
}
