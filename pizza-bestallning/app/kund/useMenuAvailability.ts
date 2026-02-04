"use client";

import { useEffect, useState } from "react";

export type AvailabilityMap = Record<string, boolean>;

export function useMenuAvailability() {
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  async function refreshAvailability() {
    try {
      const res = await fetch("/api/menu/availability", { cache: "no-store" });
      if (!res.ok) return;
      const map = (await res.json()) as AvailabilityMap;
      setAvailability(map || {});
    } catch {
      // ignore
    } finally {
      setLoadingAvailability(false);
    }
  }

  useEffect(() => {
    refreshAvailability();

    // valfritt: poll så att kundsidan uppdateras om personalen markerar "slut"
    const t = window.setInterval(refreshAvailability, 15000);
    return () => window.clearInterval(t);
  }, []);

  return { availability, loadingAvailability, refreshAvailability };
}
