import Link from "next/link";
import { X } from "lucide-react";

export default function ConfiguratorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#eef2ef] text-[#17231e]">
      <header className="sticky top-0 z-40 border-b border-[#d8dfda] bg-white/96 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-[4.5rem] max-w-[1560px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-[#13231d] text-sm font-bold text-white">G</span>
            <span>
              <span className="block text-sm font-semibold leading-none">Grabmal Studio</span>
              <span className="mt-1 hidden text-[10px] font-medium text-[#78847e] sm:block">Konfiguration wird automatisch gespeichert</span>
            </span>
          </Link>
          <Link href="/" title="Konfiguration verlassen" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[#65716b] transition hover:bg-[#edf2ef] hover:text-[#17231e]">
            <X className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Schließen</span>
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full min-w-0 max-w-[1560px] flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6">{children}</div>
    </div>
  );
}
