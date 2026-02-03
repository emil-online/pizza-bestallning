export default function PolicyPage() {
  const updated = new Date().toLocaleDateString("sv-SE");

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Integritetspolicy
          </h1>
          <p className="mt-2 text-slate-600">
            Senast uppdaterad: <span className="font-semibold">{updated}</span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <article className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 space-y-6 text-slate-800 leading-relaxed">
          <section>
            <h2 className="text-lg font-extrabold text-slate-900">
              Alsike Pizzeria Il Forno
            </h2>
            <p className="mt-2">
              Alsike Pizzeria Il Forno värnar om din personliga integritet. Denna
              policy förklarar hur vi samlar in, använder och skyddar dina
              personuppgifter vid onlinebeställning.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">
              1. Personuppgiftsansvarig
            </h3>
            <p className="mt-2">
              <span className="font-semibold">Il Forno i Alsike AB</span>
              <br />
              Organisationsnummer: 556998-1292
              <br />
              Adress: Gränsgatan 47, 741 46 Knivsta, Sverige
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">
              2. Vilka uppgifter samlar vi in?
            </h3>
            <p className="mt-2">
              Vi samlar endast in ditt <span className="font-semibold">telefonnummer</span>{" "}
              i samband med onlinebeställning.
            </p>
            <p className="mt-2">
              Inga namn, adresser, personnummer eller betaluppgifter lagras hos oss.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">
              3. Varför samlar vi in telefonnummer?
            </h3>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Skicka SMS om orderstatus (t.ex. mottagen, tillagas, klar)</li>
              <li>Kunna kontakta dig om något gäller din beställning</li>
            </ul>
            <p className="mt-2">Telefonnumret används inte för marknadsföring.</p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">
              4. Hur länge sparas uppgifterna?
            </h3>
            <p className="mt-2">
              Telefonnumret och orderinformationen raderas automatiskt efter{" "}
              <span className="font-semibold">24 timmar</span>.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">5. Betalning</h3>
            <p className="mt-2">
              Betalning sker med <span className="font-semibold">Swish</span>. All
              betalning hanteras direkt av restaurangen. Vi lagrar inga kortuppgifter
              eller Swish-uppgifter.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">6. Cookies</h3>
            <p className="mt-2">
              Webbplatsen använder endast nödvändiga cookies för att hålla varukorgen
              aktiv och möjliggöra beställningsflödet. Vi använder inga spårnings-
              eller marknadsföringscookies.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">
              7. Delning av uppgifter
            </h3>
            <p className="mt-2">
              Vi delar inte dina personuppgifter med tredje part, förutom vad som
              krävs för att genomföra betalningen.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">8. Dina rättigheter</h3>
            <p className="mt-2">
              Du har rätt att få information om vilka uppgifter som behandlas och
              begära rättelse eller radering. Eftersom uppgifterna raderas automatiskt
              efter 24 timmar krävs normalt ingen åtgärd.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">9. Kontakt</h3>
            <p className="mt-2">
              Vid frågor om integritet eller personuppgifter, kontakta oss på plats i
              restaurangen.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
