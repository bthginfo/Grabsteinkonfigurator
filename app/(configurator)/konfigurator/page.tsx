import { createDraftAndRedirect } from "@/lib/actions/draft-actions";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const steps = ["Modell", "Naturstein", "Inschrift", "Ausstattung", "Anfrage"];

export default function KonfiguratorStartPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100svh-7rem)] w-full max-w-7xl overflow-hidden rounded-lg border border-[#cfd7d2] bg-white shadow-[0_22px_65px_rgba(25,38,31,0.1)] lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
      <section className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#17624b]">Neuer Entwurf</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-normal text-[#17201c] sm:text-5xl">Ihr Grabmal Schritt für Schritt gestalten</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#626a65]">
            Form, Naturstein, Inschrift und Grabanlage werden als gemeinsamer 3D-Entwurf gespeichert.
          </p>
          <form action={createDraftAndRedirect} className="mt-8">
            <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#17624b] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#104736] active:translate-y-px">
              Entwurf beginnen <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-7 flex max-w-xl items-start gap-3 text-sm leading-6 text-[#626a65]">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#17624b]" aria-hidden="true" />
            Unverbindlich und automatisch gespeichert. Maße, Material und Friedhofsvorgaben werden vor der Fertigung fachlich geprüft.
          </p>
        </div>
      </section>

      <aside className="flex flex-col justify-center border-t border-[#d6ddd8] bg-[#eaf0ec] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#17624b]">Konfiguration</p>
          <ol className="mt-6 divide-y divide-[#cbd5cf]">
            {steps.map((step, index) => (
              <li key={step} className="flex min-h-14 items-center gap-4 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white text-xs font-bold tabular-nums text-[#17624b] shadow-sm">{index + 1}</span>
                <span className="text-base font-semibold text-[#26312b]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </main>
  );
}
