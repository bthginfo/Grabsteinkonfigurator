import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Box, FileCheck2, Rotate3d, ShieldCheck } from "lucide-react";
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
  enclosure: "pflanzflaeche",
};

const steps = [
  { icon: Box, title: "Form und Anlage", text: "Grabmalform und Grundfläche unabhängig kombinieren." },
  { icon: Rotate3d, title: "Direkt in 3D", text: "Material, Inschrift und Ausstattung aus jedem Winkel prüfen." },
  { icon: FileCheck2, title: "Saubere Anfrage", text: "Technische Angaben und Richtpreis gebündelt übermitteln." },
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col bg-[#f6f8f6]">
      <section className="relative min-h-[35rem] overflow-hidden border-b border-black/8 sm:min-h-[42rem] lg:h-[calc(100svh-8rem)] lg:max-h-[50rem]">
        <Image
          src="/assets/marketing/hero-memorial-v2.png"
          alt="Modernes Grabmal aus dunklem Naturstein in einer gepflegten Gartenanlage"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[64%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,250,248,0.98)_0%,rgba(248,250,248,0.92)_32%,rgba(248,250,248,0.28)_58%,rgba(248,250,248,0)_78%)] max-lg:bg-[linear-gradient(180deg,rgba(248,250,248,0.96)_0%,rgba(248,250,248,0.82)_48%,rgba(248,250,248,0.18)_78%)]" />

        <div className="relative mx-auto flex h-full min-h-[35rem] max-w-[1440px] items-start px-5 pb-16 pt-16 sm:min-h-[42rem] sm:px-8 sm:pt-24 lg:items-center lg:px-10 lg:py-16">
          <div className="max-w-[39rem]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#12644f]">Grabmal digital gestalten</p>
            <h1 className="mt-5 text-[clamp(2.75rem,5vw,5.35rem)] font-semibold leading-[0.98] tracking-normal text-[#13201b]">
              Grabmal<br />Konfigurator
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#4f5e57] sm:text-lg sm:leading-8">
              Entwickeln Sie ein persönliches Grabmal mit realistischen Materialien, frei kombinierbaren Formen und einer direkten 3D-Vorschau.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link href="/konfigurator" className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#12644f] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(18,100,79,0.22)] transition hover:bg-[#0c4f3e]">
                Konfiguration starten <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[#4f5e57] max-sm:text-white">
                <ShieldCheck className="size-4 text-[#12644f] max-sm:text-white" aria-hidden="true" /> Unverbindlich und automatisch gespeichert
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dce2de] bg-white">
        <div className="mx-auto grid max-w-[1440px] divide-y divide-[#dce2de] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 py-7 md:px-7 md:first:pl-0 md:last:pr-0 lg:py-9">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#e8f2ed] text-[#12644f]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#17231e]">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#68756f]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#edf2ef] px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#12644f]">Der Entwurf wird konkret</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-[#17231e] sm:text-4xl">Jede Entscheidung direkt am Grabmal sehen.</h2>
            <p className="mt-5 text-base leading-7 text-[#5d6a64]">Die Vorschau verbindet Stein, Inschrift, Motive und Grabfläche in einer gemeinsamen Ansicht. Alle Angaben bleiben bis zur Anfrage änderbar.</p>
            <Link href="/konfigurator" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#12644f] hover:text-[#0c4f3e]">
              Eigenen Entwurf anlegen <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="marketing-product overflow-hidden rounded-lg border border-[#ccd6d0] bg-white shadow-[0_24px_70px_rgba(28,48,38,0.14)]">
            <div className="flex items-center justify-between border-b border-[#dce2de] px-5 py-3">
              <span className="text-xs font-semibold text-[#24322b]">Interaktive 3D-Vorschau</span>
              <span className="flex items-center gap-2 text-xs text-[#68756f]"><span className="size-1.5 rounded-full bg-[#25a36f]" /> Live</span>
            </div>
            <MonumentPreview draft={example} orderId="beispiel" embedded downloadEnabled={false} />
          </div>
        </div>
      </section>

      <section className="bg-[#13231d] px-5 py-14 text-white sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8fd0b5]">Bereit für den ersten Entwurf?</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">In wenigen Schritten zur konkreten Anfrage.</h2>
          </div>
          <Link href="/konfigurator" className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-md bg-white px-6 text-sm font-semibold text-[#13231d] transition hover:bg-[#e8f2ed]">
            Jetzt gestalten <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
