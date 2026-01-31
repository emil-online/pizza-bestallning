// lib/openingHours.ts
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const HOURS: Record<DayKey, { open: string; close: string }> = {
  mon: { open: "10:30", close: "21:00" },
  tue: { open: "10:30", close: "21:00" },
  wed: { open: "10:30", close: "21:00" },
  thu: { open: "10:30", close: "21:00" },
  fri: { open: "10:30", close: "21:00" },
  sat: { open: "11:30", close: "21:00" },
  sun: { open: "11:30", close: "21:00" },
};

// Sista tid då en order får läggas (gäller alla dagar)
const LAST_ORDER_TIME = "20:45";

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function getStockholmNowParts() {
  const now = new Date();
  const stockholm = new Date(
    now.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })
  );

  const dow = stockholm.getDay(); // 0=sön ... 6=lör
  const map: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayKey = map[dow];

  const minutesNow = stockholm.getHours() * 60 + stockholm.getMinutes();
  return { dayKey, minutesNow };
}

/**
 * Öppet för beställning = efter öppningstid och innan LAST_ORDER_TIME.
 * (Stängningstid finns kvar för info, men påverkar inte beställning efter cutoff.)
 */
export function isOrderOpenNowStockholm() {
  const { dayKey, minutesNow } = getStockholmNowParts();
  const { open } = HOURS[dayKey];

  const openMin = toMinutes(open);
  const lastOrderMin = toMinutes(LAST_ORDER_TIME);

  return minutesNow >= openMin && minutesNow < lastOrderMin;
}

export function orderingMessageStockholm() {
  const { dayKey, minutesNow } = getStockholmNowParts();
  const { open, close } = HOURS[dayKey];

  const openMin = toMinutes(open);
  const lastOrderMin = toMinutes(LAST_ORDER_TIME);
  const closeMin = toMinutes(close);

  if (minutesNow < openMin) {
    return `Stängt för beställning. Öppnar kl ${open}.`;
  }

  if (minutesNow >= lastOrderMin) {
    // efter cutoff: visa info om stängning också
    if (minutesNow < closeMin) {
      return `Stängt för beställning efter kl ${LAST_ORDER_TIME}`;
    }

    // efter stängning: nästa dag
    const order: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const idx = order.indexOf(dayKey);
    const next = order[(idx + 1) % 7];
    return `Stängt just nu. Öppnar imorgon kl ${HOURS[next].open}.`;
  }

  return `Öppet för beställning. Sista beställning kl ${LAST_ORDER_TIME}.`;
}
