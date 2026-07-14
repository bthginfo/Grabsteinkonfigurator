import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f5f3] text-[#202421]">
      <header className="relative z-20 border-b border-black/10 bg-white/95 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Grabmal Atelier Startseite">
            <span className="flex size-9 shrink-0 items-center justify-center border border-[#17624b] bg-[#17624b] text-sm font-semibold text-white">GA</span>
            <span className="min-w-0">
              <span className="font-display block truncate text-lg leading-none text-[#202421]">Grabmal Atelier</span>
              <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[#747b76] sm:block">Gestaltung mit Ruhe und Klarheit</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm" aria-label="Hauptnavigation">
            <Link className="inline-flex min-h-11 items-center px-3 font-medium text-[#4f5752] hover:text-[#17624b]" href="/konfigurator">
              Konfigurator
            </Link>
            <Link className="hidden min-h-11 items-center px-3 text-[#747b76] hover:text-[#202421] sm:inline-flex" href="/admin">
              Verwaltung
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
