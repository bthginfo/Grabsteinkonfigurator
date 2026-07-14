import { createDraftAndRedirect } from "@/lib/actions/draft-actions";

const steps = ["Modell", "Naturstein", "Inschrift", "Ausstattung", "Anfrage"];

export default function KonfiguratorStartPage() {
  return (
    <main className="grid min-h-[calc(100svh-8.5rem)] overflow-hidden border border-[#d9ddda] bg-white lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <section className="flex flex-col justify-between p-6 sm:p-10 lg:p-14">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.17em] text-[#17624b]">
            <span className="h-px w-8 bg-[#17624b]" /> Neuer Entwurf
          </p>
          <h1 className="font-display mt-6 text-4xl leading-tight text-[#202421] sm:text-5xl">Gestalten Sie ein persönliches Grabmal.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#626a65]">
            Wählen Sie Form, Stein und Inschrift in Ruhe aus. Ihr Entwurf wird automatisch gespeichert und kann jederzeit über seinen persönlichen Link fortgesetzt werden.
          </p>
          <form action={createDraftAndRedirect} className="mt-8">
            <button type="submit" className="inline-flex min-h-12 items-center justify-center bg-[#17624b] px-6 text-sm font-semibold text-white transition hover:bg-[#104736] active:translate-y-px">
              Neuen Entwurf beginnen <span aria-hidden="true" className="ml-3">→</span>
            </button>
          </form>
        </div>
        <p className="mt-12 max-w-lg border-l-2 border-[#b99a55] pl-4 text-sm leading-6 text-[#626a65]">
          Die Konfiguration ist unverbindlich. Vor der Fertigung prüft ein Steinmetzbetrieb Material, Maße und Friedhofsvorgaben persönlich mit Ihnen.
        </p>
      </section>

      <aside className="flex flex-col justify-between bg-[#202421] p-6 text-white sm:p-10 lg:p-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#d9c590]">Ihr Weg zum Entwurf</p>
          <ol className="mt-8 divide-y divide-white/15">
            {steps.map((step, index) => (
              <li key={step} className="flex min-h-16 items-center gap-5 py-3">
                <span className="text-xs font-semibold tabular-nums text-[#d9c590]">0{index + 1}</span>
                <span className="font-display text-xl text-white/95">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-10 border-t border-white/15 pt-6 text-sm leading-6 text-white/65">
          <p className="font-semibold text-white">Was Sie benötigen</p>
          <p className="mt-1">Etwa 10 Minuten Zeit. Alle Angaben können später noch geändert werden.</p>
        </div>
      </aside>
    </main>
  );
}
