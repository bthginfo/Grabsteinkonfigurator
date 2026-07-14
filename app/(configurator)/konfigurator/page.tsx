import { ArrowRight, CheckCircle2, Cuboid, FileText, Palette, Type } from "lucide-react";
import { createDraftAndRedirect } from "@/lib/actions/draft-actions";

const steps = [
  { icon: Cuboid, label: "Modell" },
  { icon: Palette, label: "Naturstein" },
  { icon: Type, label: "Inschrift" },
  { icon: FileText, label: "Anfrage" },
] as const;

export default function KonfiguratorStartPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-6xl flex-col justify-center py-6">
      <div className="overflow-hidden rounded-lg border border-[#d6ded9] bg-white shadow-[0_24px_70px_rgba(27,47,37,0.1)]">
        <section className="px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#12644f]">Neuer Entwurf</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-normal text-[#17231e] sm:text-5xl">Ein Grabmal konkret gestalten.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#65716b]">Form, Naturstein, Inschrift und Grabfläche werden in einer gemeinsamen 3D-Ansicht geplant. Der persönliche Entwurfslink bleibt jederzeit verfügbar.</p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <form action={createDraftAndRedirect}>
                <button type="submit" className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#12644f] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(18,100,79,0.2)] transition hover:bg-[#0c4f3e]">
                  Entwurf starten <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </form>
              <span className="inline-flex items-center gap-2 text-sm text-[#65716b]"><CheckCircle2 className="size-4 text-[#12644f]" /> Unverbindlich und automatisch gespeichert</span>
            </div>
          </div>
        </section>
        <section className="grid border-t border-[#dce2de] bg-[#f4f7f5] sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, label }, index) => (
            <div key={label} className="flex items-center gap-3 border-b border-[#dce2de] px-6 py-5 last:border-b-0 sm:border-r lg:border-b-0 lg:last:border-r-0">
              <span className="grid size-9 place-items-center rounded-md bg-white text-[#12644f] shadow-sm"><Icon className="size-4" /></span>
              <div><span className="block text-[10px] font-bold text-[#8a958f]">0{index + 1}</span><span className="text-sm font-semibold text-[#24322b]">{label}</span></div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
