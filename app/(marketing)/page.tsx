import Link from "next/link";
import { MonumentPreview } from "@/components/preview/MonumentPreview";
import type { MonumentDraft } from "@/lib/config/monument-schema";

const example: MonumentDraft = {
  schemaVersion: 1,
  grabtyp: "einzelgrab",
  form: "stele",
  material: "granit_grau",
  surface: "poliert",
  heightCm: 90,
  widthCm: 48,
  depthCm: 12,
  inscription: {
    name: "Maria Muster",
    dates: "* 1942  † 2025",
    epitaph: "In liebevoller Erinnerung",
    font: "antiqua",
    alignment: "mittig",
  },
  engravingFinish: "vergoldet",
};

const benefits = [
  ["01", "In Ruhe gestalten", "Fünf verständliche Schritte führen von der Grundform bis zur fertigen Anfrage."],
  ["02", "Entscheidungen sehen", "Form, Stein und Inschrift erscheinen unmittelbar am dreidimensionalen Entwurf."],
  ["03", "Transparent planen", "Der Richtpreis passt sich nachvollziehbar an Maße, Material und Ausstattung an."],
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col bg-white">
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-[#c8cac5]">
        <div className="marketing-monument absolute inset-0">
          <MonumentPreview draft={example} orderId="beispiel" hero downloadEnabled={false} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,25,22,0.02)_0%,rgba(20,25,22,0.08)_39%,rgba(20,25,22,0.88)_59%,rgba(20,25,22,0.96)_100%)] sm:bg-[linear-gradient(90deg,rgba(20,25,22,0.82)_0%,rgba(20,25,22,0.55)_38%,rgba(20,25,22,0.04)_72%)]" />
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-end px-4 pb-7 pt-20 sm:items-center sm:px-6 sm:pb-24">
          <div className="max-w-xl text-white">
            <p className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9c590] sm:mb-5 sm:text-xs">
              <span className="h-px w-8 bg-[#b99a55]" />
              Digitales Steinatelier
            </p>
            <h1 className="font-display text-[2.15rem] leading-[1.08] sm:text-5xl lg:text-6xl">Ein Grabmal, das der Erinnerung gerecht wird.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/80 sm:mt-6 sm:text-lg sm:leading-7">
              Gestalten Sie Form, Naturstein und Inschrift in Ihrem Tempo. Sie sehen jede Entscheidung direkt und erhalten einen transparenten Richtpreis für die persönliche Beratung.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:gap-3">
              <Link href="/konfigurator" className="inline-flex min-h-12 items-center justify-center bg-[#17624b] px-6 text-sm font-semibold text-white transition hover:bg-[#104736]">
                Gestaltung beginnen <span aria-hidden="true" className="ml-3">→</span>
              </Link>
              <span className="text-sm text-white/70">Unverbindlich · Entwurf jederzeit fortsetzen</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 right-6 z-10 hidden border-l border-white/30 pl-4 text-xs leading-5 text-white/70 lg:block">
          Interaktive 3D-Vorschau<br />Ziehen zum Drehen
        </div>
      </section>

      <section className="border-b border-[#d9ddda] bg-[#f4f5f3]">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#d9ddda] px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
          {benefits.map(([number, title, description]) => (
            <div key={number} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0 lg:py-10">
              <div className="flex gap-4">
                <span className="pt-0.5 text-xs font-semibold tabular-nums text-[#9b7a3c]">{number}</span>
                <div>
                  <h2 className="font-display text-xl text-[#202421]">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#626a65]">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 border-y border-[#d9ddda] py-10 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#17624b]">Vom Entwurf zur Beratung</p>
            <h2 className="font-display mt-3 text-3xl leading-tight text-[#202421]">Ihr Entwurf bleibt persönlich und unverbindlich.</h2>
            <p className="mt-3 text-sm leading-6 text-[#626a65]">Ein Steinmetzbetrieb prüft Naturstein, Fundament und örtliche Vorgaben, bevor ein verbindliches Angebot entsteht.</p>
          </div>
          <Link href="/konfigurator" className="inline-flex min-h-12 shrink-0 items-center border border-[#202421] px-5 text-sm font-semibold text-[#202421] hover:border-[#17624b] hover:text-[#17624b]">
            Zum Konfigurator <span aria-hidden="true" className="ml-3">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
