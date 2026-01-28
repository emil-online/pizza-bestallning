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

export default function AdminPage() {
  // ---------- PIN gate ----------
  const [isAuthed, setIsAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    const ok = localStorage.getItem(ADMIN_AUTH_KEY);
    if (ok === "1") setIsAuthed(true);
  }, []);

  function submitPin() {
    if (pin === ADMIN_PIN) {
      setIsAuthed(true);
      setPinError("");
      if (remember) localStorage.setItem(ADMIN_AUTH_KEY, "1");
      else localStorage.removeItem(ADMIN_AUTH_KEY);
      setPin("");
      return;
    }
    setPinError("Fel PIN. Försök igen.");
  }

  function logout() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthed(false);
    setPin("");
    setPinError("");
  }

  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-amber-50 p-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-amber-100">
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
            <p className="mt-1 text-slate-600">Ange PIN för att komma in.</p>

            <label className="mt-6 block text-sm font-medium text-gray-700">
              PIN
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="1234"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitPin();
              }}
            />

            <div className="mt-3 flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember" className="text-sm text-gray-700">
                Kom ihåg mig på den här enheten
              </label>
            </div>

            {pinError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {pinError}
              </div>
            )}

            <button
              onClick={submitPin}
              className="mt-5 w-full rounded-2xl bg-amber-600 px-4 py-3 text-white font-semibold hover:bg-amber-700"
            >
              Logga in
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ---------- Admin app ----------
  const [showArchive, setShowArchive] = useState(false);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [archived, setArchived] = useState<DbOrder[]>([]);

  // Första laddningen
  const [loading, setLoading] = useState(true);
  // Bakgrundsuppdatering (utan hopp)
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

    // Fallback poll
    const t = window.setInterval(fetchOrders, 15000);

    return () => {
      supabase.removeChannel(ch);
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-amber-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin – Orderlista
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchive((s) => !s)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              {showArchive ? "Visa aktiva" : "Visa arkiv"}
            </button>
            <button
              onClick={logout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              title="Logga ut"
            >
              Logga ut
            </button>
          </div>
        </div>

        <p className="mt-1 text-slate-600">
          {showArchive ? "Arkiverade ordrar" : "Aktiva ordrar"} (Supabase)
        </p>

        {/* Reserverar ALLTID plats så listan inte hoppar */}
        {!loading && (
          <div
            className={`mt-3 h-5 text-sm text-slate-500 transition-opacity ${
              refreshing ? "opacity-100" : "opacity-0"
            }`}
          >
            Uppdaterar…
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-2xl bg-white p-4 text-slate-600 shadow-sm border border-amber-100">
            Laddar...
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="mt-10 text-center text-slate-500">
            {showArchive ? "Inga arkiverade ordrar ännu." : "Inga ordrar ännu."}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {visible.map((o) => {
            const items: { name: string; qty: number; comment?: string }[] =
              Array.isArray(o.items) ? o.items : [];
            const time = formatTimeFromIso(o.created_at);

            return (
              <div
                key={o.id}
                className={`relative rounded-2xl p-5 shadow-sm border-2 ${
                  !showArchive && o.status === "Ny"
                    ? "bg-yellow-50 border-yellow-400"
                    : "bg-white border-amber-100"
                }`}
              >
                {!showArchive && (
                  <button
                    onClick={() => archiveOrder(o.id)}
                    className="absolute right-3 top-3 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
                    title="Arkivera order"
                  >
                    Arkivera
                  </button>
                )}

                <div className="text-sm text-slate-600">
                  Order • {time}
                </div>

                <div className="mt-1 text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <span>Status: {o.status}</span>
                  {!showArchive && o.status === "Ny" && (
                    <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold">
                      NY
                    </span>
                  )}
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  {(o.customer_name ?? "Kund")} • {(o.customer_phone ?? "—")}
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="font-medium text-gray-900">Innehåll</div>

                  <ul className="mt-2 space-y-2 text-slate-800">
                    {items.map((it, idx) => (
                      <li key={idx} className="rounded-xl border border-slate-200 p-3">
                        <div className="font-medium text-gray-900">
                          {it.qty}× {it.name}
                        </div>
                        {it.comment?.trim() ? (
                          <div className="mt-1 text-sm text-slate-600">
                            Kommentar: {it.comment}
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
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-sm font-semibold text-slate-700">
                        Totalt
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {o.total} kr
                      </span>
                    </div>
                  )}
                </div>

                {!showArchive && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setStatus(o.id, "Tillagas")}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50"
                    >
                      Tillagas
                    </button>
                    <button
                      onClick={() => setStatus(o.id, "Klar")}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50"
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
