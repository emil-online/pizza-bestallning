// lib/elks.ts (server only)
export async function sendSms46elks(opts: { to: string; message: string }) {
  const user = process.env.ELKS_USER!;
  const pass = process.env.ELKS_PASS!;
  const from = process.env.ELKS_FROM!; // t.ex. "PizzeriaX" eller ett 46elks-nummer

  if (!user || !pass || !from) throw new Error("Missing 46elks env vars");

  const res = await fetch("https://api.46elks.com/a1/sms", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${user}:${pass}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      to: opts.to,        // E.164: +4670...
      from,               // alfanamn eller nummer
      message: opts.message,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`46elks error ${res.status}: ${text}`);
  return JSON.parse(text);
}
