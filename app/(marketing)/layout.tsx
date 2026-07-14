import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f8f6] text-[#17231e]">
      <header className="relative z-30 border-b border-[#dce2de] bg-white/96 px-5 backdrop-blur sm:px-8 lg:px-10">
        <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between gap-5">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Grabmal Studio Startseite">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#13231d] text-sm font-bold text-white">G</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-none text-[#17231e]">Grabmal Studio</span>
              <span className="mt-1 block text-[10px] font-medium text-[#7a8680]">Digital planen. Persönlich umsetzen.</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Hauptnavigation">
            <Link className="hidden min-h-10 items-center px-3 text-sm font-medium text-[#65716b] transition hover:text-[#17231e] sm:inline-flex" href="/admin">Verwaltung</Link>
            <Link className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#12644f] px-4 text-sm font-semibold text-white transition hover:bg-[#0c4f3e]" href="/konfigurator">
              Konfigurator <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="border-t border-[#dce2de] bg-white px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 text-xs text-[#748079] sm:flex-row sm:items-center sm:justify-between">
          <span>Grabmal Studio · Digitaler Entwurf für die persönliche Beratung</span>
          <span>Richtpreise unverbindlich · Fertigung nach technischer Prüfung</span>
        </div>
      </footer>
    </div>
  );
}
