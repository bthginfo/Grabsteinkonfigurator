import Link from "next/link";
import { X } from "lucide-react";

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f1f4f2] text-[#202421]">
      <header className="sticky top-0 z-40 border-b border-[#dce2de] bg-white/95 px-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex h-16 max-w-[1560px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-[#17624b] text-sm font-semibold text-white">GA</span>
            <span>
              <span className="block text-sm font-semibold leading-none text-[#18201c]">Grabmal Konfigurator</span>
              <span className="mt-1 hidden text-[10px] font-medium text-[#747b76] sm:block">Entwurf wird schrittweise gespeichert</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[#626a65] transition hover:bg-[#f0f4f2] hover:text-[#17624b]"
          >
            <X className="size-4" />
            <span className="hidden sm:inline">Entwurf verlassen</span>
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full min-w-0 max-w-[1560px] flex-1 flex-col px-3 py-4 sm:px-6 sm:py-6">{children}</div>
    </div>
  );
}
